"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Bell, ChevronDown, ChevronRight, User, Lock, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UpdatePasswordModal from "@/components/auth/UpdatePasswordModal";

const UUID_OR_ID_RE = /^[0-9a-f-]{16,}$/i;

function humanizeSegment(segment: string): string {
  if (UUID_OR_ID_RE.test(segment)) return "Details";
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label: humanizeSegment(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return crumbs;
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const crumbs = useBreadcrumb();

  return (
    <>
      <header className="h-14 px-3 flex items-center justify-between lg:px-6 bg-white border-b border-gray-200 shadow-sm">
        {/* Left: menu toggle + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="lg:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-1.5 min-w-0 text-sm">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 hidden sm:inline">
              Home
            </Link>
            {crumbs.map((c) => (
              <span key={c.href} className="flex items-center gap-1.5 min-w-0">
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 hidden sm:inline" />
                {c.isLast ? (
                  <span className="font-semibold text-gray-900 truncate">{c.label}</span>
                ) : (
                  <Link href={c.href} className="text-gray-400 hover:text-gray-600 transition-colors truncate hidden sm:inline">
                    {c.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="hidden md:inline text-xs font-medium text-gray-400 mr-2 truncate max-w-[160px]">
            {user?.company?.companyName}
          </span>

          <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#0A2540" }}>
                <span className="text-white font-semibold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                {user?.userName || "User"}
              </span>
              <ChevronDown className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-20 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.userName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: "#0099d6" }}>{user?.role}</p>
                  </div>

                  <button
                    onClick={() => setShowDropdown(false)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Profile
                  </button>

                  <button
                    onClick={() => { setShowDropdown(false); setShowPasswordModal(true); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-gray-400" />
                    Update Password
                  </button>

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { logout(); setShowDropdown(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <UpdatePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </>
  );
}
