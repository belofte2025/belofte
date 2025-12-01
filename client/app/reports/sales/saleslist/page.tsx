"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Search,
  Calendar,
  Eye,
  Trash2,
  Receipt,
  User,
  X,
  Edit,
  Plus,
  Minus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { listSales, deleteSaleById, updateSale } from "@/services/salesService";
import toast from "react-hot-toast";
import { Dialog } from "@headlessui/react";

interface SaleItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

interface Sale {
  id: string;
  saleType: string;
  sourceType?: string;
  customer: {
    customerName: string;
  };
  totalAmount: number;
  createdAt: string;
  items: SaleItem[];
}

export default function SalesListPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Set default dates to current week
  const getStartOfWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek.toISOString().split("T")[0];
  };

  const getEndOfWeek = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState(getStartOfWeek());
  const [endDate, setEndDate] = useState(getEndOfWeek());

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editForm, setEditForm] = useState<{
    saleType: string;
    saleDate: string;
    items: SaleItem[];
  }>({ saleType: "", saleDate: "", items: [] });

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const filters: {
        startDate?: string;
        endDate?: string;
      } = {};
      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
      }

      const result = await listSales(filters);
      setSales(result);
      setFilteredSales(result);
    } catch (err) {
      console.error("Error loading sales:", err);
      toast.error("Failed to load sales. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const filterSales = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredSales(sales);
      return;
    }

    const filtered = sales.filter(
      (sale) =>
        sale.customer.customerName
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        sale.saleType.toLowerCase().includes(query.toLowerCase()) ||
        sale.id.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredSales(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;

    try {
      await deleteSaleById(id);
      toast.success("Sale deleted successfully.");
      loadSales();
    } catch (err) {
      console.error("Error deleting sale:", err);
      toast.error("Failed to delete sale. Please try again.");
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    loadSales();
  };

  const handleOpenEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setEditForm({
      saleType: sale.saleType,
      saleDate: new Date(sale.createdAt).toISOString().split("T")[0],
      items: sale.items.map(item => ({ ...item })),
    });
    setShowEditModal(true);
  };

  const handleEditSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    if (editForm.items.length === 0) {
      toast.error("Sale must have at least one item");
      return;
    }

    try {
      await updateSale(editingSale.id, {
        saleType: editForm.saleType,
        saleDate: editForm.saleDate,
        items: editForm.items,
      });
      toast.success("Sale updated successfully");
      setShowEditModal(false);
      setEditingSale(null);
      loadSales();
    } catch (err) {
      console.error("Error updating sale:", err);
      toast.error("Failed to update sale");
    }
  };

  const updateEditItem = (index: number, field: keyof SaleItem, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeEditItem = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addEditItem = () => {
    setEditForm(prev => ({
      ...prev,
      items: [...prev.items, { itemName: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const calculateEditTotal = () => {
    return editForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getSaleTypeColor = (type: string) => {
    return type?.toLowerCase() === "cash"
      ? "bg-green-100 text-green-800"
      : "bg-blue-100 text-blue-800";
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header */}
          <div className="mb-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales List</h1>
              <p className="mt-1 text-gray-600">
                {filteredSales.length} sale(s) found
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 mb-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => filterSales(e.target.value)}
                  placeholder="Search by customer, type, or ID..."
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => filterSales("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Date Filters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Date Range
                </label>
                {(startDate || endDate) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-4 py-3 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                    className="w-full px-4 py-3 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sales List */}
          {loading ? (
            <div className="bg-white shadow-sm border border-gray-200 p-16">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading sales...</span>
              </div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="bg-white shadow-sm border border-gray-200 p-16">
              <div className="text-center">
                <Receipt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Sales Found
                </h3>
                <p className="text-gray-600">
                  {searchQuery || startDate || endDate
                    ? "Try adjusting your search or date filters"
                    : "No sales have been recorded yet"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-white shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium ${getSaleTypeColor(sale.saleType)}`}
                      >
                        {sale.saleType?.toUpperCase() || "SALE"}
                      </span>
                      <span className="text-sm text-gray-500">#{sale.id.slice(-8)}</span>
                      <span className="text-sm text-gray-400">{formatDateTime(sale.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/sales/${sale.id}`)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(sale)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-900">{sale.customer.customerName}</span>
                  </div>

                  {/* Items Table */}
                  <div className="border border-gray-200 mb-3">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left">
                        <tr>
                          <th className="px-3 py-2 text-xs font-medium text-gray-500">Item</th>
                          <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Qty</th>
                          <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Price</th>
                          <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sale.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-gray-900">{item.itemName}</td>
                            <td className="px-3 py-2 text-gray-600 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-3 py-2 text-gray-900 font-medium text-right">
                              {formatCurrency(item.quantity * item.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">{sale.items.length} item(s)</span>
                    <div className="text-right">
                      <span className="text-sm text-gray-500 mr-2">Total:</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(sale.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Sale Modal */}
      <Dialog open={showEditModal} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl bg-white p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-6">
              Edit Sale
            </Dialog.Title>

            <form onSubmit={handleEditSale} className="space-y-6">
              {/* Customer Info - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{editingSale?.customer.customerName}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Customer cannot be changed</p>
              </div>

              {/* Sale Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Type
                </label>
                <select
                  value={editForm.saleType}
                  onChange={(e) => setEditForm(prev => ({ ...prev, saleType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              {/* Sale Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Sale Date
                  </div>
                </label>
                <input
                  type="date"
                  value={editForm.saleDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, saleDate: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Items
                  </label>
                  <button
                    type="button"
                    onClick={addEditItem}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {editForm.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => updateEditItem(index, "itemName", e.target.value)}
                          placeholder="Item name"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateEditItem(index, "quantity", parseInt(e.target.value) || 0)}
                          placeholder="Qty"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateEditItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="w-24 text-right text-sm font-medium text-gray-700">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEditItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                        disabled={editForm.items.length === 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 flex items-center justify-between p-3 bg-green-50">
                  <span className="font-medium text-gray-700">Total Amount</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(calculateEditTotal())}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSale(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
