"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getItemTransactionHistory } from "@/services/reportService";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingDown,
  Package,
  AlertTriangle,
  ChevronLeft,
  FileText,
} from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  type: "inward" | "sale" | "adjustment";
  description: string;
  reference: string;
  quantity: number;
  balance: number;
  details?: any;
}

interface Summary {
  totalInward: number;
  totalSold: number;
  totalAdjustments: number;
  currentBalance: number;
  hasNegativeStock: boolean;
  negativeOccurrences: number;
  firstNegativeDate: string | null;
}

interface ReportData {
  supplier: {
    id: string;
    name: string;
    country: string;
  };
  itemName: string;
  summary: Summary;
  transactions: Transaction[];
  negativePoints: Array<{
    date: string;
    balance: number;
    transaction: string;
  }>;
}

export default function ItemTransactionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.supplierId as string;
  const itemName = decodeURIComponent(params.itemName as string);

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [supplierId, itemName]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getItemTransactionHistory(supplierId, itemName);
      setReportData(data);
    } catch (err) {
      console.error("Failed to fetch transaction history:", err);
      setError("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "inward":
        return <ArrowDownCircle className="w-5 h-5 text-green-600" />;
      case "sale":
        return <ArrowUpCircle className="w-5 h-5 text-red-600" />;
      case "adjustment":
        return <TrendingDown className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionBadgeColor = (type: string) => {
    switch (type) {
      case "inward":
        return "bg-green-100 text-green-800";
      case "sale":
        return "bg-red-100 text-red-800";
      case "adjustment":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !reportData) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              {error || "Failed to load report"}
            </h3>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { supplier, summary, transactions, negativePoints } = reportData;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Item Transaction History
              </h1>
              <p className="text-gray-600">
                {itemName} - {supplier.name} ({supplier.country})
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <ArrowDownCircle className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-medium text-gray-600">
                Total Received
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summary.totalInward}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <ArrowUpCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-medium text-gray-600">Total Sold</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summary.totalSold}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-600">
                Total Adjustments
              </h3>
            </div>
            <p
              className={`text-2xl font-bold ${
                summary.totalAdjustments < 0
                  ? "text-red-600"
                  : summary.totalAdjustments > 0
                  ? "text-green-600"
                  : "text-gray-900"
              }`}
            >
              {summary.totalAdjustments > 0 ? "+" : ""}
              {summary.totalAdjustments}
            </p>
          </div>

          <div
            className={`rounded-lg shadow-sm border p-6 ${
              summary.hasNegativeStock
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {summary.hasNegativeStock ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <Package className="w-5 h-5 text-green-600" />
              )}
              <h3
                className={`text-sm font-medium ${
                  summary.hasNegativeStock ? "text-red-800" : "text-green-800"
                }`}
              >
                Current Balance
              </h3>
            </div>
            <p
              className={`text-2xl font-bold ${
                summary.hasNegativeStock ? "text-red-900" : "text-green-900"
              }`}
            >
              {summary.currentBalance}
            </p>
          </div>
        </div>

        {/* Negative Stock Alert */}
        {summary.hasNegativeStock && negativePoints.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Negative Stock Detected
                </h3>
                <p className="text-red-700 mb-4">
                  This item went into negative stock {negativePoints.length}{" "}
                  time(s). First occurrence:{" "}
                  {formatDate(negativePoints[0].date)}
                </p>
                <div className="bg-white rounded-lg p-4 space-y-2">
                  {negativePoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm border-b border-gray-200 last:border-0 pb-2 last:pb-0"
                    >
                      <span className="text-gray-700">{point.transaction}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500">
                          {formatDate(point.date)}
                        </span>
                        <span className="font-semibold text-red-600">
                          Balance: {point.balance}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              All Transactions ({transactions.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Running Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn, idx) => (
                  <tr
                    key={txn.id + idx}
                    className={`hover:bg-gray-50 ${
                      txn.balance < 0 ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(txn.type)}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionBadgeColor(
                            txn.type
                          )}`}
                        >
                          {txn.type.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {txn.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {txn.reference}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                        txn.quantity > 0
                          ? "text-green-600"
                          : txn.quantity < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {txn.quantity > 0 ? "+" : ""}
                      {txn.quantity}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                        txn.balance < 0
                          ? "text-red-600"
                          : txn.balance === 0
                          ? "text-gray-600"
                          : "text-gray-900"
                      }`}
                    >
                      {txn.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formula Explanation */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                Balance Calculation
              </h4>
              <p className="text-sm text-blue-700">
                Running Balance = Total Received - Total Sold + Total
                Adjustments. Each transaction shows the balance at that point
                in time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
