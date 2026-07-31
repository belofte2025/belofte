"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Receipt } from "lucide-react";
import Link from "next/link";
import { getExpense, updateExpense } from "@/services/expenseService";
import { getAccounts, Account } from "@/services/accountingService";
import toast from "react-hot-toast";

const PAYMENT_ACCOUNT_CODES = ["1010", "1020", "1030"];

export default function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({
    date: "",
    description: "",
    amount: "",
    accountId: "",
    paymentAccountId: "",
    reference: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getExpense(id), getAccounts()])
      .then(([expense, accts]) => {
        setAccounts(accts);
        setForm({
          date: expense.date?.slice(0, 10) ?? "",
          description: expense.description,
          amount: String(expense.amount),
          accountId: expense.accountId,
          paymentAccountId: expense.paymentAccountId,
          reference: expense.reference ?? "",
        });
      })
      .catch(() => toast.error("Failed to load expense"))
      .finally(() => setLoading(false));
  }, [id]);

  const expenseAccounts = accounts.filter((a) => a.type === "EXPENSE");
  const paymentAccounts = accounts.filter((a) => PAYMENT_ACCOUNT_CODES.includes(a.code));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.accountId || !form.paymentAccountId) {
      toast.error("Fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      await updateExpense(id, {
        date: form.date,
        description: form.description,
        amount: parseFloat(form.amount),
        accountId: form.accountId,
        paymentAccountId: form.paymentAccountId,
        reference: form.reference || undefined,
      });
      toast.success("Expense updated");
      router.push("/accounting/expenses");
    } catch {
      toast.error("Failed to update expense");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/accounting/expenses" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Expense</h1>
              <p className="text-sm text-gray-500">Update expense details and repost journal entry</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 p-5 border-b border-gray-100">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Receipt className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Expense Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date" className="input"
                    value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₵) *</label>
                  <input
                    type="number" min="0.01" step="0.01" className="input"
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00" required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text" className="input"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What was the expense for?" required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Expense Account *</label>
                <select
                  className="input"
                  value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  required
                >
                  <option value="">Select expense category</option>
                  {expenseAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Paid From *</label>
                <select
                  className="input"
                  value={form.paymentAccountId} onChange={(e) => setForm({ ...form, paymentAccountId: e.target.value })}
                  required
                >
                  <option value="">Select payment account</option>
                  {paymentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reference</label>
                <input
                  type="text" className="input"
                  value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="Receipt or reference number (optional)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Link href="/accounting/expenses" className="btn btn-secondary flex-1 text-center">
                  Cancel
                </Link>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
