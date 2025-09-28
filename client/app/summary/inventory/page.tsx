import InventoryReportComponent from "@/components/inventory/InventoryReportComponent";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <InventoryReportComponent inventory={[]} suppliers={[]} loading={false} />
    </DashboardLayout>
  );
}
