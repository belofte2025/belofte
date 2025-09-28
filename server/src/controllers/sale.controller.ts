import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const recordSale = async (req: Request, res: Response) => {
  const { saleType, sourceType, sourceId, customerId, items } = req.body;
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(400).json({ error: "Company ID missing" });
    return;
  }
  const totalAmount = items.reduce(
    (sum: number, i: { unitPrice: number; quantity: number }) => sum + i.unitPrice * i.quantity,
    0
  );

  try {
    const sale = await prisma.sale.create({
      data: {
        saleType,
        sourceType,
        sourceId,
        customerId,
        companyId,
        totalAmount,
        items: {
          createMany: {
            data: items.map((i: { itemName: string; quantity: number; unitPrice: number }) => ({
              itemName: i.itemName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
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

    const allItems = containers.flatMap((c: {
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
      c.items.map((i: {
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
      }))
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

    res.json(sales);
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
    }

    res.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update sale and items
export const updateSale = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { saleType, items } = req.body;

  try {
    await prisma.sale.update({
      where: { id },
      data: {
        saleType,
        items: {
          deleteMany: {},
          createMany: {
            data: items.map((item: { itemName: string; quantity: number; unitPrice: number }) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
      },
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

// GET /sales
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

    const response = sales.map((sale: {
      id: string;
      saleType: string;
      sourceType: string;
      customer: { customerName: string };
      totalAmount: number;
      createdAt: Date;
      items: { itemName: string; quantity: number; unitPrice: number }[];
    }) => ({
      id: sale.id,
      saleType: sale.saleType,
      sourceType: sale.sourceType,
      customerName: sale.customer.customerName,
      totalAmount: sale.totalAmount,
      createdAt: sale.createdAt,
      items: sale.items.map((i: { itemName: string; quantity: number; unitPrice: number }) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    }));

    res.json(response);
  } catch (error) {
    console.error("Failed to list sales", error);
    res.status(500).json({ error: "Internal Server Error" });
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
