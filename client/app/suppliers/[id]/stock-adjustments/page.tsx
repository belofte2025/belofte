import DashboardLayout from "@/components/layout/DashboardLayout";
import StockAdjustmentPage from "@/components/pages/suppliers/StockAdjustmentPage";

interface StockAdjustmentRouteProps {
  params: Promise<{ id: string }>;
}

export default async function StockAdjustmentRoute({ params }: StockAdjustmentRouteProps) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <StockAdjustmentPage supplierId={id} />
    </DashboardLayout>
  );
}
