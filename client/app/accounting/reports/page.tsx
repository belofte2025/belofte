"use client";

import { useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, BarChart3, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
  TrialBalanceLine,
  IncomeStatement,
  BalanceSheet,
} from "@/services/accountingService";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

type Tab = "trial-balance" | "income-statement" | "balance-sheet";

const TABS: { id: Tab; label: string }[] = [
  { id: "trial-balance", label: "Trial Balance" },
  { id: "income-statement", label: "Income Statement" },
  { id: "balance-sheet", label: "Balance Sheet" },
];

export default function ReportsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("trial-balance");

  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = `${today.slice(0, 7)}-01`;

  const [tbAsOf, setTbAsOf] = useState(today);
  const [tbData, setTbData] = useState<TrialBalanceLine[] | null>(null);
  const [tbLoading, setTbLoading] = useState(false);

  const [isStart, setIsStart] = useState(firstOfMonth);
  const [isEnd, setIsEnd] = useState(today);
  const [isData, setIsData] = useState<IncomeStatement | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [bsAsOf, setBsAsOf] = useState(today);
  const [bsData, setBsData] = useState<BalanceSheet | null>(null);
  const [bsLoading, setBsLoading] = useState(false);

  const fetchTrialBalance = useCallback(async () => {
    setTbLoading(true);
    try {
      const data = await getTrialBalance(tbAsOf);
      setTbData(data.accounts);
    } catch {
      toast.error("Failed to load trial balance");
    } finally {
      setTbLoading(false);
    }
  }, [tbAsOf]);

  const fetchIncomeStatement = useCallback(async () => {
    if (!isStart || !isEnd) {
      toast.error("Select both start and end dates");
      return;
    }
    setIsLoading(true);
    try {
      const data = await getIncomeStatement(isStart, isEnd);
      setIsData(data);
    } catch {
      toast.error("Failed to load income statement");
    } finally {
      setIsLoading(false);
    }
  }, [isStart, isEnd]);

  const fetchBalanceSheet = useCallback(async () => {
    setBsLoading(true);
    try {
      const data = await getBalanceSheet(bsAsOf);
      setBsData(data);
    } catch {
      toast.error("Failed to load balance sheet");
    } finally {
      setBsLoading(false);
    }
  }, [bsAsOf]);

  const tbTotalDebit = tbData?.reduce((s, a) => s + a.debit, 0) ?? 0;
  const tbTotalCredit = tbData?.reduce((s, a) => s + a.credit, 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="icon-btn text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="page-title">Reports</h1>
          </div>
        </div>

        <div className="card">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "trial-balance" && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> As of Date
                  </label>
                  <input
                    type="date"
                    value={tbAsOf}
                    onChange={(e) => setTbAsOf(e.target.value)}
                    className="input"
                  />
                </div>
                <button onClick={fetchTrialBalance} disabled={tbLoading} className="btn btn-primary">
                  <BarChart3 className="w-4 h-4" />
                  Generate
                </button>
              </div>
            </div>

            {tbLoading ? (
              <Spinner />
            ) : tbData === null ? (
              <EmptyPrompt message="Select a date and click Generate" />
            ) : tbData.length === 0 ? (
              <EmptyPrompt message="No data for the selected date" />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Account Name</th>
                      <th>Type</th>
                      <th className="text-right">Debit</th>
                      <th className="text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tbData.map((row, i) => (
                      <tr key={i}>
                        <td className="font-mono text-sm">{row.code}</td>
                        <td className="font-medium">{row.name}</td>
                        <td>
                          <span className="badge badge-gray">{row.type}</span>
                        </td>
                        <td className="text-right">
                          {row.debit > 0 ? formatCurrency(row.debit) : "—"}
                        </td>
                        <td className="text-right">
                          {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                      <td colSpan={3} className="py-2 px-3 text-sm text-gray-700">
                        Totals
                      </td>
                      <td className="text-right py-2 px-3 text-sm">{formatCurrency(tbTotalDebit)}</td>
                      <td className="text-right py-2 px-3 text-sm">{formatCurrency(tbTotalCredit)}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="py-1 px-3">
                        <span
                          className={`badge ${Math.abs(tbTotalDebit - tbTotalCredit) < 0.01 ? "badge-green" : "badge-red"}`}
                        >
                          {Math.abs(tbTotalDebit - tbTotalCredit) < 0.01
                            ? "Balanced"
                            : `Difference: ${formatCurrency(Math.abs(tbTotalDebit - tbTotalCredit))}`}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "income-statement" && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Start Date
                  </label>
                  <input
                    type="date"
                    value={isStart}
                    onChange={(e) => setIsStart(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> End Date
                  </label>
                  <input
                    type="date"
                    value={isEnd}
                    onChange={(e) => setIsEnd(e.target.value)}
                    className="input"
                  />
                </div>
                <button
                  onClick={fetchIncomeStatement}
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  <BarChart3 className="w-4 h-4" />
                  Generate
                </button>
              </div>
            </div>

            {isLoading ? (
              <Spinner />
            ) : isData === null ? (
              <EmptyPrompt message="Select a date range and click Generate" />
            ) : (
              <div className="card space-y-4">
                <ISSection title="Revenue" rows={isData.revenue} />
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Total Revenue</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(isData.totalRevenue)}
                  </span>
                </div>
                <ISSection title="Cost of Goods Sold" rows={isData.cogs} />
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-700">Gross Profit</span>
                  <span
                    className={`text-sm font-bold ${isData.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(isData.grossProfit)}
                  </span>
                </div>
                <ISSection title="Expenses" rows={isData.expenses} />
                <div className="flex justify-between py-3 border-t-2 border-gray-300 bg-gray-50 px-3 rounded-xl">
                  <span className="text-sm font-bold text-gray-900">Net Income</span>
                  <span
                    className={`text-sm font-bold ${isData.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(isData.netIncome)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "balance-sheet" && (
          <div className="space-y-4">
            <div className="card">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> As of Date
                  </label>
                  <input
                    type="date"
                    value={bsAsOf}
                    onChange={(e) => setBsAsOf(e.target.value)}
                    className="input"
                  />
                </div>
                <button onClick={fetchBalanceSheet} disabled={bsLoading} className="btn btn-primary">
                  <BarChart3 className="w-4 h-4" />
                  Generate
                </button>
              </div>
            </div>

            {bsLoading ? (
              <Spinner />
            ) : bsData === null ? (
              <EmptyPrompt message="Select a date and click Generate" />
            ) : (
              <div className="card space-y-4">
                <BSSection title="Assets" rows={bsData.assets} total={bsData.totalAssets} totalLabel="Total Assets" totalColor="text-blue-600" />
                <BSSection title="Liabilities" rows={bsData.liabilities} total={bsData.totalLiabilities} totalLabel="Total Liabilities" totalColor="text-red-600" />
                <BSSection title="Equity" rows={bsData.equity} total={bsData.totalEquity} totalLabel="Total Equity" totalColor="text-purple-600" />
                <div className="flex justify-between py-3 border-t-2 border-gray-300 bg-gray-50 px-3 rounded-xl">
                  <span className="text-sm font-bold text-gray-900">
                    Total Liabilities + Equity
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(bsData.totalLiabilities + bsData.totalEquity)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
      <span className="ml-3 text-sm text-gray-500">Loading...</span>
    </div>
  );
}

function EmptyPrompt({ message }: { message: string }) {
  return (
    <div className="card text-center py-12">
      <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 mt-3">{message}</p>
    </div>
  );
}

function ISSection({
  title,
  rows,
}: {
  title: string;
  rows: { accountName: string; amount: number }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 pl-2">No entries</p>
      ) : (
        <div className="space-y-1">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-between text-sm px-2">
              <span className="text-gray-700">{row.accountName}</span>
              <span className="text-gray-900 font-medium">{formatCurrency(row.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BSSection({
  title,
  rows,
  total,
  totalLabel,
  totalColor,
}: {
  title: string;
  rows: { accountName: string; amount: number }[];
  total: number;
  totalLabel: string;
  totalColor: string;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 pl-2">No entries</p>
      ) : (
        <div className="space-y-1 mb-2">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-between text-sm px-2">
              <span className="text-gray-700">{row.accountName}</span>
              <span className="text-gray-900 font-medium">{formatCurrency(row.amount)}</span>
            </div>
          ))}
        </div>
      )}
      <div className={`flex justify-between text-sm font-semibold px-2 pt-2 border-t border-gray-100 ${totalColor}`}>
        <span>{totalLabel}</span>
        <span>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
