"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getCustomers } from "@/services/customerService";
import { getSupplierItemsWithSales } from "@/services/supplierService";
import { recordSale } from "@/services/salesService";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Select from "react-select";
import { Dialog } from "@headlessui/react";
import { printReceiptHTML } from "@/lib/printReceipts";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Receipt,
  CreditCard,
  Banknote,
  Package,
  User,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";

type Item = {
  id: string;
  itemName: string;
  supplierName: string;
  available: number;
  unitPrice: number;
};

type CartItem = {
  id: string;
  itemName: string;
  supplierName: string;
  available: number;
  unitPrice: number;
  qty: number;
};

type CustomerOption = {
  label: string;
  value: string;
};
type Customer = {
  id: string;
  name: string;
  phone: string;
};

export default function RegularSaleComponent() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerOption | null>(null);
  const [saleType, setSaleType] = useState<"cash" | "credit">("cash");
  const [loading, setLoading] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCreditPrompt, setShowCreditPrompt] = useState(false);
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [custData, itemData] = await Promise.all([
        getCustomers(),
        getSupplierItemsWithSales(),
      ]);
      setCustomers(
        custData.map((c: Customer) => ({
          label: `${c.name} (${c.phone})`,
          value: c.id,
        }))
      );
      setItems(itemData);
    } catch {
      toast.error("Failed to load data.");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.itemName.toLowerCase().includes(search.toLowerCase()) ||
          item.supplierName.toLowerCase().includes(search.toLowerCase())
      ),
    [search, items]
  );

  const addToCart = (item: Item) => {
    const exists = cart.find((c) => c.id === item.id);
    if (exists) {
      if (exists.qty < item.available) {
        setCart((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
        );
      } else {
        toast.error("No more stock available");
      }
    } else {
      if (item.available > 0) {
        setCart((prev) => [{ ...item, qty: 1 }, ...prev]); // New on top
      } else {
        toast.error("Item is out of stock");
      }
    }
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updatePriceInCart = (id: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      setCart((prev) =>
        prev.map((i) => (i.id === id ? { ...i, unitPrice: price } : i))
      );
    }
  };

  const total = useMemo(
    () => cart.reduce((sum, i) => sum + i.qty * i.unitPrice, 0),
    [cart]
  );

  const handleConfirmSale = () => {
    if (!selectedCustomer) {
      toast.error("Select a customer first.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Cart is empty.");
      return;
    }
    setShowConfirmModal(true);
  };

  const finalizeSale = async () => {
    if (loading) return;

    if (!selectedCustomer) {
      toast.error("Select a customer first.");
      return;
    }

    if (cart.length === 0) {
      toast.error("Cart is empty.");
      return;
    }

    setShowConfirmModal(false);

    try {
      setLoading(true);

      const customerId = selectedCustomer.value;

      await recordSale({
        sourceType: "regular",
        sourceId: customerId,
        customerId,
        saleType,
        items: cart.map((item) => ({
          itemName: item.itemName,
          quantity: item.qty,
          unitPrice: item.unitPrice,
        })),
      });

      toast.success("Sale recorded");

      // Prompt user to print receipt
      setShowPrintPrompt(true);
    } catch (error) {
      toast.error("Failed to record sale");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setShowPrintPrompt(false);

    // ✅ Clone state first
    const clonedCart = [...cart];
    const clonedCustomer = selectedCustomer;

    // ✅ Trigger receipt generation with the cloned data
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

    // ✅ Then clear state
    setCart([]);

    if (saleType === "credit") {
      setShowCreditPrompt(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Regular Sales</h1>
              <p className="text-gray-600">Process sales from available inventory</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Sale Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Customer Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Customer</h3>
              </div>
              <Select
                options={customers}
                value={selectedCustomer}
                onChange={(opt) => setSelectedCustomer(opt)}
                placeholder="Search and select customer..."
                className="text-sm"
                styles={{
                  control: (base) => ({
                    ...base,
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.75rem',
                    padding: '0.25rem',
                    boxShadow: 'none',
                    '&:hover': {
                      border: '1px solid #3b82f6',
                    },
                  }),
                }}
              />
            </div>

            {/* Sale Type */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSaleType("cash")}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    saleType === "cash"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Banknote className={`w-6 h-6 mx-auto mb-2 ${
                    saleType === "cash" ? "text-green-600" : "text-gray-400"
                  }`} />
                  <div className={`text-sm font-medium ${
                    saleType === "cash" ? "text-green-700" : "text-gray-700"
                  }`}>
                    Cash Sale
                  </div>
                </button>
                <button
                  onClick={() => setSaleType("credit")}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    saleType === "credit"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <CreditCard className={`w-6 h-6 mx-auto mb-2 ${
                    saleType === "credit" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <div className={`text-sm font-medium ${
                    saleType === "credit" ? "text-blue-700" : "text-gray-700"
                  }`}>
                    Credit Sale
                  </div>
                </button>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Cart Summary</h3>
                <Badge variant="info">{cart.length} items</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₵ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total:</span>
                  <span className="text-green-600">₵ {total.toFixed(2)}</span>
                </div>
              </div>
              <button
                disabled={loading || cart.length === 0 || !selectedCustomer}
                onClick={handleConfirmSale}
                className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>

          {/* Right Column - Items and Cart */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Available Items</h3>
                  <Badge variant="default">{filteredItems.length} available</Badge>
                </div>
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search items by name or supplier..."
                  className="max-w-md"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No items found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {item.itemName}
                            </h4>
                            <p className="text-sm text-gray-600">by {item.supplierName}</p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-semibold text-gray-900">₵ {item.unitPrice.toFixed(2)}</div>
                            <Badge 
                              variant={item.available > 10 ? "success" : item.available > 0 ? "warning" : "danger"}
                              size="sm"
                            >
                              {item.available} in stock
                            </Badge>
                          </div>
                          <Plus className="w-5 h-5 text-gray-400 group-hover:text-green-500 ml-3 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Shopping Cart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Shopping Cart</h3>
                  {cart.length > 0 && (
                    <button
                      onClick={() => setCart([])}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              
              {cart.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Add items from the inventory above</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <div className="divide-y divide-gray-200">
                    {cart.map((item) => (
                      <div key={item.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.itemName}</h4>
                            <p className="text-sm text-gray-600">by {item.supplierName}</p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-sm text-gray-600">Qty: {item.qty}</div>
                            </div>
                            
                            <div className="text-center min-w-[100px]">
                              <div className="text-sm text-gray-600">Unit Price</div>
                              {isAdmin ? (
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updatePriceInCart(item.id, e.target.value)}
                                  className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  step="0.01"
                                  min="0"
                                />
                              ) : (
                                <div className="font-medium">₵ {item.unitPrice.toFixed(2)}</div>
                              )}
                            </div>
                            
                            <div className="text-right min-w-[80px]">
                              <div className="text-sm text-gray-600">Total</div>
                              <div className="font-bold text-green-600">
                                ₵ {(item.qty * item.unitPrice).toFixed(2)}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove from cart"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                Confirm Sale
              </Dialog.Title>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">Are you sure you want to finalize this sale?</p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Customer:</span>
                    <span className="font-medium">{selectedCustomer?.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Items:</span>
                    <span className="font-medium">{cart.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment:</span>
                    <span className="font-medium capitalize">{saleType}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-green-600">₵ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={finalizeSale}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  Confirm Sale
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Print Receipt Modal */}
      <Dialog
        open={showPrintPrompt}
        onClose={() => setShowPrintPrompt(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                Sale Completed!
              </Dialog.Title>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">Your sale has been successfully processed.</p>
                <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                  <Receipt className="w-5 h-5" />
                  <span className="font-medium">Would you like to print a receipt?</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setShowPrintPrompt(false);
                    if (saleType === "credit") setShowCreditPrompt(true);
                    setCart([]);
                    try {
                      const itemData = await getSupplierItemsWithSales();
                      setItems(itemData);
                    } catch {
                      toast.error("Failed to reload items.");
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  Print Receipt
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Credit Payment Modal */}
      <Dialog
        open={showCreditPrompt}
        onClose={() => setShowCreditPrompt(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-200">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
                Credit Sale Complete
              </Dialog.Title>
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  This was a credit sale. Would you like to record a payment now?
                </p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    Recording a payment now will help maintain accurate customer balances.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setShowCreditPrompt(false);
                    setSelectedCustomer(null);
                    setCart([]);
                    try {
                      const itemData = await getSupplierItemsWithSales();
                      setItems(itemData);
                    } catch {
                      toast.error("Failed to reload items.");
                    }
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Record Later
                </button>
                <button
                  onClick={() => {
                    if (selectedCustomer) {
                      router.push(`/customers/${selectedCustomer.value}/payments`);
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
