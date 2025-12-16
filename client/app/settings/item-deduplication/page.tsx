"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Package, AlertTriangle, Check, X, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Dialog } from "@headlessui/react";
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

interface DuplicateGroup {
  masterName: string | null;
  items: Item[];
  selected: boolean;
}

export default function ItemDeduplicationPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    validGroups: DuplicateGroup[];
    mergeRequests: { masterName: string; duplicateNames: string[] }[];
  } | null>(null);

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
      setDuplicateGroups([]);
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplier(supplierId);
    if (supplierId) {
      loadSupplierItems(supplierId);
    } else {
      setItems([]);
      setDuplicateGroups([]);
    }
  };

  const createDuplicateGroup = () => {
    setDuplicateGroups([
      ...duplicateGroups,
      {
        masterName: null,
        items: [],
        selected: false,
      },
    ]);
  };

  const addItemToGroup = (groupIndex: number, item: Item) => {
    const newGroups = [...duplicateGroups];
    const group = newGroups[groupIndex];

    // Check if item already in group
    if (group.items.find(i => i.id === item.id)) {
      toast.error("Item already in this group");
      return;
    }

    // Check if item is in another group
    const inOtherGroup = newGroups.some((g, i) =>
      i !== groupIndex && g.items.find(existingItem => existingItem.id === item.id)
    );

    if (inOtherGroup) {
      toast.error("Item is already in another group");
      return;
    }

    group.items.push(item);

    // Auto-select first item as master if none selected
    if (!group.masterName && group.items.length === 1) {
      group.masterName = item.itemName;
    }

    setDuplicateGroups(newGroups);
  };

  const removeItemFromGroup = (groupIndex: number, itemId: string) => {
    const newGroups = [...duplicateGroups];
    const group = newGroups[groupIndex];

    const removedItem = group.items.find(i => i.id === itemId);
    group.items = group.items.filter(i => i.id !== itemId);

    // If master was removed, select first item as new master
    if (removedItem && group.masterName === removedItem.itemName) {
      group.masterName = group.items.length > 0 ? group.items[0].itemName : null;
    }

    setDuplicateGroups(newGroups);
  };

  const setMasterItem = (groupIndex: number, itemName: string) => {
    const newGroups = [...duplicateGroups];
    newGroups[groupIndex].masterName = itemName;
    setDuplicateGroups(newGroups);
  };

  const removeGroup = (groupIndex: number) => {
    setDuplicateGroups(duplicateGroups.filter((_, i) => i !== groupIndex));
  };

  const handleMergeDuplicates = () => {
    // Validate groups - allow single items for spacing cleanup
    const validGroups = duplicateGroups.filter(g => g.items.length >= 1 && g.masterName);

    if (validGroups.length === 0) {
      toast.error("Please create at least one group with items");
      return;
    }

    const invalidGroups = validGroups.filter(g => !g.masterName);
    if (invalidGroups.length > 0) {
      toast.error("Please set a final name for all groups");
      return;
    }

    const mergeRequests = validGroups
      .map(group => ({
        masterName: group.masterName!,
        duplicateNames: group.items.filter(i => i.itemName !== group.masterName).map(i => i.itemName),
      }))
      .filter(req => req.duplicateNames.length > 0); // Only include requests that actually change something

    if (mergeRequests.length === 0) {
      toast.error("No changes to apply. Please edit the final name to be different from the original.");
      return;
    }

    setConfirmData({ validGroups: validGroups.filter(g =>
      g.items.some(i => i.itemName !== g.masterName)
    ), mergeRequests });
    setShowConfirmDialog(true);
  };

  const confirmMerge = async () => {
    if (!confirmData) return;

    setShowConfirmDialog(false);
    setProcessing(true);
    try {
      const response = await api.post(`/items/merge-duplicates`, {
        supplierId: selectedSupplier,
        mergeGroups: confirmData.mergeRequests,
      });

      toast.success(`Successfully merged ${response.data.mergedCount} duplicate items`);

      // Reload items
      await loadSupplierItems(selectedSupplier);
      setDuplicateGroups([]);
      setConfirmData(null);
    } catch (error: any) {
      console.error("Failed to merge duplicates:", error);
      toast.error(error.response?.data?.message || "Failed to merge duplicate items");
    } finally {
      setProcessing(false);
    }
  };

  const cancelMerge = () => {
    setShowConfirmDialog(false);
    setConfirmData(null);
  };

  const getAvailableItems = () => {
    const usedItemIds = new Set(
      duplicateGroups.flatMap(g => g.items.map(i => i.id))
    );
    return items.filter(item => !usedItemIds.has(item.id));
  };

  const hasSpacingIssues = (itemName: string) => {
    return (
      itemName.includes('  ') || // Double space or more
      itemName.startsWith(' ') || // Leading space
      itemName.endsWith(' ')      // Trailing space
    );
  };

  const getSpacingIssueText = (itemName: string) => {
    const issues = [];
    if (itemName.startsWith(' ')) issues.push('leading space');
    if (itemName.endsWith(' ')) issues.push('trailing space');
    if (itemName.includes('  ')) issues.push('double spacing');
    return issues.join(', ');
  };

  return (
    <ProtectedPage permission="items.deduplicate">
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/settings"
              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Item Deduplication</h1>
              <p className="text-gray-600 mt-1">
                Merge duplicate items caused by typos or spacing issues
              </p>
            </div>
          </div>
        </div>

        {/* Supplier Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Supplier
          </label>
          <select
            value={selectedSupplier}
            onChange={(e) => handleSupplierChange(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a supplier --</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.suppliername} ({supplier.country})
              </option>
            ))}
          </select>
        </div>

        {selectedSupplier && (
          <>
            {/* Available Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Available Items</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {loading ? "Loading..." : `${getAvailableItems().length} items available`}
                  </p>
                </div>
                <button
                  onClick={createDuplicateGroup}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Create Duplicate Group
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {getAvailableItems().map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.itemName}</p>
                          {hasSpacingIssues(item.itemName) && (
                            <div className="flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                              <span className="text-xs text-amber-600 font-medium">
                                {getSpacingIssueText(item.itemName)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Duplicate Groups */}
            {duplicateGroups.length > 0 && (
              <div className="space-y-4 mb-6">
                {duplicateGroups.map((group, groupIndex) => (
                  <div
                    key={groupIndex}
                    className="bg-white rounded-lg shadow-sm border-2 border-orange-200 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Duplicate Group {groupIndex + 1}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({group.items.length} items)
                        </span>
                      </div>
                      <button
                        onClick={() => removeGroup(groupIndex)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add items to this group (click to add):
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {getAvailableItems().map((item) => (
                          <button
                            key={item.id}
                            onClick={() => addItemToGroup(groupIndex, item)}
                            className="p-2 text-left border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                          >
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {item.itemName}
                            </p>
                            {hasSpacingIssues(item.itemName) && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                <span className="text-xs text-amber-600 font-medium">
                                  {getSpacingIssueText(item.itemName)}
                                </span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {group.items.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Select the correct name to keep or edit to fix spacing:
                        </p>
                        <div className="space-y-2">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className={`p-3 border-2 rounded-lg transition-all ${
                                group.masterName === item.itemName
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`master-${groupIndex}`}
                                      checked={group.masterName === item.itemName}
                                      onChange={() => setMasterItem(groupIndex, item.itemName)}
                                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium text-gray-900">
                                          {item.itemName}
                                        </p>
                                        {group.masterName === item.itemName && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <Check className="w-3 h-3 mr-1" />
                                            Keep This
                                          </span>
                                        )}
                                        {hasSpacingIssues(item.itemName) && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            <AlertTriangle className="w-3 h-3" />
                                            {getSpacingIssueText(item.itemName)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeItemFromGroup(groupIndex, item.id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Editable Master Name */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Final name to keep (edit to fix spacing or typos):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={group.masterName || ""}
                              onChange={(e) => setMasterItem(groupIndex, e.target.value)}
                              placeholder="Enter the final item name"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {group.masterName && hasSpacingIssues(group.masterName) && (
                              <div className="flex items-center gap-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                <span className="text-sm text-amber-800 font-medium">
                                  {getSpacingIssueText(group.masterName)}
                                </span>
                              </div>
                            )}
                            {group.masterName && !hasSpacingIssues(group.masterName) && (
                              <div className="flex items-center gap-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span className="text-sm text-green-800 font-medium">
                                  No spacing issues
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            You can manually edit this field to fix spacing issues or correct typos
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {duplicateGroups.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {duplicateGroups.filter(g => g.items.length >= 1).length} group(s) ready to process
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Includes {duplicateGroups.filter(g => g.items.length > 1).length} duplicate merge(s) and {duplicateGroups.filter(g => g.items.length === 1).length} cleanup(s)
                    </p>
                  </div>
                  <button
                    onClick={handleMergeDuplicates}
                    disabled={processing || duplicateGroups.every(g => g.items.length < 1)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Process Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
          </div>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onClose={() => {}} className="relative z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-gray-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <Dialog.Title className="text-xl font-bold text-gray-900">
                      Confirm Item Changes
                    </Dialog.Title>
                    <p className="text-sm text-gray-600 mt-1">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    You are about to process <span className="font-semibold">{confirmData?.validGroups.length}</span> item change(s):
                  </p>
                  <div className="space-y-3 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
                    {confirmData?.validGroups.map((group, i) => {
                      const duplicates = group.items.filter(item => item.itemName !== group.masterName);
                      const isCleanup = group.items.length === 1;
                      return (
                        <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-blue-600">{i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              {isCleanup ? (
                                // Single item cleanup/rename
                                <>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <RefreshCw className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <span className="font-semibold text-blue-700">Rename:</span>
                                    <span className="font-medium text-gray-600 line-through">{group.items[0].itemName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <span className="font-semibold text-green-700">To:</span>
                                    <span className="font-medium text-gray-900">{group.masterName}</span>
                                    {hasSpacingIssues(group.masterName || '') && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                        <AlertTriangle className="w-3 h-3" />
                                        {getSpacingIssueText(group.masterName || '')}
                                      </span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                // Multiple items merge
                                <>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <span className="font-semibold text-green-700">Keep:</span>
                                    <span className="font-medium text-gray-900">{group.masterName}</span>
                                    {hasSpacingIssues(group.masterName || '') && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                        <AlertTriangle className="w-3 h-3" />
                                        {getSpacingIssueText(group.masterName || '')}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                    <span className="font-semibold text-red-700">Merge:</span>
                                    <div className="flex-1">
                                      {duplicates.map((item, idx) => (
                                        <div key={idx} className="inline-flex items-center gap-1 mr-2 mb-1">
                                          <span className="text-sm text-gray-600">
                                            {item.itemName}{idx < duplicates.length - 1 ? ',' : ''}
                                          </span>
                                          {hasSpacingIssues(item.itemName) && (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                              <AlertTriangle className="w-2.5 h-2.5" />
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                      <span className="text-xs text-gray-500">
                                        ({duplicates.length} item{duplicates.length !== 1 ? 's' : ''})
                                      </span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900 mb-1">Warning</p>
                      <p className="text-sm text-orange-800">
                        This will update all container items and sales records. Duplicate supplier items will be deleted.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={cancelMerge}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmMerge}
                    className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Confirm Changes
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </DashboardLayout>
    </ProtectedPage>
  );
}
