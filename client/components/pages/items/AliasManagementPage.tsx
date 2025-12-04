"use client";

import { useEffect, useState } from "react";
import {
  getSupplierItemsForAliasManagement,
  bulkUpdateAliases,
  updateSupplierItem
} from "@/services/supplierService";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Package,
  CheckSquare,
  Square,
  Factory,
  Upload,
  Download,
  FileSpreadsheet
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import * as XLSX from 'xlsx';

interface AliasManagementPageProps {
  supplierId: string;
}

type SupplierItem = {
  id: string;
  itemName: string;
  alias?: string | null;
  price: number;
};

interface ImportedRow {
  'Item ID'?: string;
  'Current Alias'?: string;
  'Alias'?: string;
  'New Alias'?: string;
  [key: string]: string | undefined;
}

type SupplierData = {
  supplier: {
    id: string;
    name: string;
    country: string;
  };
  items: SupplierItem[];
};

export default function AliasManagementPage({ supplierId }: AliasManagementPageProps) {
  const [data, setData] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editedAliases, setEditedAliases] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getSupplierItemsForAliasManagement(supplierId);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch alias management data:", error);
        toast.error("Failed to load alias management data");
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

  const handleEditAlias = (itemId: string, currentAlias?: string | null) => {
    setEditingItem(itemId);
    setEditedAliases(prev => ({ ...prev, [itemId]: currentAlias || "" }));
  };

  const handleSaveAlias = async (itemId: string) => {
    const newAlias = editedAliases[itemId];
    if (newAlias === undefined) return;

    const item = data?.items.find(i => i.id === itemId);
    if (!item) return;

    try {
      setSaving(true);
      await updateSupplierItem(itemId, {
        itemName: item.itemName,
        alias: newAlias || undefined,
        price: item.price
      });

      // Update local data
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, alias: newAlias || null } : item
          ),
        };
      });

      setEditingItem(null);
      toast.success("Alias updated successfully");
    } catch (error) {
      console.error("Failed to update alias:", error);
      toast.error("Failed to update alias");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = (itemId: string) => {
    setEditingItem(null);
    setEditedAliases(prev => {
      const newAliases = { ...prev };
      delete newAliases[itemId];
      return newAliases;
    });
  };

  const handleBulkUpdate = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select items to update");
      return;
    }

    const updates = Array.from(selectedItems)
      .map(itemId => {
        const alias = editedAliases[itemId];
        if (alias === undefined) return null;
        return { itemId, alias: alias || undefined };
      })
      .filter(Boolean) as { itemId: string; alias?: string }[];

    if (updates.length === 0) {
      toast.error("Please edit aliases for selected items");
      return;
    }

    try {
      setSaving(true);
      await bulkUpdateAliases(supplierId, updates);

      // Update local data
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item => {
            const update = updates.find(u => u.itemId === item.id);
            return update ? { ...item, alias: update.alias || null } : item;
          }),
        };
      });

      setSelectedItems(new Set());
      setEditedAliases({});
      setBulkMode(false);
      toast.success(`Updated ${updates.length} aliases successfully`);
    } catch (error) {
      console.error("Failed to bulk update aliases:", error);
      toast.error("Failed to update aliases");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAliasChange = (itemId: string, alias: string) => {
    setEditedAliases(prev => ({ ...prev, [itemId]: alias }));
  };

  const handleExportToExcel = () => {
    if (!data) return;

    const exportData = data.items.map(item => ({
      'Item ID': item.id,
      'Item Name': item.itemName,
      'Current Alias': item.alias || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Items");

    // Auto-size columns
    const colWidths = [
      { wch: 40 }, // Item ID
      { wch: 30 }, // Item Name
      { wch: 30 }, // Current Alias
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `${data.supplier.name}_Aliases_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Excel file downloaded successfully");
  };

  const handleImportFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ImportedRow[];

        // Map the imported data to our format
        const importedAliases: Record<string, string> = {};
        let matchedCount = 0;

        jsonData.forEach(row => {
          const itemId = row['Item ID'];
          const newAlias = row['Current Alias'] || row['Alias'] || row['New Alias'] || '';

          if (itemId && typeof itemId === 'string') {
            importedAliases[itemId] = newAlias;
            matchedCount++;
          }
        });

        if (matchedCount === 0) {
          toast.error("No valid items found in Excel file. Please ensure your file has 'Item ID' and 'Current Alias' columns.");
          return;
        }

        // Set the imported aliases as edited aliases
        setEditedAliases(importedAliases);

        // Select all items that were imported
        const importedIds = new Set(Object.keys(importedAliases));
        setSelectedItems(importedIds);

        // Switch to bulk mode
        setBulkMode(true);

        toast.success(`Imported ${matchedCount} item aliases from Excel`);
      } catch (error) {
        console.error("Failed to import Excel file:", error);
        toast.error("Failed to import Excel file. Please check the format.");
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset the file input
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading alias management...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900">No data available</h3>
            <p className="mt-2 text-gray-500">Unable to load alias management data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/suppliers/${supplierId}/items`}
                className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Alias Management</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Factory className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-600">{data.supplier.name} ({data.supplier.country})</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportToExcel}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors duration-200 cursor-pointer">
                <Upload className="w-4 h-4" />
                Import from Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFromExcel}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded font-medium transition-all duration-200 ${
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : `Update ${selectedItems.size} Selected`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <div className="flex gap-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Excel Import/Export</h3>
              <p className="text-sm text-blue-700 mt-1">
                Export items to Excel, add aliases, and import back for bulk updates.
                The Excel file must contain columns: Item ID, Item Name, and Current Alias.
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Item Aliases</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {bulkMode ? "Select items and edit aliases to update in bulk" : "Click edit to change individual aliases"}
                </p>
              </div>
              {bulkMode && (
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
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
                    Item Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Alias
                  </th>
                  {bulkMode && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      New Alias
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
                      <span className="text-sm text-gray-600">
                        {item.alias || <span className="text-gray-400 italic">No alias</span>}
                      </span>
                    </td>
                    {bulkMode && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {selectedItems.has(item.id) ? (
                          <input
                            type="text"
                            value={editedAliases[item.id] ?? (item.alias || "")}
                            onChange={(e) => handleBulkAliasChange(item.id, e.target.value)}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter alias..."
                          />
                        ) : (
                          <span className="text-sm text-gray-400">Select to edit</span>
                        )}
                      </td>
                    )}
                    {!bulkMode && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingItem === item.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <input
                              type="text"
                              value={editedAliases[item.id] ?? (item.alias || "")}
                              onChange={(e) => setEditedAliases(prev => ({
                                ...prev,
                                [item.id]: e.target.value
                              }))}
                              className="block w-48 px-3 py-2 text-sm border border-gray-300 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter alias..."
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveAlias(item.id)}
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
                            onClick={() => handleEditAlias(item.id, item.alias)}
                            className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                            title="Edit Alias"
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
                This supplier doesn&apos;t have any items to manage aliases for.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
