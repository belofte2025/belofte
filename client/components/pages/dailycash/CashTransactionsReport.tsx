"use client";

import { useState } from "react";
import { getCashSalesAndPayments } from "@/services/reportService";
import { toast } from "react-hot-toast";
import {
  TrendingUp,
  CreditCard,
  Receipt,
  Calendar,
  Download,
  Printer,
  Search,
  FileText,
} from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Define proper types
interface SaleItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface CashSaleTransaction {
  id: string;
  type: "cash_sale";
  date: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  itemCount: number;
  items: SaleItem[];
  sourceType: string;
}

interface PaymentTransaction {
  id: string;
  type: "payment";
  date: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentType: string;
  note: string | null;
}

type Transaction = CashSaleTransaction | PaymentTransaction;

interface ReportSummary {
  totalCashSales: number;
  cashSalesCount: number;
  totalPayments: number;
  paymentsCount: number;
  totalRevenue: number;
  totalTransactions: number;
}

interface CashTransactionsReport {
  transactions: Transaction[];
  summary: ReportSummary;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function DailyCash() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<CashTransactionsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setLoading(true);
      const data = await getCashSalesAndPayments(startDate, endDate);
      setReport(data);
      toast.success("Report generated successfully");
    } catch (error) {
      toast.error("Failed to generate report");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!report) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Cash Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #059669;
              border-bottom: 3px solid #059669;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header-info {
              margin-bottom: 30px;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 8px;
            }
            .summary-card h3 {
              margin: 0 0 5px 0;
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
            }
            .summary-card p {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f9fafb;
              padding: 12px;
              text-align: left;
              border-bottom: 2px solid #e5e7eb;
              font-size: 12px;
              text-transform: uppercase;
              color: #6b7280;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:hover {
              background-color: #f9fafb;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            .badge-success {
              background-color: #d1fae5;
              color: #065f46;
            }
            .badge-info {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .total-row {
              font-weight: bold;
              background-color: #f3f4f6;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>Daily Cash Report</h1>
          <div class="header-info">
            <p><strong>Date Range:</strong> ${new Date(
              startDate
            ).toLocaleDateString()} - ${new Date(
      endDate
    ).toLocaleDateString()}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h3>Total Cash Sales</h3>
              <p>₵ ${report.summary.totalCashSales.toFixed(2)}</p>
              <small>${report.summary.cashSalesCount} transactions</small>
            </div>
            <div class="summary-card">
              <h3>Total Payments</h3>
              <p>₵ ${report.summary.totalPayments.toFixed(2)}</p>
              <small>${report.summary.paymentsCount} transactions</small>
            </div>
            <div class="summary-card">
              <h3>Total Revenue</h3>
              <p>₵ ${report.summary.totalRevenue.toFixed(2)}</p>
              <small>${report.summary.totalTransactions} total</small>
            </div>
            <div class="summary-card">
              <h3>Average Transaction</h3>
              <p>₵ ${
                report.summary.totalTransactions > 0
                  ? (
                      report.summary.totalRevenue /
                      report.summary.totalTransactions
                    ).toFixed(2)
                  : "0.00"
              }</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions
                ?.map(
                  (transaction) => `
                <tr>
                  <td>
                    ${new Date(transaction.date).toLocaleDateString()}<br>
                    <small>${new Date(
                      transaction.date
                    ).toLocaleTimeString()}</small>
                  </td>
                  <td>
                    <span class="badge badge-${
                      transaction.type === "cash_sale" ? "success" : "info"
                    }">
                      ${
                        transaction.type === "cash_sale"
                          ? "Cash Sale"
                          : "Payment"
                      }
                    </span>
                  </td>
                  <td>
                    ${transaction.customerName}<br>
                    <small>${transaction.customerPhone}</small>
                  </td>
                  <td style="color: #059669; font-weight: bold;">₵ ${transaction.amount.toFixed(
                    2
                  )}</td>
                  <td>${
                    transaction.type === "cash_sale"
                      ? `${transaction.itemCount} item${
                          transaction.itemCount !== 1 ? "s" : ""
                        }`
                      : transaction.note || "-"
                  }</td>
                </tr>
              `
                )
                .join("")}
              <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td style="color: #059669;">₵ ${report.summary.totalRevenue.toFixed(
                  2
                )}</td>
                <td>${report.summary.totalTransactions} transactions</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExportCSV = () => {
    if (!report) return;

    // Create CSV content
    const headers = [
      "Date",
      "Time",
      "Type",
      "Customer",
      "Phone",
      "Amount",
      "Details",
    ];
    const rows =
      filteredTransactions?.map((t) => [
        new Date(t.date).toLocaleDateString(),
        new Date(t.date).toLocaleTimeString(),
        t.type === "cash_sale" ? "Cash Sale" : "Payment",
        t.customerName,
        t.customerPhone,
        t.amount.toFixed(2),
        t.type === "cash_sale" ? `${t.itemCount} items` : t.note || "-",
      ]) || [];

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      "",
      `"TOTAL","","","","","${report.summary.totalRevenue.toFixed(2)}","${
        report.summary.totalTransactions
      } transactions"`,
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-cash-report-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const handleExportPDF = () => {
    if (!report) return;

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setTextColor(5, 150, 105);
    doc.text("Daily Cash Report", 14, 20);

    // Add date range
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(
        endDate
      ).toLocaleDateString()}`,
      14,
      28
    );
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

    // Add summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Summary", 14, 45);

    doc.setFontSize(9);
    const summaryY = 52;
    doc.text(
      `Total Cash Sales: ₵ ${report.summary.totalCashSales.toFixed(2)} (${
        report.summary.cashSalesCount
      } transactions)`,
      14,
      summaryY
    );
    doc.text(
      `Total Payments: ₵ ${report.summary.totalPayments.toFixed(2)} (${
        report.summary.paymentsCount
      } transactions)`,
      14,
      summaryY + 6
    );
    doc.text(
      `Total Revenue: ₵ ${report.summary.totalRevenue.toFixed(2)} (${
        report.summary.totalTransactions
      } transactions)`,
      14,
      summaryY + 12
    );

    // Add table
    const tableData =
      filteredTransactions?.map((t) => [
        new Date(t.date).toLocaleDateString() +
          "\n" +
          new Date(t.date).toLocaleTimeString(),
        t.type === "cash_sale" ? "Cash Sale" : "Payment",
        t.customerName + "\n" + t.customerPhone,
        `₵ ${t.amount.toFixed(2)}`,
        t.type === "cash_sale"
          ? `${t.itemCount} item${t.itemCount !== 1 ? "s" : ""}`
          : t.note || "-",
      ]) || [];

    autoTable(doc, {
      startY: summaryY + 20,
      head: [["Date & Time", "Type", "Customer", "Amount", "Details"]],
      body: tableData,
      foot: [
        [
          "",
          "",
          "TOTAL",
          `₵ ${report.summary.totalRevenue.toFixed(2)}`,
          `${report.summary.totalTransactions} transactions`,
        ],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: 255,
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: [243, 244, 246],
        textColor: 0,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 50 },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 45 },
      },
    });

    doc.save(`daily-cash-report-${startDate}-to-${endDate}.pdf`);
    toast.success("PDF exported successfully");
  };

  // Filter transactions based on search query
  const filteredTransactions = report?.transactions.filter((transaction) => {
    const query = searchQuery.toLowerCase();
    return (
      transaction.customerName.toLowerCase().includes(query) ||
      transaction.customerPhone.toLowerCase().includes(query) ||
      transaction.amount.toString().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Daily Cash Report
                </h1>
                <p className="text-gray-600">
                  Track all cash sales and payments
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Select Date Range</h3>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? "Loading..." : "Generate Report"}
            </button>
          </div>
        </div>

        {/* Report Content */}
        {report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded">
                    <Receipt className="w-6 h-6 text-green-600" />
                  </div>
                  <Badge variant="success" size="sm">
                    {report.summary.cashSalesCount}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Total Cash Sales
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  ₵ {report.summary.totalCashSales.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <Badge variant="info" size="sm">
                    {report.summary.paymentsCount}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Total Payments
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  ₵ {report.summary.totalPayments.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <Badge variant="default" size="sm">
                    {report.summary.totalTransactions}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Total Revenue
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  ₵ {report.summary.totalRevenue.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-1">
                  Average Transaction
                </h3>
                <p className="text-2xl font-bold text-gray-900">
                  ₵{" "}
                  {report.summary.totalTransactions > 0
                    ? (
                        report.summary.totalRevenue /
                        report.summary.totalTransactions
                      ).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>

            {/* Actions and Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full sm:w-auto">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by customer name, phone, or amount..."
                    className="max-w-md"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  All Transactions
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredTransactions?.length || 0} transactions found
                </p>
              </div>

              <div className="overflow-x-auto">
                {filteredTransactions && filteredTransactions.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.map((transaction: Transaction) => (
                        <tr
                          key={transaction.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.date).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                transaction.type === "cash_sale"
                                  ? "success"
                                  : "info"
                              }
                            >
                              {transaction.type === "cash_sale"
                                ? "Cash Sale"
                                : "Payment"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-gray-900">
                              {transaction.customerName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.customerPhone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            ₵ {transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {transaction.type === "cash_sale"
                              ? `${transaction.itemCount} item${
                                  transaction.itemCount !== 1 ? "s" : ""
                                }`
                              : transaction.note || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-sm font-bold text-gray-900"
                        >
                          TOTAL
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">
                          ₵ {report.summary.totalRevenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                          {report.summary.totalTransactions} transactions
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="p-12 text-center">
                    <p className="text-gray-600 text-lg font-medium mb-2">
                      No transactions found
                    </p>
                    <p className="text-gray-500 text-sm">
                      {searchQuery
                        ? "Try adjusting your search criteria"
                        : "Select a date range to view transactions"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!report && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="p-4 bg-blue-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Generate Your Report
            </h3>
            <p className="text-gray-600 mb-6">
              Select a date range above to view cash sales and payments
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

