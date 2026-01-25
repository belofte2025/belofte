// components/layout/Sidebar.tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useState } from "react";
import {
  Home,
  Users,
  X,
  ShoppingCart,
  LogOut,
  ChevronRight,
  BarChart3,
  Container,
  Package,
  TrendingUp,
  TrendingDown,
  Building2,
  Factory,
  Settings,
  UserPlus,
  Truck,
  ShoppingBag,
  FileText,
  List,
  PiggyBankIcon,
  Shield,
  UserCog,
  Edit,
  ClipboardList,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home, permission: "dashboard.view" },
  { name: "Customers", href: "/customers", icon: Users, permission: "customers.view" },
  { name: "Suppliers", href: "/suppliers", icon: Factory, permission: "suppliers.view" },
  { name: "Items", href: "/items", icon: Package, permission: "items.view" },
  { name: "Containers", href: "/containers", icon: Container, permission: "containers.view" },
  { name: "Sales", href: "/sales", icon: ShoppingCart, permission: "sales.view" },
];

const utilityItems = [
  { name: "Overview", href: "/utilities", icon: Settings, permission: "utilities.view" },
  {
    name: "Customer Import",
    href: "/utilities/customer-import",
    icon: UserPlus,
    permission: "utilities.import",
  },
  { name: "Supplier Import", href: "/utilities/supplier-import", icon: Truck, permission: "utilities.import" },
];

const salesReportItems = [
  { name: "Sales Summary", href: "/reports/sales", icon: ShoppingBag },
  { name: "Sales Details", href: "/reports/sales/saledetails", icon: FileText },
  { name: "Sales List", href: "/reports/sales/saleslist", icon: Factory },
  { name: "Edit Sales", href: "/reports/sales/editsales", icon: Edit },
];

const reportItems = [
  { name: "Overview", href: "/reports", icon: BarChart3, permission: "reports.view" },
  {
    name: "Sales",
    href: "/reports/sales",
    icon: TrendingUp,
    submenu: salesReportItems,
    permission: "reports.view",
  },
  { name: "Payments", href: "/reports/payments", icon: List, permission: "reports.view" },
  { name: "Customers", href: "/reports/customers", icon: Users, permission: "reports.view" },
  { name: "Suppliers", href: "/reports/suppliers", icon: Factory, permission: "reports.view" },
  { name: "Containers", href: "/reports/containers", icon: Container, permission: "reports.view" },
  { name: "Inventory", href: "/reports/inventory", icon: Package, permission: "reports.view" },
  { name: "Item Transactions", href: "/reports/item-transactions", icon: TrendingDown, permission: "reports.view" },
  { name: "Cash Received", href: "/reports/dailycash", icon: PiggyBankIcon, permission: "reports.view" },
];

const settingsItems = [
  { name: "Role Management", href: "/settings/roles", icon: Shield, permission: "roles.manage" },
  { name: "User Management", href: "/settings/users", icon: UserCog, permission: "users.view" },
  { name: "Item Deduplication", href: "/settings/item-deduplication", icon: Package, permission: "items.deduplicate" },
];

const inventoryItems = [
  { name: "Stock Adjustments", href: "/inventory/adjustments", icon: ClipboardList, permission: "inventory.adjust" },
];

type SidebarProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
};

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const [reportsOpen, setReportsOpen] = useState(
    pathname.startsWith("/reports")
  );
  const [utilitiesOpen, setUtilitiesOpen] = useState(
    pathname.startsWith("/utilities")
  );
  const [salesReportsOpen, setSalesReportsOpen] = useState(
    pathname.startsWith("/reports/sales")
  );
  const [settingsOpen, setSettingsOpen] = useState(
    pathname.startsWith("/settings")
  );
  const [inventoryOpen, setInventoryOpen] = useState(
    pathname.startsWith("/inventory")
  );

  // Filter navigation items based on permissions
  const visibleNavItems = navItems.filter(item => hasPermission(item.permission));
  const visibleUtilityItems = utilityItems.filter(item => hasPermission(item.permission));
  const visibleReportItems = reportItems.filter(item => hasPermission(item.permission));
  const visibleSettingsItems = settingsItems.filter(item => hasPermission(item.permission));
  const visibleInventoryItems = inventoryItems.filter(item => hasPermission(item.permission));

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={clsx(
          "fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-all duration-300 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 w-64 h-screen bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:static lg:block"
        )}
      >
        {/* Header */}
        <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">PETROS</h1>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {/* Main navigation items */}
            {visibleNavItems.map(({ name, href, icon: Icon }) => {
              const isActive = pathname.startsWith(href) && href !== "/reports";
              return (
                <Link
                  key={name}
                  href={href}
                  className={clsx(
                    "group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => setOpen(false)}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                  )}
                  <Icon
                    className={clsx(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <span className="truncate">{name}</span>
                </Link>
              );
            })}

            {/* Reports dropdown */}
            <div className="pt-2">
              <button
                onClick={() => setReportsOpen(!reportsOpen)}
                className={clsx(
                  "group relative flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  pathname.startsWith("/reports")
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
                aria-expanded={reportsOpen}
                aria-controls="reports-submenu"
              >
                {pathname.startsWith("/reports") && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                )}
                <span className="flex items-center">
                  <BarChart3
                    className={clsx(
                      "mr-3 h-5 w-5 transition-colors",
                      pathname.startsWith("/reports")
                        ? "text-blue-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <span className="truncate">Reports</span>
                </span>
                <ChevronRight
                  className={clsx(
                    "h-4 w-4 transition-transform duration-200",
                    reportsOpen && "rotate-90"
                  )}
                />
              </button>

              {/* Reports submenu */}
              <div
                id="reports-submenu"
                className={clsx(
                  "mt-1 ml-6 space-y-0.5 overflow-hidden transition-all duration-200",
                  reportsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                {visibleReportItems.map(({ name, href, icon: Icon, submenu }) => {
                  const isActive = pathname === href;
                  const hasSubmenu = !!submenu;
                  const isParentActive = hasSubmenu && pathname.startsWith(href);

                  if (hasSubmenu) {
                    return (
                      <div key={name}>
                        <button
                          onClick={() => setSalesReportsOpen(!salesReportsOpen)}
                          className={clsx(
                            "flex w-full items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                            isParentActive
                              ? "bg-blue-100 text-blue-800"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          <span className="flex items-center">
                            <Icon
                              className={clsx(
                                "mr-2.5 h-4 w-4",
                                isParentActive ? "text-blue-700" : "text-gray-400"
                              )}
                            />
                            <span className="truncate">{name}</span>
                          </span>
                          <ChevronRight
                            className={clsx(
                              "h-3.5 w-3.5 transition-transform duration-200",
                              salesReportsOpen && "rotate-90"
                            )}
                          />
                        </button>

                        {/* Sales submenu */}
                        <div
                          className={clsx(
                            "mt-1 ml-6 space-y-0.5 overflow-hidden transition-all duration-200",
                            salesReportsOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                          )}
                        >
                          {submenu.map(({ name: subName, href: subHref, icon: SubIcon }) => {
                            const isSubActive = pathname === subHref;
                            return (
                              <Link
                                key={subName}
                                href={subHref}
                                className={clsx(
                                  "flex items-center px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                                  isSubActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                )}
                                onClick={() => setOpen(false)}
                              >
                                <SubIcon
                                  className={clsx(
                                    "mr-2 h-3.5 w-3.5",
                                    isSubActive ? "text-white" : "text-gray-400"
                                  )}
                                />
                                <span className="truncate">{subName}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={name}
                      href={href}
                      className={clsx(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <Icon
                        className={clsx(
                          "mr-2.5 h-4 w-4",
                          isActive ? "text-blue-700" : "text-gray-400"
                        )}
                      />
                      <span className="truncate">{name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Utilities dropdown */}
            <div className="pt-2">
              <button
                onClick={() => setUtilitiesOpen(!utilitiesOpen)}
                className={clsx(
                  "group relative flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  pathname.startsWith("/utilities")
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
                aria-expanded={utilitiesOpen}
                aria-controls="utilities-submenu"
              >
                {pathname.startsWith("/utilities") && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-600 rounded-r-full" />
                )}
                <span className="flex items-center">
                  <Settings
                    className={clsx(
                      "mr-3 h-5 w-5 transition-colors",
                      pathname.startsWith("/utilities")
                        ? "text-emerald-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <span className="truncate">Utilities</span>
                </span>
                <ChevronRight
                  className={clsx(
                    "h-4 w-4 transition-transform duration-200",
                    utilitiesOpen && "rotate-90"
                  )}
                />
              </button>

              {/* Utilities submenu */}
              <div
                id="utilities-submenu"
                className={clsx(
                  "mt-1 ml-6 space-y-0.5 overflow-hidden transition-all duration-200",
                  utilitiesOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                )}
              >
                {visibleUtilityItems.map(({ name, href, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={name}
                      href={href}
                      className={clsx(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <Icon
                        className={clsx(
                          "mr-2.5 h-4 w-4",
                          isActive ? "text-emerald-700" : "text-gray-400"
                        )}
                      />
                      <span className="truncate">{name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Inventory dropdown */}
            {visibleInventoryItems.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setInventoryOpen(!inventoryOpen)}
                  className={clsx(
                    "group relative flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                    pathname.startsWith("/inventory")
                      ? "bg-orange-50 text-orange-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  aria-expanded={inventoryOpen}
                  aria-controls="inventory-submenu"
                >
                  {pathname.startsWith("/inventory") && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-600 rounded-r-full" />
                  )}
                  <span className="flex items-center">
                    <Package
                      className={clsx(
                        "mr-3 h-5 w-5 transition-colors",
                        pathname.startsWith("/inventory")
                          ? "text-orange-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />
                    <span className="truncate">Inventory</span>
                  </span>
                  <ChevronRight
                    className={clsx(
                      "h-4 w-4 transition-transform duration-200",
                      inventoryOpen && "rotate-90"
                    )}
                  />
                </button>

                {/* Inventory submenu */}
                <div
                  id="inventory-submenu"
                  className={clsx(
                    "mt-1 ml-6 space-y-0.5 overflow-hidden transition-all duration-200",
                    inventoryOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  {visibleInventoryItems.map(({ name, href, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={name}
                        href={href}
                        className={clsx(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          isActive
                            ? "bg-orange-100 text-orange-800"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <Icon
                          className={clsx(
                            "mr-2.5 h-4 w-4",
                            isActive ? "text-orange-700" : "text-gray-400"
                          )}
                        />
                        <span className="truncate">{name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Settings dropdown */}
            {visibleSettingsItems.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={clsx(
                    "group relative flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                    pathname.startsWith("/settings")
                      ? "bg-purple-50 text-purple-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  aria-expanded={settingsOpen}
                  aria-controls="settings-submenu"
                >
                  {pathname.startsWith("/settings") && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full" />
                  )}
                  <span className="flex items-center">
                    <Settings
                      className={clsx(
                        "mr-3 h-5 w-5 transition-colors",
                        pathname.startsWith("/settings")
                          ? "text-purple-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />
                    <span className="truncate">Settings</span>
                  </span>
                  <ChevronRight
                    className={clsx(
                      "h-4 w-4 transition-transform duration-200",
                      settingsOpen && "rotate-90"
                    )}
                  />
                </button>

                {/* Settings submenu */}
                <div
                  id="settings-submenu"
                  className={clsx(
                    "mt-1 ml-6 space-y-0.5 overflow-hidden transition-all duration-200",
                    settingsOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  {visibleSettingsItems.map(({ name, href, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={name}
                        href={href}
                        className={clsx(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          isActive
                            ? "bg-purple-100 text-purple-800"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <Icon
                          className={clsx(
                            "mr-2.5 h-4 w-4",
                            isActive ? "text-purple-700" : "text-gray-400"
                          )}
                        />
                        <span className="truncate">{name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center px-3 py-2.5 mb-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.userName || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
          >
            <LogOut className="mr-3 h-4 w-4 group-hover:text-red-600 transition-colors" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
