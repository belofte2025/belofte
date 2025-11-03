// services/authService.ts
import api from "@/lib/api";

// Types
export interface User {
  id: string;
  email: string;
  userName: string;
  role: string;
  companyId: string;
  company: {
    companyName: string;
  };
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  userName: string;
  email: string;
  password: string;
  role?: string;
  companyId: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePasswordResponse {
  message: string;
}

/**
 * Login user
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

/**
 * Register new user
 */
export const register = async (
  data: RegisterData
): Promise<RegisterResponse> => {
  const res = await api.post("/auth/register", {
    userName: data.userName,
    email: data.email,
    password: data.password,
    role: data.role || "user",
    companyId: data.companyId,
  });
  return res.data;
};

/**
 * Update user password
 */
export const updatePassword = async (
  data: UpdatePasswordData
): Promise<UpdatePasswordResponse> => {
  const res = await api.put("/auth/updatepassword", {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  });
  return res.data;
};
