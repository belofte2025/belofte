import api from "@/lib/api";

export const getContainerReport = async (containerId: string) => {
  const res = await api.get(`/reports/container/${containerId}`);
  return res.data;
};

export const getSupplierReport = async (supplierId: string) => {
  const res = await api.get(`/reports/supplier/${supplierId}`);
  return res.data;
};

export const getDetailedSalesReport = async (
  startDate: string,
  endDate: string
) => {
  const res = await api.get("/reports/detailed", {
    params: { startDate, endDate },
  });
  return res.data;
};

export const getSalesSummaryBySupplier = async (
  startDate: string,
  endDate: string
) => {
  const res = await api.get("/reports/salessummary/supplier", {
    params: { startDate, endDate },
  });

  return res.data; // returns array of sales with items, customerName, saleType, etc.
};
