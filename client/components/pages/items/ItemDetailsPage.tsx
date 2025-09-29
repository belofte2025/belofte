"use client";

import { useEffect, useState } from "react";
import { updateSupplierItem } from "@/services/supplierService";
import { toast } from "react-hot-toast";
import { ArrowLeft, Package, DollarSign, Factory, Edit, Save, X } from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/utils/format";

interface ItemDetailsPageProps {
  itemId: string;
}

type ItemWithSupplier = {
  id: string;
  itemName: string;
  price: number;
  supplier: {
    id: string;
    suppliername: string;
    country: string;
  };
};

export default function ItemDetailsPage({ itemId }: ItemDetailsPageProps) {
  const [item, setItem] = useState<ItemWithSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    itemName: "",
    price: 0,
  });

  useEffect(() => {
    // Since we don't have a direct getItemById service, 
    // we'll need to get it from the supplier items with sales
    // For now, we'll simulate the data structure
    const mockItem: ItemWithSupplier = {
      id: itemId,
      itemName: "Sample Item",
      price: 25.50,
      supplier: {
        id: "supplier-1",
        suppliername: "Sample Supplier",
        country: "Ghana"
      }
    };
    
    setItem(mockItem);
    setFormData({
      itemName: mockItem.itemName,
      price: mockItem.price,
    });
    setLoading(false);
  }, [itemId]);

  const handleSave = async () => {
    if (!item) return;
    
    try {
      await updateSupplierItem(item.id, formData);
      setItem(prev => prev ? { ...prev, ...formData } : null);
      setEditing(false);
      toast.success("Item updated successfully");
    } catch (error) {
      console.error("Failed to update item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleCancel = () => {
    if (item) {
      setFormData({
        itemName: item.itemName,
        price: item.price,
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading item details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900">Item not found</h3>
            <p className="mt-2 text-gray-500">The item you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/items"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Items
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/items"
                className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{item.itemName}</h1>
                <p className="mt-1 text-gray-600">Item Details & Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h3>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name
                    </label>
                    <div className="relative">
                      <Package className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.itemName}
                        onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (GHS)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.price || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Item Name</p>
                      <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Price per Unit</p>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Factory className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Supplier</p>
                      <p className="text-sm font-medium text-gray-900">
                        {item.supplier.suppliername}
                      </p>
                      <Badge variant="default" className="mt-1">
                        {item.supplier.country}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-5 h-5 text-gray-400 mr-3 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Item ID</p>
                      <p className="text-sm font-mono text-gray-900">{item.id}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href={`/suppliers/${item.supplier.id}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <Factory className="w-4 h-4" />
                  View Supplier
                </Link>
                
                <Link
                  href={`/suppliers/${item.supplier.id}/items`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Package className="w-4 h-4" />
                  All Supplier Items
                </Link>
              </div>
            </div>

            {/* Management Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Management</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href={`/suppliers/${item.supplier.id}/price-management`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <DollarSign className="w-4 h-4" />
                  Manage Prices
                </Link>
                
                <Link
                  href={`/suppliers/${item.supplier.id}/quantity-management`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <Package className="w-4 h-4" />
                  Manage Quantities
                </Link>
              </div>
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* Item Uniqueness */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Uniqueness</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="font-medium text-blue-900 mb-1">Per-Supplier Item</p>
                  <p className="text-blue-800">
                    This item is unique to <strong>{item.supplier.suppliername}</strong>. 
                    Other suppliers may have items with the same name, but they are treated as separate items.
                  </p>
                </div>
              </div>
            </div>

            {/* Item Statistics */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4 text-sm text-gray-500">
                <p>Detailed statistics and sales history for this item would be displayed here.</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Sales:</span>
                    <span className="font-medium">Coming soon</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">Coming soon</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Sale:</span>
                    <span className="font-medium">Coming soon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}