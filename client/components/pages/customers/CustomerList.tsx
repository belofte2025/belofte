"use client";

import { useEffect, useState } from "react";
import { getCustomers } from "@/services/customerService";
import { formatCurrency } from "@/utils/format";
import ActionModal from "@/components/shared/ActionModal";
import { PlusCircle, Eye, Users, TrendingDown, Wallet } from "lucide-react";
import Link from "next/link";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import clsx from "clsx";

type Customer = {
  id: string;
  name: string;
  phone: string;
  balance: number;
};

const ITEMS_PER_PAGE = 10;

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch((err) => console.error("Failed to load customers", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);
  const positiveBalance = customers.filter((c) => c.balance > 0).length;

  const balanceColor = (b: number) =>
    b > 0 ? "text-red-600" : b < 0 ? "text-green-600" : "text-gray-900";

  const balanceVariant = (b: number): "danger" | "success" | "default" =>
    b > 0 ? "danger" : b < 0 ? "success" : "default";

  const balanceLabel = (b: number) =>
    b > 0 ? "Owes Money" : b < 0 ? "Credit" : "Clear";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <Link href="/customers/new" className="btn btn-primary">
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Add Customer</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card flex items-center gap-3">
          <div className="bg-blue-50 rounded-xl p-2.5 flex-shrink-0">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="stat-label">Customers</p>
            <p className="stat-value">{customers.length}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="bg-red-50 rounded-xl p-2.5 flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="stat-label">With Debt</p>
            <p className="stat-value text-red-600">{positiveBalance}</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="bg-orange-50 rounded-xl p-2.5 flex-shrink-0">
            <Wallet className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="stat-label">Total Balance</p>
            <p className={`stat-value ${balanceColor(totalBalance)}`}>{formatCurrency(totalBalance)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          placeholder="Search by name or phone..."
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
            {paginatedCustomers.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-10">No customers found</p>
            ) : (
              paginatedCustomers.map((c) => (
                <div key={c.id} className="mobile-list-item flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${balanceColor(c.balance)}`}>
                      {formatCurrency(c.balance)}
                    </p>
                    <Badge variant={balanceVariant(c.balance)} className="text-[10px] mt-0.5">
                      {balanceLabel(c.balance)}
                    </Badge>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(c)}
                    className="icon-btn text-gray-400 hover:text-blue-600 hover:bg-blue-50 flex-shrink-0"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="table-wrapper hidden lg:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="text-gray-600">{c.phone}</td>
                    <td className={`font-semibold ${balanceColor(c.balance)}`}>{formatCurrency(c.balance)}</td>
                    <td>
                      <Badge variant={balanceVariant(c.balance)}>{balanceLabel(c.balance)}</Badge>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="icon-btn text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

      <ActionModal
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </div>
  );
}
