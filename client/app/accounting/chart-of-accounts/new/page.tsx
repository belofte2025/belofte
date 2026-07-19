"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { createAccount } from "@/services/accountingService";
import toast from "react-hot-toast";

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "COGS", "EXPENSE"] as const;
type AccountType = (typeof ACCOUNT_TYPES)[number];

function defaultNormalBalance(type: AccountType): "DEBIT" | "CREDIT" {
  return ["ASSET", "COGS", "EXPENSE"].includes(type) ? "DEBIT" : "CREDIT";
}

export default function NewAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "EXPENSE" as AccountType,
    normalBalance: "DEBIT" as "DEBIT" | "CREDIT",
    description: "",
    isSystemAccount: false,
  });
  const [saving, setSaving] = useState(false);

  const handleTypeChange = (type: AccountType) => {
    setForm({ ...form, type, normalBalance: defaultNormalBalance(type) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) { toast.error("Code and Name are required"); return; }
    setSaving(true);
    try {
      await createAccount(form);
      toast.success("Account created");
      router.push("/accounting/chart-of-accounts");
    } catch {
      toast.error("Failed to create account");
      setSaving(false);
    }
  };

  const typeDescriptions: Record<AccountType, string> = {
    ASSET:     "What the business owns (cash, inventory, equipment)",
    LIABILITY: "What the business owes (loans, payables)",
    EQUITY:    "Owner's stake in the business",
    REVENUE:   "Income from sales or services",
    COGS:      "Direct cost of goods sold",
    EXPENSE:   "Operating costs (rent, salaries, utilities)",
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/accounting/chart-of-accounts" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Account</h1>
              <p className="text-sm text-gray-500">Add a new account to your chart of accounts</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 p-5 border-b border-gray-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Account Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Code *</label>
                  <input
                    className="input"
                    value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. 6950"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Unique numeric code for this account</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Type *</label>
                  <select
                    className="input"
                    value={form.type}
                    onChange={(e) => handleTypeChange(e.target.value as AccountType)}
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.type && (
                <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                  {typeDescriptions[form.type]}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Account Name *</label>
                <input
                  className="input"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Office Supplies"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Normal Balance</label>
                <select
                  className="input"
                  value={form.normalBalance}
                  onChange={(e) => setForm({ ...form, normalBalance: e.target.value as "DEBIT" | "CREDIT" })}
                >
                  <option value="DEBIT">Debit (Assets, Expenses, COGS)</option>
                  <option value="CREDIT">Credit (Liabilities, Equity, Revenue)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Auto-set based on type — change only if you know what you&apos;re doing</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  className="input"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description for this account"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isSystemAccount}
                  onChange={(e) => setForm({ ...form, isSystemAccount: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs text-gray-700">Mark as system account (used by automated journals)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <Link href="/accounting/chart-of-accounts" className="btn btn-secondary flex-1 text-center">
                  Cancel
                </Link>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
