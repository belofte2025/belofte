import api from "@/lib/api";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "COGS" | "EXPENSE";
  normalBalance: "DEBIT" | "CREDIT";
  description?: string;
  isSystemAccount: boolean;
  isActive: boolean;
  companyId: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  source: "SALE" | "CUSTOMER_PAYMENT" | "STOCK_ADJUSTMENT" | "MANUAL" | "TRANSFER";
  status: "POSTED" | "REVERSED" | "VOID";
  postedBy?: string;
  lines: JournalLine[];
  lineCount?: number;
  createdAt: string;
}

export interface LedgerTransfer {
  id: string;
  date: string;
  description: string;
  amount: number;
  debitPartyType: string;
  debitPartyName: string;
  creditPartyType: string;
  creditPartyName: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getAccounts = async (companyId?: string): Promise<Account[]> => {
  const params = companyId ? `?companyId=${companyId}` : "";
  const res = await api.get(`/accounting/accounts${params}`);
  return res.data;
};

export const createAccount = async (data: Partial<Account>): Promise<Account> => {
  const res = await api.post("/accounting/accounts", data);
  return res.data;
};

export const updateAccount = async (id: string, data: Partial<Account>): Promise<Account> => {
  const res = await api.put(`/accounting/accounts/${id}`, data);
  return res.data;
};

export const seedDefaultAccounts = async (): Promise<void> => {
  await api.post("/accounting/seed-accounts");
};

export interface JournalFilters {
  startDate?: string;
  endDate?: string;
  source?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const getJournalEntries = async (
  filters: JournalFilters = {}
): Promise<{ entries: JournalEntry[]; pagination: Pagination }> => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.source) params.append("source", filters.source);
  if (filters.status) params.append("status", filters.status);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  const res = await api.get(`/accounting/journal?${params.toString()}`);
  return res.data;
};

export const getJournalEntry = async (id: string): Promise<JournalEntry> => {
  const res = await api.get(`/accounting/journal/${id}`);
  return res.data;
};

export interface ManualJournalData {
  date: string;
  description: string;
  lines: { accountId: string; debit: number; credit: number; description?: string }[];
}

export const createManualJournal = async (data: ManualJournalData): Promise<JournalEntry> => {
  const res = await api.post("/accounting/journal", data);
  return res.data;
};

export const reverseJournalEntry = async (id: string): Promise<JournalEntry> => {
  const res = await api.post(`/accounting/journal/${id}/reverse`);
  return res.data;
};

export const getLedgerTransfers = async (
  filters: { page?: number; limit?: number } = {}
): Promise<{ transfers: LedgerTransfer[]; pagination: Pagination }> => {
  const params = new URLSearchParams();
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  const res = await api.get(`/accounting/transfers?${params.toString()}`);
  return res.data;
};

export interface LedgerTransferData {
  date: string;
  amount: number;
  description: string;
  debitPartyType: "CUSTOMER" | "SUPPLIER" | "ACCOUNT";
  debitPartyId: string;
  creditPartyType: "CUSTOMER" | "SUPPLIER" | "ACCOUNT";
  creditPartyId: string;
}

export const createLedgerTransfer = async (data: LedgerTransferData): Promise<LedgerTransfer> => {
  const res = await api.post("/accounting/transfers", data);
  return res.data;
};

export interface TrialBalanceLine {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

export const getTrialBalance = async (
  asOf?: string
): Promise<{ rows: TrialBalanceLine[] }> => {
  const params = asOf ? `?asOf=${asOf}` : "";
  const res = await api.get(`/accounting/reports/trial-balance${params}`);
  return res.data;
};

export interface ReportRow {
  code: string;
  name: string;
  balance: number;
}

export interface IncomeStatement {
  revenue: ReportRow[];
  cogs: ReportRow[];
  expenses: ReportRow[];
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalExpenses: number;
  netIncome: number;
  hasUnpostedSales?: boolean;
  unpostedSalesCount?: number;
}

export const getIncomeStatement = async (
  startDate: string,
  endDate: string
): Promise<IncomeStatement> => {
  const res = await api.get(
    `/accounting/reports/income-statement?startDate=${startDate}&endDate=${endDate}`
  );
  return res.data;
};

export interface BalanceSheet {
  assets: ReportRow[];
  liabilities: ReportRow[];
  equity: ReportRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export const getBalanceSheet = async (asOf?: string): Promise<BalanceSheet> => {
  const params = asOf ? `?asOf=${asOf}` : "";
  const res = await api.get(`/accounting/reports/balance-sheet${params}`);
  return res.data;
};

export interface GeneralLedger {
  account: Account;
  lines: (JournalLine & { date: string; entryNumber: string })[];
}

export const getGeneralLedger = async (
  accountId: string,
  startDate?: string,
  endDate?: string
): Promise<GeneralLedger> => {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  const res = await api.get(`/accounting/reports/ledger/${accountId}?${params.toString()}`);
  return res.data;
};
