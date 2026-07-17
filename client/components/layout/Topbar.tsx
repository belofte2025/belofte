"use client";

import { useState } from "react";
import { Menu, Bell, ChevronDown, User, Lock, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UpdatePasswordModal from "@/components/auth/UpdatePasswordModal";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 h-14 px-3 flex items-center justify-between lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold truncate max-w-[160px] sm:max-w-xs">
            {user?.company?.companyName || "PETROS"}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                    <p className="text-xs text-blue-600 font-medium mt-0.5">{user?.role}</p>
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
