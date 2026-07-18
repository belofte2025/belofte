import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getSupplierItemStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;
    const companyId = req.user?.companyId;

    // Verify supplier belongs to this company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
      select: { id: true },
    });

    if (!supplier) {
      res.status(404).json({ message: "Supplier not found" });
      return;
    }

    // Aggregate container items in one query
    const items = await prisma.containerItem.groupBy({
      by: ["itemName"],
      where: { Container: { supplierId, companyId } },
      _sum: { quantity: true, receivedQty: true, soldQty: true },
      _count: { id: true },
    });

    // Batch-fetch all container IDs for this supplier once
    const supplierContainers = await prisma.container.findMany({
      where: { supplierId, companyId },
      select: { id: true },
    });
    const containerIds = supplierContainers.map((c: any) => c.id);

    // Batch-fetch sales counts for all item names at once
    const salesCounts = await prisma.saleItem.groupBy({
      by: ["itemName"],
      where: {
        Sale: { sourceType: "container", sourceId: { in: containerIds } },
      },
      _count: { id: true },
    });
    const salesCountMap = new Map(salesCounts.map((s: any) => [s.itemName, s._count.id]));

    // Batch-fetch one sample ID per item name
    const sampleItems = await prisma.containerItem.findMany({
      where: { Container: { supplierId, companyId } },
      select: { id: true, itemName: true },
      distinct: ["itemName"],
    });
    const sampleMap = new Map(sampleItems.map((s: any) => [s.itemName, s.id]));

    const itemStatistics = items.map((item: any) => ({
      id: sampleMap.get(item.itemName) || "",
      itemName: item.itemName,
      totalQuantity: item._sum.quantity || 0,
      totalReceived: item._sum.receivedQty || 0,
      totalSales: item._sum.soldQty || 0,
      containerCount: item._count.id,
      transactionCount: salesCountMap.get(item.itemName) || 0,
    }));

    itemStatistics.sort((a: any, b: any) => a.itemName.localeCompare(b.itemName));

    res.json(itemStatistics);
  } catch (error) {
    console.error("Error fetching item statistics:", error);
    res.status(500).json({ message: "Failed to fetch item statistics" });
  }
};

export const mergeDuplicateItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId, mergeGroups } = req.body;
    const companyId = req.user?.companyId;

    if (!supplierId || !mergeGroups || !Array.isArray(mergeGroups)) {
      res.status(400).json({ message: "Invalid request. supplierId and mergeGroups are required" });
      return;
    }

    if (!companyId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Verify supplier belongs to this company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
      select: { id: true },
    });

    if (!supplier) {
      res.status(404).json({ message: "Supplier not found" });
      return;
    }

    let totalMerged = 0;

    for (const group of mergeGroups) {
      const { masterName, duplicateNames } = group;

      if (!masterName || !duplicateNames || duplicateNames.length === 0) {
        continue;
      }

      await prisma.$transaction(async (tx: any) => {
        await tx.containerItem.updateMany({
          where: { itemName: { in: duplicateNames }, Container: { supplierId, companyId } },
          data: { itemName: masterName },
        });

        const containers = await tx.container.findMany({
          where: { supplierId, companyId },
          select: { id: true },
        });
        const containerIds = containers.map((c: any) => c.id);

        await tx.saleItem.updateMany({
          where: {
            itemName: { in: duplicateNames },
            Sale: { sourceType: "container", sourceId: { in: containerIds } },
          },
          data: { itemName: masterName },
        });

        const supplierItems = await tx.supplierItem.findMany({
          where: { supplierId },
          select: { id: true },
        });
        const supplierItemIds = supplierItems.map((si: any) => si.id);

        await tx.saleItem.updateMany({
          where: {
            itemName: { in: duplicateNames },
            Sale: { sourceType: "regular", sourceId: { in: supplierItemIds } },
          },
          data: { itemName: masterName },
        });

        await tx.stockAdjustment.updateMany({
          where: { supplierId, companyId, itemName: { in: duplicateNames } },
          data: { itemName: masterName },
        });

        // Keep invoice and waybill records consistent with renamed items
        await tx.invoiceItem.updateMany({
          where: { itemName: { in: duplicateNames }, Invoice: { companyId } },
          data: { itemName: masterName },
        });

        await tx.waybillItem.updateMany({
          where: { itemName: { in: duplicateNames }, Waybill: { companyId } },
          data: { itemName: masterName },
        });

        const existingMasterItem = await tx.supplierItem.findFirst({
          where: { supplierId, itemName: masterName },
        });

        if (existingMasterItem) {
          await tx.supplierItem.deleteMany({
            where: { supplierId, itemName: { in: duplicateNames } },
          });
        } else {
          const firstDuplicate = duplicateNames[0];
          await tx.supplierItem.updateMany({
            where: { supplierId, itemName: firstDuplicate },
            data: { itemName: masterName },
          });

          if (duplicateNames.length > 1) {
            await tx.supplierItem.deleteMany({
              where: { supplierId, itemName: { in: duplicateNames.slice(1) } },
            });
          }
        }

        totalMerged += duplicateNames.length;
      });
    }

    res.json({ message: "Duplicates merged successfully", mergedCount: totalMerged });
  } catch (error: any) {
    console.error("Error merging duplicates:", error);
    res.status(500).json({ message: error.message || "Failed to merge duplicate items" });
  }
};
