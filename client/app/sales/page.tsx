import DashboardLayout from "@/components/layout/DashboardLayout";
import { DestinationCard } from "@/components/ui/DestinationCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container, Receipt } from "lucide-react";

export default function SalesDashboardPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Sales" subtitle="Choose how to record a sale." />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <DestinationCard icon={Container} title="Container sales" description="Sell stock from a specific container and keep the transaction linked to it." href="/sales/container" />
        <DestinationCard icon={Receipt} title="Regular sales" description="Build an order using items from one or more suppliers." href="/sales/regular" />
      </div>
    </DashboardLayout>
  );
}
