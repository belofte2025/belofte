"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Download,
  Calendar,
  Filter,
  FileText,
  Search as SearchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { getSalesSummaryBySupplier } from "@/services/reportService";
import toast from "react-hot-toast";

// Types
type SupplierSalesItem = {
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  supplierName: string;
};

type SupplierSalesSummary = {
  saleId: string;
  customerName: string;
  saleType: string;
  createdAt: string;
  items: SupplierSalesItem[];
};

export default function SupplierSummaryPage() {
  const router = useRouter();
  const [supplierSales, setSupplierSales] = useState<SupplierSalesSummary[]>(
    []
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  });

  const fetchData = async () => {
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      setLoading(true);
      const data = await getSalesSummaryBySupplier(startDate, endDate);
      setSupplierSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching supplier sales summary:", error);
      toast.error("Failed to load sales summary");
      setSupplierSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(
    () =>
      supplierSales.filter((s) =>
        search ? s.saleType?.toLowerCase().includes(search.toLowerCase()) : true
      ),
    [supplierSales, search]
  );

  const grandTotal = useMemo(
    () =>
      filtered.reduce(
        (sum, supplier) =>
          sum + supplier.items.reduce((acc, item) => acc + item.total, 0),
        0
      ),
    [filtered]
  );

  const handleExport = async () => {
    if (!filtered.length) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const html = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h2 { margin-bottom: 6px; color: #1f2937; }
              .sale { margin-top: 20px; page-break-inside: avoid; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                font-size: 12px;
                text-align: left;
              }
              th { background-color: #f3f4f6; font-weight: 600; }
              .total { text-align: right; font-weight: bold; margin-top: 8px; }
              .grand-total { 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 2px solid #000; 
                font-size: 18px;
                font-weight: bold;
                text-align: right;
              }
              footer { 
                margin-top: 40px; 
                font-size: 11px; 
                text-align: center; 
                color: #6b7280; 
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <h2>${
              search ? search.toUpperCase() + " " : ""
            }Sales Summary Report</h2>
            <p><strong>Date Period:</strong> ${new Date(
              startDate
            ).toLocaleDateString()} to ${new Date(
        endDate
      ).toLocaleDateString()}</p>
            ${filtered
              .map(
                (s) => `
              <div class="sale">
                <h3>Customer: ${s.customerName} (${s.saleType})</h3>
                <p><strong>Date:</strong> ${new Date(
                  s.createdAt
                ).toLocaleDateString()}</p>
                <table>
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Quantity</th>
                      <th>Unit Price (GHS)</th>
                      <th>Total (GHS)</th>
                      <th>Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${s.items
                      .map(
                        (item) => `
                      <tr>
                        <td>${item.itemName}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.unitPrice)}</td>
                        <td>${formatCurrency(item.total)}</td>
                        <td>${item.supplierName || "N/A"}</td>
                      </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>
                <p class="total">Total: GHS ${formatCurrency(
                  s.items.reduce((sum, i) => sum + i.total, 0)
                )}</p>
              </div>
            `
              )
              .join("")}
            <div class="grand-total">
              Grand Total: GHS ${formatCurrency(grandTotal)}
            </div>
            <footer>
              Report generated by Petros | EYO SOLUTIONS<br>
              ${new Date().toLocaleString()}
            </footer>
          </body>
        </html>
      `;

      html2pdf()
        .from(html)
        .save(`Supplier_Sales_Summary_${startDate}_to_${endDate}.pdf`);
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Sales Details
                </h1>
                <p className="mt-1 text-gray-600">
                  Detailed item supplier-wise sales breakdown
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Sales Type
                    </div>
                  </label>
                  <select
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  >
                    <option value="">All Types</option>
                    <option value="cash">Cash</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Date
                    </div>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      End Date
                    </div>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <SearchIcon className="w-4 h-4" />
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading sales data...</span>
            </div>
          ) : !filtered.length ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Sales Found
              </h3>
              <p className="text-gray-600">
                No sales data available for the selected filters and date range.
              </p>
            </div>
          ) : (
            <>
              {/* Sales Cards */}
              <div className="space-y-4 mb-6">
                {filtered.map((sale) => {
                  const total = sale.items.reduce((sum, i) => sum + i.total, 0);
                  return (
                    <div
                      key={sale.saleId}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Customer: {sale.customerName}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                sale.saleType.toLowerCase() === "cash"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {sale.saleType}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="text-xl font-bold text-blue-600">
                            GHS {formatCurrency(total)}
                          </p>
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Item
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                Qty
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Unit Price
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Total
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                Supplier
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sale.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {item.itemName}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-gray-600">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600">
                                  GHS {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                  GHS {formatCurrency(item.total)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {item.supplierName || "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grand Total & Export */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Grand Total</p>
                    <p className="text-3xl font-bold text-green-600">
                      GHS {formatCurrency(grandTotal)}
                    </p>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Download className="w-5 h-5" />
                    {isExporting ? "Exporting..." : "Export to PDF"}
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
