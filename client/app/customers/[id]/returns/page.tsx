"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { ArrowLeft, Plus, RotateCcw, Package } from "lucide-react";
import { getCustomerReturns, CustomerReturn } from "@/services/customerReturnService";
import { getCustomerById } from "@/services/customerService";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";

export default function CustomerReturnsPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [returns, setReturns] = useState<CustomerReturn[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [retData, custData] = await Promise.all([
        getCustomerReturns(customerId),
        getCustomerById(customerId),
      ]);
      setReturns(retData);
      setCustomerName(custData.customerName || custData.name || "Customer");
    } catch {
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { load(); }, [load]);

  const total = returns.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href={`/customers/${customerId}`} className="text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="page-title">Returns — {customerName}</h1>
            <p className="text-sm text-gray-500">{returns.length} return{returns.length !== 1 ? "s" : ""} · {formatCurrency(total)} total</p>
          </div>
          <Link
            href={`/customers/${customerId}/returns/new`}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Return
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          </div>
        ) : returns.length === 0 ? (
          <div className="card text-center py-12">
            <RotateCcw className="mx-auto w-10 h-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-900 mt-3">No returns yet</p>
            <p className="text-xs text-gray-400 mt-1">Record a return when a customer brings goods back</p>
            <Link
              href={`/customers/${customerId}/returns/new`}
              className="btn btn-primary mt-4 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Return
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="mobile-list sm:hidden">
              {returns.map((r) => (
                <div key={r.id} className="mobile-list-item space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{r.returnNo}</span>
                    <span className="text-sm font-bold text-red-600">−{formatCurrency(r.totalAmount)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{format(new Date(r.createdAt), "MMM d, yyyy")}</p>
                  <div className="flex gap-1 flex-wrap">
                    {r.Items.map((item) => (
                      <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {item.itemName} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                  {r.note && <p className="text-xs text-gray-400 italic">{r.note}</p>}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="table-wrapper hidden sm:block">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Return No.</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Note</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-sm font-medium">{r.returnNo}</td>
                      <td className="text-sm text-gray-500 whitespace-nowrap">
                        {format(new Date(r.createdAt), "MMM d, yyyy")}
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {r.Items.map((item) => (
                            <span key={item.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Package className="w-2.5 h-2.5" />
                              {item.itemName} ×{item.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-sm text-gray-500 italic max-w-xs truncate">{r.note || "—"}</td>
                      <td className="text-right text-sm font-semibold text-red-600">
                        −{formatCurrency(r.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
