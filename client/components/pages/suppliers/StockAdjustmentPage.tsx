"use client";

import { useEffect, useState } from "react";
import {
  getSupplierStockWithAdjustments,
  createStockAdjustments,
  StockAdjustment,
} from "@/services/supplierService";
import {
  ArrowLeft,
  Package,
  Plus,
  Minus,
  Search,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface StockAdjustmentPageProps {
  supplierId: string;
}

interface InventoryItem {
  itemName: string;
  supplierName: string;
  received: number;
  sold: number;
  available: number;
  totalAdjustments: number;
}

interface ItemAdjustment {
  itemName: string;
  adjustmentQty: number;
  adjustmentType: "manual" | "damage" | "found";
  reason: string;
}

export default function StockAdjustmentPage({
  supplierId,
}: StockAdjustmentPageProps) {
  const [supplierData, setSupplierData] = useState<{
    supplier: { id: string; name: string; country: string };
    inventory: InventoryItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustments, setAdjustments] = useState<Record<string, ItemAdjustment>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [supplierId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getSupplierStockWithAdjustments(supplierId);
      setSupplierData(result);
    } catch (error) {
      console.error("Failed to fetch stock data:", error);
      toast.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  const updateAdjustment = (
    itemName: string,
    field: keyof ItemAdjustment,
    value: string | number
  ) => {
    setAdjustments((prev) => {
      const existing = prev[itemName] || {
        itemName,
        adjustmentQty: 0,
        adjustmentType: "manual" as const,
        reason: "",
      };

      return {
        ...prev,
        [itemName]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const incrementQty = (itemName: string) => {
    const current = adjustments[itemName]?.adjustmentQty || 0;
    updateAdjustment(itemName, "adjustmentQty", current + 1);
  };

  const decrementQty = (itemName: string) => {
    const current = adjustments[itemName]?.adjustmentQty || 0;
    updateAdjustment(itemName, "adjustmentQty", current - 1);
  };

  const clearAdjustment = (itemName: string) => {
    const newAdjustments = { ...adjustments };
    delete newAdjustments[itemName];
    setAdjustments(newAdjustments);
  };

  const handleSave = async () => {
    const adjustmentsToSave = Object.values(adjustments).filter(
      (adj) => adj.adjustmentQty !== 0
    );

    if (adjustmentsToSave.length === 0) {
      toast.error("No adjustments to save");
      return;
    }

    // Validate reasons
    const missingReasons = adjustmentsToSave.filter((adj) => !adj.reason?.trim());
    if (missingReasons.length > 0) {
      toast.error("Please provide a reason for all adjustments");
      return;
    }

    // Validate no negative stock
    const items = supplierData?.inventory || [];
    for (const adj of adjustmentsToSave) {
      const item = items.find((i) => i.itemName === adj.itemName);
      if (item && item.available + adj.adjustmentQty < 0) {
        toast.error(
          `Cannot adjust ${adj.itemName}: would result in negative stock (${
            item.available + adj.adjustmentQty
          })`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload: StockAdjustment[] = adjustmentsToSave.map((adj) => ({
        itemName: adj.itemName,
        adjustmentQty: adj.adjustmentQty,
        adjustmentType: adj.adjustmentType,
        reason: adj.reason,
      }));

      await createStockAdjustments(supplierId, payload);
      toast.success(`Successfully adjusted ${payload.length} item(s)`);

      // Refresh data and clear adjustments
      await fetchData();
      setAdjustments({});
    } catch (error: any) {
      console.error("Failed to save adjustments:", error);
      toast.error(error.response?.data?.error || "Failed to save adjustments");
    } finally {
      setSaving(false);
    }
  };

  const filteredInventory =
    supplierData?.inventory.filter((item) =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const pendingCount = Object.keys(adjustments).filter(
    (key) => adjustments[key].adjustmentQty !== 0
  ).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!supplierData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Failed to load stock data</h3>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/inventory/adjustments"
            className="inline-flex items-center text-orange-600 hover:text-orange-800 mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Suppliers
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-orange-600" />
                Stock Adjustments
              </h1>
              <p className="text-gray-600 mt-1">
                {supplierData.supplier.name} • {supplierData.supplier.country}
              </p>
            </div>

            {pendingCount > 0 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <Save className="w-5 h-5" />
                {saving ? "Saving..." : `Save ${pendingCount} Adjustment${pendingCount > 1 ? "s" : ""}`}
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adjustment
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Reason
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery ? "No items found" : "No items available"}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const adjustment = adjustments[item.itemName];
                    const hasAdjustment = adjustment && adjustment.adjustmentQty !== 0;
                    const newStock = item.available + (adjustment?.adjustmentQty || 0);
                    const isNegative = newStock < 0;

                    return (
                      <tr
                        key={item.itemName}
                        className={`hover:bg-gray-50 ${
                          hasAdjustment ? "bg-orange-50" : ""
                        }`}
                      >
                        {/* Item Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{item.itemName}</div>
                        </td>

                        {/* Current Stock */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-lg font-semibold text-gray-900">
                            {item.available}
                          </span>
                        </td>

                        {/* Adjustment Controls */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => decrementQty(item.itemName)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={adjustment?.adjustmentQty || 0}
                              onChange={(e) =>
                                updateAdjustment(
                                  item.itemName,
                                  "adjustmentQty",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                            <button
                              onClick={() => incrementQty(item.itemName)}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                        {/* New Stock */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`text-lg font-bold ${
                              isNegative
                                ? "text-red-600"
                                : hasAdjustment
                                ? "text-orange-600"
                                : "text-gray-900"
                            }`}
                          >
                            {newStock}
                          </span>
                          {isNegative && (
                            <div className="text-xs text-red-600 mt-1">Invalid!</div>
                          )}
                        </td>

                        {/* Type & Reason */}
                        <td className="px-6 py-4">
                          {hasAdjustment && (
                            <div className="space-y-2">
                              <select
                                value={adjustment.adjustmentType}
                                onChange={(e) =>
                                  updateAdjustment(
                                    item.itemName,
                                    "adjustmentType",
                                    e.target.value as "manual" | "damage" | "found"
                                  )
                                }
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="manual">Manual Correction</option>
                                <option value="damage">Damage/Loss</option>
                                <option value="found">Found/Recovered</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Reason (required)"
                                value={adjustment.reason || ""}
                                onChange={(e) =>
                                  updateAdjustment(item.itemName, "reason", e.target.value)
                                }
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {hasAdjustment && (
                            <button
                              onClick={() => clearAdjustment(item.itemName)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Clear adjustment"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                How to Use Stock Adjustments
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use <strong>+/-</strong> buttons or type a number to adjust quantities</li>
                <li>• Select adjustment type and provide a reason for each change</li>
                <li>• Click <strong>Save</strong> button when you're ready to apply all changes</li>
                <li>• Positive numbers add stock, negative numbers reduce stock</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
