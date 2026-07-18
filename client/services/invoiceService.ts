import api from "@/lib/api";

export interface InvoiceItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  customerId: string;
  saleId?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  status: "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "OVERDUE" | "VOID";
  notes?: string;
  subtotal: number;
  discountValue: number;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  Customer?: { customerName: string; phone: string };
  Items?: InvoiceItem[];
}

export interface CreateInvoiceData {
  customerId: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  items: { itemName: string; quantity: number; unitPrice: number }[];
  discountValue?: number;
}

export const getInvoices = async (filters?: {
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.customerId) params.append("customerId", filters.customerId);
  if (filters?.startDate) params.append("startDate", filters.startDate);
  if (filters?.endDate) params.append("endDate", filters.endDate);
  if (filters?.page) params.append("page", filters.page.toString());
  if (filters?.limit) params.append("limit", filters.limit.toString());
  const res = await api.get(`/accounting/invoices?${params.toString()}`);
  return res.data;
};

export const getInvoice = async (id: string): Promise<Invoice> => {
  const res = await api.get(`/accounting/invoices/${id}`);
  return res.data;
};

export const createInvoice = async (data: CreateInvoiceData): Promise<Invoice> => {
  const res = await api.post("/accounting/invoices", data);
  return res.data;
};

export const updateInvoiceStatus = async (id: string, status: string): Promise<Invoice> => {
  const res = await api.patch(`/accounting/invoices/${id}/status`, { status });
  return res.data;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await api.delete(`/accounting/invoices/${id}`);
};
