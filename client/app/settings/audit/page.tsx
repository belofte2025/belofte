"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { format } from "date-fns";
import { History, Search, ChevronLeft, ChevronRight } from "lucide-react";

type AuditLog = {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string;
  timestamp: string;
  User: { userName: string; email: string };
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN:  "bg-purple-100 text-purple-700",
};

const LIMIT = 50;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(page * LIMIT),
      });
      if (actionFilter) params.set("actionType", actionFilter);
      if (entityFilter) params.set("entityType", entityFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const res = await api.get(`/audit?${params.toString()}`);
      setLogs(res.data.logs ?? []);
      setTotal(res.data.pagination?.total ?? 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, fromDate, toDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / LIMIT);

  const filtered = search
    ? logs.filter(
        (l) =>
          l.description?.toLowerCase().includes(search.toLowerCase()) ||
          l.entityType?.toLowerCase().includes(search.toLowerCase()) ||
          l.User?.userName?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const actionColor = (a: string) =>
    ACTION_COLORS[a?.toUpperCase()] ?? "bg-gray-100 text-gray-700";

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" />
            <h1 className="page-title">Audit Log</h1>
          </div>
          <p className="text-sm text-gray-500">{total.toLocaleString()} total entries</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              className="input pl-9 w-full"
              placeholder="Search description or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input"
            style={{ maxWidth: 160 }}
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Actions</option>
            {["CREATE", "UPDATE", "DELETE", "LOGIN"].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            className="input"
            style={{ maxWidth: 180 }}
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}
          >
            <option value="">All Entities</option>
            {["Sale", "Customer", "Container", "Supplier", "Payment", "User", "Expense", "Invoice"].map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <input
            type="date" className="input" style={{ maxWidth: 150 }}
            value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
          />
          <input
            type="date" className="input" style={{ maxWidth: 150 }}
            value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0); }}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12">
            <History className="mx-auto w-10 h-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-900 mt-3">No audit logs found</p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="mobile-list sm:hidden">
              {filtered.map((log) => (
                <div key={log.id} className="mobile-list-item space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionColor(log.actionType)}`}>
                      {log.actionType}
                    </span>
                    <span className="text-xs text-gray-400">{format(new Date(log.timestamp), "MMM d, h:mm a")}</span>
                  </div>
                  <p className="text-sm text-gray-800">{log.description}</p>
                  <p className="text-xs text-gray-500">{log.entityType} · {log.User?.userName}</p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="table-wrapper hidden sm:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id}>
                      <td className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(log.timestamp), "MMM d yyyy, h:mm a")}
                      </td>
                      <td>
                        <p className="text-sm font-medium">{log.User?.userName ?? "—"}</p>
                        <p className="text-xs text-gray-400">{log.User?.email}</p>
                      </td>
                      <td>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionColor(log.actionType)}`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">{log.entityType}</td>
                      <td className="text-sm text-gray-700 max-w-xs truncate">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
                <span className="text-xs text-gray-500">
                  {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 0))}
                    disabled={page === 0}
                    className="icon-btn disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                    disabled={page >= totalPages - 1}
                    className="icon-btn disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
