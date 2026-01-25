"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getSuppliers, getSupplierItems } from "@/services/supplierService";
import { Package, Search, AlertCircle, TrendingDown } from "lucide-react";

interface Supplier {
  id: string;
  suppliername: string;
  country: string;
}

interface SupplierItem {
  id: string;
  itemName: string;
  price: number;
}

export default function ItemTransactionsPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [items, setItems] = useState<SupplierItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierItems = async (supplierId: string) => {
    try {
      setLoadingItems(true);
      const data = await getSupplierItems(supplierId);
      setItems(data || []);
    } catch (error) {
      console.error("Failed to fetch supplier items:", error);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSearchTerm("");
    fetchSupplierItems(supplier.id);
  };

  const handleItemClick = (itemName: string) => {
    if (selectedSupplier) {
      router.push(
        `/reports/item-transactions/${selectedSupplier.id}/${encodeURIComponent(itemName)}`
      );
    }
  };

  const filteredItems = items.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Item Transaction History
            </h1>
          </div>
          <p className="text-gray-600">
            View detailed transaction history for items to identify stock
            discrepancies and negative stock issues.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supplier Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 1: Select Supplier
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {suppliers.map((supplier) => (
                  <button
                    key={supplier.id}
                    onClick={() => handleSupplierSelect(supplier)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedSupplier?.id === supplier.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {supplier.suppliername}
                    </div>
                    <div className="text-sm text-gray-500">
                      {supplier.country}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 2: Select Item
            </h2>

            {!selectedSupplier ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600">
                  Please select a supplier first
                </p>
              </div>
            ) : loadingItems ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm
                        ? "No items found"
                        : "No items available for this supplier"}
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.itemName)}
                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.itemName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ${item.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                About This Report
              </h4>
              <p className="text-sm text-blue-700">
                This report shows all transactions for an item including
                container receipts, sales, and stock adjustments. It calculates
                a running balance to help identify when and why stock went
                negative.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
