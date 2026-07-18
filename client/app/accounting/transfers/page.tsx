"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Plus, ArrowLeftRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getLedgerTransfers,
  createLedgerTransfer,
  getAccounts,
  LedgerTransfer,
  Account,
  LedgerTransferData,
} from "@/services/accountingService";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

const PARTY_TYPES = ["CUSTOMER", "SUPPLIER", "ACCOUNT"] as const;
type PartyType = (typeof PARTY_TYPES)[number];

interface Party {
  type: PartyType;
  id: string;
}

const defaultParty = (): Party => ({ type: "ACCOUNT", id: "" });

interface TransferForm {
  date: string;
  amount: string;
  description: string;
  debitParty: Party;
  creditParty: Party;
}

export default function TransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<LedgerTransfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<TransferForm>({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    debitParty: defaultParty(),
    creditParty: defaultParty(),
  });

  const fetchTransfers = useCallback(() => {
    setLoading(true);
    getLedgerTransfers()
      .then((data) => setTransfers(data.transfers ?? []))
      .catch(() => toast.error("Failed to load transfers"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTransfers();
    getAccounts().then(setAccounts).catch(() => {});
  }, [fetchTransfers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    if (!form.debitParty.id || !form.creditParty.id) {
      toast.error("Both debit and credit parties are required");
      return;
    }
    setSaving(true);
    try {
      const payload: LedgerTransferData = {
        date: form.date,
        amount: parseFloat(form.amount),
        description: form.description,
        debitPartyType: form.debitParty.type,
        debitPartyId: form.debitParty.id,
        creditPartyType: form.creditParty.type,
        creditPartyId: form.creditParty.id,
      };
      await createLedgerTransfer(payload);
      toast.success("Transfer created");
      setShowModal(false);
      setForm({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        description: "",
        debitParty: defaultParty(),
        creditParty: defaultParty(),
      });
      fetchTransfers();
    } catch {
      toast.error("Failed to create transfer");
    } finally {
      setSaving(false);
    }
  };

  const PartySelect = ({
    label,
    party,
    onChange,
  }: {
    label: string;
    party: Party;
    onChange: (p: Party) => void;
  }) => (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-700">{label}</p>
      <select
        className="input"
        value={party.type}
        onChange={(e) => onChange({ type: e.target.value as PartyType, id: "" })}
      >
        {PARTY_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      {party.type === "ACCOUNT" ? (
        <select
          className="input"
          value={party.id}
          onChange={(e) => onChange({ ...party, id: e.target.value })}
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="input"
          placeholder={`${party.type} name / ID`}
          value={party.id}
          onChange={(e) => onChange({ ...party, id: e.target.value })}
        />
      )}
    </div>
  );

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
            <h1 className="page-title">Ledger Transfers</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Transfer</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading...</span>
          </div>
        ) : transfers.length === 0 ? (
          <div className="card text-center py-12">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-3">No transfers yet</p>
            <p className="text-xs text-gray-500 mt-1">Create your first ledger transfer</p>
          </div>
        ) : (
          <>
            <div className="mobile-list sm:hidden">
              {transfers.map((t) => (
                <div key={t.id} className="mobile-list-item">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(t.date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {formatCurrency(t.amount)}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span className="font-medium text-gray-700">{t.debitPartyName}</span>
                    <ArrowLeftRight className="w-3 h-3" />
                    <span className="font-medium text-gray-700">{t.creditPartyName}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="table-wrapper hidden sm:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Debit Party</th>
                    <th>Credit Party</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id}>
                      <td className="text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="font-medium">{t.description}</td>
                      <td className="text-gray-600">{t.debitPartyName}</td>
                      <td className="text-gray-600">{t.creditPartyName}</td>
                      <td className="text-right font-semibold">{formatCurrency(t.amount)}</td>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">New Ledger Transfer</h2>
              <button
                onClick={() => setShowModal(false)}
                className="icon-btn text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input"
                  placeholder="Transfer description"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <PartySelect
                  label="Debit Party (From)"
                  party={form.debitParty}
                  onChange={(p) => setForm({ ...form, debitParty: p })}
                />
                <PartySelect
                  label="Credit Party (To)"
                  party={form.creditParty}
                  onChange={(p) => setForm({ ...form, creditParty: p })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? "Saving..." : "Create Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
