"use client";

import { useEffect, useMemo, useState } from "react";
import { getContainerItemsWithSales } from "@/services/containerService";
import { getCustomers } from "@/services/customerService";
import { recordSale } from "@/services/salesService";
import { toast } from "react-hot-toast";
import Select from "react-select";
import { useParams, useRouter } from "next/navigation";
import { Dialog } from "@headlessui/react";
import { printReceiptHTML } from "@/lib/printReceipts";

type SaleItem = {
  id: string;
  itemName: string;
  supplierName: string;
  remainingQty: number;
  unitPrice: number;
  containerNo: string;
};

type CartItem = {
  id: string;
  itemName: string;
  supplierName: string;
  remainingQty: number;
  unitPrice: number;
  qty: number; // ✅ Required in CartItem
};

type Customer = {
  id: string;
  name: string;
  phone: string;
};

type CustomerOption = {
  label: string;
  value: string;
};

export default function ContainerSalesForm() {
  const { id: containerId } = useParams();
  const router = useRouter();

  const [items, setItems] = useState<SaleItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerOption | null>(null);
  const [saleType, setSaleType] = useState<"cash" | "credit">("cash");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [containerNo, setContainerNo] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);
  const [showCreditPrompt, setShowCreditPrompt] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [itemData, customerData] = await Promise.all([
          getContainerItemsWithSales(containerId as string),
          getCustomers(),
        ]);
        setItems(itemData);
        setCustomers(
          customerData.map((c: Customer) => ({
            label: `${c.name} (${c.phone})`,
            value: c.id,
          }))
        );
        containerno(itemData);
      } catch {
        toast.error("Failed to load sales data");
      }
    })();
  }, [containerId]);

  const containerno = (data: SaleItem[]) => {
    if (data.length > 0) {
      setContainerNo(data[0].containerNo);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.itemName.toLowerCase().includes(search.toLowerCase()) ||
        i.supplierName.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const addToCart = (item: Omit<CartItem, "qty">) => {
    const exists = cart.find((c) => c.id === item.id);
    if (exists) {
      if (exists.qty < item.remainingQty) {
        setCart((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
        );
      } else {
        toast.error("Insufficient stock");
      }
    } else if (item.remainingQty > 0) {
      setCart((prev) => [{ ...item, qty: 1 }, ...prev]); // ✅ now qty is added
    } else {
      toast.error("Item is out of stock");
    }
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const total = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  }, [cart]);

  const handleConfirm = () => {
    if (!selectedCustomer) return toast.error("Select a customer first");
    if (cart.length === 0) return toast.error("No items selected");
    setShowConfirmModal(true);
  };

  const finalize = async () => {
    if (loading) return;
    setShowConfirmModal(false);
    try {
      setLoading(true);
      await recordSale({
        sourceType: "container",
        sourceId: containerId,
        customerId: selectedCustomer?.value,
        saleType,
        items: cart.map((i) => ({
          itemName: i.itemName,
          quantity: i.qty,
          unitPrice: i.unitPrice,
        })),
      });
      toast.success("Sale recorded");
      setShowPrintPrompt(true);
    } catch {
      toast.error("Failed to record sale");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setShowPrintPrompt(false);
    const clonedCart = [...cart];
    const clonedCustomer = selectedCustomer;

    printReceiptHTML({
      customer: clonedCustomer?.label || "N/A",
      items: clonedCart.map((i) => ({
        itemName: i.itemName,
        qty: i.qty,
        unitPrice: i.unitPrice,
      })),
      total,
      saleType,
    });

    setCart([]);
    if (saleType === "credit") setShowCreditPrompt(true);
  };

  const reloadItems = async () => {
    try {
      const itemData = await getContainerItemsWithSales(containerId as string);
      setItems(itemData);
    } catch {
      toast.error("Failed to reload items");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 border-b border-blue-700 rounded-lg shadow-md bg-white overflow-x-hidden">
      <h1 className="text-2xl font-bold text-blue-700">
        Container Sale : 📦 {containerNo}
      </h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Customer</label>
          <Select
            options={customers}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="Select customer"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Sale Type</label>
          <div className="flex gap-3">
            {["cash", "credit"].map((type) => (
              <button
                key={type}
                onClick={() => setSaleType(type as "cash" | "credit")}
                className={`px-4 py-2 rounded ${
                  saleType === type
                    ? "bg-blue-700 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search item..."
        className="w-full sm:w-1/2 border border-gray-100 rounded px-3 py-2 text-sm mb-3"
      />

      {/* Item List Table */}
      <div className="border-t rounded overflow-y-auto max-h-56">
        <table className="w-full text-sm">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Supplier</th>
              <th className="px-4 py-2">Available</th>
              <th className="px-4 py-2">Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                onClick={() => addToCart(item)}
                className="cursor-pointer hover:bg-blue-50 border-t"
              >
                <td className="px-4 py-2">{item.itemName}</td>
                <td className="px-4 py-2">{item.supplierName}</td>
                <td className="px-4 py-2">{item.remainingQty}</td>
                <td className="px-4 py-2">₵ {item.unitPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cart Table */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">Item Cart</h3>
        {cart.length === 0 ? (
          <p className="text-sm text-gray-500">No items selected...</p>
        ) : (
          <div className="overflow-y-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Qty</th>
                  <th className="px-4 py-2">Unit Price</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">{item.itemName}</td>
                    <td className="px-4 py-2">{item.qty}</td>
                    <td className="px-4 py-2">₵ {item.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      ₵ {(item.qty * item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:underline text-sm"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-right font-bold text-lg text-blue-700">
          Total: ₵ {total.toFixed(2)}
        </div>

        <button
          disabled={loading}
          onClick={handleConfirm}
          className="mt-4 px-6 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Finalize Sale"}
        </button>
      </div>

      {/* Confirm Modal */}
      <Dialog
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="fixed z-50 inset-0"
      >
        <div className="flex items-center justify-center min-h-screen bg-black/50 px-4">
          <Dialog.Panel className="bg-white rounded max-w-sm w-full p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">
              Confirm Sale
            </Dialog.Title>
            <p>Are you sure you want to complete this sale?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-sm px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={finalize}
                className="text-sm px-4 py-2 bg-blue-700 text-white rounded"
              >
                Confirm
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Print Modal */}
      <Dialog
        open={showPrintPrompt}
        onClose={() => setShowPrintPrompt(false)}
        className="fixed z-50 inset-0"
      >
        <div className="flex items-center justify-center min-h-screen bg-black/50 px-4">
          <Dialog.Panel className="bg-white rounded max-w-sm w-full p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">
              Print Receipt
            </Dialog.Title>
            <p>Do you want to print the receipt?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={async () => {
                  setShowPrintPrompt(false);
                  if (saleType === "credit") setShowCreditPrompt(true);
                  await reloadItems();
                  setCart([]);
                }}
                className="text-sm px-4 py-2 bg-gray-200 rounded"
              >
                Skip
              </button>
              <button
                onClick={handlePrint}
                className="text-sm px-4 py-2 bg-blue-700 text-white rounded"
              >
                Print
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Credit Prompt */}
      <Dialog
        open={showCreditPrompt}
        onClose={() => setShowCreditPrompt(false)}
        className="fixed z-50 inset-0"
      >
        <div className="flex items-center justify-center min-h-screen bg-black/50 px-4">
          <Dialog.Panel className="bg-white rounded max-w-sm w-full p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">
              Record Payment?
            </Dialog.Title>
            <p>Would you like to record a payment for this credit sale now?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={async () => {
                  setShowCreditPrompt(false);
                  setSelectedCustomer(null);
                  await reloadItems();
                }}
                className="text-sm px-4 py-2 bg-gray-200 rounded"
              >
                Later
              </button>
              <button
                onClick={() => {
                  if (selectedCustomer) {
                    router.push(
                      `/customers/${selectedCustomer.value}/payments`
                    );
                  }
                }}
                className="text-sm px-4 py-2 bg-blue-700 text-white rounded"
              >
                Record Payment
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
