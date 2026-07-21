"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ArrowLeft, Search, Calendar, Eye, Edit, X,
  CheckSquare, Square, History, Receipt, AlertTriangle, Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { listSales, searchSalesByItem, updateSale, bulkUpdateSales } from "@/services/salesService";
import { getAllCustomers } from "@/services/customerService";
import toast from "react-hot-toast";
import { Dialog } from "@headlessui/react";
import Select from "react-select";
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
  customerId: string;
  customer: { customerName: string } | null;
  totalAmount: number;
  createdAt: string;
  items?: SaleItem[];
}

interface CustomerOption {
  value: string;
  label: string;
  phone?: string;
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

  const [filters, setFilters] = useState({
    itemName: "", customerName: "", startDate: "", endDate: "", saleType: "",
  });

  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [currentValidationWarning, setCurrentValidationWarning] = useState<ValidationWarning | null>(null);
  const [pendingBulkUpdate, setPendingBulkUpdate] = useState<any>(null);
  const [historyEntityId, setHistoryEntityId] = useState<string>("");

  // Single edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editForm, setEditForm] = useState<{
    saleType: string;
    saleDate: string;
    customerId: string;
    items: SaleItem[];
  }>({ saleType: "", saleDate: "", customerId: "", items: [] });
  const [saving, setSaving] = useState(false);

  // Customer dropdown
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      let result: Sale[];
      if (filters.itemName.trim()) {
        result = await searchSalesByItem({
          itemName: filters.itemName,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          saleType: filters.saleType || undefined,
        });
      } else {
        result = await listSales({
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
        if (filters.saleType) {
          result = result.filter((s) => s.saleType === filters.saleType);
        }
      }
      if (filters.customerName.trim()) {
        result = result.filter((s) =>
          (s.customer?.customerName || "").toLowerCase().includes(filters.customerName.toLowerCase())
        );
      }
      setSales(result);
      setFilteredSales(result);
    } catch {
      toast.error("Failed to load sales.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSearch = () => { setSelectedSaleIds(new Set()); loadSales(); };

  const clearFilters = () => {
    setFilters({ itemName: "", customerName: "", startDate: "", endDate: "", saleType: "" });
    setSelectedSaleIds(new Set());
  };

  const handleSelectAll = () => {
    setSelectedSaleIds(
      selectedSaleIds.size === filteredSales.length ? new Set() : new Set(filteredSales.map((s) => s.id))
    );
  };

  const handleSelectSale = (id: string) => {
    const next = new Set(selectedSaleIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedSaleIds(next);
  };

  const isAllSelected = filteredSales.length > 0 && selectedSaleIds.size === filteredSales.length;

  const validateChanges = (saleIds: string[], updates: any): ValidationWarning | null => {
    if (saleIds.length > 10) {
      return { type: "bulk_size", message: `You are about to edit ${saleIds.length} sales.`, severity: "high" };
    }
    if (updates.saleType) {
      const typesChanging = sales.filter((s) => saleIds.includes(s.id)).some((s) => s.saleType !== updates.saleType);
      if (typesChanging)
        return { type: "sale_type_change", message: "Changing sale type affects customer balance calculations.", severity: "medium" };
    }
    if (updates.saleDate) {
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(updates.saleDate) < thirtyDaysAgo)
        return { type: "date_change", message: "Changing date to more than 30 days ago may affect reports.", severity: "medium" };
    }
    return null;
  };

  const handleBulkEdit = () => {
    if (selectedSaleIds.size === 0) { toast.error("Select at least one sale"); return; }
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
      toast.success(`Updated ${saleIds.length} sales`);
      setSelectedSaleIds(new Set());
      setShowBulkEditModal(false);
      loadSales();
    } catch {
      toast.error("Failed to update sales.");
    }
  };

  // Open edit modal — also load customer list
  const handleOpenEditModal = async (sale: Sale) => {
    setEditingSale(sale);
    setEditForm({
      saleType: sale.saleType,
      saleDate: new Date(sale.createdAt).toISOString().split("T")[0],
      customerId: sale.customerId || "",
      items: (sale.items || []).map((i) => ({ ...i })),
    });
    setShowEditModal(true);

    setLoadingCustomers(true);
    try {
      const customers = await getAllCustomers();
      setCustomerOptions(customers.map((c: any) => ({
        value: c.id,
        label: `${c.customerName || c.name}${c.phone ? ` — ${c.phone}` : ""}`,
        phone: c.phone,
      })));
    } catch {
      toast.error("Could not load customers");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleEditSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    if (editForm.items.length === 0) { toast.error("Sale must have at least one item"); return; }
    if (!editForm.customerId) { toast.error("Please select a customer"); return; }

    const customerChanged = editForm.customerId !== editingSale.customerId;
    const typeChanged = editForm.saleType !== editingSale.saleType;

    // Warn if credit sale and customer changed or type changed to cash (affects ledger)
    const isOrWasCreditSale = editingSale.saleType === "credit" || editForm.saleType === "credit";
    if (isOrWasCreditSale && (customerChanged || typeChanged)) {
      const msgs: string[] = [];
      if (customerChanged) msgs.push("the customer changes (sale moves to new customer's ledger)");
      if (typeChanged && editingSale.saleType === "credit") msgs.push("type changes from credit to cash (sale removed from customer's outstanding balance)");
      if (typeChanged && editForm.saleType === "credit") msgs.push("type changes to credit (sale added to customer's outstanding balance)");

      const confirmed = window.confirm(
        `Ledger impact: ${msgs.join("; ")}.\n\nThe customer statement will update automatically. Proceed?`
      );
      if (!confirmed) return;
    }

    setSaving(true);
    try {
      await updateSale(editingSale.id, {
        saleType: editForm.saleType,
        saleDate: editForm.saleDate,
        customerId: editForm.customerId,
        items: editForm.items,
      });
      toast.success("Sale updated successfully");
      setShowEditModal(false);
      setEditingSale(null);
      loadSales();
    } catch {
      toast.error("Failed to update sale");
    } finally {
      setSaving(false);
    }
  };

  const updateEditItem = (index: number, field: keyof SaleItem, value: string | number) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const removeEditItem = (index: number) => {
    setEditForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const addEditItem = () => {
    setEditForm((prev) => ({ ...prev, items: [...prev.items, { itemName: "", quantity: 1, unitPrice: 0 }] }));
  };

  const calculateEditTotal = () =>
    editForm.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleViewHistory = (saleId: string) => {
    setHistoryEntityId(saleId);
    setShowEditHistoryModal(true);
  };

  const formatDateTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getSaleTypeColor = (type: string) =>
    type?.toLowerCase() === "cash" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";

  // Detect changes in the modal for visual cues
  const customerChanged = editingSale && editForm.customerId && editForm.customerId !== editingSale.customerId;
  const typeChanged = editingSale && editForm.saleType !== editingSale.saleType;
  const newTotal = calculateEditTotal();
  const totalChanged = editingSale && Math.abs(newTotal - editingSale.totalAmount) > 0.001;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <button onClick={() => router.back()} className="icon-btn text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center justify-between flex-1">
            <div>
              <h1 className="page-title">Edit Sales</h1>
              <p className="mt-1 text-gray-600">Search, select, and edit sales</p>
            </div>
            {selectedSaleIds.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-blue-100 text-blue-800 font-medium rounded-full text-sm">
                  {selectedSaleIds.size} selected
                </span>
                <button onClick={handleBulkEdit} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  Edit Selected
                </button>
                <button onClick={() => setSelectedSaleIds(new Set())} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search by Item Name</label>
            <input
              type="text" value={filters.itemName}
              onChange={(e) => setFilters((p) => ({ ...p, itemName: e.target.value }))}
              placeholder="Enter item name…"
              className="w-full px-4 py-3 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search by Customer Name</label>
            <input
              type="text" value={filters.customerName}
              onChange={(e) => setFilters((p) => ({ ...p, customerName: e.target.value }))}
              placeholder="Enter customer name…"
              className="w-full px-4 py-3 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" /> Start Date
              </label>
              <input type="date" value={filters.startDate}
                onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" /> End Date
              </label>
              <input type="date" value={filters.endDate}
                onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sale Type</label>
              <select value={filters.saleType}
                onChange={(e) => setFilters((p) => ({ ...p, saleType: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={handleSearch} disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Search className="w-4 h-4 inline-block mr-2" />
              {loading ? "Searching…" : "Search"}
            </button>
            {(filters.itemName || filters.customerName || filters.startDate || filters.endDate || filters.saleType) && (
              <button onClick={clearFilters} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Sales List */}
        {loading ? (
          <div className="bg-white shadow-sm border border-gray-200 p-16 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600">Loading…</span>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="bg-white shadow-sm border border-gray-200 p-16 text-center">
            <Receipt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales Found</h3>
            <p className="text-gray-600">Use the filters above and click Search</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            <div className="bg-gray-100 border border-gray-200 p-3 flex items-center justify-between">
              <button onClick={handleSelectAll} className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-gray-900">
                {isAllSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
              </button>
              <span className="text-sm text-gray-600">{filteredSales.length} sale(s)</span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className={`bg-white shadow-sm border-2 p-4 hover:shadow-md transition-all ${selectedSaleIds.has(sale.id) ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                >
                  <div className="flex items-start gap-4">
                    <button onClick={() => handleSelectSale(sale.id)} className="pt-1">
                      {selectedSaleIds.has(sale.id)
                        ? <CheckSquare className="w-6 h-6 text-blue-600" />
                        : <Square className="w-6 h-6 text-gray-400 hover:text-gray-600" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-xs font-medium ${getSaleTypeColor(sale.saleType)}`}>
                            {sale.saleType?.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">#{sale.id.slice(-8)}</span>
                          <span className="text-sm text-gray-400">{formatDateTime(sale.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => router.push(`/sales/${sale.id}`)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenEditModal(sale)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleViewHistory(sale.id)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors" title="History">
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mb-3 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {sale.customer?.customerName || "Unknown Customer"}
                        </span>
                      </div>
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
                            {(sale.items || []).map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-gray-900">{item.itemName}</td>
                                <td className="px-3 py-2 text-gray-600 text-right">{item.quantity}</td>
                                <td className="px-3 py-2 text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                                <td className="px-3 py-2 text-gray-900 font-medium text-right">{formatCurrency(item.quantity * item.unitPrice)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-500">{(sale.items || []).length} item(s)</span>
                        <div className="text-right">
                          <span className="text-sm text-gray-500 mr-2">Total:</span>
                          <span className="text-lg font-bold text-gray-900">{formatCurrency(sale.totalAmount)}</span>
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

      {/* Modals */}
      <BulkEditModal open={showBulkEditModal} onClose={() => setShowBulkEditModal(false)}
        selectedSales={filteredSales.filter((s) => selectedSaleIds.has(s.id))} onConfirm={handleBulkEditConfirm} />
      <EditHistoryModal open={showEditHistoryModal} onClose={() => setShowEditHistoryModal(false)} saleId={historyEntityId} />
      <ValidationWarningModal open={showValidationModal}
        onClose={() => { setShowValidationModal(false); setCurrentValidationWarning(null); setPendingBulkUpdate(null); }}
        warning={currentValidationWarning} onConfirm={handleValidationConfirm} />

      {/* Single Edit Modal */}
      <Dialog open={showEditModal} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl bg-white p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-5">Edit Sale</Dialog.Title>

            {/* Ledger impact banner */}
            {(customerChanged || (typeChanged && (editingSale?.saleType === "credit" || editForm.saleType === "credit"))) && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <span className="font-semibold">Ledger impact: </span>
                  {customerChanged && <span>Customer change moves this sale to the new customer's outstanding balance. </span>}
                  {typeChanged && editingSale?.saleType === "credit" && <span>Changing from credit to cash removes this from the customer's outstanding balance. </span>}
                  {typeChanged && editForm.saleType === "credit" && <span>Changing to credit adds this amount to the customer's outstanding balance. </span>}
                  The customer statement recalculates automatically.
                </div>
              </div>
            )}

            <form onSubmit={handleEditSale} className="space-y-5">
              {/* Customer */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Users className="w-4 h-4" /> Customer
                  {editingSale?.saleType === "credit" && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Affects ledger</span>
                  )}
                </label>
                <Select
                  options={customerOptions}
                  isLoading={loadingCustomers}
                  value={customerOptions.find((o) => o.value === editForm.customerId) || null}
                  onChange={(opt) => setEditForm((p) => ({ ...p, customerId: opt?.value || "" }))}
                  placeholder="Search customer…"
                  classNamePrefix="react-select"
                  isClearable={false}
                />
                {customerChanged && (
                  <p className="text-xs text-amber-600 mt-1">
                    Changing from: <strong>{editingSale?.customer?.customerName}</strong>
                  </p>
                )}
              </div>

              {/* Sale Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sale Type</label>
                <select
                  value={editForm.saleType}
                  onChange={(e) => setEditForm((p) => ({ ...p, saleType: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                </select>
                {typeChanged && (
                  <p className="text-xs text-amber-600 mt-1">
                    Changing from <strong>{editingSale?.saleType}</strong> → <strong>{editForm.saleType}</strong>
                  </p>
                )}
              </div>

              {/* Sale Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Calendar className="w-4 h-4" /> Sale Date
                </label>
                <input
                  type="date" value={editForm.saleDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, saleDate: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Items</label>
                  <button type="button" onClick={addEditItem}
                    className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition-colors">
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <input type="text" value={item.itemName}
                          onChange={(e) => updateEditItem(index, "itemName", e.target.value)}
                          placeholder="Item name"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 rounded"
                        />
                      </div>
                      <div className="w-20">
                        <input type="number" value={item.quantity}
                          onChange={(e) => updateEditItem(index, "quantity", parseInt(e.target.value) || 0)}
                          placeholder="Qty" min="1"
                          className="w-full px-2 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 rounded text-center"
                        />
                      </div>
                      <div className="w-28">
                        <input type="number" value={item.unitPrice}
                          onChange={(e) => updateEditItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          placeholder="Price" min="0" step="0.01"
                          className="w-full px-2 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 rounded text-right"
                        />
                      </div>
                      <div className="w-24 text-right text-sm font-medium text-gray-700">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                      <button type="button" onClick={() => removeEditItem(index)}
                        disabled={editForm.items.length === 1}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-3 flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <span className="text-sm font-medium text-gray-700">New Total</span>
                    {totalChanged && (
                      <span className="ml-2 text-xs text-gray-400 line-through">
                        was {formatCurrency(editingSale?.totalAmount || 0)}
                      </span>
                    )}
                  </div>
                  <span className={`text-xl font-bold ${totalChanged ? "text-amber-600" : "text-gray-900"}`}>
                    {formatCurrency(newTotal)}
                  </span>
                </div>

                {totalChanged && editForm.saleType === "credit" && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Total changed — the customer's outstanding balance in the ledger will reflect the new amount.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button type="button"
                  onClick={() => { setShowEditModal(false); setEditingSale(null); }}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2.5 text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ background: "#0099d6" }}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
