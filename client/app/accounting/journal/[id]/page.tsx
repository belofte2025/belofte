"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { getJournalEntry, reverseJournalEntry, JournalEntry } from "@/services/accountingService";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

const sourceBadge: Record<string, string> = {
  SALE: "badge-blue",
  CUSTOMER_PAYMENT: "badge-green",
  STOCK_ADJUSTMENT: "badge-yellow",
  MANUAL: "badge-gray",
  TRANSFER: "badge-yellow",
};

const statusBadge: Record<string, string> = {
  POSTED: "badge-green",
  REVERSED: "badge-red",
  VOID: "badge-gray",
};

export default function JournalEntryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmReverse, setConfirmReverse] = useState(false);
  const [reversing, setReversing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getJournalEntry(id)
      .then(setEntry)
      .catch(() => toast.error("Failed to load journal entry"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReverse = async () => {
    setConfirmReverse(false);
    setReversing(true);
    try {
      const reversed = await reverseJournalEntry(id);
      toast.success("Entry reversed successfully");
      setEntry(reversed);
    } catch {
      toast.error("Failed to reverse entry");
    } finally {
      setReversing(false);
    }
  };

  const totalDebit = entry?.lines?.reduce((sum, l) => sum + l.debit, 0) ?? 0;
  const totalCredit = entry?.lines?.reduce((sum, l) => sum + l.credit, 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/accounting/journal")}
              className="icon-btn text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="page-title">
              {loading ? "Journal Entry" : entry?.entryNumber ?? "Journal Entry"}
            </h1>
          </div>
          {entry?.status === "POSTED" && (
            <button
              onClick={() => setConfirmReverse(true)}
              disabled={reversing}
              className="btn btn-danger"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reverse Entry</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading...</span>
          </div>
        ) : !entry ? (
          <div className="card text-center py-12">
            <p className="text-sm text-gray-500">Entry not found</p>
          </div>
        ) : (
          <>
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Entry Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Entry Number</p>
                  <p className="text-sm font-mono font-semibold text-gray-900 mt-0.5">
                    {entry.entryNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {new Date(entry.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Source</p>
                  <div className="mt-0.5">
                    <span className={`badge ${sourceBadge[entry.source] ?? "badge-gray"}`}>
                      {entry.source}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <div className="mt-0.5">
                    <span className={`badge ${statusBadge[entry.status] ?? "badge-gray"}`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
                {entry.postedBy && (
                  <div>
                    <p className="text-xs text-gray-500">Posted By</p>
                    <p className="text-sm text-gray-900 mt-0.5">{entry.postedBy}</p>
                  </div>
                )}
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="text-sm text-gray-900 mt-0.5">{entry.description}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Lines</h2>
              <div className="table-wrapper border-0">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Account Code</th>
                      <th>Account Name</th>
                      <th className="text-right">Debit</th>
                      <th className="text-right">Credit</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.lines?.map((line) => (
                      <tr key={line.id}>
                        <td className="font-mono text-sm">{line.accountCode}</td>
                        <td className="font-medium">{line.accountName}</td>
                        <td className="text-right">
                          {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                        </td>
                        <td className="text-right">
                          {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                        </td>
                        <td className="text-gray-500 text-xs">{line.description ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                      <td colSpan={2} className="py-2 px-3 text-sm text-gray-700">
                        Totals
                      </td>
                      <td className="text-right py-2 px-3 text-sm">{formatCurrency(totalDebit)}</td>
                      <td className="text-right py-2 px-3 text-sm">{formatCurrency(totalCredit)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmReverse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Reverse This Entry?</h2>
            <p className="text-xs text-gray-500 mb-5">
              A new reversing journal entry will be created. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReverse(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button onClick={handleReverse} className="btn btn-danger flex-1">
                Reverse
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
