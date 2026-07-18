"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, X, Trash2, Printer, Truck } from "lucide-react";
import {
  getWaybills,
  createWaybill,
  updateWaybillStatus,
  Waybill,
} from "@/services/waybillService";
import api from "@/lib/api";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "badge-yellow",
  IN_TRANSIT: "badge-blue",
  DELIVERED: "badge-green",
  CANCELLED: "badge-red",
};

const STATUSES = ["PENDING", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

interface WaybillItemRow {
  itemName: string;
  quantity: string;
  unit: string;
}

const emptyItemRow = (): WaybillItemRow => ({ itemName: "", quantity: "", unit: "" });

const defaultForm = () => ({
  customerId: "",
  issueDate: new Date().toISOString().split("T")[0],
  deliveryDate: "",
  deliveredTo: "",
  driverName: "",
  vehicleNo: "",
  notes: "",
});

export default function WaybillsPage() {
  const [waybills, setWaybills] = useState<Waybill[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<{ id: string; customerName: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [items, setItems] = useState<WaybillItemRow[]>([emptyItemRow()]);
  const [saving, setSaving] = useState(false);
  const [printWaybill, setPrintWaybill] = useState<Waybill | null>(null);

  const fetchWaybills = () => {
    setLoading(true);
    getWaybills()
      .then((data) => setWaybills(Array.isArray(data) ? data : (data.waybills ?? [])))
      .catch(() => toast.error("Failed to load waybills"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWaybills();
    api
      .get("/customers/list")
      .then((res) => setCustomers(res.data))
      .catch(() => {});
  }, []);

  const updateItem = (index: number, field: keyof WaybillItemRow, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await updateWaybillStatus(id, status);
      setWaybills((prev) => prev.map((w) => (w.id === id ? updated : w)));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(defaultForm());
    setItems([emptyItemRow()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((it) => !it.itemName || !it.quantity)) {
      toast.error("Fill in item name and quantity for all rows");
      return;
    }
    setSaving(true);
    try {
      await createWaybill({
        customerId: form.customerId || undefined,
        issueDate: form.issueDate,
        deliveryDate: form.deliveryDate || undefined,
        deliveredTo: form.deliveredTo || undefined,
        driverName: form.driverName || undefined,
        vehicleNo: form.vehicleNo || undefined,
        notes: form.notes || undefined,
        items: items.map((it) => ({
          itemName: it.itemName,
          quantity: parseFloat(it.quantity),
          unit: it.unit || undefined,
        })),
      });
      toast.success("Waybill created");
      closeModal();
      fetchWaybills();
    } catch {
      toast.error("Failed to create waybill");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .waybill-print-area, .waybill-print-area * { visibility: visible; }
          .waybill-print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 40px;
          }
        }
      `}</style>

      <div className="space-y-4">
        <div className="page-header">
          <h1 className="page-title">Waybills</h1>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Waybill</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading...</span>
          </div>
        ) : waybills.length === 0 ? (
          <div className="card text-center py-12">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mt-3">No waybills found</p>
            <p className="text-xs text-gray-500 mt-1">Create your first waybill</p>
          </div>
        ) : (
          <>
            <div className="mobile-list sm:hidden">
              {waybills.map((wb) => (
                <div
                  key={wb.id}
                  className="mobile-list-item cursor-pointer"
                  onClick={() => setPrintWaybill(wb)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{wb.waybillNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {wb.Customer?.customerName ?? "No customer"}
                      </p>
                    </div>
                    <select
                      className="input text-xs"
                      style={{ maxWidth: 120, padding: "2px 6px" }}
                      value={wb.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(wb.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{wb.issueDate}</span>
                    {wb.deliveredTo && (
                      <span className="text-xs text-gray-500">To: {wb.deliveredTo}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="table-wrapper hidden sm:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Waybill #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Delivery Date</th>
                    <th>Delivered To</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {waybills.map((wb) => (
                    <tr
                      key={wb.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setPrintWaybill(wb)}
                    >
                      <td className="font-mono text-sm">{wb.waybillNumber}</td>
                      <td>{wb.Customer?.customerName ?? "—"}</td>
                      <td>{wb.issueDate}</td>
                      <td>{wb.deliveryDate ?? "—"}</td>
                      <td>{wb.deliveredTo ?? "—"}</td>
                      <td>
                        <select
                          className="input text-xs"
                          style={{ maxWidth: 130, padding: "3px 6px" }}
                          value={wb.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(wb.id, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintWaybill(wb);
                          }}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
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
              <h2 className="text-sm font-semibold text-gray-900">New Waybill</h2>
              <button onClick={closeModal} className="icon-btn text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Customer</label>
                  <select
                    className="input"
                    value={form.customerId}
                    onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  >
                    <option value="">No customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customerName}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    className="input"
                    value={form.deliveryDate}
                    onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Delivered To</label>
                  <input
                    type="text"
                    className="input"
                    value={form.deliveredTo}
                    onChange={(e) => setForm({ ...form, deliveredTo: e.target.value })}
                    placeholder="Recipient name or address"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    className="input"
                    value={form.driverName}
                    onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle #</label>
                  <input
                    type="text"
                    className="input"
                    value={form.vehicleNo}
                    onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Items *</label>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => [...prev, emptyItemRow()])}
                    className="btn btn-secondary"
                  >
                    <Plus className="w-3 h-3" />
                    Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                    <span className="col-span-6">Item Name</span>
                    <span className="col-span-2">Qty</span>
                    <span className="col-span-3">Unit</span>
                  </div>
                  {items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
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
                          type="text"
                          className="input"
                          placeholder="Unit (optional)"
                          value={it.unit}
                          onChange={(e) => updateItem(i, "unit", e.target.value)}
                        />
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

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? "Saving..." : "Create Waybill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printWaybill && (
        <>
          <div className="waybill-print-area" style={{ display: "none" }}>
            <div
              style={{
                maxWidth: 700,
                margin: "0 auto",
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                color: "#111827",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 32,
                }}
              >
                <div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
                    PETROS
                  </h1>
                  <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>
                    Delivery Waybill
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1d4ed8" }}>
                    WAYBILL
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>
                    {printWaybill.waybillNumber}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 6,
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: "#f3f4f6",
                      color: "#374151",
                    }}
                  >
                    {printWaybill.status}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 24,
                  marginBottom: 32,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#9ca3af",
                      letterSpacing: 1,
                      marginBottom: 6,
                      textTransform: "uppercase",
                    }}
                  >
                    Customer
                  </p>
                  <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>
                    {printWaybill.Customer?.customerName ?? "—"}
                  </p>
                  {printWaybill.deliveredTo && (
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                      Delivered To: {printWaybill.deliveredTo}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                      ISSUE DATE:{" "}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {printWaybill.issueDate}
                    </span>
                  </div>
                  {printWaybill.deliveryDate && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                        DELIVERY DATE:{" "}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {printWaybill.deliveryDate}
                      </span>
                    </div>
                  )}
                  {printWaybill.driverName && (
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                        DRIVER:{" "}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {printWaybill.driverName}
                      </span>
                    </div>
                  )}
                  {printWaybill.vehicleNo && (
                    <div>
                      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                        VEHICLE:{" "}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {printWaybill.vehicleNo}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: 24,
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#1d4ed8", color: "white" }}>
                    <th
                      style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 600 }}
                    >
                      Item Description
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontSize: 11,
                        fontWeight: 600,
                        width: 80,
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        padding: "10px 12px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        width: 80,
                      }}
                    >
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {printWaybill.Items?.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}
                    >
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid #f3f4f6" }}>
                        {item.itemName}
                      </td>
                      <td
                        style={{
                          padding: "9px 12px",
                          textAlign: "right",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid #f3f4f6" }}>
                        {item.unit ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {printWaybill.notes && (
                <div
                  style={{
                    marginBottom: 24,
                    padding: 16,
                    background: "#f9fafb",
                    borderRadius: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#9ca3af",
                      letterSpacing: 1,
                      marginBottom: 6,
                      textTransform: "uppercase",
                    }}
                  >
                    Notes
                  </p>
                  <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>
                    {printWaybill.notes}
                  </p>
                </div>
              )}

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}
              >
                <div
                  style={{
                    borderTop: "1px solid #111827",
                    paddingTop: 8,
                    textAlign: "center",
                    fontSize: 12,
                  }}
                >
                  <p style={{ color: "#9ca3af", margin: 0 }}>Received By / Signature</p>
                </div>
                <div
                  style={{
                    borderTop: "1px solid #111827",
                    paddingTop: 8,
                    textAlign: "center",
                    fontSize: 12,
                  }}
                >
                  <p style={{ color: "#9ca3af", margin: 0 }}>Driver / Authorized By</p>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: 16,
                  textAlign: "center",
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                Developed by EYO Solutions Ghana · 0246462398
              </div>
            </div>
          </div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {printWaybill.waybillNumber}
                  </h2>
                  <span
                    className={`badge ${STATUS_COLORS[printWaybill.status] ?? "badge-gray"}`}
                  >
                    {printWaybill.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={() => setPrintWaybill(null)}
                    className="icon-btn text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Customer</p>
                    <p className="text-sm font-medium text-gray-900">
                      {printWaybill.Customer?.customerName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Issue Date</p>
                    <p className="text-sm font-medium text-gray-900">{printWaybill.issueDate}</p>
                  </div>
                  {printWaybill.deliveredTo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Delivered To</p>
                      <p className="text-sm font-medium text-gray-900">{printWaybill.deliveredTo}</p>
                    </div>
                  )}
                  {printWaybill.deliveryDate && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Delivery Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {printWaybill.deliveryDate}
                      </p>
                    </div>
                  )}
                  {printWaybill.driverName && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Driver</p>
                      <p className="text-sm font-medium text-gray-900">{printWaybill.driverName}</p>
                    </div>
                  )}
                  {printWaybill.vehicleNo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Vehicle #</p>
                      <p className="text-sm font-medium text-gray-900">{printWaybill.vehicleNo}</p>
                    </div>
                  )}
                </div>

                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printWaybill.Items?.map((item) => (
                        <tr key={item.id}>
                          <td>{item.itemName}</td>
                          <td>{item.quantity}</td>
                          <td>{item.unit ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {printWaybill.notes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{printWaybill.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
