"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, X, Receipt, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getExpenses, createExpense, Expense } from "@/services/expenseService";
import { getAccounts, Account } from "@/services/accountingService";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

const PAYMENT_ACCOUNT_CODES = ["1010", "1020", "1030"];

const defaultForm = () => ({
  date: new Date().toISOString().split("T")[0],
  description: "",
  amount: "",
  accountId: "",
  paymentAccountId: "",
  reference: "",
});

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);

  const expenseAccounts = accounts.filter((a) => a.type === "EXPENSE");
  const paymentAccounts = accounts.filter((a) => PAYMENT_ACCOUNT_CODES.includes(a.code));

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
    getAccounts().catch(() => {});
    getAccounts()
      .then(setAccounts)
      .catch(() => {});
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

  const closeModal = () => {
    setShowModal(false);
    setForm(defaultForm());
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.description || !form.amount || !form.accountId || !form.paymentAccountId) {
      toast.error("Fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      await createExpense({
        date: form.date,
        description: form.description,
        amount: parseFloat(form.amount),
        accountId: form.accountId,
        paymentAccountId: form.paymentAccountId,
        reference: form.reference || undefined,
      });
      toast.success("Expense recorded");
      closeModal();
      fetchExpenses();
    } catch {
      toast.error("Failed to record expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <h1 className="page-title">Expenses</h1>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
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
                    <span className="text-xs text-gray-500">
                      {exp.ExpenseAccount?.name ?? "—"}
                    </span>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Record Expense</h2>
              <button onClick={closeModal} className="icon-btn text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              {expenseAccounts.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800">
                    No expense accounts found.{" "}
                    <Link href="/accounting/chart-of-accounts" className="font-medium underline">
                      Set up your Chart of Accounts
                    </Link>{" "}
                    and click &ldquo;Seed Default Accounts&rdquo; to get started.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What was the expense for?"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Expense Account *
                </label>
                <select
                  className="input"
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  required
                >
                  <option value="">Select account</option>
                  {expenseAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Paid From *
                </label>
                <select
                  className="input"
                  value={form.paymentAccountId}
                  onChange={(e) => setForm({ ...form, paymentAccountId: e.target.value })}
                  required
                >
                  <option value="">Select payment account</option>
                  {paymentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="Receipt or reference number (optional)"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? "Saving..." : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
