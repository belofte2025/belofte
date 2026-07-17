"use client";

import { useEffect, useState } from "react";
import { getSuppliers, deleteSupplier } from "@/services/supplierService";
import { PlusCircle, Eye, Trash2, Building, Package, Factory } from "lucide-react";
import Link from "next/link";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import { toast } from "react-hot-toast";
import clsx from "clsx";

type Supplier = {
  id: string;
  suppliername: string;
  contact: string;
  country: string;
  createdAt: string;
  containers: unknown[];
  items: unknown[];
};

const ITEMS_PER_PAGE = 10;

export default function SupplierListPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getSuppliers()
      .then(setSuppliers)
      .catch(() => toast.error("Failed to load suppliers"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = suppliers.filter(
    (s) =>
      s.suppliername.toLowerCase().includes(search.toLowerCase()) ||
      s.country.toLowerCase().includes(search.toLowerCase()) ||
      s.contact.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Supplier deleted");
    } catch {
      toast.error("Failed to delete supplier");
    }
  };

  const totalContainers = suppliers.reduce((sum, s) => sum + (s.containers?.length || 0), 0);
  const totalItems = suppliers.reduce((sum, s) => sum + (s.items?.length || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Suppliers</h1>
        <Link href="/suppliers/new" className="btn btn-primary">
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Add Supplier</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card flex items-center gap-3">
          <div className="bg-green-50 rounded-xl p-2.5 flex-shrink-0">
            <Factory className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="stat-label">Suppliers</p>
            <p className="stat-value">{suppliers.length}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="bg-blue-50 rounded-xl p-2.5 flex-shrink-0">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="stat-label">Containers</p>
            <p className="stat-value text-blue-600">{totalContainers}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="bg-purple-50 rounded-xl p-2.5 flex-shrink-0">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="stat-label">Items</p>
            <p className="stat-value text-purple-600">{totalItems}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Search by name, country, or contact..."
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          <span className="ml-3 text-sm text-gray-500">Loading...</span>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="mobile-list lg:hidden">
            {paginated.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-10">No suppliers found</p>
            ) : (
              paginated.map((s) => (
                <div key={s.id} className="mobile-list-item">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {s.suppliername.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{s.suppliername}</p>
                      <p className="text-xs text-gray-500">{s.contact} · {s.country}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Link href={`/suppliers/${s.id}`} className="icon-btn text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/suppliers/${s.id}/items`} className="icon-btn text-gray-400 hover:text-green-600 hover:bg-green-50">
                        <Package className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(s.id, s.suppliername)} className="icon-btn text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 pl-13 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Building className="w-3 h-3" />{s.containers?.length || 0} containers</span>
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" />{s.items?.length || 0} items</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="table-wrapper hidden lg:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Contact</th>
                  <th>Country</th>
                  <th>Stats</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {s.suppliername.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.suppliername}</p>
                          <p className="text-xs text-gray-500">Added {new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-600">{s.contact}</td>
                    <td><Badge variant="default">{s.country}</Badge></td>
                    <td>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Building className="w-3 h-3" />{s.containers?.length || 0}</span>
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" />{s.items?.length || 0}</span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/suppliers/${s.id}`} className="icon-btn text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/suppliers/${s.id}/items`} className="icon-btn text-gray-400 hover:text-green-600 hover:bg-green-50">
                          <Package className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(s.id, s.suppliername)} className="icon-btn text-gray-400 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
              <span className="text-xs text-gray-500">
                {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={clsx("px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors", currentPage === 1 ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400" : "border-gray-300 text-gray-700 hover:bg-gray-50")}
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={clsx("px-3 py-1.5 text-xs font-medium rounded-lg transition-colors", currentPage === p ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50")}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={clsx("px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors", currentPage === totalPages ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400" : "border-gray-300 text-gray-700 hover:bg-gray-50")}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
