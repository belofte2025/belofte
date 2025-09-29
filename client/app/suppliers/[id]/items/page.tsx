import DashboardLayout from "@/components/layout/DashboardLayout";
import SupplierItemsPage from "@/components/pages/suppliers/SupplierItemsPage";

interface SupplierItemsPageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierItems({ params }: SupplierItemsPageProps) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <SupplierItemsPage supplierId={id} />
    </DashboardLayout>
  );
}
