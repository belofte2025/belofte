import { PrismaClient, JournalSource } from "@prisma/client";
import { ACCOUNT_CODES, getAccountId, assertBalanced, nextEntryNumber, paymentTypeToAccountCode } from "./accounts";
export { nextEntryNumber };

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

interface SaleItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
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

  // Determine debit account: credit sale → AR, cash sale → Cash on Hand
  const debitCode = sale.saleType === "CREDIT" ? ACCOUNT_CODES.ACCOUNTS_RECEIVABLE : ACCOUNT_CODES.CASH_ON_HAND;
  const debitAccountId   = await getAccountId(tx, companyId, debitCode);
  const revenueAccountId = await getAccountId(tx, companyId, ACCOUNT_CODES.SALES_REVENUE);

  const lines: { accountId: string; debit: number; credit: number; description?: string }[] = [
    { accountId: debitAccountId,  debit: amount, credit: 0,      description: `Sale ${sale.id}` },
    { accountId: revenueAccountId, debit: 0,     credit: amount, description: `Sale revenue` },
  ];

  // COGS: use cost price captured at point of sale
  const totalCost = items.reduce((s, i) => s + (i.costPrice ?? 0) * i.quantity, 0);
  if (totalCost > 0) {
    const cogsId      = await getAccountId(tx, companyId, ACCOUNT_CODES.COGS);
    const inventoryId = await getAccountId(tx, companyId, ACCOUNT_CODES.INVENTORY);
    lines.push({ accountId: cogsId,      debit: totalCost, credit: 0,         description: "COGS" });
    lines.push({ accountId: inventoryId, debit: 0,         credit: totalCost, description: "Inventory reduction" });
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

  // Debit account: use explicit depositAccountCode, then fall back to paymentType inference
  const debitCode = paymentTypeToAccountCode((payment as any).depositAccountCode || payment.paymentType);

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

  // Look up actual purchase costs from ContainerItem (not SupplierItem.price which is selling price)
  const itemNames = adjustments.map(a => a.itemName);
  const containerItems = await (tx as PrismaClient).containerItem.findMany({
    where: { itemName: { in: itemNames }, Container: { supplierId, companyId } },
    select: { itemName: true, unitPrice: true },
    orderBy: { Container: { arrivalDate: "desc" } } as any,
  });
  const costMap = new Map<string, number>();
  containerItems.forEach((ci: any) => { if (!costMap.has(ci.itemName)) costMap.set(ci.itemName, ci.unitPrice); });

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

// Shared helper: look up most recent purchase cost per item name from ContainerItem
export async function lookupItemCosts(
  prismaOrTx: PrismaClient | Tx,
  companyId: string,
  itemNames: string[]
): Promise<Map<string, number>> {
  const rows = await (prismaOrTx as PrismaClient).containerItem.findMany({
    where: { itemName: { in: itemNames }, Container: { companyId } },
    select: { itemName: true, unitPrice: true },
    orderBy: { Container: { arrivalDate: "desc" } } as any,
  });
  const map = new Map<string, number>();
  rows.forEach((r: any) => { if (!map.has(r.itemName)) map.set(r.itemName, r.unitPrice); });
  return map;
}

// Invoice journal: DR AR + CR Revenue (+ COGS if costPrice captured at creation)
interface InvoiceRecord {
  id: string;
  totalAmount: number;
  subtotal: number;
  companyId: string;
  issueDate: Date;
}

interface InvoiceLineItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
}

export async function postInvoiceJournal(
  prismaOrTx: PrismaClient | Tx,
  invoice: InvoiceRecord,
  items: InvoiceLineItem[],
  companyId: string,
  postedById: string
): Promise<void> {
  const tx = prismaOrTx as Tx;
  const entryNumber  = await nextEntryNumber(tx, companyId);
  const arAccountId  = await getAccountId(tx, companyId, ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);
  const revAccountId = await getAccountId(tx, companyId, ACCOUNT_CODES.SALES_REVENUE);

  const lines: { accountId: string; debit: number; credit: number; description?: string }[] = [
    { accountId: arAccountId,  debit: invoice.totalAmount, credit: 0,                    description: `Invoice ${invoice.id}` },
    { accountId: revAccountId, debit: 0,                   credit: invoice.totalAmount,  description: "Sales revenue" },
  ];

  // COGS: use costPrice frozen at invoice creation time
  const totalCost = items.reduce((s, i) => s + (i.costPrice ?? 0) * i.quantity, 0);
  if (totalCost > 0) {
    const cogsId      = await getAccountId(tx, companyId, ACCOUNT_CODES.COGS);
    const inventoryId = await getAccountId(tx, companyId, ACCOUNT_CODES.INVENTORY);
    lines.push({ accountId: cogsId,      debit: totalCost, credit: 0,         description: "COGS" });
    lines.push({ accountId: inventoryId, debit: 0,         credit: totalCost, description: "Inventory reduction" });
  }

  assertBalanced(lines);

  await (tx as PrismaClient).journalEntry.create({
    data: {
      companyId,
      entryNumber,
      date: invoice.issueDate,
      description: "Invoice issued",
      source: JournalSource.INVOICE,
      invoiceId: invoice.id,
      postedById,
      lines: { create: lines },
    },
  });
}

