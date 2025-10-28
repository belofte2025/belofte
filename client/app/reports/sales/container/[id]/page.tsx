"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Download, 
  Package, 
  Layers,
  TrendingUp,
  Calendar
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { getContainerSalesSummary } from "@/services/containerService";
import toast from "react-hot-toast";

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
  items: Item[];
}

export default function ContainerSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [container, setContainer] = useState<ContainerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (id) {
        const data = await getContainerSalesSummary(id);
        setContainer(data);
      }
    } catch (error) {
      toast.error("Could not load container summary");
      console.error("Error loading container:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!container || isExporting) return;
    
    setIsExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      
      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1, h2 { color: #1f2937; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: 600; }
              tfoot td { font-weight: bold; background-color: #f9fafb; }
              .header-info { margin-bottom: 20px; }
              .header-info p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <h1>Container Sales Summary: ${container.number}</h1>
            <div class="header-info">
              <p><strong>Company:</strong> ${container.company}</p>
              <p><strong>Delivery Date:</strong> ${new Date(container.deliveryDate).toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Sold</th>
                  <th>Remaining</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${container.items?.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.sold}</td>
                    <td>${item.remainingQty}</td>
                    <td>GHS ${formatCurrency(item.unitPrice)}</td>
                    <td>GHS ${formatCurrency(item.total)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="5">No items found.</td></tr>'}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4">Grand Total</td>
                  <td>GHS ${formatCurrency(container.totalSales)}</td>
                </tr>
              </tfoot>
            </table>
          </body>
        </html>
      `;

      html2pdf().from(html).save(`Container_${container.number}_Summary.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const totalItemsSold = container?.items?.reduce((sum, item) => sum + item.sold, 0) || 0;
  const totalItemTypes = container?.items?.length || 0;

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
                      <p className="text-2xl font-bold text-green-600">GHS {formatCurrency(container.totalSales)}</p>
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

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Layers className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Item Types</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">{totalItemTypes}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Items Sold</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">{totalItemsSold}</p>
                    </div>
                  </div>
                </div>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sold
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {container.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.sold > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.sold}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                item.remainingQty > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {item.remainingQty}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-600">
                              GHS {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                              GHS {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                            Grand Total
                          </td>
                          <td className="px-6 py-4 text-right text-lg font-bold text-green-600">
                            GHS {formatCurrency(container.totalSales)}
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