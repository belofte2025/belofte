"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getSuppliers, getSupplierItems } from "@/services/supplierService";
import { Package, Search, ChevronRight, Loader2 } from "lucide-react";

interface Supplier {
  id: string;
  suppliername: string;
  country: string;
}

interface FlatItem {
  id: string;
  itemName: string;
  supplierId: string;
  supplierName: string;
}

export default function ItemTransactionsPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allItems, setAllItems] = useState<FlatItem[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all");

  // Load suppliers then all their items in parallel
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSuppliers(true);
        const supplierList: Supplier[] = await getSuppliers();
        setSuppliers(supplierList);
        setLoadingSuppliers(false);

        setLoadingItems(true);
        const results = await Promise.allSettled(
          supplierList.map((s) =>
            getSupplierItems(s.id).then((items: { id: string; itemName: string }[]) =>
              (items || []).map((item) => ({
                id: item.id,
                itemName: item.itemName,
                supplierId: s.id,
                supplierName: s.suppliername,
              }))
            )
          )
        );
        const flat: FlatItem[] = results.flatMap((r) =>
          r.status === "fulfilled" ? r.value : []
        );
        setAllItems(flat);
      } catch (err) {
        console.error("Failed to load item data:", err);
      } finally {
        setLoadingItems(false);
      }
    };
    load();
  }, []);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (selectedSupplierId !== "all") {
      items = items.filter((i) => i.supplierId === selectedSupplierId);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter((i) => i.itemName.toLowerCase().includes(term));
    }
    return items;
  }, [allItems, selectedSupplierId, searchTerm]);

  const handleItemClick = (item: FlatItem) => {
    router.push(
      `/reports/item-transactions/${item.supplierId}/${encodeURIComponent(item.itemName)}`
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Item Transaction History</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Search any item to view its full stock movement — receipts, sales, and adjustments.
            </p>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Item search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items by name…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 w-full"
                autoFocus
              />
            </div>

            {/* Supplier filter */}
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="input sm:w-56"
              disabled={loadingSuppliers}
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.suppliername}
                </option>
              ))}
            </select>
          </div>

          {/* Status line */}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            {loadingItems ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading items…
              </>
            ) : (
              <>
                <Package className="w-3 h-3" />
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                {selectedSupplierId !== "all" && ` from ${suppliers.find(s => s.id === selectedSupplierId)?.suppliername}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </>
            )}
          </div>
        </div>

        {/* Results grid */}
        {loadingSuppliers ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <span className="ml-3 text-sm text-gray-500">Loading…</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
            <Package className="mx-auto w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-900">No items found</p>
            <p className="text-xs text-gray-500 mt-1">
              {searchTerm ? `No items match "${searchTerm}"` : "No items available"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => (
              <button
                key={`${item.supplierId}-${item.itemName}`}
                onClick={() => handleItemClick(item)}
                className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-blue-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.itemName}</p>
                    <p className="text-xs text-gray-400 truncate">{item.supplierName}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
