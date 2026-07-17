// components/layout/Sidebar.tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useState } from "react";
import {
  Home, Users, X, ShoppingCart, LogOut, ChevronRight, BarChart3,
  Container, Package, TrendingUp, TrendingDown, Building2, Factory,
  Settings, UserPlus, Truck, ShoppingBag, FileText, List,
  PiggyBankIcon, Shield, UserCog, Edit, ClipboardList,
} from "lucide-react";

const navItems = [
  { name: "Dashboard",  href: "/dashboard",  icon: Home,         permission: "dashboard.view" },
  { name: "Customers",  href: "/customers",  icon: Users,        permission: "customers.view" },
  { name: "Suppliers",  href: "/suppliers",  icon: Factory,      permission: "suppliers.view" },
  { name: "Items",      href: "/items",      icon: Package,      permission: "items.view" },
  { name: "Containers", href: "/containers", icon: Container,    permission: "containers.view" },
  { name: "Sales",      href: "/sales",      icon: ShoppingCart, permission: "sales.view" },
];

const utilityItems = [
  { name: "Overview",         href: "/utilities",                  icon: Settings, permission: "utilities.view" },
  { name: "Customer Import",  href: "/utilities/customer-import",  icon: UserPlus, permission: "utilities.import" },
  { name: "Supplier Import",  href: "/utilities/supplier-import",  icon: Truck,    permission: "utilities.import" },
];

const salesReportItems = [
  { name: "Sales Summary", href: "/reports/sales",              icon: ShoppingBag },
  { name: "Sales Details", href: "/reports/sales/saledetails",  icon: FileText },
  { name: "Sales List",    href: "/reports/sales/saleslist",    icon: Factory },
  { name: "Edit Sales",    href: "/reports/sales/editsales",    icon: Edit },
];

const reportItems = [
  { name: "Overview",           href: "/reports",                  icon: BarChart3,     permission: "reports.view" },
  { name: "Sales",              href: "/reports/sales",            icon: TrendingUp,    permission: "reports.view", submenu: salesReportItems },
  { name: "Payments",           href: "/reports/payments",         icon: List,          permission: "reports.view" },
  { name: "Customers",          href: "/reports/customers",        icon: Users,         permission: "reports.view" },
  { name: "Suppliers",          href: "/reports/suppliers",        icon: Factory,       permission: "reports.view" },
  { name: "Containers",         href: "/reports/containers",       icon: Container,     permission: "reports.view" },
  { name: "Inventory",          href: "/reports/inventory",        icon: Package,       permission: "reports.view" },
  { name: "Item Transactions",  href: "/reports/item-transactions",icon: TrendingDown,  permission: "reports.view" },
  { name: "Cash Received",      href: "/reports/dailycash",        icon: PiggyBankIcon, permission: "reports.view" },
];

const settingsItems = [
  { name: "Role Management",      href: "/settings/roles",                  icon: Shield,      permission: "roles.manage" },
  { name: "User Management",      href: "/settings/users",                  icon: UserCog,     permission: "users.view" },
  { name: "Item Deduplication",   href: "/settings/item-deduplication",     icon: Package,     permission: "items.deduplicate" },
];

const inventoryItems = [
  { name: "Stock Adjustments", href: "/inventory/adjustments", icon: ClipboardList, permission: "inventory.adjust" },
];

type SidebarProps = { open: boolean; setOpen: (v: boolean) => void };

