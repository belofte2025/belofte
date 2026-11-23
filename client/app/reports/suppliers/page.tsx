"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { getSupplierReport, type SupplierReportItem } from "@/services/reportService";
import { getSuppliersList } from "@/services/supplierService";

type Supplier = { id: string; suppliername: string };

const columns: Column<SupplierReportItem>[] = [
  { key: "name", label: "Item", sortable: true },
  { key: "totalQuantity", label: "Received", sortable: true },
  { key: "sold", label: "Sold", sortable: true },
  { key: "remaining", label: "Received less sold", sortable: true },
];

function SupplierReport() {
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [supplierError, setSupplierError] = useState(false);
  const [listAttempt, setListAttempt] = useState(0);
  const [supplierId, setSupplierId] = useState("");

  useEffect(() => {
    let current = true;
    getSuppliersList()
      .then((result: Supplier[]) => {
        if (current) setSuppliers(result);
      })
      .catch(() => {
        if (current) setSupplierError(true);
      });
    return () => { current = false; };
  }, [listAttempt]);

  if (supplierError) {
    return (
      <div className="card space-y-3">
        <p role="alert">Couldn’t load suppliers.</p>
        <button type="button" className="btn btn-secondary" onClick={() => {
          setSupplierError(false);
          setListAttempt((attempt) => attempt + 1);
        }}>Try again</button>
      </div>
    );
  }
  if (!suppliers) return <p role="status">Loading suppliers…</p>;
  if (suppliers.length === 0) return <p className="card">No suppliers are available.</p>;

  return (
    <>
      <div className="card">
        <label htmlFor="report-supplier" className="block text-sm font-medium mb-2">Supplier</label>
        <select
          id="report-supplier"
          className="input w-full sm:max-w-sm"
          value={supplierId}
          onChange={(event) => setSupplierId(event.target.value)}
        >
          <option value="">Select a supplier</option>
          {suppliers.map(({ id, suppliername }) => (
            <option key={id} value={id}>{suppliername}</option>
          ))}
        </select>
      </div>

      {supplierId && <SupplierReportResults key={supplierId} supplierId={supplierId} />}
    </>
  );
}

function SupplierReportResults({ supplierId }: { supplierId: string }) {
  const [items, setItems] = useState<SupplierReportItem[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    getSupplierReport(supplierId)
      .then(({ items }) => {
        if (current) setItems(items);
      })
      .catch(() => {
        if (current) setError(true);
      });
    return () => { current = false; };
  }, [supplierId, attempt]);

  if (error) {
    return (
      <div className="card space-y-3">
        <p role="alert">Couldn’t load the supplier report.</p>
        <button type="button" className="btn btn-secondary" onClick={() => {
          setError(false);
          setAttempt((count) => count + 1);
        }}>Try again</button>
      </div>
    );
  }
  if (!items) return <p role="status">Loading supplier report…</p>;
  if (items.length === 0) return <p className="card">No received items for this supplier.</p>;

  const received = items.reduce((total, item) => total + item.totalQuantity, 0);
  const sold = items.reduce((total, item) => total + item.sold, 0);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Units received" value={received.toLocaleString()} />
        <StatCard label="Units sold" value={sold.toLocaleString()} />
        <StatCard label="Units received less sold" value={(received - sold).toLocaleString()} />
      </div>
      <DataTable data={items} columns={columns} searchPlaceholder="Search report…" emptyMessage="No matching items" />
    </>
  );
}

export default function SuppliersReportPage() {
  const { loading } = useAuth();
  const { hasPermission } = usePermissions();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <PageHeader title="Suppliers Report" subtitle="Received and sold quantities by supplier" />
        {loading ? (
          <p role="status">Checking report access…</p>
        ) : hasPermission("reports.view") ? (
          <SupplierReport />
        ) : (
          <p>You don’t have access to supplier reports.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
