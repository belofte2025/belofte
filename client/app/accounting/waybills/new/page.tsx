"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Truck, Search, Trash2, FileText, Link2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { createWaybill } from "@/services/waybillService";
import { getInvoice } from "@/services/invoiceService";
import { getSupplierItemsWithSales } from "@/services/supplierService";
import Select from "react-select";
import toast from "react-hot-toast";

type SupplierItem = {
  id: string;
  itemName: string;
  alias?: string | null;
  supplierName: string;
  available: number;
  unitPrice: number;
};

type CartEntry = { itemName: string; supplierName: string; quantity: number; unit: string };
type CustomerOption = { label: string; value: string };

function NewWaybillInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromInvoiceId = searchParams.get("fromInvoice");

  const [allItems, setAllItems] = useState<SupplierItem[]>([]);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveredTo, setDeliveredTo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [fromInvoiceNumber, setFromInvoiceNumber] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get("/customers/list"), getSupplierItemsWithSales()])
      .then(([custRes, itemData]) => {
        const customerOpts: CustomerOption[] = custRes.data.map((c: any) => ({
          label: c.customerName,
          value: c.id,
        }));
        setCustomers(customerOpts);
        setAllItems(itemData);

        if (fromInvoiceId) {
          getInvoice(fromInvoiceId)
            .then((invoice) => {
              setFromInvoiceNumber(invoice.invoiceNumber);
              if (invoice.customerId) {
                const match = customerOpts.find((c) => c.value === invoice.customerId);
                if (match) setSelectedCustomer(match);
              }
              if (invoice.Items && invoice.Items.length > 0) {
                setCart(
                  invoice.Items.map((item) => ({
                    itemName: item.itemName,
                    supplierName: "",
                    quantity: item.quantity,
                    unit: "",
                  }))
                );
              }
              if (invoice.Customer?.customerName) {
                setDeliveredTo(invoice.Customer.customerName);
              }
            })
            .catch(() => toast.error("Could not load invoice details"));
        }
      })
      .catch(() => toast.error("Failed to load data"));
  }, [fromInvoiceId]);

  const filteredItems = useMemo(
    () =>
      allItems.filter(
        (item) =>
          item.itemName.toLowerCase().includes(search.toLowerCase()) ||
          item.supplierName.toLowerCase().includes(search.toLowerCase()) ||
          (item.alias && item.alias.toLowerCase().includes(search.toLowerCase()))
      ),
    [allItems, search]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, SupplierItem[]>();
    for (const item of filteredItems) {
      const list = map.get(item.supplierName) ?? [];
      map.set(item.supplierName, [...list, item]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  const addItem = (item: SupplierItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemName === item.itemName);
      if (existing) {
        return prev.map((c) =>
          c.itemName === item.itemName ? { ...c, quantity: c.quantity + 1, supplierName: item.supplierName } : c
        );
      }
      return [...prev, { itemName: item.itemName, supplierName: item.supplierName, quantity: 1, unit: "" }];
    });
  };

  const updateCart = (idx: number, field: "quantity" | "unit", value: string) => {
    setCart((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        if (field === "quantity") {
          const n = parseInt(value);
          return { ...c, quantity: isNaN(n) || n < 1 ? 1 : n };
        }
        return { ...c, unit: value };
      })
    );
  };

  const removeFromCart = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error("Add at least one item"); return; }
    setSaving(true);
    try {
      await createWaybill({
        customerId: selectedCustomer?.value || undefined,
        issueDate,
        deliveryDate: deliveryDate || undefined,
        deliveredTo: deliveredTo || undefined,
        driverName: driverName || undefined,
        vehicleNo: vehicleNo || undefined,
        notes: notes || undefined,
        items: cart.map((c) => ({ itemName: c.itemName, quantity: c.quantity, unit: c.unit || undefined })),
      });
      toast.success("Waybill created");
      router.push("/accounting/waybills");
    } catch {
      toast.error("Failed to create waybill");
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/accounting/waybills" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Waybill</h1>
              <p className="text-sm text-gray-500">Create a delivery waybill</p>
            </div>
          </div>

          {fromInvoiceNumber && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium" style={{ background: "#e0f7ff", borderColor: "#0099d6", color: "#005a8c" }}>
              <Link2 className="w-4 h-4 flex-shrink-0" style={{ color: "#0099d6" }} />
              Pre-filled from Invoice <span className="font-mono font-bold">{fromInvoiceNumber}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Customer */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer</h3>
                <Select
                  options={customers}
                  value={selectedCustomer}
                  onChange={(opt) => setSelectedCustomer(opt)}
                  placeholder="Select customer (optional)..."
                  isClearable
                  className="text-sm"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      border: state.isFocused ? "1px solid #0099d6" : "1px solid #e5e7eb",
                      borderRadius: "0.5rem",
                      boxShadow: state.isFocused ? "0 0 0 3px rgba(0,174,239,0.15)" : "none",
                      "&:hover": { border: "1px solid #0099d6" },
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? "#0099d6" : state.isFocused ? "#e0f7ff" : "white",
                      color: state.isSelected ? "white" : "#111827",
                    }),
                  }}
                />
              </div>

              {/* Delivery details */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Delivery Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date *</label>
                    <input type="date" className="input" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Date</label>
                    <input type="date" className="input" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Delivered To</label>
                  <input type="text" className="input" value={deliveredTo} onChange={(e) => setDeliveredTo(e.target.value)} placeholder="Recipient name or address" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Driver</label>
                    <input type="text" className="input" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Vehicle #</label>
                    <input type="text" className="input" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              {/* Items list */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Waybill Lines</h3>
                  <span className="badge badge-blue">{cart.length} items</span>
                </div>

                {cart.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Click items on the right to add them</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {cart.map((entry, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{entry.itemName}</p>
                            {entry.supplierName && (
                              <p className="text-xs text-gray-500 truncate">{entry.supplierName}</p>
                            )}
                          </div>
                          <button onClick={() => removeFromCart(idx)} className="text-gray-400 hover:text-red-500 flex-shrink-0 p-0.5">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Qty</label>
                            <input
                              type="number" min="1" step="1" className="input text-xs py-1"
                              value={entry.quantity} onChange={(e) => updateCart(idx, "quantity", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">Unit</label>
                            <input
                              type="text" className="input text-xs py-1" placeholder="e.g. bags"
                              value={entry.unit} onChange={(e) => updateCart(idx, "unit", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={saving || cart.length === 0}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#0099d6" }}
                >
                  <Truck className="w-4 h-4" />
                  {saving ? "Creating..." : "Create Waybill"}
                </button>
              </div>
            </div>

            {/* Right — item search grouped by supplier */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items by name, alias, or supplier..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-9"
                  />
                </div>

                {grouped.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No items found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {grouped.map(([supplierName, items]) => (
                      <div key={supplierName}>
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#0099d6" }}>
                            {supplierName}
                          </p>
                          <span className="text-xs text-gray-400">({items.length})</span>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                          {items.map((item) => {
                            const inCart = cart.find((c) => c.itemName === item.itemName);
                            return (
                              <button
                                key={item.id}
                                onClick={() => addItem(item)}
                                className={`text-left p-3 rounded-xl border-2 transition-all ${
                                  inCart
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                }`}
                              >
                                <p className="text-sm font-semibold text-gray-900 truncate">{item.itemName}</p>
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className={`text-xs font-medium ${item.available > 0 ? "text-green-600" : "text-red-500"}`}>
                                    {item.available > 0 ? `${item.available} in stock` : "Out of stock"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-end mt-1">
                                  {inCart ? (
                                    <span className="text-xs text-white rounded-full px-2 py-0.5 font-medium" style={{ background: "#0099d6" }}>
                                      ×{inCart.quantity}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">tap to add</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewWaybillPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    }>
      <NewWaybillInner />
    </Suspense>
  );
}
