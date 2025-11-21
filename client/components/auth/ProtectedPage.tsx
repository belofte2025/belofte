"use client";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldX } from "lucide-react";

type ProtectedPageProps = {
  /** Single permission code or array of permissions required */
  permission: string | string[];
  /** If true, requires ALL permissions. If false, requires ANY. Default: false */
  requireAll?: boolean;
  /** Content to render when user has permission */
  children: React.ReactNode;
};

/**
 * Component that protects entire pages based on user permissions
 * Redirects to unauthorized page if user lacks required permissions
 *
 * @example
 * // In a page component
 * export default function SalesPage() {
 *   return (
 *     <ProtectedPage permission="sales.view">
 *       <SalesContent />
 *     </ProtectedPage>
 *   );
 * }
 */
export function ProtectedPage({
  permission,
  requireAll = false,
  children,
}: ProtectedPageProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Convert to array for consistent handling
  const perms = Array.isArray(permission) ? permission : [permission];

  // Determine if user has access
  const hasAccess = perms.length === 1
    ? hasPermission(perms[0])
    : requireAll
    ? hasAllPermissions(...perms)
    : hasAnyPermission(...perms);

  useEffect(() => {
    // If no access, redirect to dashboard or unauthorized page
    if (!hasAccess) {
      router.push("/dashboard");
    } else {
      setIsChecking(false);
    }
  }, [hasAccess, router]);

  // Show loading state while checking permissions
  if (isChecking || !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShieldX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Checking permissions...
          </h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  // Render children if has access
  return <>{children}</>;
}
