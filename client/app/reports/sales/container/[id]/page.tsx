"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Download,
  Package,
  Layers,
  TrendingUp,
  Calendar,
  CreditCard,
  Banknote,
  Archive,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { getContainerSalesSummary } from "@/services/containerService";
import toast from "react-hot-toast";
import { createHTMLReportTemplate, getHTML2PDFOptions } from "@/lib/pdfTemplates";

interface Item {
  name: string;
  expected: number;
  remainingQty: number;
  sold: number;
  unitPrice: number;
  total: number;
}

interface ContainerSummary {
  id: string;
  number: string;
  company: string;
  deliveryDate: string | Date;
  totalSales: number;
  creditSales: number;
  cashSales: number;
  items: Item[];
}

// Local currency helper — cedis only, no "GHS" prefix
const fmt = (n: number) => `₵${formatCurrency(n)}`;

export default function ContainerSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [container, setContainer] = useState<ContainerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (id) {
        const data = await getContainerSalesSummary(id);
        setContainer(data as ContainerSummary);
      }
    } catch (error) {
      toast.error("Could not load container summary");
      console.error("Error loading container:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [id, loadData]);

  const exportToPDF = async () => {
    if (!container || isExporting) return;
    setIsExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const totalSold      = container.items?.reduce((s, i) => s + i.sold, 0) || 0;
      const totalRemaining = container.items?.reduce((s, i) => s + i.remainingQty, 0) || 0;

      const tableContent = `
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Sold</th>
              <th>Remaining</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${container.items?.map(item => `
              <tr class="no-page-break">
                <td>${item.name}</td>
                <td class="text-center">${item.expected}</td>
                <td class="text-center">${item.sold}</td>
                <td class="text-center">${item.remainingQty}</td>
                <td class="text-right">₵${formatCurrency(item.unitPrice)}</td>
                <td class="text-right font-bold">₵${formatCurrency(item.total)}</td>
              </tr>
            `).join('') || '<tr><td colspan="6">No items found.</td></tr>'}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" class="text-right font-bold">Grand Total</td>
              <td class="text-right font-bold">₵${formatCurrency(container.totalSales)}</td>
            </tr>
          </tfoot>
        </table>
      `;

      const html = createHTMLReportTemplate(
        `Container Sales Summary: ${container.number}`,
        tableContent,
        {
          subtitle: `Supplier: ${container.company} | Delivery Date: ${new Date(container.deliveryDate).toLocaleDateString()}`,
          summaryStats: [
            { label: "Total Sales",     value: `₵${formatCurrency(container.totalSales)}` },
            { label: "Credit Sales",    value: `₵${formatCurrency(container.creditSales)}` },
            { label: "Cash Sales",      value: `₵${formatCurrency(container.cashSales)}` },
            { label: "Items Sold",      value: totalSold.toString() },
            { label: "Remaining Stock", value: totalRemaining.toString() },
          ],
        }
      );

      const options = { ...getHTML2PDFOptions(), filename: `Container_${container.number}_Summary.pdf` };
      html2pdf().set(options).from(html).save();
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const totalItemsSold    = container?.items?.reduce((s, i) => s + i.sold, 0) || 0;
  const totalRemaining    = container?.items?.reduce((s, i) => s + i.remainingQty, 0) || 0;
  const totalItemTypes    = container?.items?.length || 0;

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
                <h1 className="text-3xl font-bold text-gray-900">Container Sales Summary</h1>
                <p className="mt-1 text-gray-600">Detailed breakdown of container inventory and sales</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading container data...</span>
            </div>
          ) : !container ? (
            <div className="text-center py-16">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Container Data Available</h3>
              <p className="text-gray-600">The requested container could not be found.</p>
            </div>
          ) : (
            <>
              {/* Container Info Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-blue-600">Container {container.number}</h2>
                      <p className="text-gray-600 mt-1">{container.company}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Delivered: {new Date(container.deliveryDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Sales</p>
                      <p className="text-2xl font-bold text-green-600">{fmt(container.totalSales)}</p>
                    </div>
                    <button
                      onClick={exportToPDF}
                      disabled={isExporting}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? "Exporting..." : "Export PDF"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Item Types</p>
                    <p className="text-2xl font-bold text-blue-600">{totalItemTypes}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Units Sold</p>
                    <p className="text-2xl font-bold text-green-600">{totalItemsSold}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Archive className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Remaining Stock</p>
                    <p className="text-2xl font-bold text-amber-600">{totalRemaining}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Total Revenue</p>
                    <p className="text-xl font-bold text-purple-600">{fmt(container.totalSales)}</p>
                  </div>
                </div>
              </div>

              {/* Credit vs Cash summary card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Sales by Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Credit Sales</p>
                      <p className="text-xl font-bold text-orange-600">{fmt(container.creditSales)}</p>
                      {container.totalSales > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {Math.round((container.creditSales / container.totalSales) * 100)}% of total
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Banknote className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Cash Sales</p>
                      <p className="text-xl font-bold text-green-600">{fmt(container.cashSales)}</p>
                      {container.totalSales > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {Math.round((container.cashSales / container.totalSales) * 100)}% of total
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visual bar */}
                {container.totalSales > 0 && (
                  <div className="mt-4 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: `${(container.creditSales / container.totalSales) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Sales Breakdown</h2>
                </div>

                {!container.items || container.items.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Found</h3>
                    <p className="text-gray-600">This container has no items recorded.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sold
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Remaining
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {container.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-500">
                              {item.expected}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                item.sold > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                              }`}>
                                {item.sold}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                item.remainingQty === 0
                                  ? "bg-red-100 text-red-700"
                                  : item.remainingQty <= 5
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                                {item.remainingQty}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">
                              {fmt(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-blue-600">
                              {item.total > 0 ? fmt(item.total) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={5} className="px-4 py-4 text-right text-sm font-bold text-gray-900">
                            Grand Total
                          </td>
                          <td className="px-4 py-4 text-right text-lg font-bold text-green-600">
                            {fmt(container.totalSales)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
