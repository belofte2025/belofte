"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggle = () => setSidebarOpen((v) => !v);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar: fixed drawer on mobile, fixed sidebar on desktop */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
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
