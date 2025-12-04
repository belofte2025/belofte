"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomerPayment,
  getCustomerByIdbal,
} from "@/services/customerService";
import { sendPaymentConfirmationSMS } from "@/services/smsService";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Calendar,
  Save,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  customerId: string;
};

interface PaymentReceipt {
  receiptNumber: string;
  customerName: string;
  previousBalance: number;
  amountPaid: number;
  currentBalance: number;
  paymentType: string;
  note: string;
  date: string;
}

export default function CustomerPaymentForm({ customerId }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"payment" | "credit">("payment");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [creditDescription, setCreditDescription] = useState("");
  const [creditDate, setCreditDate] = useState(new Date().toISOString().split("T")[0]);
  const [creditAmount, setCreditAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerBal, setCustomerBal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendSMS, setSendSMS] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const data = await getCustomerByIdbal(customerId);
        console.log("📊 Customer data loaded:", data);
        setCustomerName(data.customerName || data.name);
        setCustomerPhone(data.phone || "");
        const balance = parseFloat(data.customerBal || data.balance || "0");
        setCustomerBal(balance);
      } catch (error) {
        console.error("❌ Failed to load customer:", error);
        toast.error("Failed to load customer info");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId, router]);

  const generateReceiptPDF = (receipt: PaymentReceipt) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print receipt");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${receipt.receiptNumber}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .receipt-header h1 {
            color: #1e40af;
            margin: 0 0 10px 0;
            font-size: 32px;
          }
          .receipt-header p {
            color: #64748b;
            margin: 5px 0;
          }
          .receipt-number {
            background: #eff6ff;
            padding: 10px 20px;
            border-radius: 8px;
            display: inline-block;
            font-weight: bold;
            color: #1e40af;
            margin-top: 10px;
          }
          .receipt-body {
            margin: 30px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            color: #64748b;
            font-weight: 500;
          }
          .value {
            color: #1f2937;
            font-weight: 600;
          }
          .amount-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 18px;
          }
          .amount-row.total {
            border-top: 2px solid #2563eb;
            margin-top: 10px;
            padding-top: 15px;
            font-size: 22px;
            font-weight: bold;
            color: #1e40af;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #64748b;
          }
          .signature-section {
            display: flex;
            justify-content: space-around;
            margin-top: 60px;
            padding-top: 20px;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-top: 2px solid #000;
            width: 200px;
            margin: 0 auto 10px;
          }
          .print-button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin: 20px auto;
            display: block;
          }
          .print-button:hover {
            background: #1d4ed8;
          }
        </style>
      </head>
      <body>
        <div class="receipt-header">
          <h1>PAYMENT RECEIPT</h1>
          <p>Thank you for your payment</p>
          <div class="receipt-number">Receipt #: ${receipt.receiptNumber}</div>
        </div>

        <div class="receipt-body">
          <div class="info-row">
            <span class="label">Customer Name:</span>
            <span class="value">${receipt.customerName}</span>
          </div>
          <div class="info-row">
            <span class="label">Date:</span>
            <span class="value">${new Date(receipt.date).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}</span>
          </div>
          <div class="info-row">
            <span class="label">Payment Method:</span>
            <span class="value">${receipt.paymentType}</span>
          </div>
          ${
            receipt.note
              ? `
          <div class="info-row">
            <span class="label">Note:</span>
            <span class="value">${receipt.note}</span>
          </div>
          `
              : ""
          }
        </div>

        <div class="amount-section">
          <div class="amount-row">
            <span>Previous Balance:</span>
            <span>₵ ${receipt.previousBalance.toFixed(2)}</span>
          </div>
          <div class="amount-row">
            <span>Amount Paid:</span>
            <span style="color: #16a34a;">₵ ${receipt.amountPaid.toFixed(
              2
            )}</span>
          </div>
          <div class="amount-row total">
            <span>Current Balance:</span>
            <span>₵ ${receipt.currentBalance.toFixed(2)}</span>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Customer Signature</p>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Authorized Signature</p>
          </div>
        </div>

        <div class="footer">
          <p>This is a computer-generated receipt</p>
          <p style="margin-top: 10px; font-size: 12px;">
            Generated on ${new Date().toLocaleString()}
          </p>
        </div>

        <button class="print-button no-print" onclick="window.print()">
          Print Receipt
        </button>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleCreditSubmit = async () => {
    if (!creditAmount || isNaN(Number(creditAmount))) {
      toast.error("Enter a valid credit amount");
      return;
    }
    if (!creditDescription) {
      toast.error("Select a credit description");
      return;
    }

    const creditAmountValue = parseFloat(creditAmount);
    const previousBalance = customerBal;
    const currentBalance = previousBalance - creditAmountValue;

    console.log("💳 Credit note submission:", {
      customerId,
      creditAmount: creditAmountValue,
      previousBalance,
      currentBalance,
      creditDescription,
      creditDate,
    });

    setSubmitting(true);
    try {
      console.log("📝 Recording credit note...");
      await createCustomerPayment(customerId, {
        amount: creditAmountValue,
        note: creditDescription,
        paymentType: "CREDIT_NOTE",
        paymentDate: creditDate,
      });
      console.log("✅ Credit note recorded successfully");

      toast.success(`₵ ${creditAmount} credit note recorded for ${customerName}`, {
        duration: 2000,
      });

      setTimeout(() => {
        router.push(`/customers`);
      }, 500);
    } catch (error) {
      console.error("❌ Credit note error:", error);
      toast.error("Failed to record credit note");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(Number(amount))) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!paymentType) {
      toast.error("Select a payment type");
      return;
    }

    const amountPaid = parseFloat(amount);
    const previousBalance = customerBal;
    const currentBalance = previousBalance - amountPaid;

    console.log("💰 Payment submission:", {
      customerId,
      amountPaid,
      previousBalance,
      currentBalance,
      paymentType,
      note,
      sendSMS,
      customerPhone,
    });

    setSubmitting(true);
    try {
      // Record the payment
      console.log("📝 Recording payment...");
      await createCustomerPayment(customerId, {
        amount: amountPaid,
        note,
        paymentType,
        paymentDate,
      });
      console.log("✅ Payment recorded successfully");

      // Send SMS if checkbox is checked
      if (sendSMS && customerPhone) {
        console.log("📱 Attempting to send SMS...");
        console.log("SMS Payload:", {
          customerId,
          amount: amountPaid,
          balance: currentBalance,
        });

        try {
          const smsResult = await sendPaymentConfirmationSMS(
            customerId,
            amountPaid,
            currentBalance
          );

          console.log("📤 SMS Result:", smsResult);

          if (smsResult.success) {
            toast.success(`Payment recorded and SMS sent to ${customerName}`, {
              duration: 3000,
            });
          } else {
            console.error("SMS failed:", smsResult.error);
            toast.success(
              `Payment recorded, but SMS failed: ${smsResult.error}`,
              {
                duration: 4000,
              }
            );
          }
        } catch (smsError) {
          console.error("❌ SMS error:", smsError);
          toast.success(`Payment recorded, but SMS failed to send`, {
            duration: 3000,
          });
        }
      } else {
        if (sendSMS && !customerPhone) {
          toast.success(
            `₵ ${amount} payment recorded. No phone number available for SMS.`,
            {
              duration: 3000,
            }
          );
        } else {
          toast.success(`₵ ${amount} payment recorded for ${customerName}`, {
            duration: 2000,
          });
        }
      }

      // Ask if user wants to print receipt
      setTimeout(() => {
        const wantReceipt = window.confirm(
          "Payment recorded successfully! Do you want to print the receipt?"
        );

        if (wantReceipt) {
          const receipt: PaymentReceipt = {
            receiptNumber: `RCP-${Date.now()}`,
            customerName,
            previousBalance,
            amountPaid,
            currentBalance,
            paymentType,
            note,
            date: paymentDate,
          };
          generateReceiptPDF(receipt);
        }

        router.push(`/customers`);
      }, 500);
    } catch (error) {
      console.error("❌ Payment error:", error);
      toast.error("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 font-medium">
            Loading customer details...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <h1 className="text-3xl font-bold text-gray-900">
                {activeTab === "payment" ? "Record Payment" : "Record Credit Note"}
              </h1>
              <p className="mt-1 text-gray-600">
                {activeTab === "payment"
                  ? `Add a new payment for ${customerName}`
                  : `Add a credit note for ${customerName}`}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("payment")}
              className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === "payment"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Payment
            </button>
            <button
              onClick={() => setActiveTab("credit")}
              className={`px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
                activeTab === "credit"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Credit Note
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-4">
                  {customerName.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {customerName}
                </h3>
                <p className="text-gray-600">Customer</p>
                {customerPhone && (
                  <p className="text-sm text-gray-500 mt-1">{customerPhone}</p>
                )}
                <div className="mt-3">
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₵ {customerBal.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {activeTab === "payment" ? "Payment Date: " : "Credit Date: "}
                    {activeTab === "payment" ? paymentDate : creditDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            {activeTab === "payment" ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Payment Details
                  </h2>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount Field */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount (₵)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {amount && !isNaN(Number(amount)) && (
                    <p className="mt-2 text-sm text-gray-600">
                      New Balance: ₵{" "}
                      {(customerBal - parseFloat(amount)).toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payment Method
                    </div>
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white text-gray-900"
                  >
                    <option value="">Select method</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="MOMO">Mobile Money</option>
                  </select>
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Payment Date
                    </div>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    max={today}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white text-gray-900"
                  />
                </div>

                {/* Note Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Payment Note
                    </div>
                  </label>
                  <select
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 bg-white text-gray-900"
                  >
                    <option value="">Select note type</option>
                    <option value="Part Payment">Partial Payment</option>
                    <option value="Final Payment">Final Payment</option>
                    <option value="Deposit">Deposit</option>
                  </select>
                </div>

                {/* SMS Notification Checkbox */}
                <div className="md:col-span-2">
                  <div className="bg-purple-50 border border-purple-200 rounded p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendSMS}
                        onChange={(e) => setSendSMS(e.target.checked)}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">
                          Send SMS confirmation to customer
                        </span>
                      </div>
                    </label>
                    {sendSMS && customerPhone && (
                      <p className="mt-2 ml-8 text-xs text-purple-700">
                        SMS will be sent to: {customerPhone}
                      </p>
                    )}
                    {sendSMS && !customerPhone && (
                      <p className="mt-2 ml-8 text-xs text-red-600">
                        ⚠️ No phone number available for this customer
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </div>
            ) : (
              /* Credit Note Form */
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Credit Note Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Credit Amount Field */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Credit Amount (₵)
                    </label>
                    <input
                      type="number"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {creditAmount && !isNaN(Number(creditAmount)) && (
                      <p className="mt-2 text-sm text-gray-600">
                        New Balance: ₵{" "}
                        {(customerBal - parseFloat(creditAmount)).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Credit Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Description
                      </div>
                    </label>
                    <select
                      value={creditDescription}
                      onChange={(e) => setCreditDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 bg-white text-gray-900"
                    >
                      <option value="">Select description</option>
                      <option value="Returned Damaged Goods">Returned Damaged Goods</option>
                      <option value="Discount on Payment">Discount on Payment</option>
                    </select>
                  </div>

                  {/* Credit Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Credit Date
                      </div>
                    </label>
                    <input
                      type="date"
                      value={creditDate}
                      onChange={(e) => setCreditDate(e.target.value)}
                      max={today}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => router.back()}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreditSubmit}
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded shadow-lg hover:from-green-700 hover:to-green-800 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Record Credit Note
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
