import DashboardLayout from "@/components/layout/DashboardLayout";
import PriceManagementPage from "@/components/pages/items/PriceManagementPage";

interface PriceManagementRouteProps {
  params: Promise<{ id: string }>;
}

export default async function PriceManagementRoute({ params }: PriceManagementRouteProps) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <PriceManagementPage supplierId={id} />
    </DashboardLayout>
  );
}
