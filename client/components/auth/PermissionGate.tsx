"use client";
import { usePermissions } from "@/hooks/usePermissions";
import { ReactNode } from "react";

type PermissionGateProps = {
  /** Single permission code or array of permission codes */
  permission: string | string[];
  /** If true, requires ALL permissions. If false, requires ANY permission. Default: false */
  requireAll?: boolean;
  /** Optional fallback content to render when user lacks permission */
  fallback?: ReactNode;
  /** Content to render when user has permission */
  children: ReactNode;
};

/**
 * Component that conditionally renders children based on user permissions
 *
 * @example
 * // Render button only if user can create sales
 * <PermissionGate permission="sales.create">
 *   <button>Create Sale</button>
 * </PermissionGate>
 *
 * @example
 * // Render if user has ANY of the permissions
 * <PermissionGate permission={["sales.edit", "sales.delete"]}>
 *   <button>Modify Sale</button>
 * </PermissionGate>
 *
 * @example
 * // Render if user has ALL permissions
 * <PermissionGate permission={["sales.edit", "sales.delete"]} requireAll>
 *   <button>Full Sale Management</button>
 * </PermissionGate>
 *
 * @example
 * // Show alternative content when permission is lacking
 * <PermissionGate
 *   permission="reports.export"
 *   fallback={<p>You need export permission</p>}
 * >
 *   <button>Export Report</button>
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // Convert to array for consistent handling
  const perms = Array.isArray(permission) ? permission : [permission];

  // Determine if user has access
  const hasAccess = perms.length === 1
    ? hasPermission(perms[0])
    : requireAll
    ? hasAllPermissions(...perms)
    : hasAnyPermission(...perms);

  // Render fallback if no access
  if (!hasAccess) return <>{fallback}</>;

  // Render children if has access
  return <>{children}</>;
}
