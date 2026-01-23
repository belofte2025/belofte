// services/supplierService.ts
import api from "@/lib/api";

export const getSuppliers = async () => {
  const res = await api.get("/suppliers/allsuppliers");
  return res.data;
};

export const getSupplierItems = async (id: string) => {
  const res = await api.get(`/suppliers/${id}/items`);
  return res.data;
};

export const getSuppliersList = async () => {
  const res = await api.get("/suppliers/list");
  return res.data;
};

export const getSupplierById = async (id: string) => {
  const res = await api.get(`/suppliers/${id}`);
  return res.data;
};

export const createSupplier = async (payload: {
  suppliername: string;
  contact: string;
  country: string;
}) => {
  const res = await api.post("/suppliers", payload);
  return res.data;
};

export const updateSupplier = async (
  id: string,
  payload: { suppliername: string; contact: string; country: string }
) => {
  const res = await api.put(`/suppliers/${id}`, payload);
  return res.data;
};

export const deleteSupplier = async (id: string) => {
  const res = await api.delete(`/suppliers/${id}`);
  return res.data;
};

// ========== SUPPLIER ITEMS ==========

export const addSupplierItem = async (
  supplierId: string,
  payload: { itemName: string; alias?: string; price: number }
) => {
  const res = await api.post(`/suppliers/${supplierId}/items`, payload);
  return res.data;
};

export const updateSupplierItem = async (
  id: string,
  data: { itemName: string; alias?: string; price: number }
) => {
  const res = await api.put(`/suppliers/items/${id}`, data);
  return res.data;
};

export const deleteSupplierItem = async (id: string) => {
  const res = await api.delete(`/items/${id}`);
  return res.data;
};
export const getSupplierItemsWithSales = async () => {
  const res = await api.get(`/suppliers/items/withsales`);
  return res.data.map((item: any) => ({
    id: item.id, // use real DB ID
    itemName: item.itemName,
    alias: item.alias,
    quantity: item.quantity,
    sold: item.soldQty,
    available: item.remainingQty,
    unitPrice: item.price || 0,
    supplierName: item.supplierName,
  }));
};

// ========== PRICE MANAGEMENT ==========

export const getSupplierItemsForPriceManagement = async (supplierId: string) => {
  const res = await api.get(`/suppliers/${supplierId}/price-management`);
  return res.data;
};

export const bulkUpdatePrices = async (
  supplierId: string,
  updates: { itemId: string; price: number; alias?: string }[]
) => {
  const res = await api.put(`/suppliers/${supplierId}/price-management/bulk`, {
    updates,
  });
  return res.data;
};

export const updateSinglePrice = async (
  itemId: string,
  price: number
) => {
  const res = await api.put(`/suppliers/items/${itemId}`, {
    price,
  });
  return res.data;
};

// ========== QUANTITY MANAGEMENT ==========

export const getSupplierItemsForQuantityManagement = async (supplierId: string) => {
  const res = await api.get(`/suppliers/${supplierId}/quantity-management`);
  return res.data;
};

export const bulkAdjustQuantities = async (
  supplierId: string,
  adjustments: { itemName: string; quantityChange: number; reason?: string }[]
) => {
  const res = await api.put(`/suppliers/${supplierId}/quantity-management/bulk`, {
    adjustments,
  });
  return res.data;
};

// ========== ALIAS MANAGEMENT ==========

export const getSupplierItemsForAliasManagement = async (supplierId: string) => {
  const res = await api.get(`/suppliers/${supplierId}/alias-management`);
  return res.data;
};

export const bulkUpdateAliases = async (
  supplierId: string,
  updates: { itemId: string; alias?: string }[]
) => {
  const res = await api.put(`/suppliers/${supplierId}/alias-management/bulk`, {
    updates,
  });
  return res.data;
};

// ========== STOCK ADJUSTMENTS ==========

export interface StockAdjustment {
  itemName: string;
  adjustmentQty: number;
  adjustmentType: "manual" | "damage" | "found";
  reason?: string;
  notes?: string;
}

export interface StockAdjustmentHistory {
  id: string;
  itemName: string;
  adjustmentQty: number;
  adjustmentType: string;
  reason?: string;
  notes?: string;
  createdBy: string;
  createdByEmail: string;
  createdAt: string;
}

export interface StockAdjustmentSummary {
  itemName: string;
  totalAdjustments: number;
  adjustmentCount: number;
  byType: Record<string, number>;
  recentAdjustments: Array<{
    adjustmentQty: number;
    adjustmentType: string;
    createdAt: string;
  }>;
}

export const createStockAdjustments = async (
  supplierId: string,
  adjustments: StockAdjustment[]
) => {
  const res = await api.post(`/suppliers/${supplierId}/stock-adjustments`, {
    adjustments,
  });
  return res.data;
};

export const getStockAdjustmentHistory = async (
  supplierId: string,
  itemName?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ total: number; adjustments: StockAdjustmentHistory[] }> => {
  const params = new URLSearchParams();
  if (itemName) params.append("itemName", itemName);
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const res = await api.get(
    `/suppliers/${supplierId}/stock-adjustments?${params.toString()}`
  );
  return res.data;
};

export const getStockAdjustmentSummary = async (
  supplierId: string,
  itemName: string
): Promise<StockAdjustmentSummary> => {
  const res = await api.get(
    `/suppliers/${supplierId}/stock-adjustments/summary/${encodeURIComponent(itemName)}`
  );
  return res.data;
};

export const getSupplierStockWithAdjustments = async (supplierId: string) => {
  const res = await api.get(`/suppliers/${supplierId}/stock/summary`);
  return res.data;
};
