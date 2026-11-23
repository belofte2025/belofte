"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Download,
  Calendar,
  BarChart3,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { getDetailedSalesReport } from "@/services/reportService";
import toast from "@/lib/toast";
import { createHTMLReportTemplate, getHTML2PDFOptions } from "@/lib/pdfTemplates";

interface SaleItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Sale {
  id: string;
  saleType: string;
  paymentMethod: string | null;
  customerName: string;
  totalAmount: number;
  /** Deposit taken at the till. */
  amountPaid: number;
  /** Deposit plus any later payments that reach this invoice. */
  settledAmount: number;
  outstanding: number;
  settlementStatus: "paid" | "part-paid" | "unpaid";
  createdAt: string;
  items: SaleItem[];
}

type SaleTypeFilter = "all" | "paid" | "credit";
type SettlementFilter = "all" | "paid" | "part-paid" | "unpaid";

// How a credit invoice actually stands, once payments made against the
// customer are applied to it. Without this every credit sale reads as fully
// outstanding no matter how much has been paid off.
const SETTLEMENT_LABEL: Record<string, { text: string; className: string }> = {
  paid: { text: "Paid", className: "bg-green-100 text-green-700" },
  "part-paid": { text: "Part paid", className: "bg-amber-100 text-amber-800" },
  unpaid: { text: "Unpaid", className: "bg-red-100 text-red-700" },
};
type PaymentMethodFilter = "all" | "CASH" | "MOMO" | "BANK";

const paymentMethodLabel = (m: string | null) => {
  const method = (m || "CASH").toUpperCase();
  if (method === "MOMO") return "Momo";
  if (method === "BANK") return "Bank";
  return "Cash";
};

