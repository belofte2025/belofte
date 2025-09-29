"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addSupplierItem } from "@/services/supplierService";
import { getSuppliers } from "@/services/supplierService";
import { toast } from "react-hot-toast";
import { ArrowLeft, Package, DollarSign, Factory, X, Plus } from "lucide-react";
import Link from "next/link";

type Supplier = {
  id: string;
  suppliername: string;
  country: string;
};

export default function AddItemForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [bulkMode, setBulkMode] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: "",
    itemName: "",
    price: 0,
  });
  const [bulkItems, setBulkItems] = useState([
    { itemName: "", price: 0 }
  ]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await getSuppliers();
        setSuppliers(data);
      } catch (error) {
        console.error("Failed to load suppliers:", error);
        toast.error("Failed to load suppliers");
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId || !formData.itemName.trim() || formData.price <= 0) {
      toast.error("Please fill in all required fields with valid data");
      return;
    }

    setLoading(true);
    try {
      await addSupplierItem(formData.supplierId, {
        itemName: formData.itemName,
        price: formData.price,
      });
      toast.success("Item added successfully");
      router.push("/items");
    } catch (error) {
      console.error("Failed to create item:", error);
      toast.error("Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) || 0 : value
    }));
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId) {
      toast.error("Please select a supplier first");
      return;
    }
    
    const validItems = bulkItems.filter(item => item.itemName.trim() && item.price > 0);
    
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item with name and price");
      return;
    }

    setLoading(true);
    try {
      const promises = validItems.map(item => 
        addSupplierItem(formData.supplierId, {
          itemName: item.itemName,
          price: item.price,
        })
      );
      
      await Promise.all(promises);
      toast.success(`${validItems.length} items added successfully`);
      router.push("/items");
    } catch (error) {
      console.error("Failed to create items:", error);
      toast.error("Failed to create some items");
    } finally {
      setLoading(false);
    }
  };

  const addBulkItemRow = () => {
    setBulkItems(prev => [...prev, { itemName: "", price: 0 }]);
  };

  const removeBulkItemRow = (index: number) => {
    setBulkItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkItem = (index: number, field: 'itemName' | 'price', value: string | number) => {
    setBulkItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Check if item name already exists for selected supplier
  const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
  
  // Check for potential duplicates across all suppliers
  const duplicateWarning = formData.itemName.trim() && formData.supplierId ? (
    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800">
        <strong>Note:</strong> This item name may already exist with other suppliers. 
        Each supplier can have their own version of items with the same name.
      </p>
    </div>
  ) : null;

  if (loadingSuppliers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading suppliers...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/items"
              className="inline-flex items-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{bulkMode ? 'Bulk Add Items' : 'Add New Item'}</h1>
              <p className="mt-1 text-gray-600">{bulkMode ? 'Add multiple items at once for a supplier' : 'Create a new item for a supplier'}</p>
            </div>
          </div>
          <div className="mb-6">
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setBulkMode(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  !bulkMode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Single Item
              </button>
              <button
                type="button"
                onClick={() => setBulkMode(true)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  bulkMode
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="w-4 h-4 inline mr-1" />
                Bulk Add
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={bulkMode ? handleBulkSubmit : handleSubmit} className="p-6 space-y-6">
            {/* Supplier Selection */}
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-2">
                Supplier *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Factory className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="supplierId"
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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
                <p className="mt-2 text-sm text-gray-500">
                  Selected: <strong>{selectedSupplier.suppliername}</strong> from {selectedSupplier.country}
                </p>
              )}
            </div>

            {bulkMode ? (
              /* Bulk Items Section */
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Bulk Add Instructions</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• Add multiple items at once for the selected supplier</p>
                    <p>• Click &quot;+ Add Row&quot; to add more items</p>
                    <p>• Only rows with both name and price will be saved</p>
                    <p>• Empty rows will be ignored during submission</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 pb-2 border-b">
                    <div className="col-span-1">#</div>
                    <div className="col-span-7">Item Name</div>
                    <div className="col-span-3">Price (GHS)</div>
                    <div className="col-span-1">Action</div>
                  </div>
                  
                  {bulkItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1">
                        <span className="text-sm text-gray-500">{index + 1}</span>
                      </div>
                      <div className="col-span-7">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => updateBulkItem(index, 'itemName', e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter item name (e.g., Rice, Sugar, Oil)"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={item.price || ""}
                          onChange={(e) => updateBulkItem(index, 'price', parseFloat(e.target.value) || 0)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                <button
                  type="button"
                  onClick={addBulkItemRow}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </button>
              </div>
            ) : (
              /* Single Item Section */
              <>
            {/* Item Name */}
            <div>
              <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="itemName"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter item name (e.g., Rice, Vegetable Oil, Sugar)"
                  required
                />
              </div>
              {duplicateWarning}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price per Unit (GHS) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price || ""}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter the unit price for this item from the selected supplier
              </p>
            </div>

              {/* Uniqueness Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Item Uniqueness</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Each item is unique per supplier (different suppliers can have items with the same name)</p>
                  <p>• Items are identified by their unique ID, not just the name</p>
                  <p>• This allows tracking of the same product from different suppliers separately</p>
                </div>
              </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/items"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Creating..." : bulkMode ? `Add All Items (${bulkItems.filter(item => item.itemName.trim() && item.price > 0).length})` : "Create Item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}