import api from "@/lib/api";

export interface WaybillItem {
  id: string;
  itemName: string;
  quantity: number;
  unit?: string;
}

export interface Waybill {
  id: string;
  companyId: string;
  customerId?: string;
  saleId?: string;
  invoiceId?: string;
  waybillNumber: string;
  issueDate: string;
  deliveryDate?: string;
  deliveredTo?: string;
  driverName?: string;
  vehicleNo?: string;
  notes?: string;
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  Customer?: { customerName: string };
  Items?: WaybillItem[];
}

export interface CreateWaybillData {
  customerId?: string;
  saleId?: string;
  issueDate: string;
  deliveryDate?: string;
  deliveredTo?: string;
  driverName?: string;
  vehicleNo?: string;
  notes?: string;
  items: { itemName: string; quantity: number; unit?: string }[];
}

export const getWaybills = async (filters?: {
  status?: string;
  customerId?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.customerId) params.append("customerId", filters.customerId);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  const res = await api.get(`/accounting/waybills?${params.toString()}`);
  return res.data;
};

export const getWaybill = async (id: string): Promise<Waybill> => {
  const res = await api.get(`/accounting/waybills/${id}`);
  return res.data;
};

export const createWaybill = async (data: CreateWaybillData): Promise<Waybill> => {
  const res = await api.post("/accounting/waybills", data);
  return res.data;
};

export const updateWaybillStatus = async (id: string, status: string): Promise<Waybill> => {
  const res = await api.patch(`/accounting/waybills/${id}/status`, { status });
  return res.data;
};
