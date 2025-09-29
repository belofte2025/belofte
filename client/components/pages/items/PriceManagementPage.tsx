"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  getSupplierItemsForPriceManagement, 
  bulkUpdatePrices, 
  updateSinglePrice 
} from "@/services/supplierService";
import { formatCurrency } from "@/utils/format";
import { 
  ArrowLeft, 
  DollarSign, 
  Edit, 
  Save, 
  X, 
  Package, 
  CheckSquare, 
  Square,
  Factory
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface PriceManagementPageProps {
  supplierId: string;
}

type SupplierItem = {
  id: string;
  itemName: string;
  price: number;
};

type SupplierData = {
  supplier: {
    id: string;
    name: string;
    country: string;
  };
  items: SupplierItem[];
};

export default function PriceManagementPage({ supplierId }: PriceManagementPageProps) {
  const router = useRouter();
  const [data, setData] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getSupplierItemsForPriceManagement(supplierId);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch price management data:", error);
        toast.error("Failed to load price management data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId]);

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (!data) return;
    if (selectedItems.size === data.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.items.map(item => item.id)));
    }
  };

  const handleEditPrice = (itemId: string, currentPrice: number) => {
    setEditingItem(itemId);
    setEditedPrices(prev => ({ ...prev, [itemId]: currentPrice }));
  };

  const handleSavePrice = async (itemId: string) => {
    const newPrice = editedPrices[itemId];
    if (newPrice === undefined) return;

    try {
      setSaving(true);
      await updateSinglePrice(itemId, newPrice);
      
      // Update local data
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, price: newPrice } : item
          ),
        };
      });
      
      setEditingItem(null);
      toast.success("Price updated successfully");
    } catch (error) {
      console.error("Failed to update price:", error);
      toast.error("Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (itemId: string) => {
    setEditingItem(null);
    setEditedPrices(prev => {
      const newPrices = { ...prev };
      delete newPrices[itemId];
      return newPrices;
    });
  };

  const handleBulkUpdate = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select items to update");
      return;
    }

    const updates = Array.from(selectedItems)
      .map(itemId => {
        const price = editedPrices[itemId];
        if (price === undefined) return null;
        return { itemId, price };
      })
      .filter(Boolean) as { itemId: string; price: number }[];

    if (updates.length === 0) {
      toast.error("Please edit prices for selected items");
      return;
    }

    try {
      setSaving(true);
      await bulkUpdatePrices(supplierId, updates);
      
      // Update local data
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item => {
            const update = updates.find(u => u.itemId === item.id);
            return update ? { ...item, price: update.price } : item;
          }),
        };
      });
      
      setSelectedItems(new Set());
      setEditedPrices({});
      setBulkMode(false);
      toast.success(`Updated ${updates.length} prices successfully`);
    } catch (error) {
      console.error("Failed to bulk update prices:", error);
      toast.error("Failed to update prices");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkPriceChange = (itemId: string, price: number) => {
    setEditedPrices(prev => ({ ...prev, [itemId]: price }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading price management...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900">No data available</h3>
            <p className="mt-2 text-gray-500">Unable to load price management data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/suppliers/${supplierId}/items`}
                className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Price Management</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Factory className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-600">{data.supplier.name} ({data.supplier.country})</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  bulkMode
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                {bulkMode ? "Exit Bulk Mode" : "Bulk Edit"}
              </button>
              {bulkMode && (
                <button
                  onClick={handleBulkUpdate}
                  disabled={selectedItems.size === 0 || saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : `Update ${selectedItems.size} Selected`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Item Prices</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {bulkMode ? "Select items and edit prices to update in bulk" : "Click edit to change individual prices"}
                </p>
              </div>
              {bulkMode && (
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {selectedItems.size === data.items.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selectedItems.size === data.items.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {bulkMode && (
                    <th className="w-12 px-6 py-4 text-left">
                      <span className="sr-only">Select</span>
                    </th>
                  )}
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  {bulkMode && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Price
                    </th>
                  )}
                  {!bulkMode && (
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                    {bulkMode && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleItem(item.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedItems.has(item.id) ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                            {item.itemName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.itemName}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {item.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    </td>
                    {bulkMode && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {selectedItems.has(item.id) ? (
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              value={editedPrices[item.id] ?? item.price}
                              onChange={(e) => handleBulkPriceChange(item.id, parseFloat(e.target.value) || 0)}
                              className="block w-32 pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Select to edit</span>
                        )}
                      </td>
                    )}
                    {!bulkMode && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingItem === item.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                              <input
                                type="number"
                                value={editedPrices[item.id] ?? item.price}
                                onChange={(e) => setEditedPrices(prev => ({
                                  ...prev,
                                  [item.id]: parseFloat(e.target.value) || 0
                                }))}
                                className="block w-24 pl-6 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                                autoFocus
                              />
                            </div>
                            <button
                              onClick={() => handleSavePrice(item.id)}
                              disabled={saving}
                              className="inline-flex items-center p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-all duration-200"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelEdit(item.id)}
                              className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditPrice(item.id, item.price)}
                            className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                            title="Edit Price"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.items.length === 0 && (
            <div className="text-center py-16">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                This supplier doesn&apos;t have any items to manage prices for.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}