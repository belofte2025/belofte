"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Download, 
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  Phone,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { getAllCustomers } from "@/services/customerService";
import toast from "react-hot-toast";

interface Customer {
  id: string;
  name: string;
  customerName?: string;
  phone: string;
  balance: number;
  createdAt: string;
}

export default function CustomersReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to fetch customers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate customer statistics
  const totalCustomers = customers.length;
  const totalOutstanding = customers.reduce((sum, customer) => 
    customer.balance > 0 ? sum + customer.balance : sum, 0
  );
  const totalCredits = customers.reduce((sum, customer) => 
    customer.balance < 0 ? sum + Math.abs(customer.balance) : sum, 0
  );
  const averageBalance = totalCustomers > 0 ? 
    customers.reduce((sum, customer) => sum + customer.balance, 0) / totalCustomers : 0;
  
  const customersWithDebt = customers.filter(c => c.balance > 0).length;
  const customersWithCredit = customers.filter(c => c.balance < 0).length;
  const customersCleared = customers.filter(c => c.balance === 0).length;

  const exportToPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      
      const content = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1, h2 { color: #1f2937; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; }
              .summary { background-color: #f9fafb; padding: 15px; margin: 15px 0; }
              .positive { color: #dc2626; }
              .negative { color: #059669; }
            </style>
          </head>
          <body>
            <h1>Customer Analytics Report</h1>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            
            <div class="summary">
              <h2>Customer Summary</h2>
              <p><strong>Total Customers:</strong> ${totalCustomers}</p>
              <p><strong>Total Outstanding:</strong> ${formatCurrency(totalOutstanding)}</p>
              <p><strong>Total Credits:</strong> ${formatCurrency(totalCredits)}</p>
              <p><strong>Average Balance:</strong> ${formatCurrency(averageBalance)}</p>
              <p><strong>Customers with Debt:</strong> ${customersWithDebt}</p>
              <p><strong>Customers with Credit:</strong> ${customersWithCredit}</p>
              <p><strong>Cleared Customers:</strong> ${customersCleared}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                ${customers.map(customer => `
                  <tr>
                    <td>${customer.customerName || customer.name}</td>
                    <td>${customer.phone}</td>
                    <td class="${customer.balance > 0 ? 'positive' : customer.balance < 0 ? 'negative' : ''}">${formatCurrency(customer.balance)}</td>
                    <td>${customer.balance > 0 ? 'Owes Money' : customer.balance < 0 ? 'Has Credit' : 'Cleared'}</td>
                    <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      html2pdf().from(content).save(`Customer_Analytics_Report_${new Date().toLocaleDateString().replace(/\//g, '_')}.pdf`);
      toast.success("Report exported successfully!");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Customer Analytics</h1>
                <p className="mt-1 text-gray-600">Customer behavior and transaction insights</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={exportToPDF}
                  disabled={loading || customers.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-3xl font-bold text-blue-600">{totalCustomers}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Credits</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(totalCredits)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Balance</p>
                  <p className={`text-3xl font-bold ${
                    averageBalance > 0 ? 'text-red-600' : 
                    averageBalance < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {formatCurrency(averageBalance)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Customer Status Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="p-4 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Customers with Debt</h3>
                <p className="text-3xl font-bold text-red-600">{customersWithDebt}</p>
                <p className="text-sm text-gray-500">
                  {totalCustomers > 0 ? Math.round((customersWithDebt / totalCustomers) * 100) : 0}% of total
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Customers with Credit</h3>
                <p className="text-3xl font-bold text-green-600">{customersWithCredit}</p>
                <p className="text-sm text-gray-500">
                  {totalCustomers > 0 ? Math.round((customersWithCredit / totalCustomers) * 100) : 0}% of total
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Cleared Customers</h3>
                <p className="text-3xl font-bold text-gray-600">{customersCleared}</p>
                <p className="text-sm text-gray-500">
                  {totalCustomers > 0 ? Math.round((customersCleared / totalCustomers) * 100) : 0}% of total
                </p>
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading customer data...</span>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-16">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers Found</h3>
                <p className="text-gray-600">No customer records available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Join Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm mr-4">
                              {(customer.customerName || customer.name).charAt(0).toUpperCase()}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.customerName || customer.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-semibold ${
                            customer.balance > 0 ? 'text-red-600' : 
                            customer.balance < 0 ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {formatCurrency(customer.balance)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.balance > 0 
                              ? 'bg-red-100 text-red-800' 
                              : customer.balance < 0 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {customer.balance > 0 ? 'Owes Money' : 
                             customer.balance < 0 ? 'Has Credit' : 'Cleared'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(customer.createdAt).toLocaleDateString()}
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
    </DashboardLayout>
  );
}