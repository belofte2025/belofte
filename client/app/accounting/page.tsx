"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  BookOpen, FileText, ArrowLeftRight, BarChart3, AlertCircle,
  ChevronRight, Receipt, Truck, RefreshCw, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { getAccounts, runBackfill, BackfillResult } from "@/services/accountingService";
import toast from "react-hot-toast";

const navCards = [
  { href: "/accounting/chart-of-accounts", icon: BookOpen,       title: "Chart of Accounts",  description: "Manage your account codes and categories",        color: "text-blue-600 bg-blue-50" },
  { href: "/accounting/journal",            icon: FileText,       title: "Journal Entries",    description: "View and create accounting journal entries",      color: "text-green-600 bg-green-50" },
  { href: "/accounting/transfers",          icon: ArrowLeftRight, title: "Ledger Transfers",   description: "Transfer balances between parties",               color: "text-purple-600 bg-purple-50" },
  { href: "/accounting/reports",            icon: BarChart3,      title: "Reports",            description: "Trial balance, income statement, balance sheet",  color: "text-orange-600 bg-orange-50" },
  { href: "/accounting/invoices",           icon: FileText,       title: "Invoices",           description: "Create and manage customer invoices",             color: "text-indigo-600 bg-indigo-50" },
  { href: "/accounting/expenses",           icon: Receipt,        title: "Expenses",           description: "Record and track business expenses",              color: "text-rose-600 bg-rose-50" },
  { href: "/accounting/waybills",           icon: Truck,          title: "Waybills",           description: "Manage delivery waybills and tracking",           color: "text-teal-600 bg-teal-50" },
];

export default function AccountingPage() {
  const [accountingEnabled, setAccountingEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Backfill: auto-checked on mount
  const [checking, setChecking] = useState(false);
  const [pending, setPending] = useState<{ sales: number; payments: number } | null>(null);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState<BackfillResult | null>(null);
  const [allDone, setAllDone] = useState(false);

  const checkPending = async () => {
    setChecking(true);
    try {
      const r = await runBackfill({ scope: "all", dryRun: true, maxRecords: 500 });
      if (r.salesPosted === 0 && r.paymentsPosted === 0) {
        setAllDone(true);
        setPending(null);
      } else {
        setPending({ sales: r.salesPosted, payments: r.paymentsPosted });
        setAllDone(false);
      }
    } catch {
      // silently ignore — panel just won't show
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    getAccounts()
      .then(() => {
        setAccountingEnabled(true);
        checkPending();
      })
      .catch((err) => {
        setAccountingEnabled(
          err?.response?.status === 404 || err?.response?.status === 403 ? false : true
        );
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

  const handlePost = async () => {
    setPosting(true);
    try {
      const result = await runBackfill({ scope: "all", dryRun: false, maxRecords: 500 });
      setPosted(result);
      if (result.remainingUnposted === 0) {
        setAllDone(true);
        setPending(null);
      } else {
        setPending({ sales: 0, payments: 0 }); // will re-check
        await checkPending();
      }
      toast.success(
        `${result.salesPosted + result.paymentsPosted} transactions added to accounts`
      );
    } catch {
      toast.error("Failed to post transactions");
    } finally {
      setPosting(false);
    }
  };

  const showPanel = accountingEnabled && !loading && !allDone && (checking || pending !== null || posted !== null);

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
          <>
            {/* Sync panel — only shown when there's something to do */}
            {showPanel && (
              <div className="bg-white rounded-xl border border-amber-200 shadow-sm">
                <div className="flex items-start gap-3 p-4">
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      Sales & Payments Not Yet in Your Accounts
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Transactions recorded before accounting was set up are missing from the General Ledger.
                      Your financial reports will be incomplete until they are added.
                    </p>

                    {/* Counts */}
                    {checking && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-gray-400" />
                        Checking…
                      </div>
                    )}

                    {!checking && pending && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <span className="text-lg font-black text-amber-700">{pending.sales}</span>
                          <span className="text-xs text-amber-600 font-medium">sales<br/>not in accounts</span>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <span className="text-lg font-black text-amber-700">{pending.payments}</span>
                          <span className="text-xs text-amber-600 font-medium">customer payments<br/>not in accounts</span>
                        </div>
                      </div>
                    )}

                    {/* Success result */}
                    {posted && !posting && (
                      <div className="mt-3 flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-800">
                          <span className="font-semibold">{posted.salesPosted} sales</span> and{" "}
                          <span className="font-semibold">{posted.paymentsPosted} payments</span> added to your accounts.
                          {posted.remainingUnposted > 0 && (
                            <span className="text-xs block mt-0.5 text-green-700">
                              {posted.remainingUnposted} more records remain — click again to continue.
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action */}
                    {!checking && pending && (
                      <button
                        onClick={handlePost}
                        disabled={posting}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50"
                        style={{ background: "#0099d6" }}
                      >
                        {posting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            Adding to accounts…
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Add {pending.sales + pending.payments} Transactions to Accounts
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Greyed-out done state */}
            {accountingEnabled && allDone && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-2 opacity-60">
                <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-400">All historical transactions are in your accounts.</p>
              </div>
            )}

            {/* Nav cards */}
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
