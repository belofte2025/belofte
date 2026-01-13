import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { AlertTriangle, CheckSquare, Square } from "lucide-react";

interface ValidationWarning {
  type: string;
  message: string;
  severity: "high" | "medium" | "low";
}

interface ValidationWarningModalProps {
  open: boolean;
  onClose: () => void;
  warning: ValidationWarning | null;
  onConfirm: () => void;
}

export default function ValidationWarningModal({
  open,
  onClose,
  warning,
  onConfirm,
}: ValidationWarningModalProps) {
  const [understood, setUnderstood] = useState(false);

  const handleClose = () => {
    setUnderstood(false);
    onClose();
  };

  const handleConfirm = () => {
    if (!understood) return;
    setUnderstood(false);
    onConfirm();
  };

  if (!warning) return null;

  const getSeverityColor = () => {
    switch (warning.severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getSeverityLabel = () => {
    switch (warning.severity) {
      case "high":
        return "High Risk";
      case "medium":
        return "Medium Risk";
      case "low":
        return "Low Risk";
      default:
        return "Notice";
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-white p-6 shadow-2xl border border-gray-200">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-full ${getSeverityColor()}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-bold text-gray-900 mb-1">
                Confirmation Required
              </Dialog.Title>
              <span
                className={`inline-block px-2 py-1 text-xs font-medium rounded ${getSeverityColor()}`}
              >
                {getSeverityLabel()}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed">{warning.message}</p>
          </div>

          {warning.severity === "high" && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800 font-medium">
                This action cannot be undone. Please ensure you want to proceed.
              </p>
            </div>
          )}

          {/* Confirmation Checkbox */}
          <div className="mb-6">
            <button
              onClick={() => setUnderstood(!understood)}
              className="flex items-center gap-3 w-full p-3 border-2 border-gray-200 rounded hover:bg-gray-50 transition-colors"
            >
              {understood ? (
                <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-gray-700 text-left">
                I understand the consequences and want to proceed
              </span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!understood}
              className={`px-4 py-2 text-white transition-colors ${
                understood
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Proceed
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
