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
  Save,
  CheckSquare,
  Square,
  Minus,
  Plus,
  Search,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

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

interface AdjustmentFormData extends StockAdjustment {
  currentAvailable: number;
  projectedAvailable: number;
}

const ADJUSTMENT_TYPES = [
  { value: "manual", label: "Manual Correction" },
  { value: "damage", label: "Damage/Loss" },
  { value: "found", label: "Found/Recovered" },
] as const;

export default function StockAdjustmentPage({
  supplierId,
}: StockAdjustmentPageProps) {
  const [supplierData, setSupplierData] = useState<{
    supplier: { id: string; name: string; country: string };
    inventory: InventoryItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [adjustments, setAdjustments] = useState<
    Record<string, AdjustmentFormData>
  >({});
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getSupplierStockWithAdjustments(supplierId);
        setSupplierData(result);
      } catch (error) {
        console.error("Failed to fetch stock data:", error);
        toast.error("Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId]);

  const handleToggleItem = (itemName: string, available: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName);
      setAdjustments((prev) => {
        const newAdjustments = { ...prev };
        delete newAdjustments[itemName];
        return newAdjustments;
      });
    } else {
      newSelected.add(itemName);
      setAdjustments((prev) => ({
        ...prev,
        [itemName]: {
          itemName,
          adjustmentQty: 0,
          adjustmentType: "manual",
          reason: "",
          currentAvailable: available,
          projectedAvailable: available,
        },
      }));
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (!supplierData) return;
    const itemNames = supplierData.inventory.map((item) => item.itemName);

    if (selectedItems.size === itemNames.length) {
      setSelectedItems(new Set());
      setAdjustments({});
    } else {
      setSelectedItems(new Set(itemNames));
      const newAdjustments: Record<string, AdjustmentFormData> = {};
      supplierData.inventory.forEach((item) => {
        newAdjustments[item.itemName] = {
          itemName: item.itemName,
          adjustmentQty: 0,
          adjustmentType: "manual",
          reason: "",
          currentAvailable: item.available,
          projectedAvailable: item.available,
        };
      });
      setAdjustments(newAdjustments);
    }
  };

  const handleAdjustmentChange = (
    itemName: string,
    field: keyof AdjustmentFormData,
    value: string | number
  ) => {
    setAdjustments((prev) => {
      const current = prev[itemName];
      if (!current) return prev;

      const updated = { ...current, [field]: value };

      // Update projected available when quantity changes
      if (field === "adjustmentQty") {
        const qty = typeof value === "number" ? value : parseInt(value) || 0;
        updated.projectedAvailable = current.currentAvailable + qty;
      }

      return {
        ...prev,
        [itemName]: updated,
      };
    });
  };

  const handleQuickAdjust = (itemName: string, change: number) => {
    const currentAdjustment = adjustments[itemName];
    if (!currentAdjustment) return;

    const newQty = currentAdjustment.adjustmentQty + change;
    handleAdjustmentChange(itemName, "adjustmentQty", newQty);
  };

  const handleSaveAdjustments = async () => {
    const selectedAdjustments = Object.values(adjustments).filter(
      (adj) => selectedItems.has(adj.itemName) && adj.adjustmentQty !== 0
    );

    if (selectedAdjustments.length === 0) {
      toast.error("No adjustments to save. Please select items and enter quantities.");
      return;
    }

    // Validate all adjustments
    const invalidAdjustments = selectedAdjustments.filter(
      (adj) => adj.projectedAvailable < 0
    );

    if (invalidAdjustments.length > 0) {
      toast.error(
        `Cannot save: ${invalidAdjustments.map((a) => a.itemName).join(", ")} would have negative quantities`
      );
      return;
    }

    // Validate reasons are provided
    const missingReasons = selectedAdjustments.filter(
      (adj) => !adj.reason || adj.reason.trim() === ""
    );

    if (missingReasons.length > 0) {
      toast.error("Please provide a reason for all adjustments");
      return;
    }

    setSaving(true);
    try {
      const adjustmentsToSave: StockAdjustment[] = selectedAdjustments.map(
        (adj) => ({
          itemName: adj.itemName,
          adjustmentQty: adj.adjustmentQty,
          adjustmentType: adj.adjustmentType,
          reason: adj.reason,
          notes: adj.notes,
        })
      );

      await createStockAdjustments(supplierId, adjustmentsToSave);

      toast.success(
        `Successfully saved ${adjustmentsToSave.length} stock adjustment(s)`
      );

      // Refresh data
      const result = await getSupplierStockWithAdjustments(supplierId);
      setSupplierData(result);

      // Clear selections
      setSelectedItems(new Set());
      setAdjustments({});
    } catch (error: any) {
      console.error("Failed to save adjustments:", error);
      toast.error(error.response?.data?.error || "Failed to save adjustments");
    } finally {
      setSaving(false);
    }
  };

  const filteredInventory = supplierData?.inventory.filter((item) =>
    item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading stock data...</div>
      </div>
    );
  }

  if (!supplierData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Failed to load stock data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/suppliers/${supplierId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Supplier Details
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Stock Adjustments
              </h1>
              <p className="text-gray-600 mt-1">
                {supplierData.supplier.name} - {supplierData.supplier.country}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                {selectedItems.size === supplierData.inventory.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    Select All
                  </>
                )}
              </button>

              <button
                onClick={handleSaveAdjustments}
                disabled={selectedItems.size === 0 || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : `Save Adjustments (${selectedItems.size})`}
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Stock Adjustment Guidelines</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Use positive numbers to increase stock (e.g., found items during count)</li>
              <li>Use negative numbers to decrease stock (e.g., damaged items)</li>
              <li>All adjustments require a reason for audit purposes</li>
              <li>Adjustments cannot result in negative stock quantities</li>
            </ul>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredInventory && filteredInventory.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const isSelected = selectedItems.has(item.itemName);
                const adjustment = adjustments[item.itemName];
                const hasNegativeProjection =
                  adjustment && adjustment.projectedAvailable < 0;

                return (
                  <div
                    key={item.itemName}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() =>
                          handleToggleItem(item.itemName, item.available)
                        }
                        className="mt-1"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      <div className="flex-1">
                        {/* Item Info */}
                        <div className="mb-3">
                          <h3 className="font-medium text-gray-900">
                            {item.itemName}
                          </h3>
                          <div className="text-sm text-gray-600 mt-1 flex gap-4">
                            <span>Available: <strong>{item.available}</strong></span>
                            {item.totalAdjustments !== 0 && (
                              <span className={item.totalAdjustments > 0 ? "text-green-600" : "text-red-600"}>
                                Adjustments: {item.totalAdjustments > 0 ? "+" : ""}{item.totalAdjustments}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Adjustment Form */}
                        {isSelected && adjustment && (
                          <div className="space-y-3 border-t pt-3">
                            {/* Quantity Adjustment */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity Adjustment
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleQuickAdjust(item.itemName, -10)
                                  }
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                                >
                                  -10
                                </button>
                                <button
                                  onClick={() =>
                                    handleQuickAdjust(item.itemName, -1)
                                  }
                                  className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <input
                                  type="number"
                                  value={adjustment.adjustmentQty}
                                  onChange={(e) =>
                                    handleAdjustmentChange(
                                      item.itemName,
                                      "adjustmentQty",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className={`w-24 px-3 py-2 text-center border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    hasNegativeProjection
                                      ? "border-red-500"
                                      : "border-gray-300"
                                  }`}
                                />
                                <button
                                  onClick={() =>
                                    handleQuickAdjust(item.itemName, 1)
                                  }
                                  className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleQuickAdjust(item.itemName, 10)
                                  }
                                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                                >
                                  +10
                                </button>
                                <span
                                  className={`ml-2 text-sm ${
                                    hasNegativeProjection
                                      ? "text-red-600 font-medium"
                                      : adjustment.projectedAvailable >
                                        adjustment.currentAvailable
                                      ? "text-green-600"
                                      : adjustment.projectedAvailable <
                                        adjustment.currentAvailable
                                      ? "text-orange-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  New: {adjustment.projectedAvailable}
                                  {hasNegativeProjection && " (Invalid)"}
                                </span>
                              </div>
                            </div>

                            {/* Adjustment Type */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Adjustment Type
                              </label>
                              <select
                                value={adjustment.adjustmentType}
                                onChange={(e) =>
                                  handleAdjustmentChange(
                                    item.itemName,
                                    "adjustmentType",
                                    e.target.value as "manual" | "damage" | "found"
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                {ADJUSTMENT_TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Reason */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={adjustment.reason || ""}
                                onChange={(e) =>
                                  handleAdjustmentChange(
                                    item.itemName,
                                    "reason",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., Physical count discrepancy"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            {/* Notes (Optional) */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Additional Notes (Optional)
                              </label>
                              <textarea
                                value={adjustment.notes || ""}
                                onChange={(e) =>
                                  handleAdjustmentChange(
                                    item.itemName,
                                    "notes",
                                    e.target.value
                                  )
                                }
                                placeholder="Any additional details..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {searchQuery
                ? "No items found matching your search"
                : "No items available for this supplier"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
