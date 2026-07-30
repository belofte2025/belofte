import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { logUpdate, EntityType } from "../utils/auditLogger";
import { postSaleJournal } from "../services/accounting/journalEngine";
import notificationService from "../services/notification.service";

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
        select: { id: true, status: true },
      });

      if (!container) {
        res.status(404).json({ error: "Container not found" });
        return;
      }

      if (["Pending", "Shipped", "Arrived"].includes(container.status)) {
        res.status(400).json({ error: "Cannot sell from a container that has not yet arrived at the warehouse" });
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

        // Get total received from containers (only warehouse-received containers count as stock)
        const containerItems = await prisma.containerItem.findMany({
          where: {
            itemName,
            Container: {
              supplierId,
              companyId,
              status: { in: ["Received", "Incomplete", "Done"] },
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

    // Send notification (fire-and-forget, non-fatal)
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { customerName: true, phone: true, balance: true },
      });
      if (customer) {
        const balance = saleType === "credit" ? customer.balance + totalAmount : undefined;
        const msg = notificationService.saleMessage(customer.customerName, items.length, totalAmount, balance);
        notificationService.send({
          companyId,
          customerId,
          customerName: customer.customerName,
          phone: customer.phone,
          message: msg,
        }).catch(() => {});
      }
    } catch { /* non-fatal */ }

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
      items: sale.SaleItem.map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
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
  const { saleType, items, saleDate, customerId: newCustomerId } = req.body;
  const userId = req.user?.id;
  const companyId = req.user?.companyId;

  try {
    const existing = await prisma.sale.findUnique({
      where: { id },
      select: {
        companyId: true,
        sourceType: true,
        sourceId: true,
        customerId: true,
        saleType: true,
        discountType: true,
        discountValue: true,
      },
    });
    if (!existing || existing.companyId !== companyId) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }

    // Validate new customer belongs to same company (if changing)
    const targetCustomerId = newCustomerId || existing.customerId;
    if (newCustomerId && newCustomerId !== existing.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: newCustomerId },
        select: { companyId: true },
      });
      if (!customer || customer.companyId !== companyId) {
        res.status(400).json({ error: "Customer not found in this company" });
        return;
      }
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

    // Recalculate totals from new items (preserving any existing discount)
    const subtotal = items.reduce(
      (sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice,
      0
    );
    const discountValue = existing.discountValue ?? 0;
    let discountAmount = 0;
    if (existing.discountType === "percentage" && discountValue > 0) {
      discountAmount = (subtotal * discountValue) / 100;
    } else if (existing.discountType === "amount" && discountValue > 0) {
      discountAmount = discountValue;
    }
    const totalAmount = Math.max(0, subtotal - discountAmount);

    const updateData: any = {
      saleType,
      customerId: targetCustomerId,
      subtotal,
      totalAmount,
      SaleItem: {
        deleteMany: {},
        createMany: {
          data: items.map(
            (item: { itemName: string; quantity: number; unitPrice: number }) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              costPrice: editCostMap.get(item.itemName) ?? 0,
            })
          ),
        },
      },
    };

    if (saleDate) {
      updateData.createdAt = new Date(saleDate);
    }

    await prisma.sale.update({ where: { id }, data: updateData });

    if (userId) {
      const changes: string[] = [];
      if (saleType && saleType !== existing.saleType) changes.push(`Type: ${existing.saleType} → ${saleType}`);
      if (newCustomerId && newCustomerId !== existing.customerId) changes.push(`Customer changed`);
      if (saleDate) changes.push(`Date: ${saleDate}`);
      if (items) changes.push(`Items: ${items.length} items, Total: GHS ${totalAmount.toFixed(2)}`);

      await logUpdate(userId, EntityType.SALE, id, id, `Updated sale - ${changes.join(", ")}`);
    }

    res.json({ message: "Sale updated successfully", totalAmount });
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

    const response = sales.map((sale) => ({
      id: sale.id,
      saleType: sale.saleType,
      sourceType: sale.sourceType,
      customerId: sale.customerId,
      customer: sale.Customer
        ? { customerName: sale.Customer.customerName }
        : null,
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

    const response = sales.map((sale) => ({
      id: sale.id,
      saleType: sale.saleType,
      sourceType: sale.sourceType,
      customerId: sale.customerId,
      customer: sale.Customer ? { customerName: sale.Customer.customerName } : null,
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
