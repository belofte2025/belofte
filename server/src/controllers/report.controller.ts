import { Request, Response } from "express";
import {
  getContainerReport as getContainerReportService,
  getSupplierReport,
  getDetailedSalesReport,
} from "../services/report.service";
import prisma from "../utils/prisma";

export const getContainerReport = async (req: Request, res: Response) => {
  try {
    const report = await getContainerReportService(req.params.containerId);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate container report" });
  }
};

export const supplierReport = async (req: Request, res: Response) => {
  try {
    const report = await getSupplierReport(req.params.supplierId);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate supplier report" });
  }
};

export const detailedSalesReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await getDetailedSalesReport(
      startDate as string,
      endDate as string
    );
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate detailed report" });
  }
};

export const getSalesSummaryBySupplier = async (
  req: Request,
  res: Response
) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ message: "Start and end dates are required." });
      return;
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Fetch sales with items and customer info
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        items: true,
        customer: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch supplier items with supplier names
    const supplierItems = await prisma.supplierItem.findMany({
      include: {
        supplier: true,
      },
    });

    // Build a map from itemName to supplierName
    const itemToSupplierMap = new Map<string, string>();
    for (const si of supplierItems) {
      itemToSupplierMap.set(
        si.itemName.trim().toLowerCase(),
        si.supplier.suppliername
      );
    }

    // Attach supplier name to each sale item and enrich sale with customer name + sale type
    const enrichedSales = sales.map((sale: {
      id: string;
      customer: { customerName: string } | null;
      saleType: string;
      createdAt: Date;
      items: { itemName: string; quantity: number; unitPrice: number }[];
    }) => ({
      saleId: sale.id,
      customerName: sale.customer?.customerName || "Walk-in",
      saleType: sale.saleType,
      createdAt: sale.createdAt,
      items: sale.items.map((item: { itemName: string; quantity: number; unitPrice: number }) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        supplierName:
          itemToSupplierMap.get(item.itemName.trim().toLowerCase()) ||
          "Unknown Supplier",
      })),
    }));

    res.json(enrichedSales);
    return;
  } catch (error) {
    console.error("Error fetching sales summary with supplier names:", error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
