import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { logUpdate, EntityType } from "../utils/auditLogger";
import { postSaleJournal } from "../services/accounting/journalEngine";

export const recordSale = async (req: Request, res: Response) => {
  const { saleType, sourceType, sourceId, customerId, items, saleDate, discountType, discountValue } = req.body;
  const companyId = req.user?.companyId;
  const userPermissions = req.user?.permissions || [];
  const canEditPrice = userPermissions.includes("sales.edit_price");

  if (!companyId) {
    res.status(400).json({ error: "Company ID missing" });
    return;
  }

  try {
    // Verify container exists for container sales
    if (sourceType === "container" && sourceId) {
      const container = await prisma.container.findUnique({
        where: { id: sourceId },
        select: { id: true },
      });

      if (!container) {
        res.status(404).json({ error: "Container not found" });
        return;
      }
    }

    // If user cannot edit prices, validate that submitted prices match current prices
    if (!canEditPrice) {
      // Get all supplier items for the company to check current prices
      const itemNames = items.map((i: { itemName: string }) => i.itemName);
      const supplierItems = await prisma.supplierItem.findMany({
        where: {
          itemName: { in: itemNames },
          Supplier: { companyId },
        },
        select: {
          itemName: true,
          price: true,
        },
      });

      // Create a map of item prices
      const priceMap = new Map(
        supplierItems.map((item) => [item.itemName, item.price])
      );

      // Check if any submitted price differs from current price
      for (const item of items) {
        const currentPrice = priceMap.get(item.itemName);
        if (currentPrice !== undefined && item.unitPrice !== currentPrice) {
          res.status(403).json({
            error: "Forbidden: You don't have permission to modify prices",
            detail: `Item "${item.itemName}" has a different price than the current price. Contact an admin or manager to override prices.`,
          });
          return;
        }
      }
    }

    // Validate stock availability for regular sales
    if (sourceType === "regular") {
      // For each item, check if there's enough stock using its own supplier
      for (const item of items) {
        const itemName = item.itemName;
        const requestedQty = item.quantity;

        // Get the supplier for this specific item
        let supplierId: string | null = null;
        if (item.supplierItemId) {
          const supplierItem = await prisma.supplierItem.findUnique({
            where: { id: item.supplierItemId },
            select: { supplierId: true },
          });
          if (supplierItem) {
            supplierId = supplierItem.supplierId;
          }
        }

        if (!supplierId) {
          res.status(400).json({
            error: "Failed to record sale",
            detail: `No supplier found for item "${itemName}"`,
          });
          return;
        }

        // Get total received from containers
        const containerItems = await prisma.containerItem.findMany({
          where: {
            itemName,
            Container: {
              supplierId,
              companyId,
            },
          },
          select: { quantity: true, containerId: true },
        });

        const totalReceived = containerItems.reduce((sum, ci) => sum + ci.quantity, 0);
        const containerIds = containerItems.map((ci) => ci.containerId);

        // Get total sold from all sales (container + regular)
        const [containerSales, regularSales] = await Promise.all([
          // Container sales
          prisma.saleItem.findMany({
            where: {
              itemName,
              Sale: {
                companyId,
                sourceType: "container",
                sourceId: { in: containerIds },
              },
            },
            select: { quantity: true },
          }),
          // Regular sales
          prisma.saleItem.findMany({
            where: {
              itemName,
              Sale: {
                companyId,
                sourceType: "regular",
                sourceId: {
                  in: await prisma.supplierItem
                    .findMany({
                      where: { supplierId, itemName },
                      select: { id: true },
                    })
                    .then((items) => items.map((i) => i.id)),
                },
              },
            },
            select: { quantity: true },
          }),
        ]);

        const totalSold =
          containerSales.reduce((sum, s) => sum + s.quantity, 0) +
          regularSales.reduce((sum, s) => sum + s.quantity, 0);

        // Get total stock adjustments
        const adjustments = await prisma.stockAdjustment.findMany({
          where: {
            supplierId,
            itemName,
            companyId,
          },
          select: { adjustmentQty: true },
        });

        const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.adjustmentQty, 0);

        // Calculate available stock
        const available = totalReceived - totalSold + totalAdjustments;

        // Validate
        if (requestedQty > available) {
          res.status(400).json({
            error: "Insufficient stock",
            detail: `Item "${itemName}" has only ${available} units available, but you're trying to sell ${requestedQty} units.`,
            itemName,
            available,
            requested: requestedQty,
          });
          return;
        }
      }
    }

    // Look up purchase cost prices for COGS journaling
    const itemNames = items.map((i: { itemName: string }) => i.itemName);
    const costPriceMap = new Map<string, number>();
    try {
      if (sourceType === "container" && sourceId) {
        const containerItems = await prisma.containerItem.findMany({
          where: { containerId: sourceId, itemName: { in: itemNames } },
          select: { itemName: true, unitPrice: true },
        });
        containerItems.forEach((ci) => costPriceMap.set(ci.itemName, ci.unitPrice));
      } else {
        const latestCosts = await prisma.containerItem.findMany({
          where: { itemName: { in: itemNames }, Container: { companyId } },
          select: { itemName: true, unitPrice: true },
          orderBy: { Container: { arrivalDate: "desc" } },
        });
        latestCosts.forEach((ci) => {
          if (!costPriceMap.has(ci.itemName)) costPriceMap.set(ci.itemName, ci.unitPrice);
        });
      }
    } catch { /* cost lookup non-fatal */ }

    // Calculate subtotal (sum of all items before discount)
    const subtotal = items.reduce(
      (sum: number, i: { unitPrice: number; quantity: number }) =>
        sum + i.unitPrice * i.quantity,
      0
    );

    // Calculate discount amount
    let discountAmount = 0;
    if (discountType && discountValue > 0) {
      if (discountType === "percentage") {
        discountAmount = (subtotal * discountValue) / 100;
      } else if (discountType === "amount") {
        discountAmount = discountValue;
      }
    }

    // Calculate final total after discount
    const totalAmount = Math.max(0, subtotal - discountAmount);

    const sale = await prisma.sale.create({
      data: {
        saleType,
        sourceType,
        sourceId,
        customerId,
        companyId,
        subtotal,
        discountType: discountType || null,
        discountValue: discountValue || 0,
        totalAmount,
        createdAt: saleDate ? new Date(saleDate) : new Date(),
        SaleItem: {
          createMany: {
            data: items.map(
              (i: {
                itemName: string;
                quantity: number;
                unitPrice: number;
              }) => ({
                itemName: i.itemName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                costPrice: costPriceMap.get(i.itemName) ?? 0,
              })
            ),
          },
        },
      },
    });
    // Post accounting journal if enabled (non-fatal)
    try {
      const company = await prisma.company.findUnique({ where: { id: companyId }, select: { enableAccounting: true } });
      if (company?.enableAccounting && req.user?.id) {
        const itemsWithCost = items.map((i: any) => ({
          ...i,
          costPrice: costPriceMap.get(i.itemName) ?? 0,
        }));
        await postSaleJournal(prisma as any, sale, itemsWithCost, companyId, req.user.id);
      }
    } catch (journalErr) {
      console.error("Journal entry failed (non-fatal):", journalErr);
    }

    res.status(201).json(sale);
  } catch (err) {
    console.error("Sale recording error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(400).json({
      error: "Failed to record sale",
      detail: errorMessage,
      stack: err instanceof Error ? err.stack : undefined
    });
  }
};

