"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  BookOpen, FileText, ArrowLeftRight, BarChart3, AlertCircle,
  ChevronRight, Receipt, Truck, RefreshCw, CheckCircle2, XCircle,
  AlertTriangle,
} from "lucide-react";
import { getAccounts, runBackfill, BackfillResult } from "@/services/accountingService";
import toast from "react-hot-toast";

const navCards = [
  { href: "/accounting/chart-of-accounts", icon: BookOpen,       title: "Chart of Accounts",  description: "Manage your account codes and categories",               color: "text-blue-600 bg-blue-50" },
  { href: "/accounting/journal",            icon: FileText,       title: "Journal Entries",    description: "View and create accounting journal entries",             color: "text-green-600 bg-green-50" },
  { href: "/accounting/transfers",          icon: ArrowLeftRight, title: "Ledger Transfers",   description: "Transfer balances between parties",                      color: "text-purple-600 bg-purple-50" },
  { href: "/accounting/reports",            icon: BarChart3,      title: "Reports",            description: "Trial balance, income statement, balance sheet",         color: "text-orange-600 bg-orange-50" },
  { href: "/accounting/invoices",           icon: FileText,       title: "Invoices",           description: "Create and manage customer invoices",                    color: "text-indigo-600 bg-indigo-50" },
  { href: "/accounting/expenses",           icon: Receipt,        title: "Expenses",           description: "Record and track business expenses",                     color: "text-rose-600 bg-rose-50" },
  { href: "/accounting/waybills",           icon: Truck,          title: "Waybills",           description: "Manage delivery waybills and tracking",                  color: "text-teal-600 bg-teal-50" },
];

type BackfillStep = "idle" | "checking" | "ready" | "running" | "done";

