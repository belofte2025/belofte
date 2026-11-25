"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Calendar,
  Receipt,
  FileText,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  TrendingUp,
} from "lucide-react";
import { getAllPayments } from "@/services/paymentService";
import { formatCurrency } from "@/utils/format";
import { createHTMLReportTemplate, getHTML2PDFOptions } from "@/lib/pdfTemplates";
import toast from "@/lib/toast";

type Payment = {
  id: string;
  amount: number;
  paymentType: string;
  note?: string;
  createdAt: string;
  customer: {
    id: string;
    customerName: string;
    phone: string;
  };
};

type MethodTotal = {
  paymentType: string;
  count: number;
  total: number;
};

type PaymentsResponse = {
  payments: Payment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  summary: {
    totalAmount: number;
    totalPayments: number;
    /** Every method in the filtered period, not only the page on screen. */
    byType?: MethodTotal[];
  };
};

const PERIOD_OPTIONS = [
  { key: "today",  label: "Today"      },
  { key: "week",   label: "This Week"  },
  { key: "month",  label: "This Month" },
  { key: "custom", label: "Custom"     },
] as const;

type PeriodKey = (typeof PERIOD_OPTIONS)[number]["key"];

/** Local calendar date. toISOString() would report yesterday west of UTC. */
const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

/**
 * The dates a preset stands for. The week runs Monday to today, which is how
 * the shop counts a trading week; a custom period is whatever was typed, and
 * two blank dates mean every payment ever taken.
 */
const rangeForPeriod = (
  period: PeriodKey,
  customStart: string,
  customEnd: string
): { startDate: string; endDate: string } => {
  if (period === "custom") return { startDate: customStart, endDate: customEnd };

  const now = new Date();
  const today = toInputDate(now);

  if (period === "today") return { startDate: today, endDate: today };

  if (period === "week") {
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return { startDate: toInputDate(monday), endDate: today };
  }

  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: toInputDate(firstOfMonth), endDate: today };
};

const PAGE_SIZES = [25, 50, 100];

/**
 * The codes actually stored on CustomerPayment. This report used to filter on
 * "MOBILE_MONEY", which the app has never written — payments are recorded as
 * "MOMO" — so the Mobile Money filter returned nothing and the Mobile Money
 * total on the PDF was always zero. UNSPECIFIED stands in for the older rows
 * saved before a method was recorded at all.
 */
const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  MOMO: "Mobile Money",
  BANK: "Bank Transfer",
  CREDIT_NOTE: "Credit Note",
  DEBT_SETTLEMENT: "Debt Settlement",
  UNSPECIFIED: "Not Recorded",
};

const METHOD_COLORS: Record<string, string> = {
  CASH: "bg-blue-50 border-blue-200 text-blue-700",
  MOMO: "bg-purple-50 border-purple-200 text-purple-700",
  BANK: "bg-green-50 border-green-200 text-green-700",
  CREDIT_NOTE: "bg-orange-50 border-orange-200 text-orange-700",
  DEBT_SETTLEMENT: "bg-teal-50 border-teal-200 text-teal-700",
  UNSPECIFIED: "bg-gray-50 border-gray-200 text-gray-600",
};

/** Only the methods a teller can actually choose are offered as a filter. */
const FILTERABLE_METHODS = ["CASH", "MOMO", "BANK", "CREDIT_NOTE"];

