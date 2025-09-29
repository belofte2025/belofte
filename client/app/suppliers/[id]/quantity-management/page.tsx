import DashboardLayout from "@/components/layout/DashboardLayout";
import QuantityManagementPage from "@/components/pages/items/QuantityManagementPage";

interface QuantityManagementRouteProps {
  params: Promise<{ id: string }>;
}

export default async function QuantityManagementRoute({ params }: QuantityManagementRouteProps) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <QuantityManagementPage supplierId={id} />
    </DashboardLayout>
  );
}
