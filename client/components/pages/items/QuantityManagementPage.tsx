"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  getSupplierItemsForQuantityManagement, 
  bulkAdjustQuantities 
} from "@/services/supplierService";
import { formatCurrency } from "@/utils/format";
import { 
  ArrowLeft, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Save, 
  CheckSquare, 
  Square,
  Factory,
  Calendar,
  Minus,
  Plus
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface QuantityManagementPageProps {
  supplierId: string;
}

type ContainerItem = {
  id: string;
  itemName: string;
  quantity: number;
  receivedQty: number;
  soldQty: number;
  unitPrice: number;
  container: {
    id: string;
    containerNo: string;
    arrivalDate: string;
  };
};

type SupplierData = {
  supplier: {
    id: string;
    name: string;
    country: string;
  };
  items: ContainerItem[];
};

type QuantityAdjustment = {
  itemName: string;
  quantityChange: number;
  reason: string;
};

export default function QuantityManagementPage({ supplierId }: QuantityManagementPageProps) {
  const router = useRouter();
  const [data, setData] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [adjustments, setAdjustments] = useState<Record<string, QuantityAdjustment>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getSupplierItemsForQuantityManagement(supplierId);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch quantity management data:", error);
        toast.error("Failed to load quantity management data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId]);

  const handleToggleItem = (itemName: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName);
      // Remove adjustment when unselecting
      setAdjustments(prev => {
        const newAdjustments = { ...prev };
        delete newAdjustments[itemName];
        return newAdjustments;
      });
    } else {
      newSelected.add(itemName);
      // Initialize adjustment when selecting
      setAdjustments(prev => ({
        ...prev,
        [itemName]: {
          itemName,
          quantityChange: 0,
          reason: "",
        }
      }));
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (!data) return;
    const itemNames = data.items.map(item => item.itemName);
    
    if (selectedItems.size === itemNames.length) {
      setSelectedItems(new Set());
      setAdjustments({});
    } else {
      setSelectedItems(new Set(itemNames));
      const newAdjustments: Record<string, QuantityAdjustment> = {};
      itemNames.forEach(itemName => {
        newAdjustments[itemName] = {
          itemName,
          quantityChange: 0,
          reason: "",
        };
      });
      setAdjustments(newAdjustments);
    }
  };

  const handleAdjustmentChange = (itemName: string, field: keyof QuantityAdjustment, value: string | number) => {
    setAdjustments(prev => ({
      ...prev,
      [itemName]: {
        ...prev[itemName],
        [field]: value,
      }
    }));
  };

  const handleQuickAdjust = (itemName: string, change: number) => {
    const currentAdjustment = adjustments[itemName];
    if (!currentAdjustment) return;
    
    handleAdjustmentChange(itemName, "quantityChange", currentAdjustment.quantityChange + change);
  };

  const handleBulkAdjust = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select items to adjust");
      return;
    }

    const validAdjustments = Array.from(selectedItems)
      .map(itemName => adjustments[itemName])
      .filter(adj => adj && adj.quantityChange !== 0);

    if (validAdjustments.length === 0) {
      toast.error("Please specify quantity changes for selected items");
      return;
    }

    try {
      setSaving(true);
      const result = await bulkAdjustQuantities(supplierId, validAdjustments);
      
      // Refresh data after successful adjustment
      const updatedData = await getSupplierItemsForQuantityManagement(supplierId);
      setData(updatedData);
      
      setSelectedItems(new Set());
      setAdjustments({});
      setBulkMode(false);
      
      const successCount = result.results.filter((r: any) => r.status === 'updated').length;
      toast.success(`Successfully adjusted ${successCount} items`);
    } catch (error) {
      console.error("Failed to bulk adjust quantities:", error);
      toast.error("Failed to adjust quantities");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStockStatus = (item: ContainerItem) => {
    const remaining = item.quantity - item.soldQty;
    if (remaining <= 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' };
    if (remaining < item.quantity * 0.2) return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading quantity management...</span>
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
            <p className="mt-2 text-gray-500">Unable to load quantity management data.</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Quantity Management</h1>
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
                <Package className="w-4 h-4" />
                {bulkMode ? "Exit Bulk Mode" : "Bulk Adjust"}
              </button>
              {bulkMode && (
                <button
                  onClick={handleBulkAdjust}
                  disabled={selectedItems.size === 0 || saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Adjusting..." : `Adjust ${selectedItems.size} Selected`}
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
                <h3 className="text-lg font-semibold text-gray-900">Item Quantities</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {bulkMode ? "Select items and specify quantity adjustments" : "View current stock levels and container information"}
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
                    Current Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Container Info
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Unit Price
                  </th>
                  {bulkMode && (
                    <>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adjustment
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.items.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const remaining = item.quantity - item.soldQty;
                  const adjustment = adjustments[item.itemName];
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                      {bulkMode && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleItem(item.itemName)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {selectedItems.has(item.itemName) ? (
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
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs">
                              {item.itemName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.itemName}
                            </div>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                              {stockStatus.status === 'out' ? 'Out of Stock' : 
                               stockStatus.status === 'low' ? 'Low Stock' : 'In Stock'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-semibold">Total: {item.quantity}</div>
                          <div className="text-xs text-gray-500">Received: {item.receivedQty}</div>
                          <div className="text-xs text-gray-500">Sold: {item.soldQty}</div>
                          <div className="text-xs font-medium">Remaining: {remaining}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{item.container.containerNo}</div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(item.container.arrivalDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(item.unitPrice)}
                        </div>
                      </td>
                      {bulkMode && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {selectedItems.has(item.itemName) && adjustment ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleQuickAdjust(item.itemName, -1)}
                                  className="inline-flex items-center p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  value={adjustment.quantityChange}
                                  onChange={(e) => handleAdjustmentChange(item.itemName, "quantityChange", parseInt(e.target.value) || 0)}
                                  className="block w-20 text-center py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="0"
                                />
                                <button
                                  onClick={() => handleQuickAdjust(item.itemName, 1)}
                                  className="inline-flex items-center p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                {adjustment.quantityChange > 0 && (
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                )}
                                {adjustment.quantityChange < 0 && (
                                  <TrendingDown className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Select to adjust</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {selectedItems.has(item.itemName) && adjustment ? (
                              <input
                                type="text"
                                value={adjustment.reason}
                                onChange={(e) => handleAdjustmentChange(item.itemName, "reason", e.target.value)}
                                className="block w-full py-1 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Adjustment reason..."
                              />
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data.items.length === 0 && (
            <div className="text-center py-16">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                This supplier doesn&apos;t have any container items to manage quantities for.
              </p>
            </div>
          )}
        </div>

        {/* Help Section */}
        {bulkMode && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Quantity Adjustment Help</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Positive numbers increase quantities, negative numbers decrease them</li>
              <li>• Use the +/- buttons for quick adjustments</li>
              <li>• Quantities cannot go below zero</li>
              <li>• Providing a reason for adjustments is recommended for audit purposes</li>
              <li>• Changes are applied to the most recent container for each item</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}