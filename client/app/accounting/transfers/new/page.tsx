"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import {
  createLedgerTransfer,
  getAccounts,
  Account,
  LedgerTransferData,
} from "@/services/accountingService";
import toast from "react-hot-toast";

const PARTY_TYPES = ["CUSTOMER", "SUPPLIER", "ACCOUNT"] as const;
type PartyType = (typeof PARTY_TYPES)[number];

interface Party {
  type: PartyType;
  id: string;
}

export default function NewTransferPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
    debitParty: { type: "ACCOUNT" as PartyType, id: "" },
    creditParty: { type: "ACCOUNT" as PartyType, id: "" },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => {});
  }, []);

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
      router.push("/accounting/transfers");
    } catch {
      toast.error("Failed to create transfer");
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/accounting/transfers"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Transfer</h1>
              <p className="text-sm text-gray-500">Create a ledger transfer between accounts or parties</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 p-5 border-b border-gray-100">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ArrowLeftRight className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Transfer Details</h2>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₵) *</label>
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
                  placeholder="Transfer description (optional)"
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

              <div className="flex gap-3 pt-2">
                <Link href="/accounting/transfers" className="btn btn-secondary flex-1 text-center">
                  Cancel
                </Link>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? "Creating..." : "Create Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
