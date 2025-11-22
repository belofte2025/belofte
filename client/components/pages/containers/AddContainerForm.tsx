"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createContainer } from "@/services/containerService";
import { getSuppliers, getSupplierItems } from "@/services/supplierService";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import {
  Container,
  Upload,
  FileText,
  Package,
  Calendar,
  Building,
  ArrowLeft,
  Download,
  Trash2,
  CheckCircle,
  Plus,
  X,
} from "lucide-react";
import Badge from "@/components/ui/Badge";

type ParsedExcelItem = {
  itemName: string;
  quantity: number;
  unitPrice: number;
};

type Supplier = {
  id: string;
  suppliername: string;
};

type SupplierItem = {
  itemName: string;
  price: number;
};

export default function AddContainerForm() {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [containerNo, setContainerNo] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierOptions, setSupplierOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<ParsedExcelItem[]>([]);
  const [mode, setMode] = useState<"none" | "excel" | "supplier">("none");
  const [saving, setSaving] = useState(false);

  // New item form states
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    getSuppliers().then((res) => {
      setSupplierOptions(
        res.map((s: Supplier) => ({ label: s.suppliername, value: s.id }))
      );
    });
  }, []);

  useEffect(() => {
    if (!supplierId) return;
    getSupplierItems(supplierId).then((items) => {
      setSupplierItems(items);
    });
  }, [supplierId]);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed = XLSX.utils.sheet_to_json(worksheet) as ParsedExcelItem[];
    setSelectedItems(parsed);
    setMode("excel");
  };

  const handleQuantityChange = (itemName: string, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.itemName === itemName ? { ...item, quantity: qty } : item
      )
    );
  };

  const handlePriceChange = (itemName: string, price: number) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.itemName === itemName ? { ...item, unitPrice: price } : item
      )
    );
  };

  const handleRemoveItem = (itemName: string) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.itemName !== itemName)
    );
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) {
      toast.error("Item name is required");
      return;
    }

    const quantity = parseFloat(newItemQuantity) || 0;
    const price = parseFloat(newItemPrice) || 0;

    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (price < 0) {
      toast.error("Price cannot be negative");
      return;
    }

    // Check if item already exists
    const existingItem = selectedItems.find(
      (item) => item.itemName.toLowerCase() === newItemName.trim().toLowerCase()
    );

    if (existingItem) {
      toast.error("Item already exists in the list");
      return;
    }

    // Add new item
    setSelectedItems((prev) => [
      ...prev,
      {
        itemName: newItemName.trim(),
        quantity: quantity,
        unitPrice: price,
      },
    ]);

    // Reset form
    setNewItemName("");
    setNewItemQuantity("");
    setNewItemPrice("");
    setShowAddItemForm(false);
    toast.success("Item added successfully");
  };

  const handleClearPreview = () => {
    setSelectedItems([]);
    setMode("none");
  };

  const handlePreviewSubmit = () => {
    if (
      !year ||
      !containerNo ||
      !arrivalDate ||
      !supplierId ||
      mode === "none"
    ) {
      toast.error("All fields are required and mode must be selected.");
      return;
    }

    const validItems = selectedItems.filter((i) => i.quantity > 0);
    if (validItems.length === 0) {
      toast.error("Please add at least one item with quantity > 0.");
      return;
    }

    setShowPreview(true);
  };

  const handleSubmit = async () => {
    const validItems = selectedItems.filter((i) => i.quantity > 0);

    const payload = {
      year: parseInt(year),
      containerNo,
      arrivalDate,
      supplierId,
      items: validItems,
    };

    try {
      setSaving(true);
      await createContainer(payload);
      toast.success("Container added");
      setShowPreview(false);
      router.push("/containers");
    } catch {
      toast.error("Failed to create container");
    } finally {
      setSaving(false);
    }
  };

  const totalValue = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const totalItems = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const selectedSupplierName =
    supplierOptions.find((s) => s.value === supplierId)?.label || "N/A";

  const formattedArrivalDate = arrivalDate
    ? new Date(arrivalDate).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Containers
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Container className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Add New Container
              </h1>
              <p className="text-gray-600">
                Create a new container with inventory items
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Container Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Information */}
            <div className="bg-white p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Container Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Year
                  </label>
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="w-4 h-4 inline mr-2" />
                    Container Number
                  </label>
                  <input
                    type="text"
                    value={containerNo}
                    onChange={(e) => setContainerNo(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="CONT-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Arrival Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Supplier
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select Supplier</option>
                    {supplierOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            {selectedItems.length > 0 && (
              <div className="bg-white p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Container Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-medium">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Item Types:</span>
                    <span className="font-medium">{selectedItems.length}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t">
                    <span>Total Value:</span>
                    <span className="text-indigo-600">
                      ₵ {totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handlePreviewSubmit}
              disabled={
                saving ||
                !containerNo ||
                !year ||
                !arrivalDate ||
                !supplierId ||
                selectedItems.length === 0
              }
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center gap-2">
                <Package className="w-5 h-5" />
                Preview Container
              </div>
            </button>
          </div>

          {/* Right Column - Items Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Source Selection */}
            <div className="bg-white shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add Items to Container
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      if (!supplierId) {
                        toast.error("Please select a supplier first");
                        return;
                      }
                      setMode("supplier");
                      setSelectedItems(
                        supplierItems.map((item) => ({
                          itemName: item.itemName,
                          unitPrice: item.price,
                          quantity: 0,
                        }))
                      );
                    }}
                    className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group"
                  >
                    <Package className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">
                      Load from Supplier
                    </div>
                    <div className="text-xs text-gray-500">
                      Use supplier&apos;s item catalog
                    </div>
                  </button>

                  <label className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 cursor-pointer group">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-green-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                      Upload Excel
                    </div>
                    <div className="text-xs text-gray-500">
                      Import from spreadsheet
                    </div>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleExcelUpload}
                      hidden
                    />
                  </label>

                  <a
                    href="/templates/container_template.xlsx"
                    download
                    className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <Download className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                      Download Template
                    </div>
                    <div className="text-xs text-gray-500">
                      Excel format example
                    </div>
                  </a>
                </div>

                {mode !== "none" && (
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant={mode === "excel" ? "success" : "info"}>
                      {mode === "excel" ? "Excel Import" : "Supplier Catalog"}{" "}
                      Active
                    </Badge>
                    <button
                      onClick={handleClearPreview}
                      className="inline-flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Items
                    </button>
                  </div>
                )}
              </div>

              {/* Add New Item Button & Form */}
              {mode !== "none" && (
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  {!showAddItemForm ? (
                    <button
                      onClick={() => setShowAddItemForm(true)}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-white transition-all duration-200 flex items-center justify-center gap-2 text-gray-600 hover:text-indigo-600 font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Add Custom Item
                    </button>
                  ) : (
                    <div className="bg-white p-4 border-2 border-indigo-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">
                          Add New Item
                        </h4>
                        <button
                          onClick={() => {
                            setShowAddItemForm(false);
                            setNewItemName("");
                            setNewItemQuantity("");
                            setNewItemPrice("");
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Item Name *
                          </label>
                          <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="e.g., Rice Bags"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={newItemQuantity}
                            onChange={(e) => setNewItemQuantity(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unit Price *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleAddNewItem}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                          Add Item
                        </button>
                        <button
                          onClick={() => {
                            setShowAddItemForm(false);
                            setNewItemName("");
                            setNewItemQuantity("");
                            setNewItemPrice("");
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              {mode !== "none" && selectedItems.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Value
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedItems.map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.itemName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.itemName,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handlePriceChange(
                                  item.itemName,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                            ₵{" "}
                            {(
                              (item.quantity || 0) * (item.unitPrice || 0)
                            ).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleRemoveItem(item.itemName)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {mode !== "none" && selectedItems.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No items to display</p>
                  <p className="text-sm">
                    Add items using one of the methods above
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Container Preview
                    </h2>
                    <p className="text-indigo-100 text-sm">
                      Review before saving
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Container Details Section */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Container className="w-5 h-5 text-indigo-600" />
                    Container Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Year
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {year}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Container No.
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {containerNo}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Supplier
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedSupplierName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Arrival Date
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formattedArrivalDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">
                      Total Items
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {totalItems}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-xs text-purple-600 uppercase tracking-wide mb-1">
                      Item Types
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {selectedItems.length}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-xs text-green-600 uppercase tracking-wide mb-1">
                      Total Value
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      ₵ {totalValue.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Items List (
                    {selectedItems.filter((i) => i.quantity > 0).length})
                  </h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Item Name
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Total Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedItems
                            .filter((item) => item.quantity > 0)
                            .map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {item.itemName}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                  ₵ {item.unitPrice.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-indigo-600 text-right">
                                  ₵{" "}
                                  {(item.quantity * item.unitPrice).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-4 text-right text-sm font-bold text-gray-900"
                            >
                              Grand Total:
                            </td>
                            <td className="px-4 py-4 text-right text-lg font-bold text-indigo-600">
                              ₵ {totalValue.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Edit
                  </div>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {saving ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating Container...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Confirm & Save
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-indigo-900 mb-2">
                Container Creation Tips
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-indigo-700">
                <div>
                  <p className="font-medium mb-1">Required Information:</p>
                  <ul className="space-y-1">
                    <li>• Container number (unique identifier)</li>
                    <li>• Arrival date and time</li>
                    <li>• Supplier selection</li>
                    <li>• At least one item with quantity</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Adding Items:</p>
                  <ul className="space-y-1">
                    <li>• Load from supplier catalog or upload Excel</li>
                    <li>
                      • Click &quot;Add Custom Item&quot; to add new items
                    </li>
                    <li>• Edit quantities and prices inline</li>
                    <li>• Remove unwanted items with trash icon</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
