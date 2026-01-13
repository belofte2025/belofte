import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Edit, Calendar, CheckSquare, Square, AlertCircle } from "lucide-react";

interface Sale {
  id: string;
  saleType: string;
  customer: {
    customerName: string;
  };
  totalAmount: number;
  createdAt: string;
}

interface BulkEditModalProps {
  open: boolean;
  onClose: () => void;
  selectedSales: Sale[];
  onConfirm: (updates: any) => Promise<void>;
}

export default function BulkEditModal({
  open,
  onClose,
  selectedSales,
  onConfirm,
}: BulkEditModalProps) {
  const [updateFields, setUpdateFields] = useState({
    saleType: false,
    saleDate: false,
  });

  const [formData, setFormData] = useState({
    saleType: "cash",
    saleDate: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setUpdateFields({ saleType: false, saleDate: false });
    setFormData({ saleType: "cash", saleDate: "" });
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build updates object based on selected fields
    const updates: any = {};
    if (updateFields.saleType) {
      updates.saleType = formData.saleType;
    }
    if (updateFields.saleDate) {
      if (!formData.saleDate) {
        return; // Date is required if checkbox is selected
      }
      updates.saleDate = formData.saleDate;
    }

    // Check if at least one field is selected
    if (!updateFields.saleType && !updateFields.saleDate) {
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(updates);
      handleClose();
    } catch (err) {
      console.error("Bulk edit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleField = (field: "saleType" | "saleDate") => {
    setUpdateFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const isValid = () => {
    if (!updateFields.saleType && !updateFields.saleDate) return false;
    if (updateFields.saleDate && !formData.saleDate) return false;
    return true;
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg bg-white p-6 shadow-2xl border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-full">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Bulk Edit Sales
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedSales.length} sale(s) selected
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How bulk editing works:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Select which fields you want to update</li>
                    <li>All selected sales will be updated with the same values</li>
                    <li>Item editing is not available for bulk operations</li>
                    <li>Changes cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Sale Type Field */}
            <div className="border border-gray-200 rounded p-4">
              <button
                type="button"
                onClick={() => toggleField("saleType")}
                className="flex items-center gap-3 w-full mb-3"
              >
                {updateFields.saleType ? (
                  <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-700">Update Sale Type</span>
              </button>

              {updateFields.saleType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Sale Type
                  </label>
                  <select
                    value={formData.saleType}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, saleType: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              )}
            </div>

            {/* Sale Date Field */}
            <div className="border border-gray-200 rounded p-4">
              <button
                type="button"
                onClick={() => toggleField("saleDate")}
                className="flex items-center gap-3 w-full mb-3"
              >
                {updateFields.saleDate ? (
                  <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-700">Update Sale Date</span>
              </button>

              {updateFields.saleDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      New Sale Date
                    </div>
                  </label>
                  <input
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, saleDate: e.target.value }))
                    }
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={updateFields.saleDate}
                  />
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview Changes</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">{selectedSales.length}</span> sales will be updated
                </p>
                {updateFields.saleType && (
                  <p>
                    • Sale type will be changed to{" "}
                    <span className="font-medium">{formData.saleType}</span>
                  </p>
                )}
                {updateFields.saleDate && formData.saleDate && (
                  <p>
                    • Sale date will be changed to{" "}
                    <span className="font-medium">
                      {new Date(formData.saleDate).toLocaleDateString()}
                    </span>
                  </p>
                )}
                {!updateFields.saleType && !updateFields.saleDate && (
                  <p className="text-gray-500 italic">No fields selected for update</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid() || submitting}
                className={`px-4 py-2 text-white transition-colors ${
                  isValid() && !submitting
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {submitting ? "Updating..." : "Apply Changes"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
