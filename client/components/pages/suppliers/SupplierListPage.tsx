"use client";

import { useEffect, useState } from "react";
import { getSuppliers, deleteSupplier } from "@/services/supplierService";
import { PlusCircle, Eye, Trash2, Building, Package, Factory } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Btn } from "@/components/ui/Btn";
import Badge from "@/components/ui/Badge";
import { toast } from "@/lib/toast";

type Supplier = {
  id: string;
  suppliername: string;
  contact: string;
  country: string;
  createdAt: string;
  containers: unknown[];
  items: unknown[];
};

type Row = Supplier & { initial: string; containerCount: number; itemCount: number };

export default function SupplierListPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSuppliers()
      .then(setSuppliers)
      .catch(() => toast.error("Failed to load suppliers"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;
    try {
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Supplier deleted");
    } catch {
      toast.error("Failed to delete supplier");
    }
  };

  const totalContainers = suppliers.reduce((sum, s) => sum + (s.containers?.length || 0), 0);
  const totalItems = suppliers.reduce((sum, s) => sum + (s.items?.length || 0), 0);

  const rows: Row[] = suppliers.map((s) => ({
    ...s,
    initial: s.suppliername.charAt(0).toUpperCase(),
    containerCount: s.containers?.length || 0,
    itemCount: s.items?.length || 0,
  }));

  const columns: Column<Row>[] = [
    {
      key: "suppliername",
      label: "Supplier",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
            {s.initial}
          </div>
          <div>
            <p className="font-medium text-gray-900">{s.suppliername}</p>
            <p className="text-xs text-gray-500">Added {new Date(s.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      ),
    },
    { key: "contact", label: "Contact", sortable: true, className: "text-gray-600" },
    {
      key: "country",
      label: "Country",
      sortable: true,
      render: (s) => <Badge variant="default">{s.country}</Badge>,
    },
    {
      key: "stats",
      label: "Stats",
      render: (s) => (
        <div className="flex gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Building className="w-3 h-3" />{s.containerCount}</span>
          <span className="flex items-center gap-1"><Package className="w-3 h-3" />{s.itemCount}</span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/suppliers/${s.id}`} className="icon-btn text-gray-400 hover:text-blue-600 hover:bg-blue-50">
            <Eye className="w-4 h-4" />
          </Link>
          <Link href={`/suppliers/${s.id}/items`} className="icon-btn text-gray-400 hover:text-green-600 hover:bg-green-50">
            <Package className="w-4 h-4" />
          </Link>
          <button onClick={() => handleDelete(s.id, s.suppliername)} className="icon-btn text-gray-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Suppliers"
        actions={
          <Btn href="/suppliers/new" icon={PlusCircle}>
            Add Supplier
          </Btn>
        }
      />

      <div className="stats-grid">
        <StatCard label="Suppliers" value={suppliers.length} icon={Factory} accent="bg-green-50" iconColor="text-green-600" />
        <StatCard label="Containers" value={totalContainers} icon={Building} accent="bg-blue-50" iconColor="text-blue-600" valueColor="text-blue-600" />
        <StatCard label="Items" value={totalItems} icon={Package} accent="bg-purple-50" iconColor="text-purple-600" valueColor="text-purple-600" className="col-span-2 lg:col-span-1" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          <span className="ml-3 text-sm text-gray-500">Loading...</span>
        </div>
      ) : (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Search by name, country, or contact..."
          emptyMessage="No suppliers found"
        />
      )}
    </div>
  );
}
