"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Search,
  Check,
  X,
  AlertTriangle,
  Edit2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ProtectedPage } from "@/components/auth/ProtectedPage";
import { getSuppliers } from "@/services/supplierService";
import api from "@/lib/api";

interface Supplier {
  id: string;
  suppliername: string;
  country: string;
}

interface Item {
  id: string;
  itemName: string;
}

interface PendingChange {
  originalName: string;
  newName: string;
  itemId: string;
}

export default function ItemDeduplicationPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, PendingChange>
  >({});
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error("Failed to load suppliers:", error);
      toast.error("Failed to load suppliers");
    }
  };

  const loadSupplierItems = async (supplierId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/suppliers/${supplierId}/items`);
      setItems(response.data);
      setPendingChanges({});
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplier(supplierId);
    setSearchQuery("");
    if (supplierId) {
      loadSupplierItems(supplierId);
    } else {
      setItems([]);
      setPendingChanges({});
    }
  };

  const startEditing = (item: Item) => {
    setEditingItem(item.id);
    setEditValue(pendingChanges[item.id]?.newName || item.itemName);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditValue("");
  };

  const saveEdit = (item: Item) => {
    const trimmedValue = editValue.trim();

    if (!trimmedValue) {
      toast.error("Item name cannot be empty");
      return;
    }

    if (trimmedValue === item.itemName) {
      // No change, remove from pending if exists
      const newChanges = { ...pendingChanges };
      delete newChanges[item.id];
      setPendingChanges(newChanges);
    } else {
      // Add to pending changes
      setPendingChanges((prev) => ({
        ...prev,
        [item.id]: {
          originalName: item.itemName,
          newName: trimmedValue,
          itemId: item.id,
        },
      }));
    }

    setEditingItem(null);
    setEditValue("");
  };

  const clearChange = (itemId: string) => {
    const newChanges = { ...pendingChanges };
    delete newChanges[itemId];
    setPendingChanges(newChanges);
  };

  const hasSpacingIssues = (itemName: string) => {
    return (
      itemName.includes("  ") ||
      itemName.startsWith(" ") ||
      itemName.endsWith(" ")
    );
  };

  const isMergeOperation = (newName: string, currentItemId: string) => {
    // Check if another item has the same name (case insensitive)
    return items.some(
      (item) =>
        item.id !== currentItemId &&
        item.itemName.toLowerCase() === newName.toLowerCase()
    );
  };

  const handleApplyChanges = async () => {
    const changes = Object.values(pendingChanges);
    if (changes.length === 0) {
      toast.error("No changes to apply");
      return;
    }

    // Group changes: merges go together, renames can be separate
    const mergeGroups: { masterName: string; duplicateNames: string[] }[] = [];

    changes.forEach((change) => {
      // Find if there's already a group with this target name
      const existingGroup = mergeGroups.find(
        (g) => g.masterName.toLowerCase() === change.newName.toLowerCase()
      );

      if (existingGroup) {
        existingGroup.duplicateNames.push(change.originalName);
      } else {
        mergeGroups.push({
          masterName: change.newName,
          duplicateNames: [change.originalName],
        });
      }
    });

    setSaving(true);
    try {
      const response = await api.post(`/items/merge-duplicates`, {
        supplierId: selectedSupplier,
        mergeGroups: mergeGroups,
      });

      toast.success(
        `Successfully updated ${response.data.mergedCount} item(s)`
      );

      // Reload items
      await loadSupplierItems(selectedSupplier);
    } catch (error: any) {
      console.error("Failed to apply changes:", error);
      toast.error(error.response?.data?.message || "Failed to apply changes");
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items
    .filter((item) =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.itemName.localeCompare(b.itemName));

  const pendingCount = Object.keys(pendingChanges).length;
  const mergeCount = Object.values(pendingChanges).filter((c) =>
    isMergeOperation(c.newName, c.itemId)
  ).length;
  const renameCount = pendingCount - mergeCount;

  return (
    <ProtectedPage permission="items.deduplicate">
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-2">
                <Link
                  href="/settings"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Item Deduplication
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Fix typos, spacing issues, or merge duplicate items
                  </p>
                </div>
                {pendingCount > 0 && (
                  <button
                    onClick={handleApplyChanges}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Apply {pendingCount} Change{pendingCount !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            </div>

            {/* Supplier Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.suppliername} ({supplier.country})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSupplier && (
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Items
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Changes Summary */}
            {pendingCount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-900">
                      {pendingCount} pending change
                      {pendingCount !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-orange-700">
                      {renameCount > 0 && (
                        <span>
                          {renameCount} rename{renameCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {renameCount > 0 && mergeCount > 0 && <span>, </span>}
                      {mergeCount > 0 && (
                        <span>
                          {mergeCount} merge{mergeCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Items List */}
            {selectedSupplier && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {searchQuery
                      ? "No items match your search"
                      : "No items found for this supplier"}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredItems.map((item) => {
                      const change = pendingChanges[item.id];
                      const isEditing = editingItem === item.id;
                      const willMerge =
                        change && isMergeOperation(change.newName, item.id);

                      return (
                        <div
                          key={item.id}
                          className={`p-4 transition-colors ${
                            change
                              ? willMerge
                                ? "bg-blue-50"
                                : "bg-orange-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-3">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(item);
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                autoFocus
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                              />
                              <button
                                onClick={() => saveEdit(item)}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Save"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                {change ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-gray-500 line-through">
                                      {item.itemName}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-gray-900">
                                      {change.newName}
                                    </span>
                                    {willMerge && (
                                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                        Merge
                                      </span>
                                    )}
                                    {!willMerge && (
                                      <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                                        Rename
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                      {item.itemName}
                                    </span>
                                    {hasSpacingIssues(item.itemName) && (
                                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Spacing issue
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {change && (
                                  <button
                                    onClick={() => clearChange(item.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Clear change"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => startEditing(item)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Edit name"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer */}
                {filteredItems.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
                    {filteredItems.length} item
                    {filteredItems.length !== 1 ? "s" : ""} shown
                    {searchQuery && ` (filtered)`}
                  </div>
                )}
              </div>
            )}

            {/* Help Text */}
            {selectedSupplier && !loading && filteredItems.length > 0 && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">How to use:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • Click the edit icon to rename an item or fix spacing
                    issues
                  </li>
                  <li>
                    • If you type an existing item name, they will be merged
                  </li>
                  <li>
                    • Review your changes and click &quot;Apply Changes&quot; to
                    save
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedPage>
  );
}
