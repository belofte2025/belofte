"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { getContainerItemsWithSales, getContainerById } from "@/services/containerService";
import { getCustomers } from "@/services/customerService";
import { recordSale } from "@/services/salesService";
import PaymentMethodSelector, { PaymentMethod } from "./PaymentMethodSelector";
import { toast } from "@/lib/toast";
import Select from "react-select";
import { useParams, useRouter } from "next/navigation";
import { Dialog } from "@headlessui/react";
import { printReceiptHTML } from "@/lib/printReceipts";
import { usePermissions } from "@/hooks/usePermissions";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CreditCard,
  Package,
  User,
  CheckCircle,
  AlertCircle,
  Calendar,
  UserPlus,
  X,
  Lock,
  Container as ContainerIcon,
  Percent,
  DollarSign,
} from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import CustomerForm from "@/components/pages/customers/CustomerForm";

type Item = {
  id: string;
  itemName: string;
  alias?: string | null;
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
  qty: number;
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
  const { hasPermission } = usePermissions();
  const canEditPrice = hasPermission("sales.edit_price");

  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerOption | null>(null);
  const [saleType, setSaleType] = useState<"cash" | "credit">("cash");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [amountPaid, setAmountPaid] = useState(0);
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [containerNo, setContainerNo] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<"percentage" | "amount" | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [containerStatus, setContainerStatus] = useState<string>("loading");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);
  const [showCreditPrompt, setShowCreditPrompt] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const PRE_WAREHOUSE = ["Pending", "Shipped", "Arrived"];
  // "loading" sentinel keeps the form blocked until we know the actual status
  const isPreWarehouse = containerStatus === "loading" || PRE_WAREHOUSE.includes(containerStatus);

  const fetchData = useCallback(async () => {
    try {
      const [itemData, customerData, containerData] = await Promise.all([
        getContainerItemsWithSales(containerId as string),
        getCustomers(),
        getContainerById(containerId as string),
      ]);
      setItems(itemData);
      setContainerStatus(containerData?.status ?? null);
      setCustomers(
        customerData.map((c: Customer) => ({
          label: `${c.name} (${c.phone})`,
          value: c.id,
        }))
      );
      if (itemData.length > 0) {
        setContainerNo(itemData[0].containerNo);
      }
    } catch {
      toast.error("Failed to load data.");
    }
  }, [containerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.itemName.toLowerCase().includes(search.toLowerCase()) ||
        i.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        (i.alias && i.alias.toLowerCase().includes(search.toLowerCase()))
    );
  }, [items, search]);

  const addToCart = (item: Item) => {
    const exists = cart.find((c) => c.id === item.id);
    if (exists) {
      if (exists.qty < item.remainingQty) {
        setCart((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
        );
      } else {
        toast.error("No more stock available");
      }
    } else {
      if (item.remainingQty > 0) {
        setCart((prev) => [{ ...item, qty: 1 }, ...prev]);
      } else {
        toast.error("Item is out of stock");
      }
    }
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const increaseQty = (id: string) => {
    const item = cart.find((c) => c.id === id);
    if (item && item.qty < item.remainingQty) {
      setCart((prev) =>
        prev.map((c) => (c.id === id ? { ...c, qty: c.qty + 1 } : c))
      );
    } else {
      toast.error("No more stock available");
    }
  };

  const decreaseQty = (id: string) => {
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, qty: Math.max(1, c.qty - 1) } : c))
    );
  };

  const updatePriceInCart = (id: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      setCart((prev) =>
        prev.map((i) => (i.id === id ? { ...i, unitPrice: price } : i))
      );
    }
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.qty * i.unitPrice, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    if (!discountType || discountValue <= 0) return 0;
    if (discountType === "percentage") {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  }, [discountType, discountValue, subtotal]);

  const total = useMemo(
    () => Math.max(0, subtotal - discountAmount),
    [subtotal, discountAmount]
  );

  const handleConfirmSale = () => {
    if (isPreWarehouse) {
      toast.error("Container has not yet arrived at the warehouse.");
      return;
    }
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
        sourceType: "container",
        sourceId: containerId,
        customerId,
        saleType,
        // On a credit sale the method describes how the down payment arrived
        paymentMethod: saleType === "cash" || amountPaid > 0 ? paymentMethod : undefined,
        amountPaid: saleType === "credit" ? amountPaid : undefined,
        saleDate,
        discountType: discountType,
        discountValue: discountValue,
        items: cart.map((item) => ({
          itemName: item.itemName,
          quantity: item.qty,
          unitPrice: item.unitPrice,
        })),
      });

      toast.success("Sale recorded");
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

    const clonedCart = [...cart];
    const clonedCustomer = selectedCustomer;

    printReceiptHTML({
      customer: clonedCustomer?.label || "N/A",
      items: clonedCart.map((i) => ({
        itemName: i.itemName,
        qty: i.qty,
        unitPrice: i.unitPrice,
      })),
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      total,
      saleType,
    });

    setCart([]);
    setDiscountType(null);
    setDiscountValue(0);

    if (saleType === "credit") {
      setShowCreditPrompt(true);
    }
  };

  const handleCustomerModalClose = async () => {
    setShowCustomerModal(false);
    try {
      const custData = await getCustomers();
      setCustomers(
        custData.map((c: Customer) => ({
          label: `${c.name} (${c.phone})`,
          value: c.id,
        }))
      );
    } catch {
      toast.error("Failed to reload customers.");
    }
  };

  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-7xl">
        {/* Pre-warehouse banner */}
        {containerStatus !== "loading" && isPreWarehouse && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Container not yet at warehouse</p>
              <p className="text-xs text-amber-700 mt-0.5">
                This container is currently <strong>{containerStatus}</strong>. Sales will be available once it is marked as Received.
              </p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-800">
              <ContainerIcon className="size-5" />
            </div>
            <div>
              <h1 className="page-title">
                Container Sales
              </h1>
              <p className="text-gray-600">
                {containerNo
                  ? `Container: ${containerNo}`
                  : "Process sales from container inventory"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(295px,1fr)_minmax(0,1.8fr)] xl:items-start">
          {/* Left Column - Sale Configuration */}
          <div className="min-w-0 space-y-3">
            {/* Sale Date */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Sale Date</h3>
              </div>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Customer Selection */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Customer</h3>
                </div>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Add new customer"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
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
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.75rem",
                    padding: "0.25rem",
                    boxShadow: "none",
                    "&:hover": {
                      border: "1px solid #3b82f6",
                    },
                  }),
                }}
              />
            </div>

            {/* Sale Type */}
            <PaymentMethodSelector
              saleType={saleType}
              setSaleType={setSaleType}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              amountPaid={amountPaid}
              setAmountPaid={setAmountPaid}
              total={total}
            />

            {/* Cart Summary */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Cart Summary</h3>
                <Badge variant="info">{cart.length} items</Badge>
              </div>

              {/* Discount Section */}
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Percent className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Apply Discount</span>
                </div>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setDiscountType(discountType === "percentage" ? null : "percentage")}
                    className={`flex-1 p-2 rounded border-2 text-sm font-medium transition-all ${
                      discountType === "percentage"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Percent className="w-4 h-4 inline mr-1" />
                    Percentage
                  </button>
                  <button
                    onClick={() => setDiscountType(discountType === "amount" ? null : "amount")}
                    className={`flex-1 p-2 rounded border-2 text-sm font-medium transition-all ${
                      discountType === "amount"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Fixed Amount
                  </button>
                </div>
                {discountType && (
                  <div className="relative">
                    <input
                      type="number"
                      value={discountValue || ""}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      placeholder={discountType === "percentage" ? "Enter %" : "Enter amount"}
                      className="w-full px-4 py-2 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="0"
                      max={discountType === "percentage" ? 100 : subtotal}
                      step={discountType === "percentage" ? 1 : 0.01}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      {discountType === "percentage" ? "%" : "₵"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₵ {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>
                      Discount ({discountType === "percentage" ? `${discountValue}%` : "Fixed"}):
                    </span>
                    <span className="font-medium">- ₵ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-3 border-t">
                  <span>Total:</span>
                  <span className="text-green-600">₵ {total.toFixed(2)}</span>
                </div>
              </div>
              <button
                disabled={loading || cart.length === 0 || !selectedCustomer}
                onClick={handleConfirmSale}
                className="btn btn-primary mt-4 w-full"
              >
                {loading ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>

          {/* Right Column - Items and Cart */}
          <div className="min-w-0 space-y-4">
            {/* Items List */}
            <div className="overflow-hidden rounded-xl bg-white border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Available Items
                  </h3>
                  <Badge variant="default">
                    {filteredItems.length} available
                  </Badge>
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
                      <button
                        type="button"
                        key={item.id}
                        disabled={isPreWarehouse}
                        onClick={() => addToCart(item)}
                        className="group block w-full p-4 text-left transition-colors hover:bg-blue-50 focus-visible:outline-offset-[-2px] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="flex items-center justify-between">
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {item.itemName}
                            </span>
                            {item.alias && (
                              <span className="block text-xs text-gray-500 italic">
                                Alias: {item.alias}
                              </span>
                            )}
                            <span className="block text-sm text-gray-600">
                              by {item.supplierName}
                            </span>
                          </span>
                          <span className="ml-3 shrink-0 text-right">
                            <span className="block text-base font-semibold text-gray-900">
                              ₵ {item.unitPrice.toFixed(2)}
                            </span>
                            <Badge
                              variant={
                                item.remainingQty > 10
                                  ? "success"
                                  : item.remainingQty > 0
                                  ? "warning"
                                  : "danger"
                              }
                              size="sm"
                            >
                              {item.remainingQty} in stock
                            </Badge>
                          </span>
                          <Plus className="ml-2 size-5 shrink-0 text-blue-700" aria-hidden="true" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Shopping Cart */}
            <div className="overflow-hidden rounded-xl bg-white border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Shopping Cart
                  </h3>
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
                        <div className="flex flex-col gap-3 min-[1400px]:flex-row min-[1400px]:items-center">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-gray-900">
                              {item.itemName}
                            </h4>
                            <p className="text-sm text-gray-600">
                              by {item.supplierName}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 items-center gap-2 rounded-lg bg-gray-50 p-2 sm:flex sm:flex-wrap sm:gap-3 sm:bg-transparent sm:p-0">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => decreaseQty(item.id)}
                                className="icon-btn text-gray-600 hover:bg-gray-100"
                                title="Decrease quantity"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <div className="min-w-7 text-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.qty}
                                </div>
                                <div className="text-xs text-gray-500">qty</div>
                              </div>
                              <button
                                onClick={() => increaseQty(item.id)}
                                className="icon-btn text-gray-600 hover:bg-gray-100"
                                title="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="min-w-0 text-right sm:min-w-[5.5rem] sm:text-center">
                              <div className="flex items-center justify-end gap-1 text-xs text-gray-600 sm:justify-center">
                                Unit Price
                                {!canEditPrice && (
                                  <span title="You don't have permission to edit prices">
                                    <Lock className="w-3 h-3 text-gray-400" />
                                  </span>
                                )}
                              </div>
                              {canEditPrice ? (
                                <input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updatePriceInCart(item.id, e.target.value)
                                  }
                                  className="w-20 px-2 py-1 text-sm border border-gray-200 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  step="0.01"
                                  min="0"
                                  title="Edit price"
                                />
                              ) : (
                                <div
                                  className="break-words font-medium text-gray-700"
                                  title="Price editing is restricted. Contact an admin or manager."
                                >
                                  ₵ {item.unitPrice.toFixed(2)}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 pl-2 text-left sm:min-w-[4.5rem] sm:pl-0 sm:text-right">
                              <div className="text-sm text-gray-600">Total</div>
                              <div className="break-words font-bold text-blue-700">
                                ₵ {(item.qty * item.unitPrice).toFixed(2)}
                              </div>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="icon-btn justify-self-end text-red-700 hover:bg-red-50"
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

      {/* Customer Modal */}
      <Dialog
        open={showCustomerModal}
        onClose={handleCustomerModalClose}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Add New Customer
              </Dialog.Title>
              <button
                onClick={handleCustomerModalClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <CustomerForm mode="create" />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />
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
                <p className="text-gray-600 mb-4">
                  Are you sure you want to finalize this sale?
                </p>
                <div className="bg-gray-50 rounded p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Date:</span>
                    <span className="font-medium">{saleDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Customer:</span>
                    <span className="font-medium">
                      {selectedCustomer?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Items:</span>
                    <span className="font-medium">{cart.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment:</span>
                    <span className="font-medium capitalize">{saleType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">₵ {subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-orange-600">
                      <span>
                        Discount ({discountType === "percentage" ? `${discountValue}%` : "Fixed"}):
                      </span>
                      <span className="font-medium">- ₵ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
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
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />
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
                <p className="text-gray-600 mb-4">
                  Your sale has been successfully processed.
                </p>
                <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                  <Receipt className="w-5 h-5" />
                  <span className="font-medium">
                    Would you like to print a receipt?
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setShowPrintPrompt(false);
                    if (saleType === "credit") setShowCreditPrompt(true);
                    setCart([]);
                    setDiscountType(null);
                    setDiscountValue(0);
                    try {
                      const itemData = await getContainerItemsWithSales(
                        containerId as string
                      );
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
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />
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
                  This was a credit sale. Would you like to record a payment
                  now?
                </p>
                <div className="bg-blue-50 rounded p-4">
                  <p className="text-sm text-blue-700">
                    Recording a payment now will help maintain accurate customer
                    balances.
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
                      const itemData = await getContainerItemsWithSales(
                        containerId as string
                      );
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
                      router.push(
                        `/customers/${selectedCustomer.value}/payments`
                      );
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
