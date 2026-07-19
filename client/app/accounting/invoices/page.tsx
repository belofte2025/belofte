"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { getInvoices, Invoice } from "@/services/invoiceService";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "badge-gray",
  SENT: "badge-blue",
  PARTIAL: "badge-yellow",
  PAID: "badge-green",
  OVERDUE: "badge-red",
  VOID: "badge-gray",
};

const STATUSES = ["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "VOID"];

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchInvoices = () => {
    setLoading(true);
    getInvoices({
      status: statusFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((data) => setInvoices(Array.isArray(data) ? data : (data.invoices ?? [])))
      .catch(() => toast.error("Failed to load invoices"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, startDate, endDate]);

  const totalValue = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = totalValue - totalPaid;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <h1 className="page-title">Invoices</h1>
          <button onClick={() => router.push("/accounting/invoices/new")} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Invoice</span>
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <p className="text-xs text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalValue)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-500">Amount Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalOutstanding)}</p>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
              style={{ maxWidth: 160 }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input" style={{ maxWidth: 160 }}
            />
            <input
              type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input" style={{ maxWidth: 160 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="card text-center py-12">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-3">No invoices found</p>
            <p className="text-xs text-gray-500 mt-1">Create your first invoice to get started</p>
          </div>
        ) : (
          <>
            <div className="mobile-list sm:hidden">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="mobile-list-item cursor-pointer"
                  onClick={() => router.push(`/accounting/invoices/${inv.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{inv.Customer?.customerName ?? "—"}</p>
                    </div>
                    <span className={`badge ${STATUS_COLORS[inv.status] ?? "badge-gray"} flex-shrink-0`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{inv.issueDate}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(inv.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="table-wrapper hidden sm:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/accounting/invoices/${inv.id}`)}
                    >
                      <td className="font-mono text-sm">{inv.invoiceNumber}</td>
                      <td>{inv.Customer?.customerName ?? "—"}</td>
                      <td>{inv.issueDate}</td>
                      <td>{inv.dueDate ?? "—"}</td>
                      <td className="font-medium">{formatCurrency(inv.totalAmount)}</td>
                      <td>{formatCurrency(inv.paidAmount)}</td>
                      <td>{formatCurrency(inv.totalAmount - inv.paidAmount)}</td>
                      <td>
                        <span className={`badge ${STATUS_COLORS[inv.status] ?? "badge-gray"}`}>
                          {inv.status}
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
    </DashboardLayout>
  );
}
