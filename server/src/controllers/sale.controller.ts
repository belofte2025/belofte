import { Request, Response } from "express";
import prisma from "../utils/prisma";
import { logUpdate, EntityType } from "../utils/auditLogger";
import { postSaleJournal, reverseSaleJournal } from "../services/accounting/journalEngine";
import notificationService from "../services/notification.service";
import { computeCustomerBalance } from "../services/customerBalance.service";

const VALID_PAYMENT_METHODS = ["CASH", "MOMO", "BANK"];

/**
 * Refusal raised from inside the sale transaction. The stock check and the
 * insert have to run in one transaction, and a transaction callback cannot
 * write the response, so it throws this and the handler answers with it.
 */
class SaleRefused extends Error {
  constructor(readonly status: number, readonly body: Record<string, unknown>) {
    super(typeof body.detail === "string" ? body.detail : "Sale refused");
  }
}

export const recordSale = async (req: Request, res: Response) => {
  const { saleType, paymentMethod, sourceType, sourceId, customerId, items, saleDate, discountType, discountValue, amountPaid } = req.body;
  const companyId = req.user?.companyId;

  const isCredit = saleType?.toLowerCase() === "credit";
  // Default to CASH for backward compatibility with older clients that don't send a method.
  const normalizedPaymentMethod = VALID_PAYMENT_METHODS.includes((paymentMethod || "").toUpperCase())
    ? paymentMethod.toUpperCase()
    : "CASH";
  const userPermissions = req.user?.permissions || [];
  const canEditPrice = userPermissions.includes("sales.edit_price");

  if (!companyId) {
    res.status(400).json({ error: "Company ID missing" });
    return;
  }

  try {
    // Shape of the request itself, before anything is looked up.
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Failed to record sale", detail: "A sale needs at least one item." });
      return;
    }
    for (const item of items) {
      const qty = Number(item?.quantity);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
        res.status(400).json({
          error: "Failed to record sale",
          detail: `Item "${item?.itemName ?? "unknown"}" has an invalid quantity. It must be a whole number above zero.`,
        });
        return;
      }
      const price = Number(item?.unitPrice);
      if (!Number.isFinite(price) || price < 0) {
        res.status(400).json({
          error: "Failed to record sale",
          detail: `Item "${item?.itemName ?? "unknown"}" has an invalid price.`,
        });
        return;
      }
    }

    // Verify container exists for container sales
    if (sourceType === "container" && sourceId) {
      // Scoped to the company: unscoped, a sale could name another company's
      // container, and the supplier lookup further down would then fail to
      // resolve and skip the stock check instead of rejecting the sale.
      const container = await prisma.container.findFirst({
        where: { id: sourceId, companyId },
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
      // Keyed on the supplier item the line was actually picked from, not on the
      // item name. 88 item names here are carried by several suppliers at
      // different prices, so a name-keyed map compared against whichever row
      // happened to load last: it blocked correct prices and let edits through.
      const itemNames = items.map((i: { itemName: string }) => i.itemName);
      const supplierItemIds = items
        .map((i: { supplierItemId?: string }) => i.supplierItemId)
        .filter((id: string | undefined): id is string => !!id);

      const supplierItems = await prisma.supplierItem.findMany({
        where: {
          Supplier: { companyId },
          OR: [
            ...(supplierItemIds.length ? [{ id: { in: supplierItemIds } }] : []),
            { itemName: { in: itemNames } },
          ],
        },
        select: { id: true, itemName: true, price: true },
      });

      const priceById = new Map(supplierItems.map((i) => [i.id, i.price]));
      // Fallback for lines that carry no supplier item (container sales): every
      // price this company sells the name at, so a correct one is never refused.
      const pricesByName = new Map<string, Set<number>>();
      for (const i of supplierItems) {
        if (!pricesByName.has(i.itemName)) pricesByName.set(i.itemName, new Set());
        pricesByName.get(i.itemName)!.add(i.price);
      }

      for (const item of items) {
        const exact = item.supplierItemId ? priceById.get(item.supplierItemId) : undefined;
        const allowed = exact !== undefined ? new Set([exact]) : pricesByName.get(item.itemName);
        if (allowed && allowed.size > 0 && !allowed.has(item.unitPrice)) {
          res.status(403).json({
            error: "Forbidden: You don't have permission to modify prices",
            detail: `Item "${item.itemName}" has a different price than the current price. Contact an admin or manager to override prices.`,
          });
          return;
        }
      }
    }

    // The stock check and the insert run in one serializable transaction.
    // Previously the check and the write were separate statements, so two
    // tills could both pass the check on the last unit and both sell it.
    const { created: sale, costPriceMap, totalAmount } = await prisma.$transaction(async (tx) => {
    // Validate stock availability. This runs for container sales as well as
    // regular ones: it previously skipped container sales entirely, so those
    // could be recorded against stock that no longer existed, which is how
    // items ended up at negative quantities in the inventory report.
    if (sourceType === "regular" || sourceType === "container") {
      // For each item, check if there's enough stock using its own supplier
      for (const item of items) {
        const itemName = item.itemName;
        const requestedQty = item.quantity;

        // Get the supplier for this specific item
        let supplierId: string | null = null;
        if (item.supplierItemId) {
          const supplierItem = await tx.supplierItem.findUnique({
            where: { id: item.supplierItemId },
            select: { supplierId: true },
          });
          if (supplierItem) {
            supplierId = supplierItem.supplierId;
          }
        }

        // A container sale carries the container as its source, so the supplier
        // comes from there rather than from a supplier-item reference.
        if (!supplierId && sourceType === "container" && sourceId) {
          const container = await tx.container.findFirst({
            where: { id: sourceId, companyId },
            select: { supplierId: true },
          });
          if (container) {
            supplierId = container.supplierId;
          }
        }

        if (!supplierId) {
          // A regular sale has always required a resolvable supplier, so keep
          // rejecting it. A container sale was not checked at all before, so
          // skip the check rather than start refusing sales that used to go
          // through; the aim is to stop overselling, not to block trade on an
          // edge case this code cannot attribute.
          if (sourceType === "regular") {
            throw new SaleRefused(400, {
              error: "Failed to record sale",
              detail: `No supplier found for item "${itemName}"`,
            });
          }
          continue;
        }

        // Get total received from containers (all containers count — legacy containers
        // pre-dating the lifecycle feature all have "Pending" as their default status)
        const containerItems = await tx.containerItem.findMany({
          where: {
            itemName,
            Container: { supplierId, companyId },
          },
          select: { quantity: true, containerId: true },
        });

        const totalReceived = containerItems.reduce((sum, ci) => sum + ci.quantity, 0);
        const containerIds = containerItems.map((ci) => ci.containerId);

        const supplierItemIdsOfSupplier = (
          await tx.supplierItem.findMany({ where: { supplierId }, select: { id: true } })
        ).map((i) => i.id);

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
          // Regular sales. Matched on every supplier item of this supplier,
          // then narrowed by itemName above: a line is attributed by its own
          // supplier item, and only older rows fall back to the sale's
          // sourceId, which names just the first item in the cart.
          prisma.saleItem.findMany({
            where: {
              itemName,
              Sale: { companyId, sourceType: "regular" },
              OR: [
                { supplierItemId: { in: supplierItemIdsOfSupplier } },
                {
                  supplierItemId: null,
                  Sale: { sourceId: { in: supplierItemIdsOfSupplier } },
                },
              ],
            },
            select: { quantity: true },
          }),
        ]);

        const totalSold =
          containerSales.reduce((sum, s) => sum + s.quantity, 0) +
          regularSales.reduce((sum, s) => sum + s.quantity, 0);

        // Get total stock adjustments
        const adjustments = await tx.stockAdjustment.findMany({
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
          throw new SaleRefused(400, {
            error: "Insufficient stock",
            detail: `Item "${itemName}" has only ${available} units available, but you're trying to sell ${requestedQty} units.`,
            itemName,
            available,
            requested: requestedQty,
          });
        }
      }
    }

    // Look up purchase cost prices for COGS journaling
    const itemNames = items.map((i: { itemName: string }) => i.itemName);
    const costPriceMap = new Map<string, number>();
    try {
      if (sourceType === "container" && sourceId) {
        const containerItems = await tx.containerItem.findMany({
          where: { containerId: sourceId, itemName: { in: itemNames } },
          select: { itemName: true, unitPrice: true },
        });
        containerItems.forEach((ci) => costPriceMap.set(ci.itemName, ci.unitPrice));
      } else {
        const latestCosts = await tx.containerItem.findMany({
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

    // A cash sale is paid in full. A credit sale may carry a deposit taken at the
    // point of sale — only the remainder becomes a receivable.
    const requestedDeposit = Number(amountPaid);
    const resolvedAmountPaid = isCredit
      ? Math.min(Math.max(0, Number.isFinite(requestedDeposit) ? requestedDeposit : 0), totalAmount)
      : totalAmount;

    // On a credit sale the method describes how the deposit arrived; with no
    // deposit there is nothing to attribute.
    const resolvedPaymentMethod =
      isCredit && resolvedAmountPaid === 0 ? null : normalizedPaymentMethod;

    // Only supplier items that belong to this company may be attributed to.
    const claimedSupplierItemIds = items
      .map((i: { supplierItemId?: string }) => i.supplierItemId)
      .filter((id: string | undefined): id is string => !!id);
    const ownSupplierItemIds = new Set(
      claimedSupplierItemIds.length
        ? (
            await tx.supplierItem.findMany({
              where: { id: { in: claimedSupplierItemIds }, Supplier: { companyId } },
              select: { id: true },
            })
          ).map((s) => s.id)
        : []
    );

    const created = await tx.sale.create({
      data: {
        saleType,
        paymentMethod: resolvedPaymentMethod,
        amountPaid: resolvedAmountPaid,
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
                supplierItemId?: string;
              }) => ({
                itemName: i.itemName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                costPrice: costPriceMap.get(i.itemName) ?? 0,
                // Recorded per line. The sale's own sourceId names only the
                // first item's supplier, so a cart spanning suppliers charged
                // every line to that one.
                supplierItemId:
                  i.supplierItemId && ownSupplierItemIds.has(i.supplierItemId)
                    ? i.supplierItemId
                    : null,
              })
            ),
          },
        },
      },
    });
      // Carried out of the transaction for the journal and the SMS below.
      return { created, costPriceMap, totalAmount };
    }, { isolationLevel: "Serializable", timeout: 20000, maxWait: 10000 });

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
        where: { id: customerId, companyId },
        select: { customerName: true, phone: true },
      });
      if (customer) {
        // Derived, not read from Customer.balance. That column is decremented
        // by payments and returns but never raised by a credit sale, so it runs
        // far negative — customers were being texted balances like -1,099,000
        // when they actually owed 142,900. The sale is already written at this
        // point, so the derived figure includes it.
        const balance =
          saleType === "credit"
            ? await computeCustomerBalance(customerId, companyId)
            : undefined;
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
    // A refusal decided inside the transaction: answer with what it carried.
    if (err instanceof SaleRefused) {
      res.status(err.status).json(err.body);
      return;
    }

    // Two tills committing against the same stock at the same moment. The
    // transaction is serializable, so one of them is rolled back rather than
    // both selling the last unit; it is safe to try again.
    const code = (err as { code?: string })?.code;
    if (code === "P2034" || code === "40001") {
      console.warn("Sale serialization conflict; asking the caller to retry");
      res.status(409).json({
        error: "Could not record sale",
        detail: "Another sale was recorded against the same stock at that moment. Please try again.",
        retryable: true,
      });
      return;
    }

    console.error("Sale recording error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    // No stack in the response: it reaches the browser and says more about the
    // server than a caller needs.
    res.status(400).json({
      error: "Failed to record sale",
      detail: errorMessage,
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
  const { saleType, paymentMethod, items, saleDate, customerId: newCustomerId, amountPaid } = req.body;
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
        amountPaid: true,
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

    const effectiveSaleType = saleType ?? existing.saleType;
    const isCredit = effectiveSaleType?.toLowerCase() === "credit";
    const resolvedPaymentMethod = isCredit
      ? null
      : paymentMethod !== undefined
      ? VALID_PAYMENT_METHODS.includes((paymentMethod || "").toUpperCase())
        ? paymentMethod.toUpperCase()
        : "CASH"
      : undefined; // undefined → Prisma leaves the existing value untouched

    // How much of this sale is settled, recomputed for the type it now has.
    // Leaving the old figure in place is what made a type change invisible: a
    // cash sale switched to credit kept amountPaid at the full total, so the
    // customer's balance — which counts a credit sale as totalAmount minus
    // amountPaid — did not move at all.
    const wasCredit = existing.saleType?.toLowerCase() === "credit";
    const requestedDeposit = Number(amountPaid);
    const hasRequestedDeposit = Number.isFinite(requestedDeposit);
    let resolvedAmountPaid: number;
    if (!isCredit) {
      // Settled in full the moment it stops being a credit sale.
      resolvedAmountPaid = totalAmount;
    } else if (hasRequestedDeposit) {
      resolvedAmountPaid = Math.min(Math.max(0, requestedDeposit), totalAmount);
    } else if (wasCredit) {
      // Still on credit and no new deposit given: keep what was taken, capped
      // in case the edit lowered the total.
      resolvedAmountPaid = Math.min(Math.max(0, existing.amountPaid ?? 0), totalAmount);
    } else {
      // Cash becoming credit with no deposit stated: nothing has been paid.
      resolvedAmountPaid = 0;
    }

    const updateData: any = {
      saleType,
      paymentMethod: resolvedPaymentMethod,
      customerId: targetCustomerId,
      subtotal,
      totalAmount,
      amountPaid: resolvedAmountPaid,
      SaleItem: {
        deleteMany: {},
        createMany: {
          data: items.map(
            (item: { itemName: string; quantity: number; unitPrice: number; supplierItemId?: string }) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              costPrice: editCostMap.get(item.itemName) ?? 0,
              supplierItemId: item.supplierItemId ?? null,
            })
          ),
        },
      },
    };

    if (saleDate) {
      updateData.createdAt = new Date(saleDate);
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { enableAccounting: true },
    });
    const restatesLedger = !!(company?.enableAccounting && userId);

    // The edit and the ledger move together. The original entry described the
    // sale as it was: a cash sale debits cash, the same sale on credit debits
    // receivables, and the totals move when the items change. Reversing and
    // reposting in the same transaction as the edit means the books can never
    // be left behind the sale — if the ledger cannot be restated, the edit does
    // not happen either. An unposted sale is caught by the backfill, but an
    // edited one is not: it still has its original entries, so nothing would
    // ever flag it.
    const updated = await prisma.$transaction(async (tx) => {
      const saved = await tx.sale.update({ where: { id }, data: updateData });
      if (restatesLedger) {
        await reverseSaleJournal(tx as any, id, companyId!, userId!);
        const itemsWithCost = items.map((i: any) => ({
          ...i,
          costPrice: editCostMap.get(i.itemName) ?? 0,
        }));
        await postSaleJournal(tx as any, saved, itemsWithCost, companyId!, userId!);
      }
      return saved;
    }, { timeout: 20000, maxWait: 10000 });

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
    // The edit and its ledger entries share a transaction, so nothing was
    // saved. Say so, rather than leaving the user guessing whether half of it
    // went through.
    res.status(500).json({
      error: "Failed to update sale",
      detail:
        "The sale was not changed. Its accounting entries could not be restated, so the edit was rolled back to keep the books in step with the sale.",
    });
  }
};
export const updateSaleTotalAmount = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { totalAmount } = req.body;
  const companyId = req.user?.companyId;

  try {
    const existing = await prisma.sale.findUnique({
      where: { id },
      select: { companyId: true, saleType: true, amountPaid: true },
    });
    if (!existing || existing.companyId !== companyId) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }

    const newTotal = Number(totalAmount);
    if (!Number.isFinite(newTotal) || newTotal < 0) {
      res.status(400).json({ error: "Invalid total amount" });
      return;
    }

    // Keep the settled figure consistent with the new total, or the paid and
    // credit columns stop adding up to it: a cash sale is settled in full, and
    // a credit sale's deposit cannot exceed what is now owed.
    const isCreditSale = existing.saleType?.toLowerCase() === "credit";
    const amountPaid = isCreditSale
      ? Math.min(Math.max(0, existing.amountPaid ?? 0), newTotal)
      : newTotal;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { enableAccounting: true },
    });
    const userId = req.user?.id;
    const restatesLedger = !!(company?.enableAccounting && userId);

    const lines = restatesLedger
      ? await prisma.saleItem.findMany({
          where: { saleId: id },
          select: { itemName: true, quantity: true, unitPrice: true, costPrice: true },
        })
      : [];

    // The ledger stated the old total; it is restated in the same transaction,
    // so the figure and the books cannot disagree.
    const sale = await prisma.$transaction(async (tx) => {
      const saved = await tx.sale.update({
        where: { id },
        data: { totalAmount: newTotal, amountPaid },
      });
      if (restatesLedger) {
        await reverseSaleJournal(tx as any, id, companyId!, userId!);
        await postSaleJournal(tx as any, saved, lines, companyId!, userId!);
      }
      return saved;
    }, { timeout: 20000, maxWait: 10000 });

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
