"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Search,
  Calendar,
  Eye,
  Edit,
  X,
  CheckSquare,
  Square,
  History,
  Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import {
  listSales,
  searchSalesByItem,
  updateSale,
  bulkUpdateSales,
} from "@/services/salesService";
import toast from "react-hot-toast";
import { Dialog } from "@headlessui/react";
import BulkEditModal from "@/components/sales/BulkEditModal";
import EditHistoryModal from "@/components/sales/EditHistoryModal";
import ValidationWarningModal from "@/components/sales/ValidationWarningModal";

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
  } | null;
  totalAmount: number;
  createdAt: string;
  items?: SaleItem[];
}

interface ValidationWarning {
  type: string;
  message: string;
  severity: "high" | "medium" | "low";
}

export default function EditSalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set());

  // Filter state
  const [filters, setFilters] = useState({
    itemName: "",
    customerName: "",
    startDate: "",
    endDate: "",
    saleType: "",
  });

  // Modal state
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [currentValidationWarning, setCurrentValidationWarning] = useState<ValidationWarning | null>(null);
  const [pendingBulkUpdate, setPendingBulkUpdate] = useState<any>(null);
  const [historyEntityId, setHistoryEntityId] = useState<string>("");

  // Single edit modal state (reused from saleslist)
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
      let result: Sale[];

      // If item name is provided, use search endpoint
      if (filters.itemName.trim()) {
        result = await searchSalesByItem({
          itemName: filters.itemName,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          saleType: filters.saleType || undefined,
        });
      } else {
        // Otherwise use regular list endpoint
        result = await listSales({
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });

        // Client-side filter by sale type if specified
        if (filters.saleType) {
          result = result.filter((sale) => sale.saleType === filters.saleType);
        }
      }

      // Client-side filter by customer name
      if (filters.customerName.trim()) {
        result = result.filter((sale) =>
          (sale.customer?.customerName || "")
            .toLowerCase()
            .includes(filters.customerName.toLowerCase())
        );
      }

      setSales(result);
      setFilteredSales(result);
    } catch (err) {
      console.error("Error loading sales:", err);
      toast.error("Failed to load sales. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSearch = () => {
    setSelectedSaleIds(new Set()); // Clear selections on new search
    loadSales();
  };

  const clearFilters = () => {
    setFilters({
      itemName: "",
      customerName: "",
      startDate: "",
      endDate: "",
      saleType: "",
    });
    setSelectedSaleIds(new Set());
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedSaleIds.size === filteredSales.length) {
      setSelectedSaleIds(new Set());
    } else {
      setSelectedSaleIds(new Set(filteredSales.map((s) => s.id)));
    }
  };

  const handleSelectSale = (id: string) => {
    const newSelection = new Set(selectedSaleIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedSaleIds(newSelection);
  };

  const isAllSelected = filteredSales.length > 0 && selectedSaleIds.size === filteredSales.length;

  // Validation logic
  const validateChanges = (saleIds: string[], updates: any): ValidationWarning | null => {
    // High severity: Bulk editing >10 sales
    if (saleIds.length > 10) {
      return {
        type: "bulk_size",
        message: `You are about to edit ${saleIds.length} sales. This action will affect multiple records and cannot be undone.`,
        severity: "high",
      };
    }

    // Medium severity: Sale type change
    if (updates.saleType) {
      const affectedSales = sales.filter((s) => saleIds.includes(s.id));
      const typesChanging = affectedSales.some((s) => s.saleType !== updates.saleType);
      if (typesChanging) {
        return {
          type: "sale_type_change",
          message:
            "Changing sale type may affect customer debt calculations. Please verify balances after saving.",
          severity: "medium",
        };
      }
    }

    // Medium severity: Date change >30 days in past
    if (updates.saleDate) {
      const updateDate = new Date(updates.saleDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (updateDate < thirtyDaysAgo) {
        return {
          type: "date_change",
          message:
            "You are changing the sale date to more than 30 days ago. This may affect historical reports.",
          severity: "medium",
        };
      }
    }

    return null;
  };

  // Bulk edit handler
  const handleBulkEdit = () => {
    if (selectedSaleIds.size === 0) {
      toast.error("Please select at least one sale");
      return;
    }
    setShowBulkEditModal(true);
  };

  const handleBulkEditConfirm = async (updates: any) => {
    const saleIds = Array.from(selectedSaleIds);
    const warning = validateChanges(saleIds, updates);

    if (warning) {
      setCurrentValidationWarning(warning);
      setPendingBulkUpdate({ saleIds, updates });
      setShowBulkEditModal(false);
      setShowValidationModal(true);
      return;
    }

    // No warning, proceed directly
    await executeBulkUpdate(saleIds, updates);
  };

  const handleValidationConfirm = async () => {
    if (pendingBulkUpdate) {
      await executeBulkUpdate(pendingBulkUpdate.saleIds, pendingBulkUpdate.updates);
      setPendingBulkUpdate(null);
    }
    setShowValidationModal(false);
    setCurrentValidationWarning(null);
  };

  const executeBulkUpdate = async (saleIds: string[], updates: any) => {
    try {
      await bulkUpdateSales(saleIds, updates);
      toast.success(`Successfully updated ${saleIds.length} sales`);
      setSelectedSaleIds(new Set());
      setShowBulkEditModal(false);
      loadSales();
    } catch (err) {
      console.error("Bulk update failed:", err);
      toast.error("Failed to update sales. Please try again.");
    }
  };

  // Single edit handlers (reused from saleslist)
  const handleOpenEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setEditForm({
      saleType: sale.saleType,
      saleDate: new Date(sale.createdAt).toISOString().split("T")[0],
      items: (sale.items || []).map((item) => ({ ...item })),
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
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const removeEditItem = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addEditItem = () => {
    setEditForm((prev) => ({
      ...prev,
      items: [...prev.items, { itemName: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const calculateEditTotal = () => {
    return editForm.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  // View history handler
  const handleViewHistory = (saleId: string) => {
    setHistoryEntityId(saleId);
    setShowEditHistoryModal(true);
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Sales</h1>
                <p className="mt-1 text-gray-600">
                  Search, select, and edit multiple sales at once
                </p>
              </div>
              {selectedSaleIds.size > 0 && (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-800 font-medium rounded-full text-sm">
                    {selectedSaleIds.size} selected
                  </span>
                  <button
                    onClick={handleBulkEdit}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Edit Selected
                  </button>
                  <button
                    onClick={() => setSelectedSaleIds(new Set())}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 mb-6">
            {/* Item Name Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Item Name
              </label>
              <input
                type="text"
                value={filters.itemName}
                onChange={(e) => setFilters((prev) => ({ ...prev, itemName: e.target.value }))}
                placeholder="Enter item name..."
                className="w-full px-4 py-3 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Customer Name Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Customer Name
              </label>
              <input
                type="text"
                value={filters.customerName}
                onChange={(e) => setFilters((prev) => ({ ...prev, customerName: e.target.value }))}
                placeholder="Enter customer name..."
                className="w-full px-4 py-3 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range and Sale Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Start Date
                  </div>
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sale Type</label>
                <select
                  value={filters.saleType}
                  onChange={(e) => setFilters((prev) => ({ ...prev, saleType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                <Search className="w-4 h-4 inline-block mr-2" />
                {loading ? "Searching..." : "Search"}
              </button>
              {(filters.itemName ||
                filters.customerName ||
                filters.startDate ||
                filters.endDate ||
                filters.saleType) && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear All Filters
                </button>
              )}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales Found</h3>
                <p className="text-gray-600">
                  Try adjusting your search filters or search for different criteria
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {/* Select All Row */}
              <div className="bg-gray-100 border border-gray-200 p-3 flex items-center justify-between">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                  <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
                </button>
                <span className="text-sm text-gray-600">{filteredSales.length} sale(s) found</span>
              </div>

              {/* Sales Cards */}
              <div className="grid grid-cols-1 gap-4">
                {filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    className={`bg-white shadow-sm border-2 p-4 hover:shadow-md transition-all duration-200 ${
                      selectedSaleIds.has(sale.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleSelectSale(sale.id)}
                        className="pt-1"
                      >
                        {selectedSaleIds.has(sale.id) ? (
                          <CheckSquare className="w-6 h-6 text-blue-600" />
                        ) : (
                          <Square className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>

                      {/* Sale Content */}
                      <div className="flex-1">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium ${getSaleTypeColor(
                                sale.saleType
                              )}`}
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
                              onClick={() => handleViewHistory(sale.id)}
                              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              title="View History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-900">
                            {sale.customer?.customerName || "Unknown Customer"}
                          </span>
                        </div>

                        {/* Items Table */}
                        <div className="border border-gray-200 mb-3">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left">
                              <tr>
                                <th className="px-3 py-2 text-xs font-medium text-gray-500">Item</th>
                                <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Qty</th>
                                <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Price</th>
                                <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">
                                  Subtotal
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {(sale.items || []).map((item, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 text-gray-900">{item.itemName}</td>
                                  <td className="px-3 py-2 text-gray-600 text-right">{item.quantity}</td>
                                  <td className="px-3 py-2 text-gray-600 text-right">
                                    {formatCurrency(item.unitPrice)}
                                  </td>
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
                          <span className="text-sm text-gray-500">{(sale.items || []).length} item(s)</span>
                          <div className="text-right">
                            <span className="text-sm text-gray-500 mr-2">Total:</span>
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(sale.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <BulkEditModal
        open={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        selectedSales={filteredSales.filter((s) => selectedSaleIds.has(s.id))}
        onConfirm={handleBulkEditConfirm}
      />

      <EditHistoryModal
        open={showEditHistoryModal}
        onClose={() => setShowEditHistoryModal(false)}
        saleId={historyEntityId}
      />

      <ValidationWarningModal
        open={showValidationModal}
        onClose={() => {
          setShowValidationModal(false);
          setCurrentValidationWarning(null);
          setPendingBulkUpdate(null);
        }}
        warning={currentValidationWarning}
        onConfirm={handleValidationConfirm}
      />

      {/* Single Edit Modal (reused from saleslist) */}
      <Dialog open={showEditModal} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl bg-white p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-6">Edit Sale</Dialog.Title>

            <form onSubmit={handleEditSale} className="space-y-6">
              {/* Customer Info - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200">
                  <span className="text-gray-600">{editingSale?.customer?.customerName || "Unknown Customer"}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Customer cannot be changed</p>
              </div>

              {/* Sale Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Type</label>
                <select
                  value={editForm.saleType}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, saleType: e.target.value }))}
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
                  onChange={(e) => setEditForm((prev) => ({ ...prev, saleDate: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Items</label>
                  <button
                    type="button"
                    onClick={addEditItem}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
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
                        <X className="w-4 h-4" />
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
