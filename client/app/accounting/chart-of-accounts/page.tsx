"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Plus, Search, RefreshCw, X, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getAccounts,
  createAccount,
  seedDefaultAccounts,
  Account,
} from "@/services/accountingService";
import toast from "react-hot-toast";

const typeColors: Record<string, string> = {
  ASSET: "badge-blue",
  LIABILITY: "badge-red",
  EQUITY: "badge-yellow",
  REVENUE: "badge-green",
  COGS: "badge-yellow",
  EXPENSE: "badge-gray",
};

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "COGS", "EXPENSE"];

interface AccountForm {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "COGS" | "EXPENSE";
  normalBalance: "DEBIT" | "CREDIT";
  description: string;
  isSystemAccount: boolean;
}

const defaultForm: AccountForm = {
  code: "",
  name: "",
  type: "ASSET",
  normalBalance: "DEBIT",
  description: "",
  isSystemAccount: false,
};

export default function ChartOfAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AccountForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);

  const fetchAccounts = () => {
    setLoading(true);
    getAccounts()
      .then(setAccounts)
      .catch(() => toast.error("Failed to load accounts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filtered = accounts.filter(
    (a) =>
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleSeed = async () => {
    setConfirmSeed(false);
    setSeeding(true);
    try {
      await seedDefaultAccounts();
      toast.success("Default chart of accounts seeded");
      fetchAccounts();
    } catch {
      toast.error("Failed to seed accounts");
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      toast.error("Code and Name are required");
      return;
    }
    setSaving(true);
    try {
      await createAccount(form);
      toast.success("Account created");
      setShowModal(false);
      setForm(defaultForm);
      fetchAccounts();
    } catch {
      toast.error("Failed to create account");
    } finally {
      setSaving(false);
    }
  };

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
            <h1 className="page-title">Chart of Accounts</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmSeed(true)}
              disabled={seeding}
              className="btn btn-secondary"
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Seed Default COA</span>
            </button>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Account</span>
            </button>
          </div>
        </div>

        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-3">No accounts found</p>
            <p className="text-xs text-gray-500 mt-1">Seed default accounts or add one manually</p>
          </div>
        ) : (
          <>
            <div className="mobile-list sm:hidden">
              {filtered.map((account) => (
                <div key={account.id} className="mobile-list-item">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {account.code} — {account.name}
                      </p>
                      {account.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{account.description}</p>
                      )}
                    </div>
                    <span className={`badge ${typeColors[account.type] ?? "badge-gray"} flex-shrink-0`}>
                      {account.type}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="badge badge-gray">{account.normalBalance}</span>
                    {!account.isActive && <span className="badge badge-red">Inactive</span>}
                    {account.isSystemAccount && <span className="badge badge-blue">System</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="table-wrapper hidden sm:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Normal Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((account) => (
                    <tr key={account.id}>
                      <td className="font-mono text-sm">{account.code}</td>
                      <td className="font-medium">
                        {account.name}
                        {account.isSystemAccount && (
                          <span className="ml-2 badge badge-blue text-xs">System</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${typeColors[account.type] ?? "badge-gray"}`}>
                          {account.type}
                        </span>
                      </td>
                      <td className="text-gray-600">{account.normalBalance}</td>
                      <td>
                        <span className={`badge ${account.isActive ? "badge-green" : "badge-red"}`}>
                          {account.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
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
              <h2 className="text-sm font-semibold text-gray-900">Add Account</h2>
              <button
                onClick={() => setShowModal(false)}
                className="icon-btn text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    className="input"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. 1000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    className="input"
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as AccountForm["type"],
                        normalBalance: ["ASSET", "COGS", "EXPENSE"].includes(e.target.value)
                          ? "DEBIT"
                          : "CREDIT",
                      })
                    }
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Account name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Normal Balance</label>
                <select
                  className="input"
                  value={form.normalBalance}
                  onChange={(e) => setForm({ ...form, normalBalance: e.target.value as "DEBIT" | "CREDIT" })}
                >
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isSystemAccount}
                  onChange={(e) => setForm({ ...form, isSystemAccount: e.target.checked })}
                  className="rounded"
                />
                <span className="text-xs text-gray-700">System account</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? "Saving..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmSeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Seed Default Chart of Accounts?
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              This will add standard accounting accounts to your company. Existing accounts will not be
              duplicated.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmSeed(false)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleSeed} className="btn btn-primary flex-1">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
