"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ArrowLeft, Printer } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { getInvoice, updateInvoiceStatus, Invoice } from "@/services/invoiceService";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "badge-gray",
  SENT: "badge-blue",
  PARTIAL: "badge-yellow",
  PAID: "badge-green",
  OVERDUE: "badge-red",
  VOID: "badge-gray",
};

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getInvoice(id)
      .then(setInvoice)
      .catch(() => toast.error("Failed to load invoice"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (status: string) => {
    if (!invoice) return;
    setUpdating(true);
    try {
      const updated = await updateInvoiceStatus(invoice.id, status);
      setInvoice(updated);
      toast.success(`Invoice marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          <span className="ml-3 text-sm text-gray-500">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="card text-center py-12">
          <p className="text-sm text-gray-500">Invoice not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const balance = invoice.totalAmount - invoice.paidAmount;

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 40px;
          }
        }
      `}</style>

      <div className="no-print space-y-4">
        <div className="page-header">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="icon-btn text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="page-title">{invoice.invoiceNumber}</h1>
            <span className={`badge ${STATUS_COLORS[invoice.status] ?? "badge-gray"}`}>
              {invoice.status}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {invoice.status === "DRAFT" && (
              <button
                className="btn btn-secondary"
                disabled={updating}
                onClick={() => handleStatus("SENT")}
              >
                Mark as Sent
              </button>
            )}
            {["SENT", "PARTIAL", "OVERDUE"].includes(invoice.status) && (
              <button
                className="btn btn-primary"
                disabled={updating}
                onClick={() => handleStatus("PAID")}
              >
                Mark as Paid
              </button>
            )}
            {!["VOID", "PAID"].includes(invoice.status) && (
              <button
                className="btn btn-danger"
                disabled={updating}
                onClick={() => handleStatus("VOID")}
              >
                Void
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / Download</span>
            </button>
          </div>
        </div>

        <div className="card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Customer</p>
              <p className="text-sm font-semibold text-gray-900">
                {invoice.Customer?.customerName ?? "—"}
              </p>
              {invoice.Customer?.phone && (
                <p className="text-xs text-gray-500 mt-0.5">{invoice.Customer.phone}</p>
              )}
            </div>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Issue Date</p>
                <p className="text-sm font-medium text-gray-900">{invoice.issueDate}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Due Date</p>
                  <p className="text-sm font-medium text-gray-900">{invoice.dueDate}</p>
                </div>
              )}
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.Items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.itemName}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td className="font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="min-w-[220px] space-y-1">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountValue > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(invoice.discountValue)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-gray-900 border-t border-gray-200 pt-1">
                <span>Total</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Paid</span>
                <span>{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div
                className={`flex justify-between text-sm font-semibold ${
                  balance > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                <span>Balance Due</span>
                <span>{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="print-area" style={{ display: "none" }}>
        <div
          style={{
            maxWidth: 700,
            margin: "0 auto",
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            color: "#111827",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 32,
            }}
          >
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
                PETROS
              </h1>
              <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>Tax Invoice</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#1d4ed8" }}>
                INVOICE
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>
                {invoice.invoiceNumber}
              </p>
              <span
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: "#f3f4f6",
                  color: "#374151",
                }}
              >
                {invoice.status}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              marginBottom: 32,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#9ca3af",
                  letterSpacing: 1,
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                Bill To
              </p>
              <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>
                {invoice.Customer?.customerName ?? "—"}
              </p>
              {invoice.Customer?.phone && (
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                  {invoice.Customer.phone}
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                  ISSUE DATE:{" "}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{invoice.issueDate}</span>
              </div>
              {invoice.dueDate && (
                <div>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                    DUE DATE:{" "}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{invoice.dueDate}</span>
                </div>
              )}
            </div>
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: 24,
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#1d4ed8", color: "white" }}>
                <th
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Item Description
                </th>
                <th
                  style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 600,
                    width: 60,
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 600,
                    width: 100,
                  }}
                >
                  Unit Price
                </th>
                <th
                  style={{
                    padding: "10px 12px",
                    textAlign: "right",
                    fontSize: 11,
                    fontWeight: 600,
                    width: 100,
                  }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.Items?.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}
                >
                  <td style={{ padding: "9px 12px", borderBottom: "1px solid #f3f4f6" }}>
                    {item.itemName}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      textAlign: "right",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      textAlign: "right",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td
                    style={{
                      padding: "9px 12px",
                      textAlign: "right",
                      fontWeight: 600,
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
            <div style={{ minWidth: 240 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountValue > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  <span>Discount</span>
                  <span>- {formatCurrency(invoice.discountValue)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  fontSize: 15,
                  fontWeight: 800,
                  borderTop: "2px solid #111827",
                  marginTop: 4,
                }}
              >
                <span>Total</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                <span>Amount Paid</span>
                <span>{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  fontSize: 14,
                  fontWeight: 700,
                  color: balance > 0 ? "#dc2626" : "#16a34a",
                }}
              >
                <span>Balance Due</span>
                <span>{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div
              style={{
                marginBottom: 24,
                padding: 16,
                background: "#f9fafb",
                borderRadius: 8,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#9ca3af",
                  letterSpacing: 1,
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                Notes
              </p>
              <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{invoice.notes}</p>
            </div>
          )}

          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: 16,
              textAlign: "center",
              fontSize: 11,
              color: "#9ca3af",
            }}
          >
            Developed by EYO Solutions Ghana · 0246462398
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
