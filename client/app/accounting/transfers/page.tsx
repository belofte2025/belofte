"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Plus, ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { getLedgerTransfers, LedgerTransfer } from "@/services/accountingService";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

export default function TransfersPage() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<LedgerTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = useCallback(() => {
    setLoading(true);
    getLedgerTransfers()
      .then((data) => setTransfers(data.transfers ?? []))
      .catch(() => toast.error("Failed to load transfers"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [fetchTransfers]);

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
          <button onClick={() => router.push("/accounting/transfers/new")} className="btn btn-primary">
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
    </DashboardLayout>
  );
}
