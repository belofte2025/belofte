import api from "@/lib/api";
import { User } from "./authService";

export interface OnboardData {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface OnboardResponse {
  message: string;
  company: {
    id: string;
    companyName: string;
  };
  user: User;
  token: string;
}

/**
 * Onboard a new company with its first admin user
 * Public endpoint - no authentication required
 */
export const onboardCompany = async (
  data: OnboardData
): Promise<OnboardResponse> => {
  const res = await api.post("/onboard", data);
  return res.data;
};
