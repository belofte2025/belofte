"use client";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import clsx from "clsx";

const COLLAPSE_KEY = "sidebar_collapsed";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setSidebarOpen((v) => !v);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const handleSetCollapsed = (v: boolean) => {
    setCollapsed(v);
    try {
      localStorage.setItem(COLLAPSE_KEY, v ? "1" : "0");
    } catch {
      /* localStorage unavailable */
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar: fixed drawer on mobile, fixed sidebar on desktop */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} collapsed={collapsed} setCollapsed={handleSetCollapsed} />

      {/* Main area — offset by sidebar width on desktop */}
      <div className={clsx("flex flex-col min-h-screen transition-[padding] duration-300", collapsed ? "lg:pl-20" : "lg:pl-64")}>
        {/* Sticky topbar */}
        <div className="sticky top-0 z-30">
          <Topbar onMenuClick={toggle} />
        </div>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 pb-20 lg:pb-6 animate-fade-in">
          <div className="page-container">{children}</div>
        </main>
      </div>

      {/* Bottom navigation (mobile only) */}
      <BottomNav onMenuClick={toggle} />
    </div>
  );
}
