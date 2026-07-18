import api from "@/lib/api";

export interface Expense {
  id: string;
  companyId: string;
  expenseNumber: string;
  date: string;
  description: string;
  amount: number;
  accountId: string;
  paymentAccountId: string;
  reference?: string;
  createdAt: string;
  ExpenseAccount?: { code: string; name: string };
  PaymentAccount?: { code: string; name: string };
}

export interface CreateExpenseData {
  date: string;
  description: string;
  amount: number;
  accountId: string;
  paymentAccountId: string;
  reference?: string;
}

export const getExpenses = async (filters?: {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.accountId) params.append("accountId", filters.accountId);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  const res = await api.get(`/accounting/expenses?${params.toString()}`);
  return res.data;
};

export const getExpense = async (id: string): Promise<Expense> => {
  const res = await api.get(`/accounting/expenses/${id}`);
  return res.data;
};

export const createExpense = async (data: CreateExpenseData): Promise<Expense> => {
  const res = await api.post("/accounting/expenses", data);
  return res.data;
};

export const deleteExpense = async (id: string): Promise<void> => {
  await api.delete(`/accounting/expenses/${id}`);
};
