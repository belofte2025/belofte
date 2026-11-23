import DashboardLayout from "@/components/layout/DashboardLayout";
import { DestinationCard } from "@/components/ui/DestinationCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Users, Package, Container, FileText, TrendingDown, Factory, Wallet, Banknote } from "lucide-react";

const reports = [
  { icon: FileText, title: "Sales summary", description: "Review sales activity and transaction totals.", href: "/reports/sales" },
  { icon: Wallet, title: "Payments", description: "Review collected payments by method and date.", href: "/reports/payments" },
  { icon: Banknote, title: "Cash received", description: "Review cash sales and customer payments.", href: "/reports/dailycash" },
  { icon: Package, title: "Inventory status", description: "See current stock levels and movements.", href: "/reports/inventory" },
  { icon: Container, title: "Container reports", description: "Review container processing and stock.", href: "/reports/containers" },
  { icon: TrendingDown, title: "Item transactions", description: "Trace the movements that changed an item’s stock.", href: "/reports/item-transactions" },
  { icon: Factory, title: "Suppliers report", description: "Compare received and sold quantities by supplier.", href: "/reports/suppliers" },
  { icon: Users, title: "Customer analytics", description: "Review customer balances and transaction history.", href: "/reports/customers" },
];

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Reports" subtitle="Review sales, payments, and stock across your business." />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => <DestinationCard key={report.href} {...report} />)}
      </div>
    </DashboardLayout>
  );
}
