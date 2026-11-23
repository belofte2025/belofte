import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { logUpdate, EntityType } from "../utils/auditLogger";
import { postSaleJournal, reverseSaleJournal } from "../services/accounting/journalEngine";

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
      select: {
        id: true, saleType: true, createdAt: true,
        amountPaid: true, totalAmount: true, subtotal: true,
        discountType: true, discountValue: true,
      }
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

    const accounting = await prisma.company.findUnique({
      where: { id: companyId },
      select: { enableAccounting: true },
    });

    // One sale at a time. Each may re-post its ledger in its own transaction,
    // and a hundred of those opened at once would exhaust the connection pool.
    for (const sale of sales) {
      const updateData: any = {};

      if (updates.saleType) {
        updateData.saleType = updates.saleType;
      }

      if (updates.saleDate) {
        updateData.createdAt = new Date(updates.saleDate);
      }

      // Totals have to be recalculated with the items, or the sale keeps the
      // old figure and stops agreeing with the lines beneath it.
      let totalAmount = sale.totalAmount;
      if (updates.items && updates.items.length > 0) {
        const subtotal = updates.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
        let discountAmount = 0;
        if (sale.discountType === "percentage" && sale.discountValue > 0) {
          discountAmount = (subtotal * sale.discountValue) / 100;
        } else if (sale.discountType === "amount" && sale.discountValue > 0) {
          discountAmount = sale.discountValue;
        }
        totalAmount = Math.max(0, subtotal - discountAmount);

        updateData.subtotal = subtotal;
        updateData.totalAmount = totalAmount;
        // The relation is SaleItem; writing "items" here was rejected by
        // Prisma, so a bulk edit that touched items failed outright.
        updateData.SaleItem = {
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

      // Settled figure follows the type, exactly as a single edit does: a sale
      // that stops being on credit is paid in full, and one that becomes credit
      // owes the lot unless a deposit was already taken.
      const willBeCredit = (updates.saleType ?? sale.saleType)?.toLowerCase() === "credit";
      const wasCredit = sale.saleType?.toLowerCase() === "credit";
      updateData.amountPaid = !willBeCredit
        ? totalAmount
        : wasCredit
        ? Math.min(Math.max(0, sale.amountPaid ?? 0), totalAmount)
        : 0;

      const updated = await prisma.sale.update({
        where: { id: sale.id },
        data: updateData,
      });

      // Restate the ledger for this sale.
      if (accounting?.enableAccounting) {
        try {
          const lines = await prisma.saleItem.findMany({
            where: { saleId: sale.id },
            select: { itemName: true, quantity: true, unitPrice: true, costPrice: true },
          });
          await prisma.$transaction(async (tx) => {
            await reverseSaleJournal(tx as any, sale.id, companyId!, userId);
            await postSaleJournal(tx as any, updated, lines, companyId!, userId);
          }, { timeout: 20000, maxWait: 10000 });
        } catch (journalErr) {
          console.error(`Journal re-post failed for sale ${sale.id} in bulk update:`, journalErr);
        }
      }

      await logUpdate(
        userId,
        EntityType.SALE,
        sale.id,
        sale.id,
        `Bulk update (${saleIds.length} sales) - ${changesSummary}`
      );
    }

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