export default function SalesReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleTypeFilter>("all");
  const [settlementFilter, setSettlementFilter] = useState<SettlementFilter>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>("all");

  const fetchSalesReport = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date");
      return;
    }

    setLoading(true);
    try {
      const data = await getDetailedSalesReport(startDate, endDate);
      setSales(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to fetch sales report");
      console.error(error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSalesReport();
  }, [fetchSalesReport]);

  // Apply sale-type / payment-method filters
  const filteredSales = useMemo(() => {
    if (!Array.isArray(sales)) return [];
    return sales.filter((s) => {
      const isPaid = s.saleType.toLowerCase() === "cash";
      if (saleTypeFilter === "paid" && !isPaid) return false;
      if (saleTypeFilter === "credit" && isPaid) return false;
      if (saleTypeFilter === "paid" && paymentMethodFilter !== "all") {
        const method = (s.paymentMethod || "CASH").toUpperCase();
        if (method !== paymentMethodFilter) return false;
      }
      // How the invoice actually stands, which is a different question from
      // whether it was made on credit.
      if (settlementFilter !== "all" && s.settlementStatus !== settlementFilter) return false;
      return true;
    });
  }, [sales, saleTypeFilter, paymentMethodFilter, settlementFilter]);

  // Calculate summary stats for PDF export
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalTransactions = filteredSales.length;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const cashSales = filteredSales.filter(s => s.saleType.toLowerCase() === 'cash');
  const creditSales = filteredSales.filter(s => s.saleType.toLowerCase() === 'credit');
  // Settled means the deposit taken at the till plus any payment the customer
  // has made since. Counting only the deposit called a half-paid invoice fully
  // outstanding, and would now contradict the status shown on its own row.
  // The two figures still sum to total revenue.
  const totalCashRevenue =
    cashSales.reduce((sum, s) => sum + s.totalAmount, 0) +
    creditSales.reduce((sum, s) => sum + (s.settledAmount ?? s.amountPaid ?? 0), 0);
  const totalCreditRevenue = creditSales.reduce(
    (sum, s) => sum + (s.outstanding ?? s.totalAmount - (s.amountPaid ?? 0)),
    0
  );
  const partPaidCount = creditSales.filter((s) => s.settlementStatus === "part-paid").length;
  const fullyPaidCredit = creditSales.filter((s) => s.settlementStatus === "paid").length;

  const exportToPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      // Build table content
      const tableContent = `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Status</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Outstanding</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            ${filteredSales.map(sale => `
              <tr class="no-page-break">
                <td>${new Date(sale.createdAt).toLocaleDateString()}</td>
                <td>${sale.customerName}</td>
                <td>${sale.saleType}</td>
                <td>${(SETTLEMENT_LABEL[sale.settlementStatus] ?? SETTLEMENT_LABEL.unpaid).text}</td>
                <td>${sale.saleType.toLowerCase() === "cash" ? paymentMethodLabel(sale.paymentMethod) : "-"}</td>
                <td class="text-right font-bold">${formatCurrency(sale.totalAmount)}</td>
                <td class="text-right">${(sale.outstanding ?? 0) > 0 ? formatCurrency(sale.outstanding) : "-"}</td>
                <td class="text-center">${Array.isArray(sale.items) ? sale.items.length : 0} items</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      // Use standardized HTML template with company branding
      const html = createHTMLReportTemplate(
        "Sales Report",
        tableContent,
        {
          subtitle: `Period: ${startDate} to ${endDate}`,
          summaryStats: [
            { label: "Total Revenue", value: formatCurrency(totalRevenue) },
            { label: "Total Transactions", value: totalTransactions.toString() },
            { label: "Average Transaction", value: formatCurrency(avgTransaction) },
            { label: "Cash Sales", value: `${cashSales.length} tx` },
            { label: "Credit Sales", value: `${creditSales.length} tx` },
            { label: "Total Cash Sales", value: formatCurrency(totalCashRevenue) },
            { label: "Total Credit Sales", value: formatCurrency(totalCreditRevenue) },
          ],
        }
      );

      const options = {
        ...getHTML2PDFOptions(),
        filename: `Sales_Report_${startDate}_to_${endDate}.pdf`
      };
      await html2pdf().set(options).from(html).save();
      toast.success("Report exported successfully!");
    } catch {
      toast.error("Failed to export report");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="icon-btn text-gray-400 hover:text-gray-700 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="page-title">Sales Report</h1>
          </div>
          <button
            onClick={exportToPDF}
            disabled={loading || filteredSales.length === 0}
            className="btn btn-success"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>

        {/* Date & type filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
            </div>
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
            </div>
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" />Sale Type</label>
              <select
                value={saleTypeFilter}
                onChange={(e) => {
                  setSaleTypeFilter(e.target.value as SaleTypeFilter);
                  setPaymentMethodFilter("all");
                }}
                className="input"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            {saleTypeFilter === "paid" && (
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" />Payment Method</label>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value as PaymentMethodFilter)}
                  className="input"
                >
                  <option value="all">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="MOMO">Momo</option>
                  <option value="BANK">Bank</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" />Settlement</label>
              <select
                value={settlementFilter}
                onChange={(e) => setSettlementFilter(e.target.value as SettlementFilter)}
                className="input"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="part-paid">Part paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <button onClick={fetchSalesReport} disabled={loading} className="btn btn-primary">
              <BarChart3 className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>

        {/* Summary stats */}
        {!loading && filteredSales.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="stat-card">
              <p className="stat-label">Total Revenue</p>
              <p className="stat-value text-blue-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Transactions</p>
              <p className="stat-value">{totalTransactions}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Avg. Transaction</p>
              <p className="stat-value">{formatCurrency(avgTransaction)}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Cash / Credit</p>
              <p className="text-base font-bold mt-1">
                <span className="text-green-600">{cashSales.length}</span>
                <span className="text-gray-300 mx-1">/</span>
                <span className="text-orange-500">{creditSales.length}</span>
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Total Paid</p>
              <p className="stat-value text-green-600">{formatCurrency(totalCashRevenue)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                cash sales, deposits and payments received since
              </p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Still Outstanding</p>
              <p className="stat-value text-orange-500">{formatCurrency(totalCreditRevenue)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {creditSales.length} credit sale{creditSales.length !== 1 ? "s" : ""}
                {fullyPaidCredit > 0 ? ` · ${fullyPaidCredit} settled` : ""}
                {partPaidCount > 0 ? ` · ${partPaidCount} part paid` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Sales table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Sales Transactions</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
              <span className="ml-3 text-sm text-gray-500">Loading...</span>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-900">No Sales Found</p>
              <p className="text-xs text-gray-500 mt-1">No sales found for the selected date range and filters</p>
            </div>
          ) : (
            <div className="table-wrapper border-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="text-gray-500">{new Date(sale.createdAt).toLocaleDateString()}</td>
                      <td className="font-medium">{sale.customerName}</td>
                      <td>
                        <span className={`badge ${sale.saleType.toLowerCase() === "cash" ? "badge-green" : "badge-red"}`}>
                          {sale.saleType}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const s = SETTLEMENT_LABEL[sale.settlementStatus] ?? SETTLEMENT_LABEL.unpaid;
                          return (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.className}`}>
                              {s.text}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="text-gray-500">
                        {sale.saleType.toLowerCase() === "cash" || (sale.amountPaid ?? 0) > 0
                          ? paymentMethodLabel(sale.paymentMethod)
                          : "-"}
                      </td>
                      <td className="font-semibold">
                        {formatCurrency(sale.totalAmount)}
                        {sale.saleType.toLowerCase() === "credit" && (sale.settledAmount ?? 0) > 0 && (sale.outstanding ?? 0) > 0 && (
                          <span className="block text-xs font-normal text-gray-400">
                            {formatCurrency(sale.settledAmount)} paid · {formatCurrency(sale.outstanding)} owing
                          </span>
                        )}
                      </td>
                      <td className="text-gray-500">{Array.isArray(sale.items) ? sale.items.length : 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}