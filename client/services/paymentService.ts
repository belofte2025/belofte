import api from "@/lib/api";

export const recordPayment = async (data: any) => {
  const res = await api.post("/payments", data);
  return res.data;
};

export const getCustomerStatement = async (customerId: string) => {
  const res = await api.get(`/payments/${customerId}/statement`);
  return res.data;
};

export const updateCustomerPayment = async (
  id: string,
  data: {
    amount?: number;
    note?: string;
    paymentType?: string;
    paymentDate?: string;
  }
) => {
  const res = await api.put(`/payments/${id}`, data);
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

// Get all payments with filtering and pagination
export const getAllPayments = async (params?: {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentType?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });
  }
  
  const res = await api.get(`/payments/all?${queryParams.toString()}`);
  return res.data;
};