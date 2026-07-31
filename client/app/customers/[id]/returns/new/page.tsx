"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { createCustomerReturn } from "@/services/customerReturnService";
import { getCustomerById } from "@/services/customerService";
import { getSalesByCustomerId } from "@/services/salesService";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";

type LineItem = { itemName: string; quantity: number; unitPrice: number };

type Sale = {
  id: string;
  saleDate: string;
  totalAmount: number;
  saleType: string;
  items: { itemName: string; quantity: number; unitPrice: number }[];
};

export default function NewCustomerReturnPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customerName, setCustomerName] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ itemName: "", quantity: 1, unitPrice: 0 }]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCustomerById(customerId), getSalesByCustomerId(customerId)])
      .then(([cust, salesData]) => {
        setCustomerName(cust.customerName || cust.name || "Customer");
        setSales(salesData || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  // When a sale is selected, pre-populate items from that sale
  const handleSaleSelect = (saleId: string) => {
    setSelectedSaleId(saleId);
    if (!saleId) {
      setItems([{ itemName: "", quantity: 1, unitPrice: 0 }]);
      return;
    }
    const sale = sales.find((s) => s.id === saleId);
    if (sale?.items?.length) {
      setItems(sale.items.map((i) => ({ itemName: i.itemName, quantity: i.quantity, unitPrice: i.unitPrice })));
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { itemName: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const valid = items.every((i) => i.itemName.trim() && i.quantity > 0 && i.unitPrice >= 0) && total > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) { toast.error("Please fill in all item fields"); return; }
    setSubmitting(true);
    try {
      await createCustomerReturn({
        customerId,
        saleId: selectedSaleId || undefined,
        note: note.trim() || undefined,
        items: items.map((i) => ({ itemName: i.itemName.trim(), quantity: i.quantity, unitPrice: i.unitPrice })),
      });
      toast.success("Return recorded");
      router.push(`/customers/${customerId}/returns`);
    } catch {
      toast.error("Failed to record return");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Link href={`/customers/${customerId}/returns`} className="text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-gray-500" />
              New Return
            </h1>
            <p className="text-sm text-gray-500">{customerName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Link to a past sale (optional) */}
          {sales.length > 0 && (
            <div className="card space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Link to a Sale (optional)</h2>
              <select
                className="input w-full"
                value={selectedSaleId}
                onChange={(e) => handleSaleSelect(e.target.value)}
              >
                <option value="">— Select a sale to pre-fill items —</option>
                {sales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {format(new Date(s.saleDate), "MMM d, yyyy")} · {formatCurrency(s.totalAmount)} · {s.saleType}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400">Selecting a sale pre-fills the items below. You can adjust quantities.</p>
            </div>
          )}

          {/* Items */}
          <div className="card space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Returned Items</h2>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    className="input col-span-5"
                    placeholder="Item name"
                    value={item.itemName}
                    onChange={(e) => updateItem(index, "itemName", e.target.value)}
                    required
                  />
                  <input
                    type="number"
                    className="input col-span-2"
                    placeholder="Qty"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    required
                  />
                  <input
                    type="number"
                    className="input col-span-4"
                    placeholder="Unit price"
                    min={0}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="icon-btn text-red-500 disabled:opacity-30 col-span-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addItem} className="btn btn-secondary text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add item
            </button>

            {/* Total */}
            <div className="flex justify-between items-center border-t pt-3 mt-2">
              <span className="text-sm font-semibold text-gray-600">Return Total</span>
              <span className="text-lg font-bold text-red-600">−{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Note */}
          <div className="card space-y-2">
            <label className="text-sm font-semibold text-gray-700">Note (optional)</label>
            <textarea
              className="input w-full resize-none"
              rows={2}
              placeholder="Reason for return..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Warning */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            Recording this return will reduce {customerName}&apos;s balance by {formatCurrency(total)}.
          </div>

          <div className="flex gap-3">
            <Link href={`/customers/${customerId}/returns`} className="btn btn-secondary flex-1 text-center">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary flex-1" disabled={submitting || !valid}>
              {submitting ? "Saving..." : "Record Return"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
