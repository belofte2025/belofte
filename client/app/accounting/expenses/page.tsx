"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Receipt, AlertCircle, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getExpenses, Expense } from "@/services/expenseService";
import { getAccounts, Account } from "@/services/accountingService";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

const PAYMENT_ACCOUNT_CODES = ["1010", "1020", "1030"];

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountFilter, setAccountFilter] = useState("");

  const expenseAccounts = accounts.filter((a) => a.type === "EXPENSE");

  const fetchExpenses = () => {
    setLoading(true);
    getExpenses({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      accountId: accountFilter || undefined,
    })
      .then((data) => setExpenses(Array.isArray(data) ? data : (data.expenses ?? [])))
      .catch(() => toast.error("Failed to load expenses"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate, accountFilter]);

  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const now = new Date();
  const thisMonthTotal = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, e) => s + e.amount, 0);

  const thisYearTotal = expenses
    .filter((e) => new Date(e.date).getFullYear() === now.getFullYear())
    .reduce((s, e) => s + e.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <h1 className="page-title">Expenses</h1>
          <button onClick={() => router.push("/accounting/expenses/new")} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Record Expense</span>
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <p className="text-xs text-gray-500">This Month</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(thisMonthTotal)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-500">This Year</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(thisYearTotal)}</p>
          </div>
        </div>

        {!loading && expenseAccounts.length === 0 && (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-900">Expense accounts not set up</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Go to{" "}
                <Link href="/accounting/chart-of-accounts" className="font-semibold underline">
                  Chart of Accounts
                </Link>{" "}
                and click &ldquo;Seed Default Accounts&rdquo; to create the standard expense categories
                (Rent, Salaries, Utilities, Transport, etc.).
              </p>
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
              style={{ maxWidth: 160 }}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
              style={{ maxWidth: 160 }}
            />
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="input"
              style={{ maxWidth: 220 }}
            >
              <option value="">All Expense Accounts</option>
              {expenseAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="card text-center py-12">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-3">No expenses found</p>
            <p className="text-xs text-gray-500 mt-1">Record your first expense</p>
          </div>
        ) : (
          <>
            <div className="mobile-list sm:hidden">
              {expenses.map((exp) => (
                <div key={exp.id} className="mobile-list-item">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{exp.expenseNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{exp.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{exp.date}</span>
                    <span className="text-xs text-gray-500">{exp.ExpenseAccount?.name ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="table-wrapper hidden sm:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Expense #</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Account</th>
                    <th>Paid From</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="font-mono text-sm">{exp.expenseNumber}</td>
                      <td>{exp.date}</td>
                      <td>{exp.description}</td>
                      <td>
                        {exp.ExpenseAccount
                          ? `${exp.ExpenseAccount.code} — ${exp.ExpenseAccount.name}`
                          : "—"}
                      </td>
                      <td>
                        {exp.PaymentAccount
                          ? `${exp.PaymentAccount.code} — ${exp.PaymentAccount.name}`
                          : "—"}
                      </td>
                      <td className="font-medium">{formatCurrency(exp.amount)}</td>
                      <td>
                        <Link
                          href={`/accounting/expenses/${exp.id}/edit`}
                          className="icon-btn text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
