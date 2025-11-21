"use client";

import { useState } from "react";
import { sendBulkDebtReminders } from "@/services/smsService";
import { Send, AlertCircle, CheckCircle, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import toast from "react-hot-toast";

// Define expected types for results
interface SMSResultItem {
  customer: string;
  phone: string;
  success: boolean;
}

interface BulkSMSResults {
  total: number;
  sent: number;
  failed: number;
  results: SMSResultItem[];
}

export default function BulkSMSPage() {
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<BulkSMSResults | null>(null);

  const handleSendBulkReminders = async () => {
    if (
      !window.confirm(
        "Send debt reminders to all customers with outstanding balances?"
      )
    ) {
      return;
    }

    setSending(true);
    try {
      const result = await sendBulkDebtReminders();
      setResults(result);
      toast.success(`Sent ${result.sent} of ${result.total} messages`);
    } catch {
      // remove `error` variable since it's unused
      toast.error("Failed to send bulk SMS");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bulk SMS</h1>
                <p className="text-gray-600">
                  Send debt reminders to multiple customers
                </p>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  How it works
                </h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>
                    • Automatically finds all customers with unpaid or partial
                    debts
                  </li>
                  <li>
                    • Sends a personalized reminder with their outstanding
                    balance
                  </li>
                  <li>• Each SMS is logged for tracking purposes</li>
                  <li>• Failed messages will be reported in the results</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-white shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Send Debt Reminders
              </h2>
              <p className="text-gray-600 mb-6">
                Send SMS reminders to all customers with outstanding balances
              </p>

              <button
                onClick={handleSendBulkReminders}
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending Messages...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Bulk Reminders
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="mt-6 bg-white shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Results</h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">Total</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {results.total}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">Sent</p>
                    <p className="text-3xl font-bold text-green-900">
                      {results.sent}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">Failed</p>
                    <p className="text-3xl font-bold text-red-900">
                      {results.failed}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Detailed Results
                  </h4>
                  {results.results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {result.customer}
                          </p>
                          <p className="text-sm text-gray-600">
                            {result.phone}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          result.success
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {result.success ? "Sent" : "Failed"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
