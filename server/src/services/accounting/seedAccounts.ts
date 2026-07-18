import prisma from "../../utils/prisma";
import { AccountType, NormalBalance } from "@prisma/client";

interface AccountDef {
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  description?: string;
}

export const DEFAULT_COA: AccountDef[] = [
  // Assets
  { code: "1010", name: "Cash on Hand",              type: "ASSET",     normalBalance: "DEBIT",  description: "Physical cash held in the business" },
  { code: "1020", name: "Cash in Bank",              type: "ASSET",     normalBalance: "DEBIT",  description: "Cash held in bank accounts" },
  { code: "1030", name: "Mobile Money",              type: "ASSET",     normalBalance: "DEBIT",  description: "Mobile money wallet balances" },
  { code: "1100", name: "Accounts Receivable",       type: "ASSET",     normalBalance: "DEBIT",  description: "Amounts owed by customers" },
  { code: "1200", name: "Inventory",                 type: "ASSET",     normalBalance: "DEBIT",  description: "Value of goods held for sale" },
  { code: "1300", name: "Prepaid Expenses",          type: "ASSET",     normalBalance: "DEBIT",  description: "Expenses paid in advance" },
  { code: "1500", name: "Fixed Assets",              type: "ASSET",     normalBalance: "DEBIT",  description: "Long-term tangible assets" },
  // Liabilities
  { code: "2100", name: "Accounts Payable",          type: "LIABILITY", normalBalance: "CREDIT", description: "Amounts owed to suppliers" },
  { code: "2200", name: "Tax Payable",               type: "LIABILITY", normalBalance: "CREDIT", description: "Taxes collected but not yet remitted" },
  { code: "2300", name: "Accrued Expenses",          type: "LIABILITY", normalBalance: "CREDIT", description: "Expenses incurred but not yet paid" },
  { code: "2400", name: "Short-term Loans",          type: "LIABILITY", normalBalance: "CREDIT", description: "Loans due within one year" },
  { code: "2500", name: "Long-term Loans",           type: "LIABILITY", normalBalance: "CREDIT", description: "Loans due after one year" },
  // Equity
  { code: "3100", name: "Owner's Equity",            type: "EQUITY",    normalBalance: "CREDIT", description: "Owner's capital contribution" },
  { code: "3200", name: "Retained Earnings",         type: "EQUITY",    normalBalance: "CREDIT", description: "Accumulated profits retained in business" },
  { code: "3300", name: "Owner's Drawings",          type: "EQUITY",    normalBalance: "DEBIT",  description: "Withdrawals by owner" },
  // Revenue
  { code: "4100", name: "Sales Revenue",             type: "REVENUE",   normalBalance: "CREDIT", description: "Revenue from product sales" },
  { code: "4200", name: "Service Revenue",           type: "REVENUE",   normalBalance: "CREDIT", description: "Revenue from services rendered" },
  { code: "4900", name: "Sales Returns",             type: "REVENUE",   normalBalance: "DEBIT",  description: "Contra-revenue: value of returned goods" },
  // COGS
  { code: "5100", name: "Cost of Goods Sold",        type: "COGS",      normalBalance: "DEBIT",  description: "Direct cost of goods sold" },
  { code: "5200", name: "Inventory Adjustment Loss", type: "COGS",      normalBalance: "DEBIT",  description: "Losses from inventory write-offs and adjustments" },
  // Expenses
  { code: "6100", name: "Rent Expense",              type: "EXPENSE",   normalBalance: "DEBIT",  description: "Rent paid for business premises" },
  { code: "6200", name: "Salaries & Wages",          type: "EXPENSE",   normalBalance: "DEBIT",  description: "Employee compensation" },
  { code: "6300", name: "Utilities Expense",         type: "EXPENSE",   normalBalance: "DEBIT",  description: "Electricity, water, internet" },
  { code: "6400", name: "Transport & Freight",       type: "EXPENSE",   normalBalance: "DEBIT",  description: "Shipping and delivery costs" },
  { code: "6500", name: "Marketing & Advertising",   type: "EXPENSE",   normalBalance: "DEBIT",  description: "Promotional and advertising costs" },
  { code: "6600", name: "Maintenance & Repairs",     type: "EXPENSE",   normalBalance: "DEBIT",  description: "Equipment and property maintenance" },
  { code: "6700", name: "Bank Charges",              type: "EXPENSE",   normalBalance: "DEBIT",  description: "Banking fees and transaction charges" },
  { code: "6800", name: "Insurance Expense",         type: "EXPENSE",   normalBalance: "DEBIT",  description: "Business insurance premiums" },
  { code: "6850", name: "Depreciation Expense",      type: "EXPENSE",   normalBalance: "DEBIT",  description: "Periodic depreciation of fixed assets" },
  { code: "6900", name: "Other Expenses",            type: "EXPENSE",   normalBalance: "DEBIT",  description: "Miscellaneous operating expenses" },
];

export async function seedDefaultAccounts(companyId: string): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const def of DEFAULT_COA) {
    const existing = await prisma.account.findFirst({ where: { companyId, code: def.code } });
    if (existing) { skipped++; continue; }
    await prisma.account.create({
      data: {
        companyId,
        code: def.code,
        name: def.name,
        type: def.type,
        normalBalance: def.normalBalance,
        description: def.description,
        isSystemAccount: true,
        isActive: true,
      },
    });
    created++;
  }

  return { created, skipped };
}
