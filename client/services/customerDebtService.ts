// client\services\customerDebtService.ts

import api from "@/lib/api";

export interface CustomerDebt {
  id: string;
  customerId: string;
  companyId: string;
  amount: number;
  description?: string;
  debtType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    customerName: string;
    phone: string;
    balance: number;
  };
}

export const createCustomerDebt = async (data: {
  customerId: string;
  amount: number;
  description?: string;
  debtType?: string;
}) => {
  console.log("[customerDebtService] Creating debt:", data);
  try {
    const res = await api.post("/customerdebts", data);
    console.log("[customerDebtService] Debt created successfully:", res.data);
    return res.data;
  } catch (error) {
    console.error("[customerDebtService] Error creating debt:", error);
    throw error;
  }
};

export const getCustomerDebts = async (customerId: string) => {
  console.log("[customerDebtService] Fetching debts for customer:", customerId);
  try {
    const res = await api.get(`/customerdebts/customer/${customerId}`);
    console.log("[customerDebtService] Debts fetched successfully:", res.data);
    return res.data;
  } catch (error) {
    console.error("[customerDebtService] Error fetching debts:", error);
    throw error;
  }
};

export const getAllDebts = async (status?: string) => {
  console.log("[customerDebtService] Fetching all debts with status:", status);
  try {
    const params = status ? { status } : {};
    const res = await api.get("/customerdebts", { params });
    console.log("[customerDebtService] All debts fetched successfully");
    return res.data;
  } catch (error) {
    console.error("[customerDebtService] Error fetching all debts:", error);
    throw error;
  }
};

export const updateCustomerDebt = async (
  id: string,
  data: {
    amount?: number;
    description?: string;
    status?: string;
  }
) => {
  console.log("[customerDebtService] Updating debt:", { id, data });
  try {
    const res = await api.put(`/customerdebts/${id}`, data);
    console.log("[customerDebtService] Debt updated successfully:", res.data);
    return res.data;
  } catch (error) {
    console.error("[customerDebtService] Error updating debt:", error);
    throw error;
  }
};

export const markDebtAsPaid = async (id: string) => {
  console.log("[customerDebtService] Marking debt as paid:", id);
  try {
    const res = await api.patch(`/customerdebts/${id}/mark-paid`);
    console.log(
      "[customerDebtService] Debt marked as paid successfully:",
      res.data
    );
    return res.data;
  } catch (error) {
    console.error("[customerDebtService] Error marking debt as paid:", error);
    throw error;
  }
};

export const deleteCustomerDebt = async (id: string) => {
  console.log("[customerDebtService] Deleting debt:", id);
  try {
    const res = await api.delete(`/customerdebts/${id}`); // Changed from /customer-debts/
    console.log("[customerDebtService] Debt deleted successfully:", res.data);
    return res.data;
  } catch (error) {
    console.error("[customerDebtService] Error deleting debt:", error);
    throw error;
  }
};
export const bulkCreateCustomerDebts = async (
  debts: Array<{
    customerId: string;
    amount: number;
    description?: string;
    debtType?: string;
  }>
) => {
  console.log("[customerDebtService] Bulk creating debts:", debts.length);
  try {
    const res = await api.post("/customerdebts/bulk", { debts });
    console.log("[customerDebtService] Bulk debts created successfully");
    return res.data;
  } catch (error) {
    console.error("[customerDebtService] Error bulk creating debts:", error);
    throw error;
  }
};
