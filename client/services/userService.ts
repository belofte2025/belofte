import api from "@/lib/api";

export interface UserRole {
  id: string;
  name: string;
}

export interface User {
  id: string;
  userName: string;
  email: string;
  roleId?: string | null;
  role?: UserRole | null;
  createdAt: string;
}

export interface CreateUserData {
  userName: string;
  email: string;
  password: string;
  roleId?: string;
}

export interface UpdateUserData {
  userName?: string;
  email?: string;
  roleId?: string;
}

/**
 * Get all users in the company
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get("/users");
  return response.data;
};

/**
 * Create a new user
 */
export const createUser = async (data: CreateUserData): Promise<User> => {
  const response = await api.post("/users", data);
  return response.data;
};

/**
 * Update a user
 */
export const updateUser = async (
  id: string,
  data: UpdateUserData
): Promise<User> => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};
