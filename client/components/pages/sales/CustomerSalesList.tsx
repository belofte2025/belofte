"use client";
import { useEffect, useState } from "react";
import { getCustomerById } from "@/services/customerService";
import { getSalesByCustomerId } from "@/services/salesService";
import { formatCurrency } from "@/utils/format";
import { ShoppingCart, Calendar, DollarSign, TrendingUp, Receipt } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  customerId: string;
};

type Sale = {
  id: string;
  saleDate: string;
  totalAmount: number;
};

export default function CustomerSalesList({ customerId }: Props) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const data = await getSalesByCustomerId(customerId);
        setSales(data);
      } catch {
        toast.error("Failed to fetch sales.");
      } finally {
        setLoading(false);
      }
    };

    const loadCustomer = async () => {
      try {
        const data = await getCustomerById(customerId);
        setCustomerName(data.customerName || data.name);
      } catch {
        toast.error("Failed to load customer.");
      }
    };

    loadCustomer();
    loadSales();
  }, [customerId]);

  // Calculate statistics
  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const averageAmount = totalSales > 0 ? totalAmount / totalSales : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {customerName ? customerName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Sales History</h1>
              <p className="mt-1 text-gray-600">
                Sales transactions for {customerName || 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-3xl font-bold text-gray-900">{totalSales}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Sale</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(averageAmount)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Sales Transactions</h2>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading sales...</span>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Found</h3>
              <p className="text-gray-600">This customer hasn&apos;t made any purchases yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sales.map((sale, index) => (
                <div
                  key={sale.id}
                  className="p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            {new Date(sale.saleDate).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500">Sale ID: {sale.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(sale.totalAmount)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">Amount</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Summary Footer */}
        {totalSales > 0 && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sales Summary</h3>
              <p className="text-gray-600">
                Customer has made <span className="font-semibold text-blue-600">{totalSales}</span> purchases 
                totaling <span className="font-semibold text-green-600">{formatCurrency(totalAmount)}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
