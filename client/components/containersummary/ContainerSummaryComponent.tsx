"use client";

import { useEffect, useState } from "react";
import { getContainerSalesSummary } from "@/services/containerService";
import { formatCurrency } from "@/utils/format";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import LoadingSpinner from "../shared/LoadingSpinner";

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

    const doc = new jsPDF();
    const title = `Container Sales Summary - ${container.number}`;
    const deliveryDate = new Date(container.deliveryDate).toDateString();

    doc.setFontSize(12);
    doc.text(title, 14, 16);
    doc.text(`Company: ${container.company}`, 14, 28);
    doc.text(`Delivery Date: ${deliveryDate}`, 14, 40);

    autoTable(doc, {
      startY: 50,
      head: [["Item", "Sold", "Remaining", "Unit Price", "Total"]],
      body: container.items.map((item) => [
        item.name,
        item.sold.toString(),
        item.remainingQty.toString(),
        `${formatCurrency(item.unitPrice)}`,
        `${formatCurrency(item.total)}`,
      ]),
      foot: [
        [
          { content: "Grand Total", colSpan: 4, styles: { halign: "right" } },
          `${formatCurrency(container.totalSales)}`,
        ],
      ],
    });

    doc.save(`ContainerSummary-${container.number}.pdf`);
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