export const getSales = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const sales = await prisma.sale.findMany({
    where: { companyId },
    include: { SaleItem: true, Customer: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(sales);
};
export const getContainerItemsBySupplier = async (
  req: Request,
  res: Response
) => {
  const { id: supplierId } = req.params;
  const companyId = req.user?.companyId;

  if (!supplierId) {
    res.status(400).json({ error: "Supplier ID is required" });
    return;
  }

  try {
    const containers = await prisma.container.findMany({
      where: { supplierId, companyId },
      include: {
        ContainerItem: true,
      },
    });

    const allItems = containers.flatMap(
      (c: {
        id: string;
        containerNo: string;
        ContainerItem: {
          id: string;
          itemName: string;
          quantity: number;
          soldQty: number;
          unitPrice: number;
        }[];
      }) =>
        c.ContainerItem.map(
          (i: {
            id: string;
            itemName: string;
            quantity: number;
            soldQty: number;
            unitPrice: number;
          }) => ({
            id: i.id,
            itemName: i.itemName,
            available: i.quantity - i.soldQty,
            unitPrice: i.unitPrice,
            containerId: c.id,
            containerNo: c.containerNo,
          })
        )
    );

    res.json(allItems);
    return;
  } catch (error) {
    console.error("Error fetching container SaleItem:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};
export const getSalesByCustomerId = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  try {
    const sales = await prisma.sale.findMany({
      where: { customerId: id, companyId },
      include: { SaleItem: true },
      orderBy: { createdAt: "desc" },
    });

    // Transform to match frontend expectations
    const transformedSales = sales.map((sale) => ({
      id: sale.id,
      saleDate: sale.createdAt,
      totalAmount: sale.totalAmount,
      saleType: sale.saleType,
      saleItems: sale.SaleItem,
    }));

    res.json(transformedSales);
  } catch (error) {
    console.error("Error fetching sales by Customer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSaleById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { SaleItem: true, Customer: true },
    });

    if (!sale || sale.companyId !== companyId) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }

    res.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const updateSale = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { saleType, items, saleDate } = req.body;
  const userId = req.user?.id;
  const companyId = req.user?.companyId;

  try {
    const existing = await prisma.sale.findUnique({
      where: { id },
      select: { companyId: true, sourceType: true, sourceId: true },
    });
    if (!existing || existing.companyId !== companyId) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }

    // Re-look up cost prices so COGS stays accurate after edit
    const editedItemNames = items.map((i: { itemName: string }) => i.itemName);
    const editCostMap = new Map<string, number>();
    try {
      if (existing.sourceType === "container" && existing.sourceId) {
        const cItems = await prisma.containerItem.findMany({
          where: { containerId: existing.sourceId, itemName: { in: editedItemNames } },
          select: { itemName: true, unitPrice: true },
        });
        cItems.forEach((ci) => editCostMap.set(ci.itemName, ci.unitPrice));
      } else {
        const cItems = await prisma.containerItem.findMany({
          where: { itemName: { in: editedItemNames }, Container: { companyId } },
          select: { itemName: true, unitPrice: true },
          orderBy: { Container: { arrivalDate: "desc" } },
        });
        cItems.forEach((ci) => { if (!editCostMap.has(ci.itemName)) editCostMap.set(ci.itemName, ci.unitPrice); });
      }
    } catch { /* non-fatal — costPrice stays 0 */ }

    const updateData: any = {
      saleType,
      SaleItem: {
        deleteMany: {},
        createMany: {
          data: items.map(
            (item: {
              itemName: string;
              quantity: number;
              unitPrice: number;
            }) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              costPrice: editCostMap.get(item.itemName) ?? 0,
            })
          ),
        },
      },
    };

    // If a sale date is provided, update createdAt
    if (saleDate) {
      updateData.createdAt = new Date(saleDate);
    }

    await prisma.sale.update({
      where: { id },
      data: updateData,
    });

    // Log the update to audit trail
    if (userId) {
      const changes = [];
      if (saleType) changes.push(`Type: ${saleType}`);
      if (saleDate) changes.push(`Date: ${saleDate}`);
      if (items) changes.push(`Items: ${items.length} items`);

      await logUpdate(
        userId,
        EntityType.SALE,
        id,
        id,
        `Updated sale - ${changes.join(', ')}`
      );
    }

    res.json({ message: "Sale updated successfully" });
  } catch (error) {
    console.error("Error updating sale:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const updateSaleTotalAmount = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { totalAmount } = req.body;
  const companyId = req.user?.companyId;

  try {
    const existing = await prisma.sale.findUnique({ where: { id }, select: { companyId: true } });
    if (!existing || existing.companyId !== companyId) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }

    const sale = await prisma.sale.update({ where: { id }, data: { totalAmount } });
    res.json(sale);
  } catch (error) {
    console.error("Error updating sale:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /sales/list
export const listSales = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { startDate, endDate } = req.query;

    const whereClause: any = {
      companyId,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999); // include entire end day
        whereClause.createdAt.lte = end;
      }
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        SaleItem: true,
        Customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // FIXED: Return customer object instead of just customerName string
    const response = sales.map((sale) => ({
      id: sale.id,
      saleType: sale.saleType,
      sourceType: sale.sourceType,
      customer: sale.Customer ? {
        customerName: sale.Customer.customerName,
      } : null,
      totalAmount: sale.totalAmount,
      createdAt: sale.createdAt,
      items: sale.SaleItem.map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    }));

    res.json(response);
    return;
  } catch (error) {
    console.error("Failed to list sales", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};
// DELETE /sales/:id
export const deleteSaleById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  try {
    // Optional: validate ownership
    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale || sale.companyId !== companyId) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }

    // Delete related sale items first
    await prisma.saleItem.deleteMany({
      where: { saleId: id },
    });

    // Then delete the sale
    await prisma.sale.delete({
      where: { id },
    });

    res.json({ message: "Sale deleted successfully." });
  } catch (error) {
    console.error("Failed to delete sale", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /sales/search/by-item - Search sales by item name
export const searchSalesByItem = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { itemName, startDate, endDate, saleType } = req.query;

    if (!itemName) {
      res.status(400).json({ error: "itemName query parameter is required" });
      return;
    }

    const whereClause: any = {
      companyId,
      SaleItem: {
        some: {
          itemName: {
            contains: itemName as string,
            mode: 'insensitive'
          }
        }
      }
    };

    if (saleType) {
      whereClause.saleType = saleType;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999); // include entire end day
        whereClause.createdAt.lte = end;
      }
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        SaleItem: true,
        Customer: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format response to match frontend expectations
    const response = sales.map((sale) => ({
      id: sale.id,
      saleType: sale.saleType,
      sourceType: sale.sourceType,
      customer: sale.Customer ? {
        customerName: sale.Customer.customerName,
      } : null,
      totalAmount: sale.totalAmount,
      createdAt: sale.createdAt,
      items: sale.SaleItem.map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    }));

    res.json(response);
    return;
  } catch (error) {
    console.error("Failed to search sales by item", error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};
