"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Calendar,
  Receipt,
  FileText,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  TrendingUp,
} from "lucide-react";
import { getAllPayments } from "@/services/paymentService";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

type Payment = {
  id: string;
  amount: number;
  paymentType: string;
  note?: string;
  createdAt: string;
  customer: {
    id: string;
    customerName: string;
    phone: string;
  };
};

type PaymentsResponse = {
  payments: Payment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
  };
  summary: {
    totalAmount: number;
    totalPayments: number;
  };
};

export default function AllPaymentsReport() {
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    paymentType: "",
    page: 1,
    limit: 50,
  });

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllPayments({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        paymentType: filters.paymentType || undefined,
        page: filters.page,
        limit: filters.limit,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to load payments:", error);
      toast.error("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPayments();
  }, [filters.page, loadPayments]);

  const handleFilterSubmit = () => {
    setFilters({ ...filters, page: 1 });
    loadPayments();
  };

  const exportToPDF = () => {
    if (!data || data.payments.length === 0) return;

    // This would integrate with jsPDF in production
    // For now, we'll create a simple data export
    const csvData = [
      ["#", "Date", "Customer", "Phone", "Type", "Amount", "Note"],
      ...data.payments.map((payment, index) => [
        index + 1 + (filters.page - 1) * filters.limit,
        new Date(payment.createdAt).toLocaleDateString(),
        payment.customer.customerName,
        payment.customer.phone,
        payment.paymentType,
        payment.amount,
        payment.note || "-",
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("CSV exported successfully!");
  };

  const cashPayments =
    data?.payments.filter((p) => p.paymentType === "CASH").length || 0;
  const bankPayments =
    data?.payments.filter((p) => p.paymentType === "BANK").length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-4">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">All Payments Report</h1>
              <button
                onClick={exportToPDF}
                disabled={!data || data.payments.length === 0}
                className="btn btn-success"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
          </div>

          {/* Filters */}
          <div className="bg-white shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Type
                  </label>
                  <select
                    value={filters.paymentType}
                    onChange={(e) =>
                      setFilters({ ...filters, paymentType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleFilterSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => {
                    setFilters({
                      startDate: "",
                      endDate: "",
                      paymentType: "",
                      page: 1,
                      limit: 50,
                    });
                    setTimeout(() => loadPayments(), 0);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {data && (
            <div className="stats-grid">
              <div className="stat-card">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Payments
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.summary.totalPayments}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Receipt className="w-6 h-6 text-blue-600" />
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(data.summary.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Average Payment
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(
                      data.summary.totalPayments > 0
                        ? data.summary.totalAmount /
                            data.summary.totalPayments
                        : 0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>

              <div className="stat-card">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Payment Methods
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    <span className="text-blue-600">{cashPayments}</span> Cash
                    / <span className="text-green-600">{bankPayments}</span>{" "}
                    Bank
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          )}

          {/* Payments Table */}
          <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Payment Records
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600" />
                <span className="ml-3 text-gray-600">Loading payments...</span>
              </div>
            ) : !data || data.payments.length === 0 ? (
              <div className="text-center py-16">
                <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Payments Found
                </h3>
                <p className="text-gray-600">
                  No payment records match your filter criteria.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.payments.map((payment, index) => (
                        <tr
                          key={payment.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1 + (filters.page - 1) * filters.limit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(payment.createdAt).toLocaleDateString(
                                undefined,
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {payment.customer.customerName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {payment.customer.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.paymentType === "CASH"
                                  ? "bg-blue-100 text-blue-700"
                                  : payment.paymentType === "BANK"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {payment.paymentType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                            {payment.note || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {(filters.page - 1) * filters.limit + 1} to{" "}
                    {Math.min(
                      filters.page * filters.limit,
                      data.pagination.totalCount
                    )}{" "}
                    of {data.pagination.totalCount} payments
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setFilters({ ...filters, page: filters.page - 1 })
                      }
                      disabled={filters.page === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {filters.page} of {data.pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setFilters({ ...filters, page: filters.page + 1 })
                      }
                      disabled={filters.page >= data.pagination.totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
      </div>
    </DashboardLayout>
  );
}
