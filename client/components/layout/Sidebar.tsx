// components/layout/Sidebar.tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Home, Users, X, ShoppingCart, ChevronDown, ChevronsLeft, ChevronsRight, BarChart3,
  Container, Package, TrendingUp, TrendingDown, Factory,
  Settings, UserPlus, Truck, ShoppingBag, FileText, List,
  PiggyBankIcon, Shield, UserCog, Edit, ClipboardList,
  BookOpen, BookText, ArrowLeftRight, LineChart, Receipt, BadgeDollarSign,
  Bell, History,
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
  { name: "Notifications",      href: "/settings/notifications",      icon: Bell,        permission: "users.view" },
  { name: "Audit Log",          href: "/settings/audit",              icon: History,     permission: "audit.view" },
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

type SidebarProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
};

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="mt-4 mx-3 border-t border-white/10 first:mt-2" />;
  return (
    <p className="px-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-widest text-white/30 select-none first:pt-2">
      {children}
    </p>
  );
}

function NavItem({
  href, name, icon: Icon, exact = false, small = false, collapsed = false, onClick,
}: {
  href: string; name: string; icon: React.ElementType;
  exact?: boolean; small?: boolean; collapsed?: boolean; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? name : undefined}
      className={clsx(
        "group relative flex items-center gap-2.5 rounded-lg transition-colors duration-150",
        collapsed ? "justify-center px-0 py-2.5" : small ? "px-3 py-1.5 text-xs" : "px-3 py-2 text-sm",
        active
          ? "bg-white/10 text-white font-semibold"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full" style={{ background: "#00AEEF" }} />
      )}
      <Icon className={clsx(
        "flex-shrink-0",
        small ? "h-3.5 w-3.5" : "h-[18px] w-[18px]",
        active ? "text-[#00AEEF]" : "text-white/40 group-hover:text-white/70"
      )} />
      {!collapsed && <span className="truncate flex-1">{name}</span>}
    </Link>
  );
}

