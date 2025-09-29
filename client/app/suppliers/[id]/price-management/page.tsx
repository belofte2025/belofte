import DashboardLayout from "@/components/layout/DashboardLayout";
import PriceManagementPage from "@/components/pages/items/PriceManagementPage";

interface PriceManagementRouteProps {
  params: { id: string };
}

export default function PriceManagementRoute({ params }: PriceManagementRouteProps) {
  return (
    <DashboardLayout>
      <PriceManagementPage supplierId={params.id} />
    </DashboardLayout>
  );
}