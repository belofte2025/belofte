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

export interface StatementEntry {
  id: string;
  date: string;
  type: "sale" | "payment";
  description: string;
  amount: number;
}

export const getCustomerStatement = async (
  customerId: string,
  from: string | undefined,
  to: string | undefined
): Promise<StatementEntry[]> => {
  const res = await api.get(`/customers/${customerId}/statement`);
  return res.data;
};
