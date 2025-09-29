// components/layout/Sidebar.tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import {
  Home,
  Users,
  X,
  List,
  ShoppingCart,
  Truck,
  LogOut,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Container,
  Package,
  TrendingUp,
  Building2,
  Factory,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: Factory },
  { name: "Items", href: "/items", icon: Package },
  { name: "Containers", href: "/containers", icon: Container },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
];

const reportItems = [
  { name: "Overview", href: "/reports", icon: BarChart3 },
  { name: "Sales", href: "/reports/sales", icon: TrendingUp },
  { name: "Customers", href: "/reports/customers", icon: Users },
  { name: "Suppliers", href: "/reports/suppliers", icon: Factory },
  { name: "Containers", href: "/reports/containers", icon: Container },
  { name: "Inventory", href: "/reports/inventory", icon: Package },
];

type SidebarProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
};

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [reportsOpen, setReportsOpen] = useState(pathname.startsWith('/reports'));

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={clsx(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 w-64 h-screen bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          "md:static md:block"
        )}
      >
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">PETROS</h1>
            </div>
          </div>
          <button 
            className="md:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors" 
            onClick={() => setOpen(false)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {/* Main navigation items */}
            {navItems.map(({ name, href, icon: Icon }) => {
              const isActive = pathname.startsWith(href) && href !== '/reports';
              return (
                <Link
                  key={name}
                  href={href}
                  className={clsx(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Icon className={clsx(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                  )} />
                  {name}
                </Link>
              );
            })}
            
            {/* Reports dropdown */}
            <div className="mt-4">
              <button
                onClick={() => setReportsOpen(!reportsOpen)}
                className={clsx(
                  "flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg",
                  pathname.startsWith('/reports')
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                )}
                aria-expanded={reportsOpen}
                aria-controls="reports-submenu"
              >
                <span className="flex items-center">
                  <BarChart3 className="mr-3 h-5 w-5" />
                  Reports
                </span>
                <ChevronRight className={clsx(
                  "h-4 w-4 transition-transform",
                  reportsOpen && "rotate-90"
                )} />
              </button>

              {/* Reports submenu */}
              <div
                id="reports-submenu"
                className={clsx(
                  "mt-1 ml-6 space-y-1",
                  reportsOpen ? "block" : "hidden"
                )}
              >
                {reportItems.map(({ name, href, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={name}
                      href={href}
                      className={clsx(
                        "flex items-center px-2.5 py-2 text-sm rounded-md",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <Icon className={clsx(
                        "mr-3 h-4 w-4",
                        isActive ? "text-blue-600" : "text-gray-400"
                      )} />
                      {name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center px-2 py-3 rounded-lg hover:bg-gray-50">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.userName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full mt-2 flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
