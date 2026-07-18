// components/layout/Sidebar.tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useState } from "react";
import {
  Home, Users, X, ShoppingCart, LogOut, ChevronDown, BarChart3,
  Container, Package, TrendingUp, TrendingDown, Building2, Factory,
  Settings, UserPlus, Truck, ShoppingBag, FileText, List,
  PiggyBankIcon, Shield, UserCog, Edit, ClipboardList,
  BookOpen, BookText, ArrowLeftRight, LineChart, Receipt, BadgeDollarSign,
} from "lucide-react";

const mainItems = [
  { name: "Dashboard",  href: "/dashboard",  icon: Home,         permission: "dashboard.view" },
  { name: "Customers",  href: "/customers",  icon: Users,        permission: "customers.view" },
  { name: "Suppliers",  href: "/suppliers",  icon: Factory,      permission: "suppliers.view" },
  { name: "Items",      href: "/items",      icon: Package,      permission: "items.view" },
  { name: "Containers", href: "/containers", icon: Container,    permission: "containers.view" },
  { name: "Sales",      href: "/sales",      icon: ShoppingCart, permission: "sales.view" },
];

const salesReportSub = [
  { name: "Summary",    href: "/reports/sales",             icon: ShoppingBag },
  { name: "Details",    href: "/reports/sales/saledetails", icon: FileText },
  { name: "Sales List", href: "/reports/sales/saleslist",   icon: List },
  { name: "Edit Sales", href: "/reports/sales/editsales",   icon: Edit },
];

const reportItems = [
  { name: "Overview",          href: "/reports",                   icon: BarChart3,     permission: "reports.view" },
  { name: "Sales",             href: "/reports/sales",             icon: TrendingUp,    permission: "reports.view", sub: salesReportSub },
  { name: "Payments",          href: "/reports/payments",          icon: List,          permission: "reports.view" },
  { name: "Customers",         href: "/reports/customers",         icon: Users,         permission: "reports.view" },
  { name: "Suppliers",         href: "/reports/suppliers",         icon: Factory,       permission: "reports.view" },
  { name: "Containers",        href: "/reports/containers",        icon: Container,     permission: "reports.view" },
  { name: "Inventory",         href: "/reports/inventory",         icon: Package,       permission: "reports.view" },
  { name: "Item Transactions", href: "/reports/item-transactions", icon: TrendingDown,  permission: "reports.view" },
  { name: "Cash Received",     href: "/reports/dailycash",         icon: PiggyBankIcon, permission: "reports.view" },
];

const utilityItems = [
  { name: "Overview",        href: "/utilities",                 icon: Settings, permission: "utilities.view" },
  { name: "Customer Import", href: "/utilities/customer-import", icon: UserPlus, permission: "utilities.import" },
  { name: "Supplier Import", href: "/utilities/supplier-import", icon: Truck,    permission: "utilities.import" },
];

const settingsItems = [
  { name: "Role Management",    href: "/settings/roles",              icon: Shield,      permission: "roles.manage" },
  { name: "User Management",    href: "/settings/users",              icon: UserCog,     permission: "users.view" },
  { name: "Item Deduplication", href: "/settings/item-deduplication", icon: Package,     permission: "items.deduplicate" },
];

const inventoryItems = [
  { name: "Stock Adjustments", href: "/inventory/adjustments", icon: ClipboardList, permission: "inventory.adjust" },
];

const accountingItems = [
  { name: "Overview",          href: "/accounting",                        icon: BookOpen },
  { name: "Invoices",          href: "/accounting/invoices",               icon: Receipt },
  { name: "Expenses",          href: "/accounting/expenses",               icon: BadgeDollarSign },
  { name: "Waybills",          href: "/accounting/waybills",               icon: Truck },
  { name: "Chart of Accounts", href: "/accounting/chart-of-accounts",      icon: BookText },
  { name: "Journal",           href: "/accounting/journal",                 icon: FileText },
  { name: "Transfers",         href: "/accounting/transfers",               icon: ArrowLeftRight },
  { name: "Reports",           href: "/accounting/reports",                 icon: LineChart },
];

type SidebarProps = { open: boolean; setOpen: (v: boolean) => void };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 select-none first:pt-2">
      {children}
    </p>
  );
}

