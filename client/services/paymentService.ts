import api from "@/lib/api";

export const recordPayment = async (data: any) => {
  const res = await api.post("/payments", data);
  return res.data;
};

export const getCustomerStatement = async (customerId: string) => {
  const res = await api.get(`/payments/${customerId}/statement`);
  return res.data;
};

export const deleteCustomerPayment = async (id: string) => {
  const res = await api.delete(`/payments/${id}/customerpayments`);
  return res.data;
};
export const getCustomerPayments = async (id: string) => {
  const res = await api.get(`/payments/${id}/payments`);
  return res.data;
};
