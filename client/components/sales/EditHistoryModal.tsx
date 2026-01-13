import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { History, User, Clock, X } from "lucide-react";
import { getEntityAuditHistory, AuditLog } from "@/services/auditService";

interface EditHistoryModalProps {
  open: boolean;
  onClose: () => void;
  saleId: string;
}

export default function EditHistoryModal({ open, onClose, saleId }: EditHistoryModalProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && saleId) {
      loadAuditHistory();
    }
  }, [open, saleId]);

  const loadAuditHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const logs = await getEntityAuditHistory("Sale", saleId);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Error loading audit history:", err);
      setError("Failed to load edit history");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionColor = (actionType: string) => {
    switch (actionType.toUpperCase()) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isBulkUpdate = (description: string) => {
    return description.toLowerCase().includes("bulk update");
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <History className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900">
                  Edit History
                </Dialog.Title>
                <p className="text-sm text-gray-500 mt-0.5">
                  Sale ID: {saleId.slice(-8)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Loading history...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="inline-block p-3 bg-red-100 rounded-full mb-3">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={loadAuditHistory}
                  className="mt-4 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block p-3 bg-gray-100 rounded-full mb-3">
                  <History className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">No edit history found</p>
                <p className="text-sm text-gray-500 mt-1">
                  This sale has not been modified yet
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs.map((log, index) => (
                  <div
                    key={log.id}
                    className={`relative border-l-4 pl-6 pb-6 ${
                      isBulkUpdate(log.description)
                        ? "border-purple-500"
                        : "border-blue-500"
                    } ${index === auditLogs.length - 1 ? "pb-0" : ""}`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${
                        isBulkUpdate(log.description)
                          ? "bg-purple-500"
                          : "bg-blue-500"
                      }`}
                    ></div>

                    {/* Content */}
                    <div className="bg-gray-50 border border-gray-200 rounded p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {log.user.userName}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${getActionColor(
                              log.actionType
                            )}`}
                          >
                            {log.actionType}
                          </span>
                          {isBulkUpdate(log.description) && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                              BULK
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {log.description}
                      </p>

                      {/* User email */}
                      <p className="text-xs text-gray-500 mt-2">{log.user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
