"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, X, Trash2, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { getInvoices, createInvoice, Invoice } from "@/services/invoiceService";
import { formatCurrency } from "@/utils/format";
import api from "@/lib/api";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "badge-gray",
  SENT: "badge-blue",
  PARTIAL: "badge-yellow",
  PAID: "badge-green",
  OVERDUE: "badge-red",
  VOID: "badge-gray",
};

const STATUSES = ["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "VOID"];

interface LineItem {
  itemName: string;
  quantity: string;
  unitPrice: string;
}

const emptyItem = (): LineItem => ({ itemName: "", quantity: "", unitPrice: "" });

const defaultForm = () => ({
  customerId: "",
  issueDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  notes: "",
  discountValue: "",
});

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; customerName: string }[]>([]);
  const [form, setForm] = useState(defaultForm());
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);

  const fetchInvoices = () => {
    setLoading(true);
    getInvoices({
      status: statusFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((data) => setInvoices(Array.isArray(data) ? data : (data.invoices ?? [])))
      .catch(() => toast.error("Failed to load invoices"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, startDate, endDate]);

  useEffect(() => {
    api
      .get("/customers/list")
      .then((res) => setCustomers(res.data))
      .catch(() => {});
  }, []);

  const totalValue = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalOutstanding = totalValue - totalPaid;

  const updateItem = (index: number, field: keyof LineItem, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce(
    (s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0),
    0
  );
  const discount = parseFloat(form.discountValue) || 0;
  const total = subtotal - discount;

  const closeModal = () => {
    setShowModal(false);
    setForm(defaultForm());
    setItems([emptyItem()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) {
      toast.error("Select a customer");
      return;
    }
    if (items.some((it) => !it.itemName || !it.quantity || !it.unitPrice)) {
      toast.error("Fill in all item fields");
      return;
    }
    setSaving(true);
    try {
      await createInvoice({
        customerId: form.customerId,
        issueDate: form.issueDate,
        dueDate: form.dueDate || undefined,
        notes: form.notes || undefined,
        discountValue: discount,
        items: items.map((it) => ({
          itemName: it.itemName,
          quantity: parseFloat(it.quantity),
          unitPrice: parseFloat(it.unitPrice),
        })),
      });
      toast.success("Invoice created");
      closeModal();
      fetchInvoices();
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <h1 className="page-title">Invoices</h1>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Invoice</span>
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <p className="text-xs text-gray-500">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalValue)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-500">Amount Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalOutstanding)}</p>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
              style={{ maxWidth: 160 }}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
              style={{ maxWidth: 160 }}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
              style={{ maxWidth: 160 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="card text-center py-12">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-3">No invoices found</p>
            <p className="text-xs text-gray-500 mt-1">Create your first invoice to get started</p>
          </div>
        ) : (
          <>
            <div className="mobile-list sm:hidden">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="mobile-list-item cursor-pointer"
                  onClick={() => router.push(`/accounting/invoices/${inv.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {inv.Customer?.customerName ?? "—"}
                      </p>
                    </div>
                    <span className={`badge ${STATUS_COLORS[inv.status] ?? "badge-gray"} flex-shrink-0`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{inv.issueDate}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(inv.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="table-wrapper hidden sm:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/accounting/invoices/${inv.id}`)}
                    >
                      <td className="font-mono text-sm">{inv.invoiceNumber}</td>
                      <td>{inv.Customer?.customerName ?? "—"}</td>
                      <td>{inv.issueDate}</td>
                      <td>{inv.dueDate ?? "—"}</td>
                      <td className="font-medium">{formatCurrency(inv.totalAmount)}</td>
                      <td>{formatCurrency(inv.paidAmount)}</td>
                      <td>{formatCurrency(inv.totalAmount - inv.paidAmount)}</td>
                      <td>
                        <span className={`badge ${STATUS_COLORS[inv.status] ?? "badge-gray"}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Create Invoice</h2>
              <button onClick={closeModal} className="icon-btn text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
                <select
                  className="input"
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  required
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Discount (₵)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Line Items *</label>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => [...prev, emptyItem()])}
                    className="btn btn-secondary"
                  >
                    <Plus className="w-3 h-3" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                    <span className="col-span-5">Item Name</span>
                    <span className="col-span-2">Qty</span>
                    <span className="col-span-3">Unit Price</span>
                    <span className="col-span-1 text-right">Total</span>
                  </div>
                  {items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          className="input"
                          placeholder="Item name"
                          value={it.itemName}
                          onChange={(e) => updateItem(i, "itemName", e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="input"
                          placeholder="Qty"
                          value={it.quantity}
                          onChange={(e) => updateItem(i, "quantity", e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input"
                          placeholder="Price"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 text-xs text-gray-600 text-right">
                        {formatCurrency(
                          (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0)
                        )}
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="icon-btn text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="input"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? "Saving..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
