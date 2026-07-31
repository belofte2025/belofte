"use client";

import { useEffect, useState } from "react";
import { getSupplierItems, addSupplierItem, updateSupplierItem, deleteSupplierItem, getSupplierById } from "@/services/supplierService";
import { formatCurrency } from "@/utils/format";
import { toast } from "react-hot-toast";
import { ArrowLeft, Plus, Trash2, Package, X, TrendingUp, Edit, Search, Tag } from "lucide-react";
import Link from "next/link";
import { Dialog } from "@headlessui/react";

interface SupplierItemsPageProps {
  supplierId: string;
}

type SupplierItem = {
  id: string;
  itemName: string;
  alias?: string | null;
  price: number;
};

type Supplier = {
  id: string;
  suppliername: string;
};

export default function SupplierItemsPage({ supplierId }: SupplierItemsPageProps) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [items, setItems] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: "",
    alias: "",
    price: 0,
  });
  const [bulkItems, setBulkItems] = useState([
    { itemName: "", alias: "", price: 0 }
  ]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierItem | null>(null);
  const [editForm, setEditForm] = useState({ itemName: "", alias: "", price: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  // Filter items based on search
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.itemName.toLowerCase().includes(query) ||
      (item.alias && item.alias.toLowerCase().includes(query))
    );
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supplierData, itemsData] = await Promise.all([
          getSupplierById(supplierId),
          getSupplierItems(supplierId)
        ]);
        setSupplier(supplierData);
        setItems(itemsData);
      } catch (error) {
        console.error("Failed to load supplier items:", error);
        toast.error("Failed to load supplier items");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItem.itemName.trim() || newItem.price <= 0) {
      toast.error("Please provide valid item name and price");
      return;
    }

    try {
      const addedItem = await addSupplierItem(supplierId, newItem);
      setItems(prev => [...prev, addedItem]);
      setNewItem({ itemName: "", alias: "", price: 0 });
      setShowAddModal(false);
      toast.success("Item added successfully");
    } catch (error) {
      console.error("Failed to add item:", error);
      toast.error("Failed to add item");
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      try {
        await deleteSupplierItem(itemId);
        setItems(prev => prev.filter(item => item.id !== itemId));
        toast.success("Item deleted successfully");
      } catch (error) {
        console.error("Failed to delete item:", error);
        toast.error("Failed to delete item");
      }
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = bulkItems.filter(item => item.itemName.trim() && item.price > 0);
    
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item with name and price");
      return;
    }

    try {
      const promises = validItems.map(item =>
        addSupplierItem(supplierId, {
          itemName: item.itemName,
          alias: item.alias,
          price: item.price,
        })
      );

      const addedItems = await Promise.all(promises);
      setItems(prev => [...prev, ...addedItems]);
      setBulkItems([{ itemName: "", alias: "", price: 0 }]);
      setShowBulkAddModal(false);
      toast.success(`${validItems.length} items added successfully`);
    } catch (error) {
      console.error("Failed to add items:", error);
      toast.error("Failed to add some items");
    }
  };

  const addBulkItemRow = () => {
    setBulkItems(prev => [...prev, { itemName: "", alias: "", price: 0 }]);
  };

  const removeBulkItemRow = (index: number) => {
    setBulkItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkItem = (index: number, field: 'itemName' | 'alias' | 'price', value: string | number) => {
    setBulkItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleOpenEditModal = (item: SupplierItem) => {
    setEditingItem(item);
    setEditForm({ itemName: item.itemName, alias: item.alias || "", price: item.price });
    setShowEditModal(true);
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingItem) return;

    if (!editForm.itemName.trim()) {
      toast.error("Item name is required");
      return;
    }

    if (editForm.price <= 0) {
      toast.error("Please provide a valid price");
      return;
    }

    try {
      const updatedItem = await updateSupplierItem(editingItem.id, {
        itemName: editForm.itemName.trim(),
        alias: editForm.alias || undefined,
        price: editForm.price,
      });
      setItems(prev => prev.map(item =>
        item.id === editingItem.id ? updatedItem : item
      ));
      setShowEditModal(false);
      setEditingItem(null);
      toast.success("Item updated successfully");
    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error("Failed to update item");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading supplier items...</span>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/suppliers/${supplierId}`}
                className="icon-btn text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="page-title">
                  {supplier?.suppliername} Items
                </h1>
                <p className="mt-1 text-gray-600">Manage supplier item catalog and pricing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 font-medium rounded hover:bg-blue-50 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
              <button
                onClick={() => setShowBulkAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded shadow-sm hover:bg-blue-700 transition-colors duration-200"
              >
                <Package className="w-5 h-5" />
                Bulk Add Items
              </button>
            </div>
          </div>
        </div>

        {/* Management Tools */}
        <div className="bg-white shadow-sm border border-gray-200 mb-4 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Item Management Tools</h3>
            <p className="text-sm text-gray-500 mt-1">Manage prices, quantities, and aliases for all items in this supplier</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href={`/suppliers/${supplierId}/price-management`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Manage Prices
            </Link>

            <Link
              href={`/suppliers/${supplierId}/quantity-management`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
            >
              <TrendingUp className="w-4 h-4" />
              Manage Quantities
            </Link>

            <Link
              href={`/suppliers/${supplierId}/alias-management`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors duration-200"
            >
              <Tag className="w-4 h-4" />
              Manage Aliases
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div className="bg-white p-6 shadow-sm border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-gray-900">{items.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 shadow-sm border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Price</p>
              <p className="text-3xl font-bold text-green-600">
                {items.length > 0 
                  ? formatCurrency(items.reduce((sum, item) => sum + item.price, 0) / items.length)
                  : formatCurrency(0)
                }
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white shadow-sm border border-gray-200 mb-4 p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by name or alias..."
              className="w-full pl-12 pr-12 py-3 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-2">
              Found {filteredItems.length} of {items.length} items
            </p>
          )}
        </div>

        {/* Items List */}
        <div className="bg-white shadow-sm border border-gray-200">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No items found</h3>
              <p className="mt-2 text-gray-500">Get started by adding your first item.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No matching items</h3>
              <p className="mt-2 text-gray-500">Try adjusting your search query</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alias
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs">
                              {item.itemName.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.itemName}
                            </div>
                            <div className="text-xs text-gray-500">
                              Item #{index + 1}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {item.alias || <span className="text-gray-400 italic">No alias</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(item.price)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                            title="Edit Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.itemName)}
                            className="inline-flex items-center p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Add Item Modal */}
      <Dialog open={showAddModal} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white p-6 shadow-2xl border border-gray-200">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-6">
              Add New Item
            </Dialog.Title>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="itemName"
                    value={newItem.itemName}
                    onChange={(e) => setNewItem(prev => ({ ...prev, itemName: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter item name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-1">
                  Alias (Optional)
                </label>
                <input
                  type="text"
                  id="alias"
                  value={newItem.alias}
                  onChange={(e) => setNewItem(prev => ({ ...prev, alias: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter search alias (e.g., sugar, rice)"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  id="price"
                  value={newItem.price || ""}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                >
                  Add Item
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Bulk Add Items Modal */}
      <Dialog open={showBulkAddModal} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl bg-white p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-6">
              Bulk Add Items
            </Dialog.Title>
            
            <form onSubmit={handleBulkAdd} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Bulk Add Instructions</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Add multiple items at once for faster catalog setup</p>
                  <p>• Click &quot;+ Add Row&quot; to add more items</p>
                  <p>• Only items with both name and price will be saved</p>
                  <p>• Empty rows will be ignored</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 pb-2 border-b">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Item Name</div>
                  <div className="col-span-3">Alias</div>
                  <div className="col-span-3">Price (₵)</div>
                  <div className="col-span-1">Action</div>
                </div>

                {bulkItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <span className="text-sm text-gray-500">{index + 1}</span>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => updateBulkItem(index, 'itemName', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={item.alias}
                        onChange={(e) => updateBulkItem(index, 'alias', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Alias (optional)"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.price || ""}
                        onChange={(e) => updateBulkItem(index, 'price', parseFloat(e.target.value) || 0)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-1">
                      {bulkItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBulkItemRow(index)}
                          className="inline-flex items-center p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                          title="Remove row"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={addBulkItemRow}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </button>
                
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkAddModal(false);
                      setBulkItems([{ itemName: "", alias: "", price: 0 }]);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                  >
                    Add All Items ({bulkItems.filter(item => item.itemName.trim() && item.price > 0).length})
                  </button>
                </div>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={showEditModal} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white p-6 shadow-2xl border border-gray-200">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-6">
              Edit Item
            </Dialog.Title>

            <form onSubmit={handleEditItem} className="space-y-4">
              {/* Item Name */}
              <div>
                <label htmlFor="editItemName" className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="editItemName"
                    value={editForm.itemName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, itemName: e.target.value }))}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                {editForm.itemName !== editingItem?.itemName && (
                  <p className="text-xs text-amber-600 mt-1">
                    Renaming will update all sales, container items, and stock adjustments for this supplier.
                  </p>
                )}
              </div>

              {/* Alias - Editable */}
              <div>
                <label htmlFor="editAlias" className="block text-sm font-medium text-gray-700 mb-1">
                  Alias (Optional)
                </label>
                <input
                  type="text"
                  id="editAlias"
                  value={editForm.alias}
                  onChange={(e) => setEditForm(prev => ({ ...prev, alias: e.target.value }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter search alias (e.g., sugar, rice)"
                />
              </div>

              {/* Price - Editable */}
              <div>
                <label htmlFor="editPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  id="editPrice"
                  value={editForm.price || ""}
                  onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="block w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
