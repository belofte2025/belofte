"use client";

import { useEffect, useState } from "react";
import { getSupplierItemsWithSales } from "@/services/supplierService";
import { formatCurrency } from "@/utils/format";
import { PlusCircle, Factory, TrendingUp, Download, Package } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Btn } from "@/components/ui/Btn";
import Badge from "@/components/ui/Badge";
import { toast } from "@/lib/toast";
import { createHTMLReportTemplate, getHTML2PDFOptions } from "@/lib/pdfTemplates";

type ItemWithSales = {
  id: string;
  itemName: string;
  alias?: string | null;
  quantity: number;
  sold: number;
  available: number;
  unitPrice: number;
  supplierName: string;
};

type Row = ItemWithSales & { initial: string; uniqueness: string };

export default function ItemsListPage() {
  const [items, setItems] = useState<ItemWithSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState("all");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getSupplierItemsWithSales();
        setItems(data);
      } catch (err) {
        console.error("Failed to load items", err);
        toast.error("Failed to load items");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const bySupplier = items.filter(
    (item) => selectedSupplier === "all" || item.supplierName === selectedSupplier
  );

  const exportToPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const tableContent = `
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Supplier</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Sold</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            ${bySupplier.map(item => `
              <tr class="no-page-break">
                <td>${item.itemName}</td>
                <td>${item.supplierName}</td>
                <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-center">${item.sold}</td>
                <td class="text-center">${item.available}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      const html = createHTMLReportTemplate(
        "Items Report",
        tableContent,
        {
          subtitle: `Generated on: ${new Date().toLocaleDateString()}`,
          summaryStats: [
            { label: "Total Items", value: totalItems.toString() },
            { label: "Total Value", value: formatCurrency(totalValue) },
            { label: "Total Sold", value: totalSold.toString() },
            { label: "Total Available", value: totalAvailable.toString() },
          ],
        }
      );

      const options = {
        ...getHTML2PDFOptions(),
        filename: `Items_Report_${new Date().toISOString().split('T')[0]}.pdf`
      };
      html2pdf().set(options).from(html).save();
      toast.success("Report exported successfully!");
    } catch {
      toast.error("Failed to export report");
    }
  };

  const uniqueSuppliers = Array.from(new Set(items.map(item => item.supplierName))).sort();

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalSold = items.reduce((sum, item) => sum + item.sold, 0);
  const totalAvailable = items.reduce((sum, item) => sum + item.available, 0);

  const itemNameCounts = items.reduce((acc, item) => {
    acc[item.itemName] = (acc[item.itemName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const isDuplicate = (itemName: string) => itemNameCounts[itemName] > 1;
  const getDuplicateStatus = (itemName: string) => {
    const count = itemNameCounts[itemName];
    return count > 1 ? `${count} suppliers` : "unique";
  };

  const rows: Row[] = bySupplier.map((item) => ({
    ...item,
    initial: item.itemName.charAt(0).toUpperCase(),
    uniqueness: getDuplicateStatus(item.itemName),
  }));

  const columns: Column<Row>[] = [
    {
      key: "itemName",
      label: "Item",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
            {item.initial}
          </div>
          <div>
            <p className="font-medium text-gray-900">{item.itemName}</p>
            {item.alias && <p className="text-xs text-gray-500 italic">Alias: {item.alias}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "supplierName",
      label: "Supplier",
      sortable: true,
      render: (item) => (
        <span className="flex items-center gap-1.5 text-gray-600"><Factory className="w-3.5 h-3.5 text-gray-400" />{item.supplierName}</span>
      ),
    },
    {
      key: "unitPrice",
      label: "Price",
      sortable: true,
      render: (item) => <span className="font-semibold text-green-600">{formatCurrency(item.unitPrice)}</span>,
    },
    { key: "quantity", label: "Quantity", sortable: true, className: "text-gray-600" },
    { key: "sold", label: "Sold", sortable: true, className: "text-gray-600" },
    { key: "available", label: "Available", sortable: true, className: "text-gray-600" },
    {
      key: "uniqueness",
      label: "Uniqueness",
      sortable: true,
      render: (item) => (
        <Badge variant={isDuplicate(item.itemName) ? "warning" : "success"}>{item.uniqueness}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Items Management"
        subtitle="Manage items across all suppliers"
        actions={
          <>
            <Btn variant="secondary" icon={Download} onClick={exportToPDF} disabled={loading || items.length === 0}>
              Export PDF
            </Btn>
            <Btn href="/items/new" icon={PlusCircle}>
              Add Item
            </Btn>
          </>
        }
      />

      <div className="stats-grid">
        <StatCard label="Total Items" value={totalItems} icon={Package} accent="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Total Value" value={formatCurrency(totalValue)} valueColor="text-green-600" />
        <StatCard label="Total Sold" value={totalSold} valueColor="text-blue-600" />
        <StatCard label="Available" value={totalAvailable} valueColor="text-purple-600" />
      </div>

      {selectedSupplier !== "all" && (
        <div className="bg-blue-50 ring-1 ring-blue-200/60 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                Quick Management for {selectedSupplier}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Manage prices and quantities for all items from this supplier
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Btn size="sm" onClick={() => toast("Navigate to supplier page first for price management")}>
                Manage Prices
              </Btn>
              <Btn size="sm" variant="secondary" icon={TrendingUp} onClick={() => toast("Navigate to supplier page first for quantity management")}>
                Manage Quantities
              </Btn>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          <span className="ml-3 text-sm text-gray-500">Loading...</span>
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Search items by name or supplier..."
          emptyMessage="No items found"
          toolbar={
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="min-w-[200px] px-3 py-2.5 bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            >
              <option value="all">All Suppliers</option>
              {uniqueSuppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          }
        />
      )}
    </div>
  );
}
