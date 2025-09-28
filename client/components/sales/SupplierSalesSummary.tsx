"use client";

import { useEffect, useState } from "react";
import { getSalesSummaryBySupplier } from "@/services/reportService";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

type SupplierSalesItem = {
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  supplierName: string;
};

type SupplierSalesSummary = {
  saleId: string;
  customerName: string;
  saleType: string;
  createdAt: string;
  items: SupplierSalesItem[];
};

export default function SupplierSalesSummary() {
  const [sales, setSales] = useState<SupplierSalesSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(() => new Date());
  const [saleType, setSaleType] = useState("");

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2 });

  const fetchData = async () => {
    if (endDate < startDate) {
      toast.error("End date must be after start date.");
      return;
    }

    try {
      setLoading(true);
      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];
      const data = await getSalesSummaryBySupplier(start, end);
      setSales(data);
    } catch {
      toast.error("Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (endDate < startDate) {
        toast.error("End date must be after start date.");
        return;
      }

      try {
        setLoading(true);
        const start = startDate.toISOString().split("T")[0];
        const end = endDate.toISOString().split("T")[0];
        const data = await getSalesSummaryBySupplier(start, end);
        setSales(data);
      } catch {
        toast.error("Failed to fetch summary");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]); // ✅ added dependencies here

  const filtered = sales.filter((s) =>
    saleType ? s.saleType.toLowerCase() === saleType.toLowerCase() : true
  );

  const grandTotal = filtered.reduce(
    (sum, s) => sum + s.items.reduce((acc, i) => acc + i.total, 0),
    0
  );

  const handleExport = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const html = `
    <html>
      <head><meta charset="utf-8">
        <style>
          body { font-family: Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
          th { background-color: #f2f2f2; }
          .total { text-align: right; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>${saleType.toUpperCase()} Sales Report</h2>
        <p><strong>From:</strong> ${startDate.toDateString()} <strong>To:</strong> ${endDate.toDateString()}</p>
        ${filtered
          .map(
            (s) => `
            <div>
              <h3>${s.customerName} (${s.saleType})</h3>
              <p><strong>Date:</strong> ${new Date(
                s.createdAt
              ).toDateString()}</p>
              <table>
                <thead>
                  <tr>
                    <th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  ${s.items
                    .map(
                      (i) => `
                    <tr>
                      <td>${i.itemName}</td>
                      <td>${i.quantity}</td>
                      <td>${formatCurrency(i.unitPrice)}</td>
                      <td>${formatCurrency(i.total)}</td>
                      <td>${i.supplierName || "N/A"}</td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
              </table>
              <p class="total">Total: ₵${formatCurrency(
                s.items.reduce((acc, i) => acc + i.total, 0)
              )}</p>
            </div>
          `
          )
          .join("")}
        <hr />
        <h3>Grand Total: ₵${formatCurrency(grandTotal)}</h3>
      </body>
    </html>`;

    html2pdf().from(html).save("supplier-sales-summary.pdf");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">🧾 Supplier Sales Summary</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div>
          <label>Start Date</label>
          <input
            type="date"
            value={startDate.toISOString().split("T")[0]}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label>End Date</label>
          <input
            type="date"
            value={endDate.toISOString().split("T")[0]}
            onChange={(e) => setEndDate(new Date(e.target.value))}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label>Sale Type</label>
          <select
            value={saleType}
            onChange={(e) => setSaleType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit</option>
          </select>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mt-6"
          onClick={fetchData}
        >
          Filter
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        filtered.map((sale) => (
          <div
            key={sale.saleId}
            className="mb-6 border p-4 rounded shadow-sm bg-white"
          >
            <h2 className="font-bold">{sale.customerName}</h2>
            <p>
              {sale.saleType} •{" "}
              {format(new Date(sale.createdAt), "dd MMM yyyy")}
            </p>

            <table className="w-full mt-2 text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Qty</th>
                  <th className="p-2 text-left">Price</th>
                  <th className="p-2 text-left">Total</th>
                  <th className="p-2 text-left">Supplier</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{item.itemName}</td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-2">{formatCurrency(item.total)}</td>
                    <td className="p-2">{item.supplierName}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-right font-bold mt-2">
              Total: ₵{" "}
              {formatCurrency(sale.items.reduce((acc, i) => acc + i.total, 0))}
            </p>
          </div>
        ))
      )}

      <div className="text-right mt-6">
        <p className="font-bold text-lg">
          Grand Total: ₵ {formatCurrency(grandTotal)}
        </p>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded mt-2"
          onClick={handleExport}
        >
          📄 Export All to PDF
        </button>
      </div>
    </div>
  );
}
