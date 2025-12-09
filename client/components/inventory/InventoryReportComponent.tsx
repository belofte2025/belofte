"use client";

import { useState } from "react";
import Button from "@/components/shared/Button";
import { createHTMLReportTemplate, getHTML2PDFOptions } from "@/lib/pdfTemplates";

type InventoryItem = {
  id: string;
  itemName: string;
  supplierName: string;
  available: number;
  unitPrice: number;
};

type Supplier = {
  id: string;
  suppliername: string;
};

interface Props {
  inventory: InventoryItem[];
  suppliers: Supplier[];
  loading: boolean;
}

export default function InventoryReportComponent({
  inventory,
  suppliers,
  loading,
}: Props) {
  const [selectedSupplier, setSelectedSupplier] = useState("");

  const filtered = selectedSupplier
    ? inventory.filter((i) => i.supplierName === selectedSupplier)
    : inventory;

  const formatCurrency = (value: number) =>
    `¢ ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const exportToPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;

    const totalInventoryValue = filtered.reduce((sum, item) => sum + (item.available * item.unitPrice), 0);
    const totalItems = filtered.reduce((sum, item) => sum + item.available, 0);

    const tableContent = `
      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Item</th>
            <th>Qty In Stock</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map(
              (item) => `
                <tr>
                  <td>${item.supplierName}</td>
                  <td>${item.itemName}</td>
                  <td>${item.available}</td>
                  <td>${formatCurrency(item.unitPrice)}</td>
                </tr>`
            )
            .join("")}
        </tbody>
      </table>`;

    const htmlContent = createHTMLReportTemplate(
      "Inventory Report",
      tableContent,
      {
        subtitle: selectedSupplier ? `Items from ${selectedSupplier}` : "All suppliers inventory",
        summaryStats: [
          { label: "Total Items", value: filtered.length.toString() },
          { label: "Total Quantity", value: totalItems.toString() },
          { label: "Inventory Value", value: formatCurrency(totalInventoryValue) },
          { label: "Avg Item Price", value: formatCurrency(totalItems > 0 ? totalInventoryValue / filtered.length : 0) },
        ]
      }
    );

    const options = {
      ...getHTML2PDFOptions(),
      filename: `Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`
    };
    html2pdf()
      .set(options)
      .from(htmlContent)
      .save();
  };

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");

    const worksheet = XLSX.utils.json_to_sheet(filtered);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, "Inventory_Report.xlsx");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <select
          className="border border-gray-300 rounded p-2 sm:w-1/2"
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
        >
          <option value="">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.suppliername} value={s.suppliername}>
              {s.suppliername}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <Button onClick={exportToPDF}>Export PDF</Button>
          <Button onClick={exportToExcel}>Export Excel</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-blue-700">Loading inventory...</div>
      ) : (
        <div className="overflow-x-auto max-h-[60vh] overflow-y-scroll rounded-2xl">
          <table className="min-w-full border rounded-r-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Supplier</th>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Qty In Stock</th>
                <th className="p-2 border">Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={`${item.itemName}-${index}`}>
                  <td className="p-2 border">{item.supplierName}</td>
                  <td className="p-2 border">{item.itemName}</td>
                  <td className="p-2 border">{item.available}</td>
                  <td className="p-2 border">
                    {formatCurrency(item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
