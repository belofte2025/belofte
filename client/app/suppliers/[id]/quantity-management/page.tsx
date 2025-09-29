import DashboardLayout from "@/components/layout/DashboardLayout";
import QuantityManagementPage from "@/components/pages/items/QuantityManagementPage";

interface QuantityManagementRouteProps {
  params: { id: string };
}

export default function QuantityManagementRoute({ params }: QuantityManagementRouteProps) {
  return (
    <DashboardLayout>
      <QuantityManagementPage supplierId={params.id} />
    </DashboardLayout>
  );
}