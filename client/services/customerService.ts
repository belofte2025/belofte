import api from "@/lib/api";

export const getCustomers = async () => {
  const res = await api.get("/customers");
  return res.data.map((c: any) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    balance: c.balance,
  }));
};

export const getAllCustomers = async () => {
  const res = await api.get("/customers");
  return res.data.map((c: any) => ({
    id: c.id,
    name: c.customerName || c.name,
    customerName: c.customerName || c.name,
    phone: c.phone,
    balance: c.balance,
    createdAt: c.createdAt,
  }));
};

export const getCustomerById = async (id: string) => {
  const res = await api.get(`/customers/${id}`);
  return res.data;
};

export const createCustomer = async (data: any) => {
  const res = await api.post("/customers", data);
  return res.data;
};

export const updateCustomer = async (id: string, data: any) => {
  const res = await api.put(`/customers/${id}`, data);
  return res.data;
};

export const createCustomerPayment = async (
  id: string,
  data: { amount: number; note?: string; paymentType?: string }
) => {
  await api.post(`/customers/${id}/payments`, data);
};

// Updated Statement Types to match new backend format
export interface StatementEntry {
  id: string;
  date: string;
  timestamp?: Date;
  type: "credit_sale" | "payment" | "debt";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  status: string;
}

export interface StatementResponse {
  statement: StatementEntry[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    currentBalance: number;
    totalTransactions: number;
  };
}

export const getCustomerStatement = async (
  customerId: string,
  from?: string,
  to?: string
): Promise<StatementResponse> => {
  const params = new URLSearchParams();
  if (from) params.append("fromDate", from);
  if (to) params.append("toDate", to);

  const queryString = params.toString();
  const url = `/customers/${customerId}/statement${
    queryString ? `?${queryString}` : ""
  }`;

  const res = await api.get(url);
  return res.data;
};