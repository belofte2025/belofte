// services/companyService.ts
import api from "@/lib/api";

export interface Company {
  id: string;
  companyName: string;
  address?: string | null;
  phone?: string | null;
  createdAt: string;
}

export interface CreateCompanyData {
  companyName: string;
  address?: string;
  phone?: string;
}

export interface UpdateCompanyData {
  companyName?: string;
  address?: string;
  phone?: string;
}

/**
 * Create a new company
 */
export const createCompany = async (data: CreateCompanyData): Promise<Company> => {
  const response = await api.post('/companies', data);
  return response.data;
};

/**
 * Get all companies
 */
export const getCompanies = async (): Promise<Company[]> => {
  const response = await api.get('/companies');
  return response.data;
};

/**
 * Get a company by ID
 */
export const getCompanyById = async (id: string): Promise<Company> => {
  const response = await api.get(`/companies/${id}`);
  return response.data;
};

/**
 * Update a company
 */
export const updateCompany = async (
  id: string,
  data: UpdateCompanyData
): Promise<Company> => {
  const response = await api.put(`/companies/${id}`, data);
  return response.data;
};

/**
 * Delete a company
 */
export const deleteCompany = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/companies/${id}`);
  return response.data;
};