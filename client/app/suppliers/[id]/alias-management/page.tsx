import DashboardLayout from "@/components/layout/DashboardLayout";
import AliasManagementPage from "@/components/pages/items/AliasManagementPage";

interface AliasManagementRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AliasManagementRoute({ params }: AliasManagementRouteProps) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <AliasManagementPage supplierId={id} />
    </DashboardLayout>
  );
}
