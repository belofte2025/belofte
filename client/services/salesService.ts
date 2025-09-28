import api from "@/lib/api";

export const recordSale = async (data: any) => {
  const res = await api.post("/sales", data);
  return res.data;
};

export const getSales = async (startDate: string, endDate: string) => {
  const res = await api.get("/sales");
  return res.data;
};

// services/itemService.ts

export const getContainerItemsBySupplier = async (supplierId: string) => {
  const res = await api.get(`sales/${supplierId}/items`);
  return res.data.map((item: any) => ({
    id: item.id,
    itemName: item.itemName,
    available: item.available,
    unitPrice: item.unitPrice,
    containerId: item.containerId,
    containerNo: item.containerNo,
  }));
};
// services/salesService.ts
export const getSalesByCustomerId = async (customerId: string) => {
  const res = await api.get(`sales/customer/${customerId}`);
  return res.data;
};
export const getSaleById = async (id: string) => {
  const res = await api.get(`/sales/${id}`);
  console.log(res);
  return res.data;
};

export const updateSale = async (id: string, data: any) => {
  const res = await api.put(`/sales/${id}`, data);
  return res.data;
};
export const updateSaleTotalAmount = async (
  id: string,
  totalAmount: number
) => {
  const res = await api.put(`/sales/${id}/total`, { totalAmount });
  return res.data;
};
export const listSales = async (filters?: {
  startDate?: string;
  endDate?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);

  const res = await api.get(
    `/sales/listsales${params.toString() ? `?${params.toString()}` : ""}`
  );

  return res.data;
};
export const deleteSaleById = async (id: string) => {
  const res = await api.delete(`/sales/deletesales/${id}`);
  return res.data;
};
