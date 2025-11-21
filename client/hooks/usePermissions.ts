import { useAuth } from "@/context/AuthContext";

/**
 * Hook to check user permissions
 * @returns Object with permission checking functions
 */
export function usePermissions() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];

  /**
   * Check if user has a specific permission
   * @param permission - Permission code (e.g., 'sales.create')
   * @returns true if user has the permission
   */
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  /**
   * Check if user has at least ONE of the specified permissions
   * @param perms - Array of permission codes
   * @returns true if user has any of the permissions
   */
  const hasAnyPermission = (...perms: string[]): boolean => {
    return perms.some(p => permissions.includes(p));
  };

  /**
   * Check if user has ALL of the specified permissions
   * @param perms - Array of permission codes
   * @returns true if user has all permissions
   */
  const hasAllPermissions = (...perms: string[]): boolean => {
    return perms.every(p => permissions.includes(p));
  };

  /**
   * Check if user is an admin (has roles.manage permission)
   * @returns true if user can manage roles
   */
  const isAdmin = (): boolean => {
    return hasPermission('roles.manage');
  };

  /**
   * Get all permissions the user has
   * @returns Array of permission codes
   */
  const getAllPermissions = (): string[] => {
    return permissions;
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    getAllPermissions,
  };
}
