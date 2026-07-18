"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAccounts, createManualJournal, Account } from "@/services/accountingService";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

interface JournalLine {
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

const emptyLine = (): JournalLine => ({
  accountId: "",
  debit: "",
  credit: "",
  description: "",
});

export default function NewJournalPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAccounts().then(setAccounts).catch(() => toast.error("Failed to load accounts"));
  }, []);

  const updateLine = (index: number, field: keyof JournalLine, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error("Minimum two lines required");
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!isBalanced) {
      toast.error("Debits and credits must be equal and non-zero");
      return;
    }
    const hasEmptyAccount = lines.some((l) => !l.accountId);
    if (hasEmptyAccount) {
      toast.error("All lines must have an account selected");
      return;
    }
    setSaving(true);
    try {
      await createManualJournal({
        date,
        description,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description,
        })),
      });
      toast.success("Journal entry created");
      router.push("/accounting/journal");
    } catch {
      toast.error("Failed to create journal entry");
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
            <h1 className="page-title">New Manual Journal Entry</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Entry Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input"
                  placeholder="Entry description"
                  required
                />
              </div>
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Journal Lines</h2>
              <button type="button" onClick={addLine} className="btn btn-secondary">
                <Plus className="w-4 h-4" />
                Add Line
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 py-2 pr-3 min-w-[180px]">
                      Account
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 py-2 px-2 w-28">
                      Debit
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 py-2 px-2 w-28">
                      Credit
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 py-2 px-2 min-w-[140px]">
                      Description
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 pr-3">
                        <select
                          value={line.accountId}
                          onChange={(e) => updateLine(i, "accountId", e.target.value)}
                          className="input"
                        >
                          <option value="">Select account</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} — {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) => {
                            updateLine(i, "debit", e.target.value);
                            if (e.target.value) updateLine(i, "credit", "");
                          }}
                          className="input text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) => {
                            updateLine(i, "credit", e.target.value);
                            if (e.target.value) updateLine(i, "debit", "");
                          }}
                          className="input text-right"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(i, "description", e.target.value)}
                          className="input"
                          placeholder="Optional"
                        />
                      </td>
                      <td className="py-2 pl-2">
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="icon-btn text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50">
                    <td className="py-2 pr-3 text-xs font-semibold text-gray-700 pl-1">Totals</td>
                    <td className="py-2 px-2 text-right text-xs font-semibold text-gray-900">
                      {formatCurrency(totalDebit)}
                    </td>
                    <td className="py-2 px-2 text-right text-xs font-semibold text-gray-900">
                      {formatCurrency(totalCredit)}
                    </td>
                    <td colSpan={2} className="py-2 px-2">
                      {totalDebit > 0 && (
                        <span
                          className={`badge ${isBalanced ? "badge-green" : "badge-red"}`}
                        >
                          {isBalanced ? "Balanced" : `Off by ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isBalanced}
              className="btn btn-primary"
            >
              {saving ? "Saving..." : "Post Entry"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
