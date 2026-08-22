import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

// Separate axios instance that reads sa_token instead of token
const saApi = axios.create({
  baseURL: BASE_URL,
  timeout: 150000,
  headers: { "Content-Type": "application/json" },
});

saApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sa_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SACompany {
  id: string;
  companyName: string;
  address: string | null;
  phone: string | null;
  createdAt: string;
  suspended: boolean;
  enableAccounting: boolean;
  totalRevenue: number;
  _count: {
    User: number;
    Customer: number;
    Sale: number;
    Container: number;
    Supplier: number;
  };
}

export interface SACompanyDetail extends SACompany {
  User: {
    id: string;
    userName: string;
    email: string;
    createdAt: string;
    Role: { name: string } | null;
  }[];
  recentSales: {
    id: string;
    totalAmount: number;
    saleType: string;
    createdAt: string;
    Customer: { customerName: string } | null;
  }[];
}

export interface PlatformStats {
  companies: number;
  users: number;
  customers: number;
  sales: number;
  suspended: number;
  totalRevenue: number;
}

export const superAdminLogin = async (email: string, password: string) => {
  const res = await saApi.post("/superadmin/login", { email, password });
  return res.data as { token: string; user: { email: string; userName: string; role: string; isSuperAdmin: boolean } };
};

export const getPlatformStats = async (): Promise<PlatformStats> => {
  const res = await saApi.get("/superadmin/stats");
  return res.data;
};

export const getAllCompanies = async (): Promise<SACompany[]> => {
  const res = await saApi.get("/superadmin/companies");
  return res.data;
};

export const getCompanyDetail = async (id: string): Promise<SACompanyDetail> => {
  const res = await saApi.get(`/superadmin/companies/${id}`);
  return res.data;
};

export const toggleCompanySuspend = async (id: string, suspended: boolean): Promise<SACompany> => {
  const res = await saApi.put(`/superadmin/companies/${id}/suspend`, { suspended });
  return res.data;
};

export const impersonateCompany = async (id: string) => {
  const res = await saApi.post(`/superadmin/companies/${id}/impersonate`);
  return res.data as { token: string; user: Record<string, unknown> };
};
