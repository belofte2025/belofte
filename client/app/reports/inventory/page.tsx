"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Download, 
  Package,
  Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { getInventoryReport } from "@/services/inventoryService";
import toast from "react-hot-toast";

interface InventoryItem {
  id: string;
  itemName: string;
  supplierName: string;
  totalOrdered: number;
  totalReceived: number;
  totalSold: number;
  available: number;
  unitPrice: number;
  totalValue: number;
}

export default function InventoryReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
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
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Supplier filter
    if (supplierFilter) {
      filtered = filtered.filter(item => item.supplierName === supplierFilter);
    }

    // Stock filter
    switch (stockFilter) {
      case 'in-stock':
        filtered = filtered.filter(item => item.available > 0);
        break;
      case 'out-of-stock':
        filtered = filtered.filter(item => item.available === 0);
        break;
      case 'low-stock':
        filtered = filtered.filter(item => item.available > 0 && item.available < 10);
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

  // Calculate inventory statistics for PDF export
  const totalItems = Array.isArray(inventory) ? inventory.length : 0;
  const totalValue = Array.isArray(inventory) ? inventory.reduce((sum, item) => sum + item.totalValue, 0) : 0;
  const inStockItems = Array.isArray(inventory) ? inventory.filter(item => item.available > 0).length : 0;
  const outOfStockItems = Array.isArray(inventory) ? inventory.filter(item => item.available === 0).length : 0;
  const lowStockItems = Array.isArray(inventory) ? inventory.filter(item => item.available > 0 && item.available < 10).length : 0;
  
  const totalOrdered = Array.isArray(inventory) ? inventory.reduce((sum, item) => sum + item.totalOrdered, 0) : 0;
  const totalReceived = Array.isArray(inventory) ? inventory.reduce((sum, item) => sum + item.totalReceived, 0) : 0;
  const totalSold = Array.isArray(inventory) ? inventory.reduce((sum, item) => sum + item.totalSold, 0) : 0;

  const suppliers = Array.isArray(inventory) ? [...new Set(inventory.map(item => item.supplierName))] : [];

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
              .out-of-stock { color: #dc2626; background-color: #fef2f2; }
              .low-stock { color: #f59e0b; background-color: #fffbeb; }
              .in-stock { color: #059669; }
            </style>
          </head>
          <body>
            <h1>Inventory Status Report</h1>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            
            <div class="summary">
              <h2>Inventory Summary</h2>
              <p><strong>Total Items:</strong> ${totalItems}</p>
              <p><strong>Total Inventory Value:</strong> ${formatCurrency(totalValue)}</p>
              <p><strong>In Stock Items:</strong> ${inStockItems}</p>
              <p><strong>Out of Stock Items:</strong> ${outOfStockItems}</p>
              <p><strong>Low Stock Items:</strong> ${lowStockItems}</p>
              <p><strong>Total Ordered:</strong> ${totalOrdered} units</p>
              <p><strong>Total Received:</strong> ${totalReceived} units</p>
              <p><strong>Total Sold:</strong> ${totalSold} units</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Supplier</th>
                  <th>Available</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredInventory.map(item => `
                  <tr class="${item.available === 0 ? 'out-of-stock' : item.available < 10 ? 'low-stock' : 'in-stock'}">
                    <td>${item.itemName}</td>
                    <td>${item.supplierName}</td>
                    <td>${item.available}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${formatCurrency(item.totalValue)}</td>
                    <td>${item.available === 0 ? 'Out of Stock' : item.available < 10 ? 'Low Stock' : 'In Stock'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      html2pdf().from(content).save(`Inventory_Report_${new Date().toLocaleDateString().replace(/\//g, '_')}.pdf`);
      toast.success("Report exported successfully!");
    } catch {
      toast.error("Failed to export report");
    }
  };

  const getStockStatus = (available: number) => {
    if (available === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (available < 10) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
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
                <h1 className="text-3xl font-bold text-gray-900">Inventory Status</h1>
                <p className="mt-1 text-gray-600">Current stock levels and movement tracking</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={exportToPDF}
                  disabled={loading || inventory.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>


          {/* Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search items or suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Inventory Items ({filteredInventory.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading inventory data...</span>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-16">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Items Found</h3>
                <p className="text-gray-600">No inventory items match your current filters.</p>
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
                        Unit Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Movement
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInventory.map((item) => {
                      const status = getStockStatus(item.available);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            {formatCurrency(item.totalValue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            <div>
                              <p>Ordered: {item.totalOrdered}</p>
                              <p>Received: {item.totalReceived}</p>
                              <p>Sold: {item.totalSold}</p>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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