import api from "@/lib/api";

export type CustomerReturnItem = {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
};

export type CustomerReturn = {
  id: string;
  returnNo: string;
  customerId: string;
  companyId: string;
  saleId?: string;
  totalAmount: number;
  note?: string;
  createdAt: string;
  Items: CustomerReturnItem[];
  Sale?: { id: string; createdAt: string; totalAmount: number };
  Customer?: { customerName: string };
};

export type CreateReturnPayload = {
  customerId: string;
  saleId?: string;
  note?: string;
  items: { itemName: string; quantity: number; unitPrice: number; costPrice?: number }[];
};

export const createCustomerReturn = async (data: CreateReturnPayload): Promise<CustomerReturn> => {
  const res = await api.post("/returns", data);
  return res.data;
};

export const getCustomerReturns = async (customerId: string): Promise<CustomerReturn[]> => {
  const res = await api.get(`/returns/customer/${customerId}`);
  return res.data;
};

export const getCompanyReturns = async (): Promise<CustomerReturn[]> => {
  const res = await api.get("/returns");
  return res.data;
};
