"use client";
import { useEffect, useState } from "react";
import {
  getCustomerStatement,
  getCustomerById,
} from "@/services/customerService";
import { getSaleById } from "@/services/salesService";
import {
  createPDFReport,
  addPDFTable,
  addPDFSummarySection,
  formatPDFCurrency,
  savePDF,
} from "@/lib/pdfTemplates";
import {
  Calendar,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  User,
  X,
  ShoppingCart,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";
import toast from "react-hot-toast";

type StatementEntry = {
  id: string;
  date: string;
  type: "credit_sale" | "payment" | "debt" | "credit_note";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  status: string;
};

type StatementResponse = {
  statement: StatementEntry[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    currentBalance: number;
    totalTransactions: number;
  };
};

type Props = {
  customerId: string;
};

export default function CustomerStatement({ customerId }: Props) {
  const [statementData, setStatementData] = useState<StatementResponse | null>(
    null
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

  // Sale detail modal
  const [modalSale, setModalSale] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const openSaleModal = async (saleId: string) => {
    setModalLoading(true);
    setModalSale(null);
    try {
      const data = await getSaleById(saleId);
      setModalSale(data);
    } catch {
      toast.error("Could not load sale details");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => setModalSale(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch customer name if not already loaded
        if (!customerName) {
          const customerData = await getCustomerById(customerId);
          setCustomerName(customerData.customerName || customerData.name);
        }
        // Fetch statement data
        const data = await getCustomerStatement(customerId, fromDate, toDate);
        setStatementData(data);
      } catch {
        toast.error("Failed to fetch statement data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId, fromDate, toDate, customerName]);

  // Filter entries by date range if dates are provided
  const entries = statementData?.statement || [];
  const filteredEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && entryDate < from) return false;
    if (to && entryDate > to) return false;
    return true;
  });

  const exportToPDF = () => {
    // Create PDF with standardized header and company branding
    const subtitle = fromDate || toDate
      ? `Period: ${fromDate || "Start"} to ${toDate || "End"}`
      : undefined;

    const { doc, headerEndY } = createPDFReport({
      title: `Customer Statement - ${customerName}`,
      subtitle,
      filename: `statement_${customerName}`,
      orientation: "portrait",
    });

    // Add summary section - start after header with proper spacing
    const summaryY = addPDFSummarySection(
      doc,
      [
        { label: "Total Debits", value: formatPDFCurrency(totalDebits) },
        { label: "Total Credits", value: formatPDFCurrency(totalCredits) },
        { label: "Current Balance", value: formatPDFCurrency(finalBalance), highlight: true },
        { label: "Transactions", value: filteredEntries.length.toString() },
      ],
      headerEndY + 10, // Start after header with 10pt spacing
      "Account Summary"
    );

    // Add transaction table with proper column widths (in points)
    addPDFTable(
      doc,
      filteredEntries.map((e) => [
        new Date(e.date).toLocaleDateString(),
        e.type.replace("_", " ").toUpperCase(),
        e.description,
        e.debit > 0 ? formatPDFCurrency(e.debit) : "-",
        e.credit > 0 ? formatPDFCurrency(e.credit) : "-",
        formatPDFCurrency(e.balance),
      ]),
      ["Date", "Type", "Description", "Debit", "Credit", "Balance"],
      summaryY + 5,
      {
        columnStyles: {
          0: { cellWidth: 70 },  // Date column
          1: { cellWidth: 85 },  // Type column
          2: { cellWidth: 140 }, // Description column
          3: { cellWidth: 90, halign: "right" },  // Debit column
          4: { cellWidth: 90, halign: "right" },  // Credit column
          5: { cellWidth: 90, halign: "right" },  // Balance column
        },
      }
    );

    savePDF(doc, `statement_${customerName}`);
  };

  // Calculate summary statistics from filtered entries
  const totalDebits = filteredEntries.reduce(
    (sum, entry) => sum + entry.debit,
    0
  );
  const totalCredits = filteredEntries.reduce(
    (sum, entry) => sum + entry.credit,
    0
  );
  // filteredEntries is newest-first; [0] is the most recent transaction = current balance
  const finalBalance =
    filteredEntries.length > 0 ? filteredEntries[0].balance : 0;
  const netChange = totalDebits - totalCredits;

  // Get transaction type badge
  const getTypeBadge = (type: string, description?: string) => {
    const isDebtSettlement = type === "payment" && description?.startsWith("Debt settled:");
    const badges: Record<string, { label: string; color: string }> = {
      credit_sale:     { label: "Credit Sale",     color: "bg-blue-100 text-blue-800" },
      payment:         { label: isDebtSettlement ? "Debt Settled" : "Payment", color: isDebtSettlement ? "bg-teal-100 text-teal-800" : "bg-green-100 text-green-800" },
      debt:            { label: "Debt",             color: "bg-red-100 text-red-800" },
      credit_note:     { label: "Credit Note",      color: "bg-purple-100 text-purple-800" },
    };
    const badge = badges[type as keyof typeof badges] || {
      label: type,
      color: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {customerName ? customerName.charAt(0).toUpperCase() : "C"}
            </div>
            <div>
              <h1 className="page-title">
                Customer Statement
              </h1>
              <p className="mt-1 text-gray-600">
                Account activity for {customerName || "Loading..."}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
          <div className="bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Debits
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDebits)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Credits
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalCredits)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Change</p>
                <p
                  className={`text-2xl font-bold ${
                    netChange > 0
                      ? "text-red-600"
                      : netChange < 0
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}
                >
                  {formatCurrency(netChange)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Current Balance
                </p>
                <p
                  className={`text-2xl font-bold ${
                    finalBalance > 0
                      ? "text-red-600"
                      : finalBalance < 0
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}
                >
                  {formatCurrency(finalBalance)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <User className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  From Date
                </div>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  To Date
                </div>
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
            <div>
              <button
                onClick={exportToPDF}
                disabled={filteredEntries.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded shadow-sm hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Statement Table */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading statement...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Transactions Found
              </h3>
              <p className="text-gray-600">
                No transactions were found for the selected date range.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      onClick={() => entry.type === "credit_sale" ? openSaleModal(entry.id) : undefined}
                      className={`transition-colors duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } ${entry.type === "credit_sale" ? "cursor-pointer hover:bg-blue-50" : "hover:bg-gray-50"}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getTypeBadge(entry.type, entry.description)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="max-w-xs truncate" title={entry.description}>
                            {entry.description}
                          </div>
                          {entry.type === "credit_sale" && (
                            <ShoppingCart className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-red-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right text-green-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                          entry.balance > 0
                            ? "text-red-600"
                            : entry.balance < 0
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-sm font-semibold text-gray-900"
                    >
                      Totals
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-right text-red-600">
                      {formatCurrency(totalDebits)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-right text-green-600">
                      {formatCurrency(totalCredits)}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm font-bold text-right ${
                        finalBalance > 0
                          ? "text-red-600"
                          : finalBalance < 0
                          ? "text-green-600"
                          : "text-gray-900"
                      }`}
                    >
                      {formatCurrency(finalBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Transaction Count */}
        {filteredEntries.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing {filteredEntries.length} transaction
            {filteredEntries.length !== 1 ? "s" : ""}
          </div>
        )}

      {/* Sale Detail Modal */}
      {(modalLoading || modalSale) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-semibold text-gray-900">Sale Details</h2>
              </div>
              <button onClick={closeModal} className="icon-btn text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
              </div>
            ) : modalSale && (
              <div className="px-6 py-4 space-y-4">
                {/* Meta row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {format(new Date(modalSale.createdAt ?? modalSale.saleDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Type</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      (modalSale.saleType ?? "").toLowerCase() === "credit"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {modalSale.saleType ?? "—"}
                    </span>
                  </div>
                  {modalSale.subtotal > 0 && modalSale.discountValue > 0 && (
                    <>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Subtotal</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(modalSale.subtotal)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-0.5">Discount</p>
                        <p className="text-sm font-semibold text-red-600">
                          {modalSale.discountType === "percentage"
                            ? `${modalSale.discountValue}%`
                            : formatCurrency(modalSale.discountValue)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Items table */}
                {(modalSale.SaleItem ?? modalSale.items ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items</p>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(modalSale.SaleItem ?? modalSale.items ?? []).map((item: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 font-medium text-gray-900">{item.itemName}</td>
                              <td className="px-4 py-2.5 text-center text-gray-600">{item.quantity}</td>
                              <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                  <span className="text-sm font-semibold text-gray-600">Total</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(modalSale.totalAmount)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
