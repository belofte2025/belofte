"use client";
import { useEffect, useState } from "react";
import {
  getCustomerPayments,
  deleteCustomerPayment,
} from "@/services/paymentService";
import { getCustomerById } from "@/services/customerService";
import { useCallback } from "react";
import { formatCurrency } from "@/utils/format";
import { CreditCard, Calendar, DollarSign, Trash2, Receipt, User, FileText } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  customerId: string;
};

type Payment = {
  id: string;
  amount: number;
  paymentType: string;
  note?: string;
  createdAt: string;
};

export default function CustomerPaymentsList({ customerId }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    try {
      const data = await getCustomerPayments(customerId);
      setPayments(data);
    } catch {
      toast.error("Failed to load payments.");
    }
  }, [customerId]);

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const data = await getCustomerById(customerId);
        setCustomerName(data.customerName || data.name);
      } catch {
        toast.error("Failed to load customer.");
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
    loadCustomer();
  }, [loadPayments, customerId]);
  const confirmDelete = async (paymentId: string, amount: number) => {
    if (!window.confirm(`Are you sure you want to delete this payment of ${formatCurrency(amount)}? This action cannot be undone.`)) return;

    try {
      await deleteCustomerPayment(paymentId);
      toast.success("Payment deleted successfully");
      await loadPayments();
    } catch {
      toast.error("Failed to delete payment. Please try again.");
    }
  };

  // Calculate statistics
  const totalPayments = payments.length;
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;
  const cashPayments = payments.filter(p => p.paymentType === 'CASH').length;
  const bankPayments = payments.filter(p => p.paymentType === 'BANK').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              {customerName ? customerName.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
              <p className="mt-1 text-gray-600">
                Complete payment records for {customerName || 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-3xl font-bold text-gray-900">{totalPayments}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Receipt className="w-6 h-6 text-blue-600" />
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
                <p className="text-sm font-medium text-gray-600">Average Payment</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(averagePayment)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Methods</p>
                <p className="text-lg font-bold text-gray-900">
                  <span className="text-blue-600">{cashPayments}</span> Cash / 
                  <span className="text-green-600">{bankPayments}</span> Bank
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <User className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Payment Records</h2>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
              <p className="text-gray-600">No payment records found for this customer.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {payments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.paymentType === 'CASH' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {payment.paymentType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(payment.createdAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        {payment.note && (
                          <div className="mt-2 flex items-center gap-1">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-600 italic">&ldquo;{payment.note}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => confirmDelete(payment.id, payment.amount)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete payment"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Summary Footer */}
        {totalPayments > 0 && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Summary</h3>
              <p className="text-gray-600">
                Customer has made <span className="font-semibold text-green-600">{totalPayments}</span> payments 
                totaling <span className="font-semibold text-green-600">{formatCurrency(totalAmount)}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
