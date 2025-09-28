"use client";
import { useEffect, useState } from "react";
import { getCustomerStatement, getCustomerById } from "@/services/customerService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Calendar, Download, FileText, TrendingUp, TrendingDown, DollarSign, User } from "lucide-react";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

type StatementEntry = {
  id: string;
  date: string;
  type: "sale" | "payment";
  description: string;
  amount: number;
};

type Props = {
  customerId: string;
};

export default function CustomerStatement({ customerId }: Props) {
  const [statement, setStatement] = useState<StatementEntry[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

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
        setStatement(data);
      } catch {
        toast.error("Failed to fetch statement data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId, fromDate, toDate, customerName]);

  // Compute running balances
  let balance = 0;
  const entries = statement.map((entry) => {
    const isSale = entry.type === "sale";
    const debit = isSale ? entry.amount : 0;
    const credit = !isSale ? entry.amount : 0;
    balance += isSale ? entry.amount : -entry.amount;

    return { ...entry, debit, credit, balance };
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Customer Statement - ${customerName}`, 14, 14);

    autoTable(doc, {
      startY: 20,
      head: [["Date", "Description", "Debit", "Credit", "Balance"]],
      body: entries.map((e) => [
        e.date,
        e.description,
        e.debit.toFixed(2),
        e.credit.toFixed(2),
        e.balance.toFixed(2),
      ]),
    });

    doc.save(`statement_${customerName}.pdf`);
  };

  // Calculate summary statistics
  const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
  const finalBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;
  const netChange = totalDebits - totalCredits;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {customerName ? customerName.charAt(0).toUpperCase() : 'C'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Customer Statement</h1>
                <p className="mt-1 text-gray-600">
                  Account activity for {customerName || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Debits</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebits)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCredits)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingDown className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Change</p>
                <p className={`text-2xl font-bold ${
                  netChange > 0 ? 'text-red-600' : netChange < 0 ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {formatCurrency(netChange)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className={`text-2xl font-bold ${
                  finalBalance > 0 ? 'text-red-600' : finalBalance < 0 ? 'text-green-600' : 'text-gray-900'
                }`}>
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              />
            </div>
            <div>
              <button
                onClick={exportToPDF}
                disabled={entries.length === 0}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Statement Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading statement...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-600">No transactions were found for the selected date range.</p>
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
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Debit
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credit
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-gray-50 transition-colors duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                        entry.balance > 0 ? 'text-red-600' : entry.balance < 0 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {formatCurrency(entry.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
