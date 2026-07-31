import { PrismaClient } from "@prisma/client";

export const ACCOUNT_CODES = {
  CASH_ON_HAND: "1010",
  CASH_IN_BANK: "1020",
  MOBILE_MONEY: "1030",
  ACCOUNTS_RECEIVABLE: "1100",
  INVENTORY: "1200",
  ACCOUNTS_PAYABLE: "2100",
  TAX_PAYABLE: "2200",
  OWNERS_EQUITY: "3100",
  RETAINED_EARNINGS: "3200",
  SALES_REVENUE: "4100",
  SERVICE_REVENUE: "4200",
  SALES_RETURNS: "4900",
  COGS: "5100",
  INVENTORY_ADJUSTMENT_LOSS: "5200",
  RENT_EXPENSE: "6100",
  SALARIES_EXPENSE: "6200",
  UTILITIES_EXPENSE: "6300",
  TRANSPORT_EXPENSE: "6400",
  MARKETING_EXPENSE: "6500",
  MAINTENANCE_EXPENSE: "6600",
  OTHER_EXPENSE: "6900",
};

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export async function getAccountId(tx: Tx, companyId: string, code: string): Promise<string> {
  const account = await tx.account.findFirst({
    where: { companyId, code, isActive: true },
    select: { id: true },
  });
  if (!account) throw new Error(`Account ${code} not found for company ${companyId}`);
  return account.id;
}

export function assertBalanced(lines: { debit: number; credit: number }[]): void {
  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.01) {
    throw new Error(`Journal is not balanced: DR ${totalDebit.toFixed(2)} vs CR ${totalCredit.toFixed(2)}`);
  }
}

export async function nextEntryNumber(tx: Tx, companyId: string): Promise<string> {
  const last = await tx.journalEntry.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: { entryNumber: true },
  });
  if (!last) return "JE-0001";
  const num = parseInt(last.entryNumber.replace(/\D/g, ""), 10);
  return `JE-${String((isNaN(num) ? 0 : num) + 1).padStart(4, "0")}`;
}

export async function nextInvoiceNumber(tx: Tx, companyId: string): Promise<string> {
  const last = await tx.invoice.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });
  if (!last) return "INV-0001";
  const num = parseInt(last.invoiceNumber.replace(/\D/g, ""), 10);
  return `INV-${String((isNaN(num) ? 0 : num) + 1).padStart(4, "0")}`;
}

export async function nextExpenseNumber(tx: Tx, companyId: string): Promise<string> {
  const last = await tx.expense.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: { expenseNumber: true },
  });
  if (!last) return "EXP-0001";
  const num = parseInt(last.expenseNumber.replace(/\D/g, ""), 10);
  return `EXP-${String((isNaN(num) ? 0 : num) + 1).padStart(4, "0")}`;
}

export async function nextWaybillNumber(tx: Tx, companyId: string): Promise<string> {
  const last = await tx.waybill.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: { waybillNumber: true },
  });
  if (!last) return "WB-0001";
  const num = parseInt(last.waybillNumber.replace(/\D/g, ""), 10);
  return `WB-${String((isNaN(num) ? 0 : num) + 1).padStart(4, "0")}`;
}

export async function nextReturnNumber(tx: Tx, companyId: string): Promise<string> {
  const last = await tx.customerReturn.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: { returnNo: true },
  });
  if (!last) return "RTN-0001";
  const num = parseInt(last.returnNo.replace(/\D/g, ""), 10);
  return `RTN-${String((isNaN(num) ? 0 : num) + 1).padStart(4, "0")}`;
}

// Map paymentType string to account code
export function paymentTypeToAccountCode(paymentType?: string | null, depositAccountCode?: string | null): string {
  if (depositAccountCode) return depositAccountCode;
  const p = (paymentType || "").toLowerCase();
  if (p.includes("bank") || p.includes("transfer")) return ACCOUNT_CODES.CASH_IN_BANK;
  if (p.includes("mobile") || p.includes("momo") || p.includes("mtn") || p.includes("vodafone")) return ACCOUNT_CODES.MOBILE_MONEY;
  return ACCOUNT_CODES.CASH_ON_HAND;
}
