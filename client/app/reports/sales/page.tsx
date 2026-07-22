"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Download, 
  Calendar, 
  BarChart3
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { getDetailedSalesReport } from "@/services/reportService";
import toast from "react-hot-toast";
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
  customerName: string;
  totalAmount: number;
  createdAt: string;
  items: SaleItem[];
}

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

  // Calculate summary stats for PDF export
  const totalRevenue = Array.isArray(sales) ? sales.reduce((sum, sale) => sum + sale.totalAmount, 0) : 0;
  const totalTransactions = Array.isArray(sales) ? sales.length : 0;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const cashSales = Array.isArray(sales) ? sales.filter(s => s.saleType.toLowerCase() === 'cash') : [];
  const creditSales = Array.isArray(sales) ? sales.filter(s => s.saleType.toLowerCase() === 'credit') : [];
  const totalCashRevenue = cashSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCreditRevenue = creditSales.reduce((sum, s) => sum + s.totalAmount, 0);

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
              <th>Amount</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            ${Array.isArray(sales) ? sales.map(sale => `
              <tr class="no-page-break">
                <td>${new Date(sale.createdAt).toLocaleDateString()}</td>
                <td>${sale.customerName}</td>
                <td>${sale.saleType}</td>
                <td class="text-right font-bold">${formatCurrency(sale.totalAmount)}</td>
                <td class="text-center">${Array.isArray(sale.items) ? sale.items.length : 0} items</td>
              </tr>
            `).join('') : ''}
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
      html2pdf().set(options).from(html).save();
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
            disabled={loading || !Array.isArray(sales) || sales.length === 0}
            className="btn btn-success"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>

        {/* Date filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
            </div>
            <div className="form-group">
              <label className="form-label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" />
            </div>
            <button onClick={fetchSalesReport} disabled={loading} className="btn btn-primary">
              <BarChart3 className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>

        {/* Summary stats */}
        {!loading && Array.isArray(sales) && sales.length > 0 && (
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
              <p className="stat-label">Total Cash Sales</p>
              <p className="stat-value text-green-600">{formatCurrency(totalCashRevenue)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{cashSales.length} transaction{cashSales.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Total Credit Sales</p>
              <p className="stat-value text-orange-500">{formatCurrency(totalCreditRevenue)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{creditSales.length} transaction{creditSales.length !== 1 ? "s" : ""}</p>
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
          ) : !Array.isArray(sales) || sales.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-900">No Sales Found</p>
              <p className="text-xs text-gray-500 mt-1">No sales found for the selected date range</p>
            </div>
          ) : (
            <div className="table-wrapper border-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="text-gray-500">{new Date(sale.createdAt).toLocaleDateString()}</td>
                      <td className="font-medium">{sale.customerName}</td>
                      <td>
                        <span className={`badge ${sale.saleType.toLowerCase() === "cash" ? "badge-green" : "badge-red"}`}>
                          {sale.saleType}
                        </span>
                      </td>
                      <td className="font-semibold">{formatCurrency(sale.totalAmount)}</td>
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