export default function AccountingPage() {
  const [accountingEnabled, setAccountingEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Backfill state
  const [backfillStep, setBackfillStep] = useState<BackfillStep>("idle");
  const [dryRunResult, setDryRunResult] = useState<BackfillResult | null>(null);
  const [runResult, setRunResult] = useState<BackfillResult | null>(null);
  const [backfillScope, setBackfillScope] = useState<"all" | "sales" | "payments">("all");
  const [backfillComplete, setBackfillComplete] = useState(false);

  useEffect(() => {
    getAccounts()
      .then(() => {
        setAccountingEnabled(true);
        // Silently check if any unposted records exist
        runBackfill({ scope: "all", dryRun: true, maxRecords: 1 })
          .then((r) => {
            if (r.salesPosted === 0 && r.paymentsPosted === 0) {
              setBackfillComplete(true);
            }
          })
          .catch(() => {});
      })
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

  const handleDryRun = async () => {
    setBackfillStep("checking");
    setDryRunResult(null);
    setRunResult(null);
    try {
      const result = await runBackfill({ scope: backfillScope, dryRun: true, maxRecords: 500 });
      setDryRunResult(result);
      setBackfillStep("ready");
    } catch {
      toast.error("Failed to check unposted records");
      setBackfillStep("idle");
    }
  };

  const handleRun = async () => {
    if (!dryRunResult) return;
    setBackfillStep("running");
    try {
      const result = await runBackfill({ scope: backfillScope, dryRun: false, maxRecords: 500 });
      setRunResult(result);
      setBackfillStep("done");
      if (result.remainingUnposted === 0) setBackfillComplete(true);
      if (result.errors.length === 0) {
        toast.success(`Posted ${result.salesPosted} sales and ${result.paymentsPosted} payments to GL`);
      } else {
        toast(`Posted with ${result.errors.length} error(s)`, { icon: "⚠️" });
      }
    } catch {
      toast.error("Backfill failed");
      setBackfillStep("ready");
    }
  };

  const resetBackfill = () => {
    setBackfillStep("idle");
    setDryRunResult(null);
    setRunResult(null);
  };

  const totalWouldPost = dryRunResult ? dryRunResult.salesPosted + dryRunResult.paymentsPosted : 0;
  const totalPosted = runResult ? runResult.salesPosted + runResult.paymentsPosted : 0;

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
            {/* GL Backfill Panel */}
            <div className={`bg-white rounded-xl shadow-sm overflow-hidden border ${backfillComplete ? "border-gray-200 opacity-60 pointer-events-none" : "border-amber-200"}`}>
              <div className={`flex items-start gap-3 p-4 border-b ${backfillComplete ? "bg-gray-50 border-gray-200" : "bg-amber-50 border-amber-200"}`}>
                {backfillComplete
                  ? <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${backfillComplete ? "text-gray-400" : "text-amber-900"}`}>
                    {backfillComplete ? "Historical Transactions Posted to GL" : "Historical Transactions Not in GL"}
                  </p>
                  <p className={`text-xs mt-0.5 ${backfillComplete ? "text-gray-400" : "text-amber-700"}`}>
                    {backfillComplete
                      ? "All historical sales and payments have been posted. Nothing to do."
                      : "Sales, customer payments, and cash collected before accounting was enabled have no journal entries. Post them to the General Ledger to get accurate financial reports."}
                  </p>
                </div>
              </div>

              <div className={`p-4 space-y-4 ${backfillComplete ? "hidden" : ""}`}>
                {/* Scope selector */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-medium text-gray-600">Post:</span>
                  {(["all", "sales", "payments"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setBackfillScope(s); resetBackfill(); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        backfillScope === s
                          ? "border-transparent text-white"
                          : "border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}
                      style={backfillScope === s ? { background: "#0099d6" } : {}}
                    >
                      {s === "all" ? "Sales + Payments" : s === "sales" ? "Sales only" : "Payments only"}
                    </button>
                  ))}
                </div>

                {/* Step: idle */}
                {backfillStep === "idle" && (
                  <button
                    onClick={handleDryRun}
                    className="btn btn-secondary gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Check Unposted Records
                  </button>
                )}

                {/* Step: checking */}
                {backfillStep === "checking" && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    Counting unposted records…
                  </div>
                )}

                {/* Step: ready (dry run done) */}
                {backfillStep === "ready" && dryRunResult && (
                  <div className="space-y-3">
                    {totalWouldPost === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2.5 border border-green-200">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        All records are already posted to the GL. Nothing to do.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500">Sales to post</p>
                            <p className="text-xl font-bold text-gray-900">{dryRunResult.salesPosted}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500">Payments to post</p>
                            <p className="text-xl font-bold text-gray-900">{dryRunResult.paymentsPosted}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500">Already posted</p>
                            <p className="text-xl font-bold text-gray-900">{dryRunResult.skipped}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {dryRunResult.remainingUnposted > 500
                            ? `More than 500 unposted records detected. This run will post up to 500 at a time — run again after to post the rest.`
                            : `This will create journal entries for ${totalWouldPost} historical record(s).`}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleRun}
                            className="btn text-white"
                            style={{ background: "#0099d6" }}
                          >
                            <RefreshCw className="w-4 h-4" />
                            Post {totalWouldPost} Records to GL
                          </button>
                          <button onClick={resetBackfill} className="btn btn-secondary">
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Step: running */}
                {backfillStep === "running" && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                    Posting journal entries… this may take a moment.
                  </div>
                )}

                {/* Step: done */}
                {backfillStep === "done" && runResult && (
                  <div className="space-y-3">
                    <div className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2.5 border ${
                      runResult.errors.length === 0
                        ? "text-green-700 bg-green-50 border-green-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    }`}>
                      {runResult.errors.length === 0
                        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className="font-semibold">
                          {runResult.errors.length === 0
                            ? `Successfully posted ${totalPosted} record(s) to the GL`
                            : `Posted ${totalPosted} record(s) with ${runResult.errors.length} error(s)`}
                        </p>
                        <p className="text-xs mt-0.5">
                          {runResult.salesPosted} sales · {runResult.paymentsPosted} payments · {runResult.skipped} skipped
                          {runResult.remainingUnposted > 0 && ` · ${runResult.remainingUnposted} still unposted`}
                        </p>
                      </div>
                    </div>

                    {runResult.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <p className="text-xs font-semibold text-red-700 mb-1">Errors:</p>
                        {runResult.errors.map((e, i) => (
                          <p key={i} className="text-xs text-red-600 font-mono">{e}</p>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {runResult.remainingUnposted > 0 && (
                        <button onClick={() => { resetBackfill(); }} className="btn btn-secondary text-xs">
                          Run Again for Remaining {runResult.remainingUnposted}
                        </button>
                      )}
                      <button onClick={resetBackfill} className="btn btn-secondary text-xs">
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

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
