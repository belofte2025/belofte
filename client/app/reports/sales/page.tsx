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
  const cashSales = Array.isArray(sales) ? sales.filter(s => s.saleType.toLowerCase() === 'cash').length : 0;
  const creditSales = Array.isArray(sales) ? sales.filter(s => s.saleType.toLowerCase() === 'credit').length : 0;

  const exportToPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      
      const content = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1, h2 { color: #1f2937; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; }
              .summary { background-color: #f9fafb; padding: 15px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <h1>Sales Report</h1>
            <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
            
            <div class="summary">
              <h2>Summary</h2>
              <p><strong>Total Revenue:</strong> ${formatCurrency(totalRevenue)}</p>
              <p><strong>Total Transactions:</strong> ${totalTransactions}</p>
              <p><strong>Average Transaction:</strong> ${formatCurrency(avgTransaction)}</p>
              <p><strong>Cash Sales:</strong> ${cashSales} | <strong>Credit Sales:</strong> ${creditSales}</p>
            </div>
            
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
                  <tr>
                    <td>${new Date(sale.createdAt).toLocaleDateString()}</td>
                    <td>${sale.customerName}</td>
                    <td>${sale.saleType}</td>
                    <td>${formatCurrency(sale.totalAmount)}</td>
                    <td>${Array.isArray(sale.items) ? sale.items.length : 0} items</td>
                  </tr>
                `).join('') : ''}
              </tbody>
            </table>
          </body>
        </html>
      `;

      html2pdf().from(content).save(`Sales_Report_${startDate}_to_${endDate}.pdf`);
      toast.success("Report exported successfully!");
    } catch {
      toast.error("Failed to export report");
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
                <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
                <p className="mt-1 text-gray-600">Comprehensive sales analytics and insights</p>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                <div className="flex-1">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div className="flex-1">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchSalesReport}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Generate Report
                  </button>
                  <button
                    onClick={exportToPDF}
                    disabled={loading || !Array.isArray(sales) || sales.length === 0}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* Sales Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Sales Transactions</h2>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading sales data...</span>
              </div>
            ) : !Array.isArray(sales) || sales.length === 0 ? (
              <div className="text-center py-16">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Found</h3>
                <p className="text-gray-600">No sales transactions were found for the selected date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(sales) && sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sale.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            sale.saleType.toLowerCase() === 'cash' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {sale.saleType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Array.isArray(sale.items) ? sale.items.length : 0} items
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}