"use client";

import moment from "moment";
import html2pdf from "html2pdf.js";
import * as XLSX from "xlsx";
import { useState } from "react";
import Button from "@/components/shared/Button";

interface Sale {
  id: string;
  saleType: string;
  totalAmount: number;
  createdAt: string;
  customer: { customerName: string };
}

interface Props {
  sales: Sale[];
  loading: boolean;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onReload: () => void;
  onDelete: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

export default function SalesListComponent({
  sales,
  loading,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReload,
  onDelete,
}: Props) {
  const [showConfirmId, setShowConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setDate: (d: Date | null) => void
  ) => {
    setDate(e.target.value ? new Date(e.target.value) : null);
  };

  const paginatedSales = sales.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);

  const exportToPDF = () => {
    const content = `
      <h2>Sales Report</h2>
      <table border="1" cellspacing="0" cellpadding="5">
        <thead>
          <tr>
            <th>Type</th><th>Customer</th><th>Amount</th><th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${sales
            .map(
              (sale) => `
            <tr>
              <td>${sale.saleType}</td>
              <td>${sale.customer.customerName}</td>
              <td>¢${sale.totalAmount.toFixed(2)}</td>
              <td>${new Date(sale.createdAt).toLocaleString()}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>`;

    html2pdf()
      .set({
        filename: "Sales_Report.pdf",
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(content)
      .save();
  };

  const exportToExcel = () => {
    const sheetData = sales.map((sale) => ({
      SaleType: sale.saleType,
      Customer: sale.customer.customerName,
      Amount: sale.totalAmount,
      Date: new Date(sale.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");
    XLSX.writeFile(workbook, "Sales_Report.xlsx");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Sales List</h1>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <input
          type="date"
          value={startDate ? moment(startDate).format("YYYY-MM-DD") : ""}
          onChange={(e) => handleDateChange(e, onStartDateChange)}
          className="border px-2 py-2 rounded"
        />
        <input
          type="date"
          value={endDate ? moment(endDate).format("YYYY-MM-DD") : ""}
          onChange={(e) => handleDateChange(e, onEndDateChange)}
          className="border px-2 py-2 rounded"
        />
        <Button onClick={onReload}>Load</Button>
        <Button onClick={exportToPDF}>Export PDF</Button>
        <Button onClick={exportToExcel}>Export Excel</Button>
      </div>

      {loading ? (
        <div className="text-blue-600">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Type</th>
                <th className="p-2 border">Customer</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((sale) => (
                <tr key={sale.id}>
                  <td
                    className={`p-2 border font-semibold ${
                      sale.saleType === "credit"
                        ? "text-red-600"
                        : "text-green-700"
                    }`}
                  >
                    {sale.saleType.toUpperCase()}
                  </td>
                  <td className="p-2 border">{sale.customer.customerName}</td>
                  <td className="p-2 border">
                    ₵ {sale.totalAmount.toFixed(2)}
                  </td>
                  <td className="p-2 border">
                    {new Date(sale.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2 border text-center">
                    {showConfirmId === sale.id ? (
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => onDelete(sale.id)}
                          className="bg-red-600 sm"
                        >
                          Confirm
                        </Button>
                        <Button
                          onClick={() => setShowConfirmId(null)}
                          className="bg-gray-400 sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowConfirmId(sale.id)}
                        className="bg-red-500 sm"
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No sales found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {sales.length > ITEMS_PER_PAGE && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <span className="px-4 py-2 text-sm font-medium">{`Page ${page} of ${totalPages}`}</span>
              <Button
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