export default function AllPaymentsReport() {
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const { startDate, endDate } = rangeForPeriod(period, customStart, customEnd);

  // A half filled custom range would silently widen to "everything from here
  // on", so it is not sent until both ends are in.
  const rangeIncomplete =
    period === "custom" && Boolean(customStart) !== Boolean(customEnd);

  const loadPayments = useCallback(async () => {
    if (rangeIncomplete) return;
    setLoading(true);
    try {
      const result = await getAllPayments({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentType: paymentType || undefined,
        page,
        limit,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to load payments:", error);
      toast.error("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, paymentType, page, limit, rangeIncomplete]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Any change to what is being filtered puts us back on the first page —
  // page 4 of the old result is rarely page 4 of the new one.
  const changePeriod = (next: PeriodKey) => {
    setPeriod(next);
    setPage(1);
  };

  const exportToPDF = async () => {
    if (!data || data.payments.length === 0) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      // Payment method breakdown table
      const methodRows = Object.entries(paymentMethodSummary)
        .map(([type, { count, total }]) => {
          const label = METHOD_LABELS[type] ?? type.replace(/_/g, " ");
          const pct = data.summary.totalAmount > 0
            ? ((total / data.summary.totalAmount) * 100).toFixed(1)
            : "0.0";
          return `<tr>
            <td>${label}</td>
            <td class="text-center">${count}</td>
            <td class="text-right font-bold">${formatCurrency(total)}</td>
            <td class="text-right">${pct}%</td>
          </tr>`;
        })
        .join("");

      const methodTable = `
        <h3 style="margin:0 0 6px;font-size:11px;font-weight:600;color:#374151;">Payment Method Breakdown</h3>
        <table style="margin-bottom:16px;">
          <thead><tr><th>Method</th><th class="text-center">Count</th><th class="text-right">Total</th><th class="text-right">Share</th></tr></thead>
          <tbody>${methodRows}</tbody>
        </table>`;

      // The figures above cover the whole period, so the transaction list has
      // to as well — exporting page 2 of 7 under a period total read as if
      // the money had gone missing. Capped so a year of payments cannot
      // produce a PDF nobody can open.
      const EXPORT_CAP = 2000;
      const wanted = Math.min(data.pagination.totalCount, EXPORT_CAP);
      const full = wanted > data.payments.length
        ? await getAllPayments({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            paymentType: paymentType || undefined,
            page: 1,
            limit: wanted,
          })
        : data;
      const exportRows: Payment[] = full.payments;
      const truncated = data.pagination.totalCount > EXPORT_CAP;

      // Transactions table
      const txRows = exportRows.map((payment, index) => `
        <tr class="no-page-break">
          <td>${index + 1}</td>
          <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
          <td>${payment.customer?.customerName ?? "-"}</td>
          <td>${payment.customer?.phone ?? "-"}</td>
          <td>${(METHOD_LABELS[payment.paymentType] ?? payment.paymentType).replace(/_/g, " ")}</td>
          <td class="text-right font-bold">${formatCurrency(payment.amount)}</td>
          <td>${payment.note || "-"}</td>
        </tr>`).join("");

      const txTable = `
        <h3 style="margin:0 0 6px;font-size:11px;font-weight:600;color:#374151;">Payment Transactions${
          truncated ? ` (first ${EXPORT_CAP} of ${data.pagination.totalCount})` : ""
        }</h3>
        <table>
          <thead><tr><th>#</th><th>Date</th><th>Customer</th><th>Phone</th><th>Type</th><th class="text-right">Amount</th><th>Note</th></tr></thead>
          <tbody>${txRows}</tbody>
        </table>`;

      const periodLabel =
        PERIOD_OPTIONS.find((opt) => opt.key === period)?.label ?? "";
      const dateLabel = startDate || endDate
        ? `${periodLabel}: ${startDate || "Start"} to ${endDate || "End"}`
        : `All payments | As of ${new Date().toLocaleDateString()}`;

      const html = createHTMLReportTemplate(
        "Payments Report",
        methodTable + txTable,
        {
          subtitle: dateLabel,
          summaryStats: [
            { label: "Total Payments", value: data.summary.totalPayments.toString() },
            { label: "Total Amount", value: formatCurrency(data.summary.totalAmount) },
            {
              label: "Average Payment",
              value: formatCurrency(
                data.summary.totalPayments > 0
                  ? data.summary.totalAmount / data.summary.totalPayments
                  : 0
              ),
            },
            { label: "Cash", value: formatCurrency(paymentMethodSummary["CASH"]?.total ?? 0) },
            { label: "Mobile Money", value: formatCurrency(paymentMethodSummary["MOMO"]?.total ?? 0) },
            { label: "Bank Transfer", value: formatCurrency(paymentMethodSummary["BANK"]?.total ?? 0) },
          ],
        }
      );

      const today = new Date().toISOString().split("T")[0];
      const options = { ...getHTML2PDFOptions(), filename: `Payments_Report_${today}.pdf` };
      await html2pdf().set(options).from(html).save();
      toast.success("PDF exported successfully!");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  // The breakdown comes from the server so it covers the whole filtered
  // period. Falling back to the rows on screen keeps the panel working
  // against an API that predates summary.byType, at page scope.
  const paymentMethodSummary: Record<string, { count: number; total: number }> =
    data?.summary.byType
      ? Object.fromEntries(
          data.summary.byType.map((row) => [
            row.paymentType,
            { count: row.count, total: row.total },
          ])
        )
      : data?.payments.reduce<Record<string, { count: number; total: number }>>(
          (acc, payment) => {
            const key = payment.paymentType;
            if (!acc[key]) acc[key] = { count: 0, total: 0 };
            acc[key].count += 1;
            acc[key].total += payment.amount;
            return acc;
          },
          {}
        ) ?? {};


  return (
    <DashboardLayout>
      <div className="space-y-4">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">All Payments Report</h1>
              <button
                onClick={exportToPDF}
                disabled={!data || data.payments.length === 0}
                className="btn btn-success"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
          </div>

          {/* Filters */}
          <div className="bg-white shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-label="Payment period"
                className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-xl border border-gray-200 bg-white p-1"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    aria-pressed={period === opt.key}
                    onClick={() => changePeriod(opt.key)}
                    className={`min-h-9 rounded-lg px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                      period === opt.key
                        ? "bg-blue-100 text-blue-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {period === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd || undefined}
                    onChange={(e) => { setCustomStart(e.target.value); setPage(1); }}
                    aria-label="Start date"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <span className="text-xs text-gray-400">to</span>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart || undefined}
                    onChange={(e) => { setCustomEnd(e.target.value); setPage(1); }}
                    aria-label="End date"
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}

              <select
                value={paymentType}
                onChange={(e) => { setPaymentType(e.target.value); setPage(1); }}
                aria-label="Payment type"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                {FILTERABLE_METHODS.map((code) => (
                  <option key={code} value={code}>{METHOD_LABELS[code]}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setPeriod("month");
                  setCustomStart("");
                  setCustomEnd("");
                  setPaymentType("");
                  setPage(1);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset
              </button>

              <p className="text-xs text-gray-500 ml-auto">
                {rangeIncomplete
                  ? "Pick both dates to apply the custom range"
                  : startDate || endDate
                  ? `Showing ${startDate || "the beginning"} to ${endDate || "today"}`
                  : "Showing every payment on record"}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {data && (
            <div className="stats-grid">
              <div className="stat-card">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Payments
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.summary.totalPayments}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(data.summary.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Average Payment
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(
                      data.summary.totalPayments > 0
                        ? data.summary.totalAmount /
                            data.summary.totalPayments
                        : 0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>

              <div className="stat-card">
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-600 mb-2">Payment Methods</p>
                  <div className="space-y-1">
                    {Object.entries(paymentMethodSummary).map(([type, { count }]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{METHOD_LABELS[type] ?? type.replace(/_/g, " ")}</span>
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-orange-100 rounded-full self-start flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Summary */}
          {data && Object.keys(paymentMethodSummary).length > 0 && (
            <div className="bg-white shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Payment Method Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(paymentMethodSummary).map(([type, { count, total }]) => {
                  const colorClass = METHOD_COLORS[type] ?? "bg-gray-50 border-gray-200 text-gray-700";
                  const label = METHOD_LABELS[type] ?? type.replace(/_/g, " ");
                  const pct = data.summary.totalAmount > 0
                    ? ((total / data.summary.totalAmount) * 100).toFixed(1)
                    : "0.0";
                  return (
                    <div
                      key={type}
                      className={`rounded-lg border p-4 ${colorClass}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
                      <p className="text-lg font-bold mt-1">{formatCurrency(total)}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">{count} transaction{count !== 1 ? "s" : ""}</p>
                        <p className="text-xs font-semibold">{pct}%</p>
                      </div>
                      {/* Mini progress bar */}
                      <div className="mt-2 h-1 w-full bg-black/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-current rounded-full opacity-40"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payments Table */}
          <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Payment Records
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600" />
                <span className="ml-3 text-gray-600">Loading payments...</span>
              </div>
            ) : !data || data.payments.length === 0 ? (
              <div className="text-center py-16">
                <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Payments Found
                </h3>
                <p className="text-gray-600">
                  No payment records match your filter criteria.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.payments.map((payment, index) => (
                        <tr
                          key={payment.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1 + (page - 1) * limit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(payment.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {payment.customer.customerName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {payment.customer.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full border text-xs font-medium ${
                                METHOD_COLORS[payment.paymentType ?? "UNSPECIFIED"] ??
                                "bg-gray-50 border-gray-200 text-gray-600"
                              }`}
                            >
                              {METHOD_LABELS[payment.paymentType ?? "UNSPECIFIED"] ??
                                (payment.paymentType ?? "").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {payment.note || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      Showing {(page - 1) * limit + 1} to{" "}
                      {Math.min(page * limit, data.pagination.totalCount)} of{" "}
                      {data.pagination.totalCount} payments
                    </span>
                    <select
                      value={limit}
                      onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                      aria-label="Rows per page"
                      className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-gray-700"
                    >
                      {PAGE_SIZES.map((size) => (
                        <option key={size} value={size}>{size} per page</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      aria-label="First page"
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      aria-label="Previous page"
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {page} of {Math.max(1, data.pagination.totalPages)}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.totalPages}
                      aria-label="Next page"
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPage(data.pagination.totalPages)}
                      disabled={page >= data.pagination.totalPages}
                      aria-label="Last page"
                      className="px-3 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
      </div>
    </DashboardLayout>
  );
}
