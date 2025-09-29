import api from "@/lib/api";

export const getInventoryReport = async () => {
  const res = await api.get("/inventory/report");
  return res.data;
};

export const getInventoryBySupplier = async (supplierId: string) => {
  const res = await api.get(`/inventory/supplier/${supplierId}`);
  return res.data;
};

export const getLowStockItems = async () => {
  const res = await api.get("/inventory/low-stock");
  return res.data;
};

export const getOutOfStockItems = async () => {
  const res = await api.get("/inventory/out-of-stock"); 
  return res.data;
};