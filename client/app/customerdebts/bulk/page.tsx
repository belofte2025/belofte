"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Upload
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import { bulkCreateCustomerDebts } from "@/services/customerDebtService";
import { getCustomers } from "@/services/customerService";
import toast from "react-hot-toast";

interface Customer {
  id: string;
  customerName: string;
}

interface DebtEntry {
  id: string;
  customerId: string;
  customerName: string;
  amount: string;
  description: string;
  debtType: string;
}

export default function BulkDebtCreationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<DebtEntry[]>([
    {
      id: Math.random().toString(),
      customerId: "",
      customerName: "",
      amount: "",
      description: "",
      debtType: "manual",
    },
  ]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Failed to load customers:", error);
        toast.error("Failed to load customers");
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: Math.random().toString(),
        customerId: "",
        customerName: "",
        amount: "",
        description: "",
        debtType: "manual",
      },
    ]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof DebtEntry, value: string) => {
    setEntries(
      entries.map((e) => {
        if (e.id === id) {
          if (field === "customerId") {
            const customer = customers.find((c) => c.id === value);
            return {
              ...e,
              customerId: value,
              customerName: customer?.customerName || "",
            };
          }
          return { ...e, [field]: value };
        }
        return e;
      })
    );
  };

  const handleSubmit = async () => {
    // Validate entries
    const invalidEntries = entries.filter(
      (e) => !e.customerId || !e.amount || parseFloat(e.amount) <= 0
    );

    if (invalidEntries.length > 0) {
      toast.error("Please fill in all required fields with valid amounts");
      return;
    }

    setSaving(true);
    try {
      const debts = entries.map((e) => ({
        customerId: e.customerId,
        amount: parseFloat(e.amount),
        description: e.description || undefined,
        debtType: e.debtType,
      }));

      await bulkCreateCustomerDebts(debts);
      toast.success(`Successfully created ${debts.length} debt entries`);
      router.push("/customer-debts");
    } catch (error) {
      console.error("Failed to create debts:", error);
      toast.error("Failed to create debts");
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = entries.reduce(
    (sum, e) => sum + (parseFloat(e.amount) || 0),
    0
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bulk Debt Entry
                </h1>
                <p className="text-gray-600">
                  Add multiple customer debts at once
                </p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Entries</p>
                  <p className="text-2xl font-bold text-blue-900">{entries.length}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">
                    Valid Entries
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {entries.filter((e) => e.customerId && e.amount).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Entries List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Debt Entries
                </h2>
                <button
                  onClick={addEntry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading customers...</span>
                </div>
              ) : (
                entries.map((entry, index) => (
                  <div key={entry.id} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Customer Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Customer *
                          </label>
                          <select
                            value={entry.customerId}
                            onChange={(e) =>
                              updateEntry(entry.id, "customerId", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            <option value="">Select Customer</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.customerName}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Amount */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={entry.amount}
                            onChange={(e) =>
                              updateEntry(entry.id, "amount", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            required
                          />
                        </div>

                        {/* Debt Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                          </label>
                          <select
                            value={entry.debtType}
                            onChange={(e) =>
                              updateEntry(entry.id, "debtType", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="manual">Manual Entry</option>
                            <option value="credit_sale">Credit Sale</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            value={entry.description}
                            onChange={(e) =>
                              updateEntry(entry.id, "description", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Optional note..."
                          />
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeEntry(entry.id)}
                        disabled={entries.length === 1}
                        className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove Entry"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || entries.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {saving ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Debts...
                </>
              ) : (
                `Create ${entries.length} Debt ${entries.length > 1 ? "Entries" : "Entry"}`
              )}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}