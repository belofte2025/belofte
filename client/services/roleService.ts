import api from "@/lib/api";

export type Permission = {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
};

export type RolePermission = {
  permissionId: string;
  permission: Permission;
};

export type Role = {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  isDefault: boolean;
  createdAt: string;
  permissions: RolePermission[];
  _count?: {
    users: number;
  };
};

export type CreateRoleData = {
  name: string;
  description?: string;
  permissionIds: string[];
  isDefault?: boolean;
};

export type UpdateRoleData = {
  name?: string;
  description?: string;
  permissionIds?: string[];
  isDefault?: boolean;
};

export type AssignRoleData = {
  userId: string;
  roleId: string;
};

/**
 * Get all roles for the company
 */
export const getRoles = async (): Promise<Role[]> => {
  const response = await api.get("/roles");
  return response.data;
};

/**
 * Get a single role by ID
 */
export const getRoleById = async (id: string): Promise<Role> => {
  const response = await api.get(`/roles/${id}`);
  return response.data;
};

/**
 * Get all available permissions
 */
export const getPermissions = async (): Promise<{
  permissions: Permission[];
  groupedPermissions: Record<string, Permission[]>;
}> => {
  const response = await api.get("/roles/permissions/all");
  return response.data;
};

/**
 * Create a new role
 */
export const createRole = async (data: CreateRoleData): Promise<Role> => {
  const response = await api.post("/roles", data);
  return response.data;
};

/**
 * Update an existing role
 */
export const updateRole = async (
  id: string,
  data: UpdateRoleData
): Promise<Role> => {
  const response = await api.put(`/roles/${id}`, data);
  return response.data;
};

/**
 * Delete a role
 */
export const deleteRole = async (id: string): Promise<void> => {
  await api.delete(`/roles/${id}`);
};

/**
 * Assign a role to a user
 */
export const assignRoleToUser = async (data: AssignRoleData): Promise<any> => {
  const response = await api.post("/roles/assign", data);
  return response.data;
};
