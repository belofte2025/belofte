import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { logUpdate, EntityType } from "../utils/auditLogger";

interface BulkUpdateRequest {
  saleIds: string[];
  updates: {
    saleType?: string;
    saleDate?: string;
    items?: Array<{
      itemName: string;
      quantity: number;
      unitPrice: number;
    }>;
  };
}

export const bulkUpdateSales = async (req: Request, res: Response) => {
  const { saleIds, updates }: BulkUpdateRequest = req.body;
  const userId = req.user!.id;
  const companyId = req.user!.companyId;

  if (!saleIds || saleIds.length === 0) {
    res.status(400).json({ error: "saleIds array is required and cannot be empty" });
    return;
  }

  if (!updates || Object.keys(updates).length === 0) {
    res.status(400).json({ error: "updates object is required and cannot be empty" });
    return;
  }

  // Limit bulk operations to 100 sales at once
  if (saleIds.length > 100) {
    res.status(400).json({
      error: "Bulk operation limit exceeded",
      detail: "Maximum 100 sales can be updated at once"
    });
    return;
  }

  try {
    // Validate all sales belong to user's company
    const sales = await prisma.sale.findMany({
      where: {
        id: { in: saleIds },
        companyId
      },
      select: { id: true, saleType: true, createdAt: true }
    });

    if (sales.length !== saleIds.length) {
      res.status(403).json({
        error: "Some sales not found or unauthorized",
        detail: `Found ${sales.length} of ${saleIds.length} requested sales`
      });
      return;
    }

    // Build changes summary for audit log
    const changesList: string[] = [];
    if (updates.saleType) changesList.push(`Type: ${updates.saleType}`);
    if (updates.saleDate) changesList.push(`Date: ${updates.saleDate}`);
    if (updates.items) changesList.push(`Items: ${updates.items.length} items`);
    const changesSummary = changesList.join(', ');

    // Perform bulk update in parallel
    const updatePromises = saleIds.map(async (saleId) => {
      const updateData: any = {};

      if (updates.saleType) {
        updateData.saleType = updates.saleType;
      }

      if (updates.saleDate) {
        updateData.createdAt = new Date(updates.saleDate);
      }

      if (updates.items && updates.items.length > 0) {
        updateData.items = {
          deleteMany: {},
          createMany: {
            data: updates.items.map((item) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        };
      }

      // Update the sale
      await prisma.sale.update({
        where: { id: saleId },
        data: updateData,
      });

      // Log each update to audit trail
      await logUpdate(
        userId,
        EntityType.SALE,
        saleId,
        saleId,
        `Bulk update (${saleIds.length} sales) - ${changesSummary}`
      );
    });

    await Promise.all(updatePromises);

    res.json({
      message: "Bulk update successful",
      count: saleIds.length,
      updated: saleIds.length
    });
    return;
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({
      error: "Bulk update failed",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
    return;
  }
};
