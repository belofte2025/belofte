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
  Save,
  Download,
  Trash2,
  CheckCircle
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

  const handleClearPreview = () => {
    setSelectedItems([]);
    setMode("none");
  };

  const handleSubmit = async () => {
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
      router.push("/containers");
    } catch {
      toast.error("Failed to create container");
    } finally {
      setSaving(false);
    }
  };

  const totalValue = selectedItems.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice),
    0
  );
  
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

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
              <h1 className="text-3xl font-bold text-gray-900">Add New Container</h1>
              <p className="text-gray-600">Create a new container with inventory items</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Container Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Container Details</h3>
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Container Summary</h3>
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
                    <span className="text-indigo-600">₵ {totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleSubmit}
              disabled={saving || !containerNo || !year || !arrivalDate || !supplierId || selectedItems.length === 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Container...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />
                  Create Container
                </div>
              )}
            </button>
          </div>

          {/* Right Column - Items Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Source Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Items to Container</h3>
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
                    <div className="text-xs text-gray-500">Use supplier&apos;s item catalog</div>
                  </button>

                  <label className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 cursor-pointer group">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-green-500 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                      Upload Excel
                    </div>
                    <div className="text-xs text-gray-500">Import from spreadsheet</div>
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
                    <div className="text-xs text-gray-500">Excel format example</div>
                  </a>
                </div>

                {mode !== "none" && (
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant={mode === "excel" ? "success" : "info"}>
                      {mode === "excel" ? "Excel Import" : "Supplier Catalog"} Active
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(mode === "excel"
                        ? selectedItems
                        : supplierItems.map((item: SupplierItem) => ({
                            itemName: item.itemName,
                            unitPrice: item.price,
                            quantity:
                              selectedItems.find((i) => i.itemName === item.itemName)
                                ?.quantity || 0,
                          }))
                      ).map((item, i) => (
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
                              className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₵ {item.unitPrice?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                            ₵ {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
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
                  <p className="text-sm">Add items using one of the methods above</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-indigo-900 mb-2">Container Creation Tips</h4>
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
                  <p className="font-medium mb-1">Excel Import Format:</p>
                  <ul className="space-y-1">
                    <li>• Column A: Item Name</li>
                    <li>• Column B: Quantity (numbers only)</li>
                    <li>• Column C: Unit Price (optional)</li>
                    <li>• First row should contain headers</li>
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
