import { PrismaClient, JournalSource } from "@prisma/client";
import { ACCOUNT_CODES, getAccountId, assertBalanced, nextEntryNumber } from "./accounts";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

interface SaleItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

interface SaleRecord {
  id: string;
  saleType: string;
  totalAmount: number;
  subtotal: number;
  companyId: string;
  createdAt: Date;
}

export async function postSaleJournal(
  prismaOrTx: PrismaClient | Tx,
  sale: SaleRecord,
  items: SaleItem[],
  companyId: string,
  postedById: string
): Promise<void> {
  const tx = prismaOrTx as Tx;
  const entryNumber = await nextEntryNumber(tx, companyId);
  const amount = sale.totalAmount;

  // Determine debit account based on sale type
  const debitCode = sale.saleType === "CREDIT" ? ACCOUNT_CODES.ACCOUNTS_RECEIVABLE : ACCOUNT_CODES.CASH_ON_HAND;
  const debitAccountId = await getAccountId(tx, companyId, debitCode);
  const revenueAccountId = await getAccountId(tx, companyId, ACCOUNT_CODES.SALES_REVENUE);

  const lines: { accountId: string; debit: number; credit: number; description?: string }[] = [
    { accountId: debitAccountId,  debit: amount, credit: 0,      description: `Sale ${sale.id}` },
    { accountId: revenueAccountId, debit: 0,     credit: amount, description: `Sale revenue` },
  ];

  // COGS: look up cost prices from SupplierItem
  try {
    const itemNames = items.map(i => i.itemName);
    const supplierItems = await (tx as PrismaClient).supplierItem.findMany({
      where: { itemName: { in: itemNames }, Supplier: { companyId } },
      select: { itemName: true, price: true },
    });
    const costMap = new Map(supplierItems.map(si => [si.itemName, si.price]));

    let totalCost = 0;
    for (const item of items) {
      const cost = costMap.get(item.itemName);
      if (cost != null && cost > 0) {
        totalCost += cost * item.quantity;
      }
    }

    if (totalCost > 0) {
      const cogsId = await getAccountId(tx, companyId, ACCOUNT_CODES.COGS);
      const inventoryId = await getAccountId(tx, companyId, ACCOUNT_CODES.INVENTORY);
      lines.push({ accountId: cogsId,      debit: totalCost, credit: 0,         description: "COGS" });
      lines.push({ accountId: inventoryId, debit: 0,         credit: totalCost, description: "Inventory reduction" });
    }
  } catch {
    // COGS lookup failed — post revenue-only journal
  }

  assertBalanced(lines);

  await (tx as PrismaClient).journalEntry.create({
    data: {
      companyId,
      entryNumber,
      date: sale.createdAt,
      description: `${sale.saleType === "CREDIT" ? "Credit" : "Cash"} sale`,
      source: JournalSource.SALE,
      saleId: sale.id,
      postedById,
      lines: { create: lines },
    },
  });
}

interface PaymentRecord {
  id: string;
  customerId: string;
  amount: number;
  paymentType?: string | null;
  companyId: string;
  createdAt: Date;
}

export async function postCustomerPaymentJournal(
  prismaOrTx: PrismaClient | Tx,
  payment: PaymentRecord,
  companyId: string,
  postedById: string
): Promise<void> {
  const tx = prismaOrTx as Tx;
  const entryNumber = await nextEntryNumber(tx, companyId);

  // Debit account depends on payment method
  let debitCode = ACCOUNT_CODES.CASH_ON_HAND;
  if (payment.paymentType?.toLowerCase().includes("bank")) debitCode = ACCOUNT_CODES.CASH_IN_BANK;
  if (payment.paymentType?.toLowerCase().includes("mobile") || payment.paymentType?.toLowerCase().includes("momo")) {
    debitCode = ACCOUNT_CODES.MOBILE_MONEY;
  }

  const debitAccountId = await getAccountId(tx, companyId, debitCode);
  const arAccountId    = await getAccountId(tx, companyId, ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);

  const lines = [
    { accountId: debitAccountId, debit: payment.amount, credit: 0,               description: "Cash received" },
    { accountId: arAccountId,    debit: 0,              credit: payment.amount,   description: `Payment from customer` },
  ];

  assertBalanced(lines);

  await (tx as PrismaClient).journalEntry.create({
    data: {
      companyId,
      entryNumber,
      date: payment.createdAt,
      description: "Customer payment received",
      source: JournalSource.CUSTOMER_PAYMENT,
      customerPaymentId: payment.id,
      postedById,
      lines: { create: lines },
    },
  });
}

interface AdjustmentItem {
  itemName: string;
  adjustmentQty: number;
  adjustmentType: string;
  unitCost?: number;
}

export async function postStockAdjustmentJournal(
  prismaOrTx: PrismaClient | Tx,
  adjustments: AdjustmentItem[],
  supplierId: string,
  companyId: string,
  postedById: string,
  date: Date = new Date()
): Promise<void> {
  const tx = prismaOrTx as Tx;

  // Look up cost prices for all items
  const itemNames = adjustments.map(a => a.itemName);
  const supplierItems = await (tx as PrismaClient).supplierItem.findMany({
    where: { supplierId, itemName: { in: itemNames } },
    select: { itemName: true, price: true },
  });
  const costMap = new Map(supplierItems.map(si => [si.itemName, si.price]));

  let totalLoss = 0;
  let totalGain = 0;

  for (const adj of adjustments) {
    const cost = costMap.get(adj.itemName) ?? 0;
    const value = Math.abs(adj.adjustmentQty) * cost;
    if (adj.adjustmentType === "DECREASE" || adj.adjustmentType === "WRITE_OFF") {
      totalLoss += value;
    } else if (adj.adjustmentType === "INCREASE") {
      totalGain += value;
    }
  }

  // Only post if there's monetary impact
  if (totalLoss === 0 && totalGain === 0) return;

  const entryNumber = await nextEntryNumber(tx, companyId);
  const inventoryId   = await getAccountId(tx, companyId, ACCOUNT_CODES.INVENTORY);
  const adjLossId     = await getAccountId(tx, companyId, ACCOUNT_CODES.INVENTORY_ADJUSTMENT_LOSS);

  const lines: { accountId: string; debit: number; credit: number; description?: string }[] = [];

  if (totalLoss > 0) {
    lines.push({ accountId: adjLossId,   debit: totalLoss, credit: 0,         description: "Inventory write-off" });
    lines.push({ accountId: inventoryId, debit: 0,         credit: totalLoss, description: "Inventory reduction" });
  }
  if (totalGain > 0) {
    lines.push({ accountId: inventoryId, debit: totalGain, credit: 0,         description: "Inventory increase" });
    lines.push({ accountId: adjLossId,   debit: 0,         credit: totalGain, description: "Adjustment gain" });
  }

  assertBalanced(lines);

  await (tx as PrismaClient).journalEntry.create({
    data: {
      companyId,
      entryNumber,
      date,
      description: "Stock adjustment",
      source: JournalSource.STOCK_ADJUSTMENT,
      postedById,
      lines: { create: lines },
    },
  });
}
