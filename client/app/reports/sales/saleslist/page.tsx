"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Search,
  Calendar,
  Eye,
  Trash2,
  Receipt,
  User,
  List,
  DollarSign,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { listSales, deleteSaleById } from "@/services/salesService";
import toast from "react-hot-toast";

interface SaleItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

interface Sale {
  id: string;
  saleType: string;
  sourceType?: string;
  customer: {
    customerName: string;
  };
  totalAmount: number;
  createdAt: string;
  items: SaleItem[];
}

export default function SalesListPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Set default dates to current week
  const getStartOfWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek.toISOString().split("T")[0];
  };

  const getEndOfWeek = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState(getStartOfWeek());
  const [endDate, setEndDate] = useState(getEndOfWeek());

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const filters: {
        startDate?: string;
        endDate?: string;
      } = {};
      if (startDate) {
        filters.startDate = startDate;
      }
      if (endDate) {
        filters.endDate = endDate;
      }

      const result = await listSales(filters);
      setSales(result);
      setFilteredSales(result);
    } catch (err) {
      console.error("Error loading sales:", err);
      toast.error("Failed to load sales. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const filterSales = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredSales(sales);
      return;
    }

    const filtered = sales.filter(
      (sale) =>
        sale.customer.customerName
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        sale.saleType.toLowerCase().includes(query.toLowerCase()) ||
        sale.id.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredSales(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;

    try {
      await deleteSaleById(id);
      toast.success("Sale deleted successfully.");
      loadSales();
    } catch (err) {
      console.error("Error deleting sale:", err);
      toast.error("Failed to delete sale. Please try again.");
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
    loadSales();
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getSaleTypeColor = (type: string) => {
    return type?.toLowerCase() === "cash"
      ? "bg-green-100 text-green-800"
      : "bg-blue-100 text-blue-800";
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales List</h1>
              <p className="mt-1 text-gray-600">
                {filteredSales.length} sale(s) found
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => filterSales(e.target.value)}
                  placeholder="Search by customer, type, or ID..."
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => filterSales("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Date Filters */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Date Range
                </label>
                {(startDate || endDate) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Date
                    </div>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      End Date
                    </div>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sales List */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading sales...</span>
              </div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
              <div className="text-center">
                <Receipt className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Sales Found
                </h3>
                <p className="text-gray-600">
                  {searchQuery || startDate || endDate
                    ? "Try adjusting your search or date filters"
                    : "No sales have been recorded yet"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Sale Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          sale.saleType?.toLowerCase() === "cash"
                            ? "bg-green-100"
                            : "bg-blue-100"
                        }`}
                      >
                        <DollarSign
                          className={`w-6 h-6 ${
                            sale.saleType?.toLowerCase() === "cash"
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${getSaleTypeColor(
                              sale.saleType
                            )}`}
                          >
                            {sale.saleType?.toUpperCase() || "SALE"}
                          </span>
                          <span className="text-sm text-gray-500">
                            #{sale.id.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/sales/${sale.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Sale"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Sale Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {sale.customer.customerName}
                      </span>
                    </div>

                    <div className="text-right md:text-left">
                      <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(sale.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Sale Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <List className="w-4 h-4" />
                      <span>{sale.items.length} item(s)</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(sale.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