function NavItem({
  href, name, icon: Icon, exact = false, small = false, onClick,
}: {
  href: string; name: string; icon: React.ElementType;
  exact?: boolean; small?: boolean; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "group flex items-center gap-2.5 rounded-md transition-colors duration-150",
        small ? "px-3 py-1.5 text-xs" : "px-3 py-2 text-sm",
        active
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <Icon className={clsx(
        "flex-shrink-0",
        small ? "h-3.5 w-3.5" : "h-4 w-4",
        active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
      )} />
      <span className="truncate flex-1">{name}</span>
      {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
    </Link>
  );
}

function CollapsibleGroup({
  label, defaultOpen, activeTest, children,
}: {
  label: string; defaultOpen: boolean; activeTest: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
          activeTest
            ? "text-blue-700 bg-blue-50"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown className={clsx(
          "h-3.5 w-3.5 flex-shrink-0 text-gray-400 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>
      {open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-gray-200 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const [salesSubOpen, setSalesSubOpen] = useState(pathname.startsWith("/reports/sales"));

  const visibleMain     = mainItems.filter(i => hasPermission(i.permission));
  const visibleReports  = reportItems.filter(i => hasPermission(i.permission));
  const visibleUtils    = utilityItems.filter(i => hasPermission(i.permission));
  const visibleSettings = settingsItems.filter(i => hasPermission(i.permission));
  const visibleInv      = inventoryItems.filter(i => hasPermission(i.permission));

  const close = () => setOpen(false);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={clsx(
          "fixed inset-0 bg-gray-900/40 z-40 transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
      />

      {/* Sidebar panel */}
      <aside className={clsx(
        "fixed top-0 left-0 z-50 w-64 h-screen flex flex-col",
        "bg-[#f8fafc] border-r border-gray-200",
        "transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>

        {/* Logo bar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">PETROS</span>
          </div>
          <button onClick={close} className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">

          {visibleMain.length > 0 && (
            <>
              <SectionLabel>Main</SectionLabel>
              {visibleMain.map(({ name, href, icon }) => (
                <NavItem key={href} href={href} name={name} icon={icon} exact={href === "/dashboard"} onClick={close} />
              ))}
            </>
          )}

          {visibleReports.length > 0 && (
            <>
              <SectionLabel>Reports</SectionLabel>
              <CollapsibleGroup
                label="Reports"
                defaultOpen={pathname.startsWith("/reports")}
                activeTest={pathname.startsWith("/reports")}
              >
                {visibleReports.map(({ name, href, icon: Icon, sub }) => {
                  if (sub) {
                    return (
                      <div key={href}>
                        <button
                          onClick={() => setSalesSubOpen(v => !v)}
                          className={clsx(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors",
                            pathname.startsWith(href)
                              ? "text-blue-700 font-semibold"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                          <span className="flex-1 text-left truncate">{name}</span>
                          <ChevronDown className={clsx("h-3 w-3 text-gray-400 flex-shrink-0 transition-transform duration-200", salesSubOpen && "rotate-180")} />
                        </button>
                        {salesSubOpen && (
                          <div className="ml-3 pl-3 border-l border-gray-200 space-y-0.5 mt-0.5">
                            {sub.map(({ name: n, href: h, icon: I }) => (
                              <NavItem key={h} href={h} name={n} icon={I} exact onClick={close} small />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return <NavItem key={href} href={href} name={name} icon={Icon} exact onClick={close} small />;
                })}
              </CollapsibleGroup>
            </>
          )}

          {visibleInv.length > 0 && (
            <>
              <SectionLabel>Inventory</SectionLabel>
              {visibleInv.map(({ name, href, icon }) => (
                <NavItem key={href} href={href} name={name} icon={icon} onClick={close} />
              ))}
            </>
          )}

          {visibleUtils.length > 0 && (
            <>
              <SectionLabel>Tools</SectionLabel>
              <CollapsibleGroup
                label="Utilities"
                defaultOpen={pathname.startsWith("/utilities")}
                activeTest={pathname.startsWith("/utilities")}
              >
                {visibleUtils.map(({ name, href, icon }) => (
                  <NavItem key={href} href={href} name={name} icon={icon} exact onClick={close} small />
                ))}
              </CollapsibleGroup>
            </>
          )}

          <SectionLabel>Accounting</SectionLabel>
          <CollapsibleGroup
            label="Accounting"
            defaultOpen={pathname.startsWith("/accounting")}
            activeTest={pathname.startsWith("/accounting")}
          >
            {accountingItems.map(({ name, href, icon }) => (
              <NavItem key={href} href={href} name={name} icon={icon} exact onClick={close} small />
            ))}
          </CollapsibleGroup>

          {visibleSettings.length > 0 && (
            <>
              <SectionLabel>Settings</SectionLabel>
              {visibleSettings.map(({ name, href, icon }) => (
                <NavItem key={href} href={href} name={name} icon={icon} onClick={close} />
              ))}
            </>
          )}

        </nav>

        {/* Developer credit */}
        <div className="px-3 py-2 flex-shrink-0">
          <p className="text-[10px] text-gray-400 text-center leading-snug">
            Developed by <span className="font-medium text-gray-500">EYO Solutions Ghana</span>
          </p>
          <p className="text-[10px] text-gray-400 text-center">0246462398</p>
        </div>

        {/* User footer */}
        <div className="border-t border-gray-200 bg-white p-3 flex-shrink-0 space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate leading-snug">{user?.userName || "User"}</p>
              <p className="text-[10px] text-gray-400 truncate leading-snug">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors group"
          >
            <LogOut className="h-4 w-4 group-hover:text-red-500 transition-colors" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
