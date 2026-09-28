"use client";

import { useEffect, useState } from "react";
import { getCustomers } from "@/services/customerService";
import { formatCurrency } from "@/utils/format";
import ActionModal from "@/components/shared/ActionModal";
import { PlusCircle, Eye, Users, TrendingDown, Wallet } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Btn } from "@/components/ui/Btn";
import Badge from "@/components/ui/Badge";

type Customer = {
  id: string;
  name: string;
  phone: string;
  balance: number;
};

type Row = Customer & { statusLabel: string; initial: string };

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch((err) => console.error("Failed to load customers", err))
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = customers.reduce((sum, c) => sum + c.balance, 0);
  const positiveBalance = customers.filter((c) => c.balance > 0).length;

  const balanceColor = (b: number) =>
    b > 0 ? "text-red-600" : b < 0 ? "text-green-600" : "text-gray-900";

  const balanceVariant = (b: number): "danger" | "success" | "default" =>
    b > 0 ? "danger" : b < 0 ? "success" : "default";

  const balanceLabel = (b: number) =>
    b > 0 ? "Owes Money" : b < 0 ? "Credit" : "Clear";

  const rows: Row[] = customers.map((c) => ({
    ...c,
    statusLabel: balanceLabel(c.balance),
    initial: c.name.charAt(0).toUpperCase(),
  }));

  const columns: Column<Row>[] = [
    {
      key: "name",
      label: "Customer",
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs flex-shrink-0">
            {c.initial}
          </div>
          <span className="font-medium text-gray-900">{c.name}</span>
        </div>
      ),
    },
    { key: "phone", label: "Contact", sortable: true, className: "text-gray-600" },
    {
      key: "balance",
      label: "Balance",
      sortable: true,
      render: (c) => <span className={`font-semibold ${balanceColor(c.balance)}`}>{formatCurrency(c.balance)}</span>,
    },
    {
      key: "statusLabel",
      label: "Status",
      sortable: true,
      render: (c) => <Badge variant={balanceVariant(c.balance)}>{c.statusLabel}</Badge>,
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (c) => (
        <div className="text-right">
          <button
            onClick={() => setSelectedCustomer(c)}
            className="icon-btn text-gray-400 hover:text-blue-600 hover:bg-blue-50"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        actions={
          <Btn href="/customers/new" icon={PlusCircle}>
            Add Customer
          </Btn>
        }
      />

      <div className="stats-grid">
        <StatCard label="Customers" value={customers.length} icon={Users} accent="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="With Debt" value={positiveBalance} icon={TrendingDown} accent="bg-red-50" iconColor="text-red-600" valueColor="text-red-600" />
        <StatCard
          label="Total Balance"
          value={formatCurrency(totalBalance)}
          icon={Wallet}
          accent="bg-orange-50"
          iconColor="text-orange-600"
          valueColor={balanceColor(totalBalance)}
          className="col-span-2 lg:col-span-1"
        />
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
          searchPlaceholder="Search by name or phone..."
          emptyMessage="No customers found"
        />
      )}

      <ActionModal
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </div>
  );
}