function NavGroup({
  label, isOpen, onToggle, active, accent = "blue", children,
}: {
  label: string; isOpen: boolean; onToggle: () => void;
  active: boolean; accent?: string; children: React.ReactNode;
}) {
  return (
    <div className="pt-1">
      <button
        onClick={onToggle}
        className={clsx(
          "group relative flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
          active
            ? `bg-${accent}-50 text-${accent}-700`
            : "text-gray-700 hover:bg-gray-50"
        )}
      >
        {active && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-${accent}-600 rounded-r-full`} />}
        <span className="truncate pl-1">{label}</span>
        <ChevronRight className={clsx("h-4 w-4 flex-shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
      </button>
      <div className={clsx("ml-3 space-y-0.5 overflow-hidden transition-all duration-200", isOpen ? "max-h-screen opacity-100 mt-0.5" : "max-h-0 opacity-0")}>
        {children}
      </div>
    </div>
  );
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const [reportsOpen,   setReportsOpen]   = useState(pathname.startsWith("/reports"));
  const [utilitiesOpen, setUtilitiesOpen] = useState(pathname.startsWith("/utilities"));
  const [salesSubOpen,  setSalesSubOpen]  = useState(pathname.startsWith("/reports/sales"));
  const [settingsOpen,  setSettingsOpen]  = useState(pathname.startsWith("/settings"));
  const [inventoryOpen, setInventoryOpen] = useState(pathname.startsWith("/inventory"));

  const visibleNav      = navItems.filter(i => hasPermission(i.permission));
  const visibleUtil     = utilityItems.filter(i => hasPermission(i.permission));
  const visibleReports  = reportItems.filter(i => hasPermission(i.permission));
  const visibleSettings = settingsItems.filter(i => hasPermission(i.permission));
  const visibleInv      = inventoryItems.filter(i => hasPermission(i.permission));

  const close = () => setOpen(false);

  const navLink = (href: string, name: string, Icon: React.ElementType, small = false) => {
    const active = small ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        key={name}
        href={href}
        onClick={close}
        className={clsx(
          "relative flex items-center rounded-xl font-medium transition-all duration-200",
          small ? "px-3 py-2 text-xs" : "px-3 py-2.5 text-sm",
          active
            ? "bg-blue-50 text-blue-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        {active && !small && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-blue-600 rounded-r-full" />}
        <Icon className={clsx(small ? "mr-2 h-3.5 w-3.5" : "mr-3 h-4 w-4", active ? "text-blue-600" : "text-gray-400")} />
        <span className="truncate">{name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          "fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
      />

      {/* Sidebar panel */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 w-64 h-screen flex flex-col bg-white border-r border-gray-200 shadow-xl",
          "transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">PETROS</span>
          </div>
          <button
            onClick={close}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {/* Main items */}
          {visibleNav.map(({ name, href, icon: Icon }) =>
            navLink(href, name, Icon)
          )}

          {/* Reports */}
          {visibleReports.length > 0 && (
            <NavGroup
              label="Reports"
              isOpen={reportsOpen}
              onToggle={() => setReportsOpen(!reportsOpen)}
              active={pathname.startsWith("/reports")}
            >
              {visibleReports.map(({ name, href, icon: Icon, submenu }) => {
                if (submenu) {
                  return (
                    <div key={name}>
                      <button
                        onClick={() => setSalesSubOpen(!salesSubOpen)}
                        className={clsx(
                          "flex w-full items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                          pathname.startsWith(href)
                            ? "bg-blue-100 text-blue-800"
                            : "text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          <span>{name}</span>
                        </span>
                        <ChevronRight className={clsx("h-3 w-3 transition-transform", salesSubOpen && "rotate-90")} />
                      </button>
                      <div className={clsx("ml-3 space-y-0.5 overflow-hidden transition-all duration-200", salesSubOpen ? "max-h-48 opacity-100 mt-0.5" : "max-h-0 opacity-0")}>
                        {submenu.map(({ name: n, href: h, icon: I }) => navLink(h, n, I, true))}
                      </div>
                    </div>
                  );
                }
                return navLink(href, name, Icon, true);
              })}
            </NavGroup>
          )}

          {/* Utilities */}
          {visibleUtil.length > 0 && (
            <NavGroup
              label="Utilities"
              isOpen={utilitiesOpen}
              onToggle={() => setUtilitiesOpen(!utilitiesOpen)}
              active={pathname.startsWith("/utilities")}
              accent="emerald"
            >
              {visibleUtil.map(({ name, href, icon: Icon }) => navLink(href, name, Icon, true))}
            </NavGroup>
          )}

          {/* Inventory */}
          {visibleInv.length > 0 && (
            <NavGroup
              label="Inventory"
              isOpen={inventoryOpen}
              onToggle={() => setInventoryOpen(!inventoryOpen)}
              active={pathname.startsWith("/inventory")}
              accent="orange"
            >
              {visibleInv.map(({ name, href, icon: Icon }) => navLink(href, name, Icon, true))}
            </NavGroup>
          )}

          {/* Settings */}
          {visibleSettings.length > 0 && (
            <NavGroup
              label="Settings"
              isOpen={settingsOpen}
              onToggle={() => setSettingsOpen(!settingsOpen)}
              active={pathname.startsWith("/settings")}
              accent="purple"
            >
              {visibleSettings.map(({ name, href, icon: Icon }) => navLink(href, name, Icon, true))}
            </NavGroup>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-200 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 mb-1 rounded-xl bg-gray-50">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.userName || "User"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all group"
          >
            <LogOut className="h-4 w-4 group-hover:text-red-600 transition-colors" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
