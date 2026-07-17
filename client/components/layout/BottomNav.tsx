"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, ShoppingCart, BarChart3, Menu } from "lucide-react";
import clsx from "clsx";

const tabs = [
  { name: "Home",      href: "/dashboard",  icon: Home },
  { name: "Customers", href: "/customers",  icon: Users },
  { name: "Sales",     href: "/sales",      icon: ShoppingCart },
  { name: "Reports",   href: "/reports",    icon: BarChart3 },
];

type Props = { onMenuClick: () => void };

export default function BottomNav({ onMenuClick }: Props) {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-stretch h-16">
        {tabs.map(({ name, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={name}
              href={href}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active ? "text-blue-600" : "text-gray-500"
              )}
            >
              <Icon className={clsx("w-5 h-5", active ? "text-blue-600" : "text-gray-400")} />
              {name}
            </Link>
          );
        })}

        {/* More → opens sidebar */}
        <button
          onClick={onMenuClick}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-gray-500"
        >
          <Menu className="w-5 h-5 text-gray-400" />
          More
        </button>
      </div>
    </nav>
  );
}
