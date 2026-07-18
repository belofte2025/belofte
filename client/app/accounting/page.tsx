"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  ArrowLeftRight,
  BarChart3,
  AlertCircle,
  ChevronRight,
  Receipt,
  Truck,
} from "lucide-react";
import { getAccounts } from "@/services/accountingService";
import toast from "react-hot-toast";

const navCards = [
  {
    href: "/accounting/chart-of-accounts",
    icon: BookOpen,
    title: "Chart of Accounts",
    description: "Manage your account codes and categories",
    color: "text-blue-600 bg-blue-50",
  },
  {
    href: "/accounting/journal",
    icon: FileText,
    title: "Journal Entries",
    description: "View and create accounting journal entries",
    color: "text-green-600 bg-green-50",
  },
  {
    href: "/accounting/transfers",
    icon: ArrowLeftRight,
    title: "Ledger Transfers",
    description: "Transfer balances between parties",
    color: "text-purple-600 bg-purple-50",
  },
  {
    href: "/accounting/reports",
    icon: BarChart3,
    title: "Reports",
    description: "Trial balance, income statement, balance sheet",
    color: "text-orange-600 bg-orange-50",
  },
  {
    href: "/accounting/invoices",
    icon: FileText,
    title: "Invoices",
    description: "Create and manage customer invoices",
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    href: "/accounting/expenses",
    icon: Receipt,
    title: "Expenses",
    description: "Record and track business expenses",
    color: "text-rose-600 bg-rose-50",
  },
  {
    href: "/accounting/waybills",
    icon: Truck,
    title: "Waybills",
    description: "Manage delivery waybills and tracking",
    color: "text-teal-600 bg-teal-50",
  },
];

export default function AccountingPage() {
  const [accountingEnabled, setAccountingEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAccounts()
      .then(() => setAccountingEnabled(true))
      .catch((err) => {
        if (err?.response?.status === 404 || err?.response?.status === 403) {
          setAccountingEnabled(false);
        } else {
          setAccountingEnabled(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleEnable = async () => {
    try {
      const { seedDefaultAccounts } = await import("@/services/accountingService");
      await seedDefaultAccounts();
      toast.success("Accounting enabled with default chart of accounts");
      setAccountingEnabled(true);
    } catch {
      toast.error("Failed to enable accounting");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <h1 className="page-title">Accounting</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading...</span>
          </div>
        ) : accountingEnabled === false ? (
          <div className="card flex flex-col items-center text-center py-12 gap-4">
            <div className="w-14 h-14 rounded-full bg-yellow-50 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Accounting Not Set Up</h2>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Enable accounting to get a full chart of accounts, journal entries, and financial
                reports automatically generated from your sales and payments.
              </p>
            </div>
            <button onClick={handleEnable} className="btn btn-primary">
              Enable Accounting
            </button>
          </div>
        ) : (
          <div className="stats-grid">
            {navCards.map((card) => (
              <Link key={card.href} href={card.href} className="card group flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{card.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
