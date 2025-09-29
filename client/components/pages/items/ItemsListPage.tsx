"use client";

import { useEffect, useState } from "react";
import { getSupplierItemsWithSales, deleteSupplierItem } from "@/services/supplierService";
import { formatCurrency } from "@/utils/format";
import { PlusCircle, Package, Factory, DollarSign, Trash2, Edit, Eye, Settings, TrendingUp } from "lucide-react";
import Link from "next/link";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import { toast } from "react-hot-toast";

type ItemWithSales = {
  id: string;
  itemName: string;
  quantity: number;
  sold: number;
  available: number;
  unitPrice: number;
  supplierName: string;
};

const ITEMS_PER_PAGE = 15;

export default function ItemsListPage() {
  const [items, setItems] = useState<ItemWithSales[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSupplier, setSelectedSupplier] = useState("all");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getSupplierItemsWithSales();
        setItems(data);
      } catch (err) {
        console.error("Failed to load items", err);
        toast.error("Failed to load items");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const filtered = items.filter((item) => {
    const matchesSearch = 
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(search.toLowerCase());
    
    const matchesSupplier = selectedSupplier === "all" || item.supplierName === selectedSupplier;
    
    return matchesSearch && matchesSupplier;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDelete = async (id: string, itemName: string, supplierName: string) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}" from ${supplierName}?`)) {
      try {
        await deleteSupplierItem(id);
        setItems(prev => prev.filter(item => item.id !== id));
        toast.success("Item deleted successfully");
      } catch (error) {
        toast.error("Failed to delete item");
      }
    }
  };

  // Get unique suppliers for filter dropdown
  const uniqueSuppliers = Array.from(new Set(items.map(item => item.supplierName))).sort();

  // Calculate statistics
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalSold = items.reduce((sum, item) => sum + item.sold, 0);
  const totalAvailable = items.reduce((sum, item) => sum + item.available, 0);

  // Find duplicate item names across suppliers
  const itemNameCounts = items.reduce((acc, item) => {
    acc[item.itemName] = (acc[item.itemName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getDuplicateStatus = (itemName: string) => {
    const count = itemNameCounts[itemName];
    return count > 1 ? `${count} suppliers` : "unique";
  };

  const isDuplicate = (itemName: string) => itemNameCounts[itemName] > 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Items Management</h1>
              <p className="mt-1 text-gray-600">Manage items across all suppliers</p>
            </div>
            <Link
              href="/items/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200"
            >
              <PlusCircle className="w-5 h-5" />
              Add Item
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sold</p>
              <p className="text-3xl font-bold text-blue-600">{totalSold}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-3xl font-bold text-purple-600">{totalAvailable}</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setCurrentPage(1);
                }}
                placeholder="Search items by name or supplier..."
                className="w-full"
              />
            </div>
            <div className="min-w-[200px]">
              <select
                value={selectedSupplier}
                onChange={(e) => {
                  setSelectedSupplier(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Suppliers</option>
                {uniqueSuppliers.map((supplier) => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Management Access */}
        {selectedSupplier !== "all" && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Quick Management for {selectedSupplier}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Manage prices and quantities for all items from this supplier
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-600">
                  Need supplier ID for direct management access
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => toast.info("Navigate to supplier page first for price management")}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <DollarSign className="w-4 h-4" />
                    Manage Prices
                  </button>
                  <button
                    onClick={() => toast.info("Navigate to supplier page first for quantity management")}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Manage Quantities
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading items...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Price
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Stock Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uniqueness
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                                {item.itemName.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.itemName}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {item.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Factory className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{item.supplierName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(item.unitPrice)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <div className="text-xs text-gray-500">
                            <div>Total: {item.quantity}</div>
                            <div>Sold: {item.sold}</div>
                            <div>Available: {item.available}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={isDuplicate(item.itemName) ? "warning" : "success"}
                          >
                            {getDuplicateStatus(item.itemName)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/items/${item.id}`}
                              className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id, item.itemName, item.supplierName)}
                              className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIdx + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)}
                      </span>{" "}
                      of <span className="font-medium">{filtered.length}</span> items
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Previous
                      </button>
                      
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}