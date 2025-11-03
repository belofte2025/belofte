"use client";

import { useState } from "react";
import { Menu, Bell, ChevronDown, User, Lock, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UpdatePasswordModal from "@/components/auth/UpdatePasswordModal";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        {/* Left side - Mobile menu + Search */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search bar - hidden on mobile */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <div className="inline-flex items-center bg-blue-700 text-white px-5 py-2 rounded-lg shadow-md">
                <span className="text-base font-semibold">
                  {user?.company?.companyName || "EYO Solutions"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Notifications + User */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User info - desktop only */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.userName || "User"} - {user?.role}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.userName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      // Add profile navigation if needed
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-gray-500" />
                    Update Password
                  </button>

                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Update Password Modal */}
      <UpdatePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
}