function CollapsibleGroup({
  label, icon: Icon, defaultOpen, activeTest, collapsed, onExpandSidebar, children,
}: {
  label: string; icon: React.ElementType; defaultOpen: boolean; activeTest: boolean;
  collapsed: boolean; onExpandSidebar: () => void; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const handleClick = () => {
    if (collapsed) {
      onExpandSidebar();
      setOpen(true);
      return;
    }
    setOpen(!open);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        title={collapsed ? label : undefined}
        className={clsx(
          "w-full flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
          collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2",
          activeTest
            ? "text-white bg-white/10"
            : "text-white/60 hover:bg-white/5 hover:text-white"
        )}
      >
        <Icon className={clsx(collapsed ? "h-[18px] w-[18px]" : "h-4 w-4 flex-shrink-0", activeTest ? "text-[#00AEEF]" : "text-white/40")} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{label}</span>
            <ChevronDown className={clsx(
              "h-3.5 w-3.5 flex-shrink-0 text-white/30 transition-transform duration-200",
              open && "rotate-180"
            )} />
          </>
        )}
      </button>
      {!collapsed && open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export default function Sidebar({ open, setOpen, collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [salesSubOpen, setSalesSubOpen] = useState(pathname.startsWith("/reports/sales"));
  // The icon-only rail only ever applies on desktop — the mobile drawer must
  // always render fully expanded, even if the desktop collapse preference is on.
  const isDesktop = useIsDesktop();
  const collapsedUi = collapsed && isDesktop;

  const visibleMain     = mainItems.filter(i => hasPermission(i.permission));
  const visibleReports  = reportItems.filter(i => hasPermission(i.permission));
  const visibleUtils    = utilityItems.filter(i => hasPermission(i.permission));
  const visibleSettings = settingsItems.filter(i => hasPermission(i.permission));
  const visibleInv      = inventoryItems.filter(i => hasPermission(i.permission));

  const close = () => setOpen(false);
  const expandSidebar = () => setCollapsed(false);
  const initials = (user?.userName || user?.email || "U").charAt(0).toUpperCase();

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
        "fixed top-0 left-0 z-50 h-screen flex flex-col",
        collapsed ? "lg:w-20" : "lg:w-64",
        "w-64",
        "transform transition-[transform,width] duration-300 ease-in-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )} style={{ background: "#0A2540" }}>

        {/* Logo bar */}
        <div className={clsx(
          "h-14 flex items-center border-b border-white/10 flex-shrink-0",
          collapsedUi ? "justify-center px-2" : "justify-between px-4"
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <Image src="/icon/eyo.png" alt="EYO" width={22} height={22} className="object-contain block flex-shrink-0" priority />
            {!collapsedUi && <span className="text-sm font-bold text-white tracking-tight truncate">PETROS</span>}
          </div>
          {!collapsedUi && (
            <button onClick={close} className="lg:hidden p-1.5 rounded-md text-white/70 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={clsx("flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-0.5", collapsedUi ? "px-2.5" : "px-2")}>

          {visibleMain.length > 0 && (
            <>
              <SectionLabel collapsed={collapsedUi}>Main</SectionLabel>
              {visibleMain.map(({ name, href, icon }) => (
                <NavItem key={href} href={href} name={name} icon={icon} exact={href === "/dashboard"} collapsed={collapsedUi} onClick={close} />
              ))}
            </>
          )}

          {visibleReports.length > 0 && (
            <>
              <SectionLabel collapsed={collapsedUi}>Reports</SectionLabel>
              <CollapsibleGroup
                label="Reports"
                icon={BarChart3}
                defaultOpen={pathname.startsWith("/reports")}
                activeTest={pathname.startsWith("/reports")}
                collapsed={collapsedUi}
                onExpandSidebar={expandSidebar}
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
                              ? "text-white font-semibold"
                              : "text-white/60 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 flex-shrink-0 text-white/40" />
                          <span className="flex-1 text-left truncate">{name}</span>
                          <ChevronDown className={clsx("h-3 w-3 text-white/30 flex-shrink-0 transition-transform duration-200", salesSubOpen && "rotate-180")} />
                        </button>
                        {salesSubOpen && (
                          <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5 mt-0.5">
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
              <SectionLabel collapsed={collapsedUi}>Inventory</SectionLabel>
              {visibleInv.map(({ name, href, icon }) => (
                <NavItem key={href} href={href} name={name} icon={icon} collapsed={collapsedUi} onClick={close} />
              ))}
            </>
          )}

          {visibleUtils.length > 0 && (
            <>
              <SectionLabel collapsed={collapsedUi}>Tools</SectionLabel>
              <CollapsibleGroup
                label="Utilities"
                icon={Settings}
                defaultOpen={pathname.startsWith("/utilities")}
                activeTest={pathname.startsWith("/utilities")}
                collapsed={collapsedUi}
                onExpandSidebar={expandSidebar}
              >
                {visibleUtils.map(({ name, href, icon }) => (
                  <NavItem key={href} href={href} name={name} icon={icon} exact onClick={close} small />
                ))}
              </CollapsibleGroup>
            </>
          )}

          <SectionLabel collapsed={collapsedUi}>Accounting</SectionLabel>
          <CollapsibleGroup
            label="Accounting"
            icon={BookOpen}
            defaultOpen={pathname.startsWith("/accounting")}
            activeTest={pathname.startsWith("/accounting")}
            collapsed={collapsedUi}
            onExpandSidebar={expandSidebar}
          >
            {accountingItems.map(({ name, href, icon }) => (
              <NavItem key={href} href={href} name={name} icon={icon} exact onClick={close} small />
            ))}
          </CollapsibleGroup>

          {visibleSettings.length > 0 && (
            <>
              <SectionLabel collapsed={collapsedUi}>Settings</SectionLabel>
              {visibleSettings.map(({ name, href, icon }) => (
                <NavItem key={href} href={href} name={name} icon={icon} collapsed={collapsedUi} onClick={close} />
              ))}
            </>
          )}

        </nav>

        {/* User card + collapse toggle */}
        <div className="flex-shrink-0 border-t border-white/10">
          <div className={clsx("flex items-center gap-2.5 px-3 py-3", collapsedUi && "justify-center px-2")}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm"
              style={{ background: "#00AEEF" }}
              title={collapsedUi ? (user?.userName || user?.email || "User") : undefined}
            >
              {initials}
            </div>
            {!collapsedUi && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{user?.userName || "User"}</p>
                <p className="text-xs text-white/40 truncate">{user?.role || user?.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={clsx(
              "hidden lg:flex w-full items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white hover:bg-white/5 transition-colors border-t border-white/10",
              collapsedUi && "justify-center px-0"
            )}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <><ChevronsLeft className="w-4 h-4" /> Collapse</>}
          </button>

          {!collapsedUi && (
            <p className="px-3 pb-2 pt-1 text-[10px] text-white/25 text-center leading-snug">
              EYO Solutions Ghana · 0246462398
            </p>
          )}
        </div>

      </aside>
    </>
  );
}
