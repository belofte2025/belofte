"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Plus, FileText, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getJournalEntries, JournalEntry } from "@/services/accountingService";
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

const SOURCES = ["", "SALE", "CUSTOMER_PAYMENT", "STOCK_ADJUSTMENT", "MANUAL", "TRANSFER"];
const STATUSES = ["", "POSTED", "REVERSED", "VOID"];

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getJournalEntries({ startDate, endDate, source, status, page, limit: 20 });
      setEntries(data.entries ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      toast.error("Failed to load journal entries");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, source, status, page]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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
            <h1 className="page-title">Journal Entries</h1>
          </div>
          <Link href="/accounting/journal/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Manual Entry</span>
          </Link>
        </div>

        <div className="card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => { setSource(e.target.value); setPage(1); }}
                className="input"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s || "All Sources"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="input"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s || "All Statuses"}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="card text-center py-12">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-3">No entries found</p>
            <p className="text-xs text-gray-500 mt-1">Adjust filters or create a manual entry</p>
          </div>
        ) : (
          <>
            <div className="mobile-list sm:hidden">
              {entries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/accounting/journal/${entry.id}`}
                  className="mobile-list-item block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{entry.entryNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{entry.description}</p>
                    </div>
                    <span className={`badge ${statusBadge[entry.status] ?? "badge-gray"} flex-shrink-0`}>
                      {entry.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <span className={`badge ${sourceBadge[entry.source] ?? "badge-gray"}`}>
                      {entry.source}
                    </span>
                    <span className="text-xs text-gray-400">
                      {entry.lineCount ?? entry.lines?.length ?? 0} lines
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="table-wrapper hidden sm:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Entry #</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/accounting/journal/${entry.id}`)}
                    >
                      <td className="font-mono text-sm text-blue-600">{entry.entryNumber}</td>
                      <td className="text-gray-500">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="font-medium max-w-xs truncate">{entry.description}</td>
                      <td>
                        <span className={`badge ${sourceBadge[entry.source] ?? "badge-gray"}`}>
                          {entry.source}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge[entry.status] ?? "badge-gray"}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="text-gray-500">
                        {entry.lineCount ?? entry.lines?.length ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
