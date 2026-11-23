"use client";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import clsx from "clsx";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();
  const toggle = () => setSidebarOpen((v) => !v);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [sidebarOpen]);

  return (
    <div className="workspace-shell min-h-screen">
      <a href="#workspace-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      {/* Sidebar: fixed drawer on mobile, fixed sidebar on desktop */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main area — offset by sidebar width on desktop */}
      <div className={clsx("flex flex-col min-h-screen transition-[padding] duration-300", collapsed ? "lg:pl-20" : "lg:pl-[248px]")}>
        {/* Sticky topbar */}
        <div className="sticky top-0 z-30">
          <Topbar onMenuClick={toggle} menuOpen={sidebarOpen} />
        </div>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main id="workspace-content" className="workspace-main flex-1 min-w-0">
          <div className="page-container">{children}</div>
        </main>
      </div>

      {/* Bottom navigation (mobile only) */}
      <BottomNav onMenuClick={toggle} menuOpen={sidebarOpen} />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SidebarProvider>
  );
}
