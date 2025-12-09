"use client";

import { useEffect, useState } from "react";
import { getContainerSalesSummary } from "@/services/containerService";
import { formatCurrency } from "@/utils/format";
import { useParams } from "next/navigation";
import LoadingSpinner from "../shared/LoadingSpinner";
import {
  createPDFReport,
  addPDFTable,
  addPDFSummarySection,
  formatPDFCurrency,
  savePDF,
} from "@/lib/pdfTemplates";

type Item = {
  name: string;
  expected: number;
  remainingQty: number;
  sold: number;
  unitPrice: number;
  total: number;
};

type ContainerSummary = {
  id: string;
  number: string;
  company: string;
  deliveryDate: string | Date;
  totalSales: number;
  items: Item[];
};

export default function ContainerSummaryComponent() {
  const { id } = useParams();
  const [container, setContainer] = useState<ContainerSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id || typeof id !== "string") return;
      try {
        setLoading(true);
        const data = await getContainerSalesSummary(id);
        setContainer(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleExportPDF = () => {
    if (!container) return;

    const deliveryDate = new Date(container.deliveryDate).toDateString();

    // Create PDF with company branding
    const { doc, headerEndY } = createPDFReport({
      title: `Container Sales Summary`,
      subtitle: `Container: ${container.number} | Company: ${container.company} | Delivery: ${deliveryDate}`,
      filename: `ContainerSummary-${container.number}`,
      orientation: "portrait",
    });

    // Calculate totals
    const totalSold = container.items.reduce((sum, item) => sum + item.sold, 0);
    const totalRemaining = container.items.reduce((sum, item) => sum + item.remainingQty, 0);

    // Add summary section - start after header with proper spacing
    const summaryY = addPDFSummarySection(
      doc,
      [
        {
          label: "Total Sales",
          value: formatPDFCurrency(container.totalSales),
          highlight: true,
        },
        {
          label: "Items Sold",
          value: totalSold.toString(),
        },
        {
          label: "Remaining Items",
          value: totalRemaining.toString(),
        },
        {
          label: "Total Items",
          value: container.items.length.toString(),
        },
      ],
      headerEndY + 10,
      "Summary"
    );

    // Prepare table data
    const tableData = container.items.map((item) => [
      item.name,
      item.sold.toString(),
      item.remainingQty.toString(),
      formatPDFCurrency(item.unitPrice),
      formatPDFCurrency(item.total),
    ]);

    // Add table with automatic page breaks
    addPDFTable(
      doc,
      tableData,
      ["Item", "Sold", "Remaining", "Unit Price", "Total"],
      summaryY,
      {
        footerRows: [
          [
            { content: "Grand Total", colSpan: 4, styles: { halign: "right" } },
            formatPDFCurrency(container.totalSales),
          ],
        ],
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 25, halign: "center" },
          3: { cellWidth: 35, halign: "right" },
          4: { cellWidth: 40, halign: "right" },
        },
      }
    );

    // Save PDF with proper filename
    savePDF(doc, `ContainerSummary-${container.number}`);
  };

  if (loading) return <LoadingSpinner />;
  if (!container) return <p className="text-gray-600">No summary found.</p>;

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">
          Container Sales Summary: {container.number}
        </h1>
        <button
          onClick={handleExportPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Export to PDF
        </button>
      </div>

      <div>
        <p>
          <strong>Company:</strong> {container.company}
        </p>
        <p>
          <strong>Delivery Date:</strong>{" "}
          {new Date(container.deliveryDate).toDateString()}
        </p>

        <div className="max-h-[500px] overflow-y-auto mt-4 ">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1 text-left">Item</th>
                <th className="border px-2 py-1 text-left">Sold</th>
                <th className="border px-2 py-1 text-left">Remaining</th>
                <th className="border px-2 py-1 text-left">Unit Price</th>
                <th className="border px-2 py-1 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {container.items.map((item, idx) => (
                <tr key={idx} className="even:bg-gray-50">
                  <td className="border px-2 py-1">{item.name}</td>
                  <td className="border px-2 py-1">{item.sold}</td>
                  <td className="border px-2 py-1">{item.remainingQty}</td>
                  <td className="border px-2 py-1">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="border px-2 py-1">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold bg-gray-50">
                <td className="border px-2 py-1 text-right" colSpan={4}>
                  Grand Total
                </td>
                <td className="border px-2 py-1">
                  {formatCurrency(container.totalSales)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
