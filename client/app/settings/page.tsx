"use client";

import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { settingsItems } from "@/components/layout/Sidebar";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function SettingsPage() {
  const { loading } = useAuth();
  const { hasPermission } = usePermissions();
  const links = settingsItems.filter(({ permission }) => hasPermission(permission));

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <PageHeader title="Settings" />
        {loading ? (
          <p role="status">Loading settings…</p>
        ) : links.length === 0 ? (
          <p>You don’t have access to company settings.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map(({ href, icon: Icon, name }) => (
              <Link key={href} href={href} className="card flex items-center gap-3 hover:shadow-md">
                <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <span className="font-medium text-gray-900">{name}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
