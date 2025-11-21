//  client\components\pages\customers\CustomerDebtsSection.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/utils/format";
import {
  Plus,
  Calendar,
  FileText,
  CheckCircle,
  Edit2,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createCustomerDebt,
  getCustomerDebts,
  markDebtAsPaid,
  updateCustomerDebt,
  deleteCustomerDebt,
  CustomerDebt,
} from "@/services/customerDebtService";

interface CustomerDebtsSectionProps {
  customerId: string;
}

export default function CustomerDebtsSection({
  customerId,
}: CustomerDebtsSectionProps) {
  const [debts, setDebts] = useState<CustomerDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<CustomerDebt | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    debtType: "manual",
  });

  const fetchDebts = useCallback(async () => {
    try {
      const data = await getCustomerDebts(customerId);
      setDebts(data);
    } catch (error) {
      console.error("Failed to fetch debts:", error);
      const errorMsg =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error || error.message
          : "Failed to load debts";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchDebts();
    }
  }, [customerId, fetchDebts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDebt) {
        await updateCustomerDebt(editingDebt.id, {
          amount: parseFloat(formData.amount),
          description: formData.description,
        });
        toast.success("Debt updated successfully");
      } else {
        await createCustomerDebt({
          customerId,
          amount: parseFloat(formData.amount),
          description: formData.description,
          debtType: formData.debtType,
        });
        toast.success("Debt added successfully");
      }

      setFormData({ amount: "", description: "", debtType: "manual" });
      setShowAddForm(false);
      setEditingDebt(null);
      fetchDebts();
    } catch (error) {
      console.error("Failed to save debt:", error);
      const errorMsg =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error || error.message
          : "Failed to save debt";
      toast.error(errorMsg);
    }
  };

  const handleMarkPaid = async (debtId: string) => {
    if (window.confirm("Mark this debt as paid?")) {
      try {
        await markDebtAsPaid(debtId);
        toast.success("Debt marked as paid");
        fetchDebts();
      } catch (error) {
        console.error("Failed to mark debt as paid:", error);
        toast.error("Failed to mark debt as paid");
      }
    }
  };

  const handleDelete = async (debtId: string) => {
    if (window.confirm("Are you sure you want to delete this debt entry?")) {
      try {
        await deleteCustomerDebt(debtId);
        toast.success("Debt deleted successfully");
        fetchDebts();
      } catch (error) {
        console.error("Failed to delete debt:", error);
        toast.error("Failed to delete debt");
      }
    }
  };

  const handleEdit = (debt: CustomerDebt) => {
    setEditingDebt(debt);
    setFormData({
      amount: debt.amount.toString(),
      description: debt.description || "",
      debtType: debt.debtType,
    });
    setShowAddForm(true);
  };

  const totalUnpaidDebt = debts
    .filter((d) => d.status === "unpaid")
    .reduce((sum, d) => sum + d.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Paid
          </span>
        );
      case "unpaid":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Unpaid
          </span>
        );
      case "partial":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Partial
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Customer Debts
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Total Unpaid:{" "}
              <span className="font-semibold text-red-600">
                {formatCurrency(totalUnpaidDebt)}
              </span>
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingDebt(null);
              setFormData({ amount: "", description: "", debtType: "manual" });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Debt
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Reason for debt..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Debt Type
              </label>
              <select
                value={formData.debtType}
                onChange={(e) =>
                  setFormData({ ...formData, debtType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="manual">Manual Entry</option>
                <option value="credit_sale">Credit Sale</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {editingDebt ? "Update Debt" : "Add Debt"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingDebt(null);
                  setFormData({
                    amount: "",
                    description: "",
                    debtType: "manual",
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Debts List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading debts...</span>
          </div>
        ) : debts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Debts</h3>
            <p className="text-gray-600">This customer has no debt entries.</p>
          </div>
        ) : (
          debts.map((debt) => (
            <div
              key={debt.id}
              className="p-6 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(debt.amount)}
                    </span>
                    {getStatusBadge(debt.status)}
                  </div>

                  {debt.description && (
                    <div className="flex items-start gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-600">
                        {debt.description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(debt.createdAt).toLocaleDateString()}
                    </div>
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {debt.debtType.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {debt.status === "unpaid" && (
                    <button
                      onClick={() => handleMarkPaid(debt.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors duration-200"
                      title="Mark as Paid"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleEdit(debt)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => handleDelete(debt.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
