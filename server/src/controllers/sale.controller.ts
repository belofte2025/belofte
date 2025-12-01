import { Request, Response } from "express";
import prisma from "../utils/prisma";

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
    // If user cannot edit prices, validate that submitted prices match current prices
    if (!canEditPrice) {
      // Get all supplier items for the company to check current prices
      const itemNames = items.map((i: { itemName: string }) => i.itemName);
      const supplierItems = await prisma.supplierItem.findMany({
        where: {
          itemName: { in: itemNames },
          supplier: { companyId },
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
        items: {
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
              })
            ),
          },
        },
      },
    });
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: "Failed to record sale", detail: err });
    console.log(err);
  }
};

export const getSales = async (req: Request, res: Response) => {
  const companyId = req.user?.companyId;
  const sales = await prisma.sale.findMany({
    where: { companyId },
    include: { items: true, customer: true },
  });
  res.json(sales);
};
export const getContainerItemsBySupplier = async (
  req: Request,
  res: Response
) => {
  const { id: supplierId } = req.params;

  if (!supplierId) {
    res.status(400).json({ error: "Supplier ID is required" });
    return;
  }

  try {
    const containers = await prisma.container.findMany({
      where: { supplierId },
      include: {
        items: true,
      },
    });

    const allItems = containers.flatMap(
      (c: {
        id: string;
        containerNo: string;
        items: {
          id: string;
          itemName: string;
          quantity: number;
          soldQty: number;
          unitPrice: number;
        }[];
      }) =>
        c.items.map(
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
    console.error("Error fetching container items:", error);
    res.status(500).json({ error: "Internal server error" });
    return;
  }
};
// controller/sales.controller.ts
export const getSalesByCustomerId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const sales = await prisma.sale.findMany({
      where: { customerId: id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    // Transform to match frontend expectations
    const transformedSales = sales.map((sale) => ({
      id: sale.id,
      saleDate: sale.createdAt,
      totalAmount: sale.totalAmount,
      saleType: sale.saleType,
      items: sale.items,
    }));

    res.json(transformedSales);
  } catch (error) {
    console.error("Error fetching sales by customer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a specific sale by ID
export const getSaleById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!sale) {
      res.status(404).json({ error: "Sale not found" });
      return; // ADD THIS RETURN STATEMENT
    }

    res.json(sale);
    return; // OPTIONAL: Add this for consistency
  } catch (error) {
    console.error("Error fetching sale:", error);
    res.status(500).json({ error: "Internal server error" });
    return; // OPTIONAL: Add this for consistency
  }
};
// Update sale and items
export const updateSale = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { saleType, items, saleDate } = req.body;

  try {
    const updateData: any = {
      saleType,
      items: {
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

    res.json({ message: "Sale updated successfully" });
  } catch (error) {
    console.error("Error updating sale:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const updateSaleTotalAmount = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { totalAmount } = req.body;

  try {
    const sale = await prisma.sale.update({
      where: { id },
      data: { totalAmount },
    });

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
        items: true,
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // FIXED: Return customer object instead of just customerName string
    const response = sales.map((sale) => ({
      id: sale.id,
      saleType: sale.saleType,
      sourceType: sale.sourceType,
      customer: {
        customerName: sale.customer.customerName,
      },
      totalAmount: sale.totalAmount,
      createdAt: sale.createdAt,
      items: sale.items.map((i) => ({
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
