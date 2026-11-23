"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, ShoppingCart, BarChart3, Menu } from "lucide-react";
import clsx from "clsx";
import { usePermissions } from "@/hooks/usePermissions";

const tabs = [
  { name: "Home",      href: "/dashboard",  icon: Home, permission: "dashboard.view" },
  { name: "Customers", href: "/customers",  icon: Users, permission: "customers.view" },
  { name: "Sales",     href: "/sales",      icon: ShoppingCart, permission: "sales.view" },
  { name: "Reports",   href: "/reports",    icon: BarChart3, permission: "reports.view" },
];

type Props = { onMenuClick: () => void; menuOpen: boolean };

export default function BottomNav({ onMenuClick, menuOpen }: Props) {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();

  return (
    <nav aria-label="Mobile shortcuts" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 safe-area-pb">
      <div className="mx-auto flex max-w-lg items-stretch gap-1 h-16 p-1.5">
        {tabs.filter(({ permission }) => hasPermission(permission)).map(({ name, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={name}
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors",
                active ? "bg-blue-50 text-blue-800" : "text-gray-600"
              )}
            >
              <Icon className={clsx("w-5 h-5", active ? "text-blue-600" : "text-gray-400")} />
              {name}
            </Link>
          );
        })}

        {/* More → opens sidebar */}
        <button
          type="button"
          aria-controls="workspace-navigation"
          aria-expanded={menuOpen}
          onClick={onMenuClick}
          className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-gray-500"
        >
          <Menu className="w-5 h-5 text-gray-400" />
          More
        </button>
      </div>
    </nav>
  );
}