// Customer return journal: DR Sales Returns + CR AR (or Cash) + DR Inventory + CR COGS
interface ReturnRecord {
  id: string;
  totalAmount: number;
  companyId: string;
  createdAt: Date;
  saleType?: string;
}

interface ReturnItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
}

export async function postCustomerReturnJournal(
  prismaOrTx: PrismaClient | Tx,
  returnRecord: ReturnRecord,
  items: ReturnItem[],
  companyId: string,
  postedById: string
): Promise<void> {
  const tx = prismaOrTx as Tx;
  const entryNumber = await nextEntryNumber(tx, companyId);
  const amount = returnRecord.totalAmount;

  const salesReturnsId = await getAccountId(tx, companyId, ACCOUNT_CODES.SALES_RETURNS);

  // Credit: reduce AR (for credit sales) or reduce Cash (for cash sales)
  const creditCode =
    returnRecord.saleType?.toLowerCase() === "cash"
      ? ACCOUNT_CODES.CASH_ON_HAND
      : ACCOUNT_CODES.ACCOUNTS_RECEIVABLE;
  const creditAccountId = await getAccountId(tx, companyId, creditCode);

  const lines: { accountId: string; debit: number; credit: number; description?: string }[] = [
    { accountId: salesReturnsId, debit: amount, credit: 0,      description: "Sales return" },
    { accountId: creditAccountId, debit: 0,      credit: amount, description: `Return ${returnRecord.id}` },
  ];

  // Reverse COGS if cost is available: DR Inventory + CR COGS
  const totalCost = items.reduce((s, i) => s + (i.costPrice ?? 0) * i.quantity, 0);
  if (totalCost > 0) {
    const inventoryId = await getAccountId(tx, companyId, ACCOUNT_CODES.INVENTORY);
    const cogsId      = await getAccountId(tx, companyId, ACCOUNT_CODES.COGS);
    lines.push({ accountId: inventoryId, debit: totalCost, credit: 0,         description: "Inventory return" });
    lines.push({ accountId: cogsId,      debit: 0,         credit: totalCost, description: "COGS reversal" });
  }

  assertBalanced(lines);

  await (tx as PrismaClient).journalEntry.create({
    data: {
      companyId,
      entryNumber,
      date: returnRecord.createdAt,
      description: "Customer return",
      source: JournalSource.CUSTOMER_RETURN,
      customerReturnId: returnRecord.id,
      postedById,
      lines: { create: lines },
    },
  });
}

// Expense journal: DR expense account + CR payment account (Cash/Bank/MoMo)
interface ExpenseRecord {
  id: string;
  amount: number;
  description: string;
  accountId: string;
  paymentAccountId: string;
  date: Date;
  companyId: string;
}

export async function postExpenseJournal(
  prismaOrTx: PrismaClient | Tx,
  expense: ExpenseRecord,
  companyId: string,
  postedById: string
): Promise<void> {
  const tx = prismaOrTx as Tx;
  const entryNumber = await nextEntryNumber(tx, companyId);

  const lines = [
    { accountId: expense.accountId,        debit: expense.amount, credit: 0,              description: expense.description },
    { accountId: expense.paymentAccountId, debit: 0,              credit: expense.amount, description: "Payment" },
  ];

  assertBalanced(lines);

  await (tx as PrismaClient).journalEntry.create({
    data: {
      companyId,
      entryNumber,
      date: expense.date,
      description: expense.description,
      source: JournalSource.EXPENSE,
      expenseId: expense.id,
      postedById,
      lines: { create: lines },
    },
  });
}
