"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Download, Package, Search, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getInventoryReport } from "@/services/inventoryService";
import toast from "react-hot-toast";
import { createHTMLReportTemplate, getHTML2PDFOptions } from "@/lib/pdfTemplates";

interface InventoryItem {
  itemName: string;
  supplierName: string;
  available: number;
}

export default function InventoryReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await getInventoryReport();
      setInventory(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to fetch inventory");
      console.error(error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = useCallback(() => {
    if (!Array.isArray(inventory)) return;
    let filtered = [...inventory];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Supplier filter
    if (supplierFilter) {
      filtered = filtered.filter(
        (item) => item.supplierName === supplierFilter
      );
    }

    // Stock filter
    switch (stockFilter) {
      case "in-stock":
        filtered = filtered.filter((item) => item.available > 0);
        break;
      case "out-of-stock":
        filtered = filtered.filter((item) => item.available === 0);
        break;
      case "low-stock":
        filtered = filtered.filter(
          (item) => item.available > 0 && item.available < 10
        );
        break;
    }

    setFilteredInventory(filtered);
  }, [inventory, searchTerm, supplierFilter, stockFilter]);

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [filterInventory]);

  // Calculate inventory statistics based on filtered results
  const totalItems = Array.isArray(filteredInventory) ? filteredInventory.length : 0;
  const inStockItems = Array.isArray(filteredInventory)
    ? filteredInventory.filter((item) => item.available > 0).length
    : 0;
  const outOfStockItems = Array.isArray(filteredInventory)
    ? filteredInventory.filter((item) => item.available === 0).length
    : 0;
  const lowStockItems = Array.isArray(filteredInventory)
    ? filteredInventory.filter((item) => item.available > 0 && item.available < 10)
        .length
    : 0;
  const totalAvailable = Array.isArray(filteredInventory)
    ? filteredInventory.reduce((sum, item) => sum + item.available, 0)
    : 0;

  // Suppliers list from full inventory for filter dropdown
  const suppliers = Array.isArray(inventory)
    ? [...new Set(inventory.map((item) => item.supplierName))]
    : [];

  const exportToPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      // Build table content
      const tableContent = `
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Supplier</th>
              <th>Available</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredInventory
              .map(
                (item) => `
              <tr class="no-page-break">
                <td>${item.itemName}</td>
                <td>${item.supplierName}</td>
                <td class="text-center">${item.available}</td>
                <td class="font-bold">${
                  item.available === 0
                    ? "Out of Stock"
                    : item.available < 10
                    ? "Low Stock"
                    : "In Stock"
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;

      // Use standardized HTML template with company branding
      const html = createHTMLReportTemplate(
        "Inventory Status Report",
        tableContent,
        {
          subtitle: `Generated on: ${new Date().toLocaleDateString()}`,
          summaryStats: [
            { label: "Total Items", value: totalItems.toString() },
            { label: "Total Available", value: `${totalAvailable} units` },
            { label: "In Stock", value: inStockItems.toString() },
            { label: "Out of Stock", value: outOfStockItems.toString() },
            { label: "Low Stock", value: lowStockItems.toString() },
          ],
        }
      );

      const options = {
        ...getHTML2PDFOptions(),
        filename: `Inventory_Report_${new Date()
          .toLocaleDateString()
          .replace(/\//g, "_")}.pdf`
      };
      html2pdf()
        .set(options)
        .from(html)
        .save();
      toast.success("Report exported successfully!");
    } catch {
      toast.error("Failed to export report");
    }
  };

  const getStockStatus = (available: number) => {
    if (available === 0)
      return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (available < 10)
      return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    return { text: "In Stock", color: "bg-green-100 text-green-800" };
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Inventory Status
                </h1>
                <p className="mt-1 text-gray-600">
                  Current stock levels and movement tracking
                </p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <Link
                  href="/inventory/adjustments"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors duration-200"
                >
                  <TrendingDown className="w-4 h-4" />
                  Stock Adjustments
                </Link>
                <button
                  onClick={exportToPDF}
                  disabled={loading || inventory.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Items</div>
              <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
            </div>
            <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Total Available</div>
              <div className="text-2xl font-bold text-blue-600">{totalAvailable.toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">In Stock</div>
              <div className="text-2xl font-bold text-green-600">{inStockItems}</div>
            </div>
            <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Low Stock</div>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
            </div>
            <div className="bg-white p-4 shadow-sm border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">Out of Stock</div>
              <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search items or suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Inventory Items ({filteredInventory.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  Loading inventory data...
                </span>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-16">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Items Found
                </h3>
                <p className="text-gray-600">
                  No inventory items match your current filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Available
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      // Group items by supplier if no specific supplier is selected
                      if (!supplierFilter) {
                        let currentSupplier = "";
                        return filteredInventory.map((item, index) => {
                          const status = getStockStatus(item.available);
                          const isNewSupplier = item.supplierName !== currentSupplier;
                          currentSupplier = item.supplierName;

                          return (
                            <Fragment key={`${item.itemName}-${item.supplierName}-${index}`}>
                              {isNewSupplier && (
                                <tr key={`supplier-${item.supplierName}`} className="bg-blue-50">
                                  <td colSpan={4} className="px-6 py-3 text-sm font-bold text-blue-900 uppercase tracking-wide border-t-2 border-blue-200">
                                    {item.supplierName}
                                  </td>
                                </tr>
                              )}
                              <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm mr-4">
                                      {item.itemName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.itemName}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.supplierName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                  {item.available}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
                                  >
                                    {status.text}
                                  </span>
                                </td>
                              </tr>
                            </Fragment>
                          );
                        });
                      } else {
                        // When a specific supplier is selected, show flat list
                        return filteredInventory.map((item, index) => {
                          const status = getStockStatus(item.available);
                          return (
                            <tr key={`${item.itemName}-${item.supplierName}-${index}`} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm mr-4">
                                    {item.itemName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.itemName}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {item.supplierName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {item.available}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
                                >
                                  {status.text}
                                </span>
                              </td>
                            </tr>
                          );
                        });
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Need to Adjust Stock?
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Use Stock Adjustments to modify inventory quantities for damage, loss, found items, or manual corrections.
                  View detailed transaction history to track why items show negative stock.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/inventory/adjustments"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <TrendingDown className="w-4 h-4" />
                    Adjust Stock Levels
                  </Link>
                  <Link
                    href="/reports/item-transactions"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-700 text-sm font-medium rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    View Transaction History
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
