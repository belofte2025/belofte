import DashboardLayout from "@/components/layout/DashboardLayout";
import SupplierItemsPage from "@/components/pages/suppliers/SupplierItemsPage";

interface SupplierItemsPageProps {
  params: { id: string };
}

export default function SupplierItems({ params }: SupplierItemsPageProps) {
  return (
    <DashboardLayout>
      <SupplierItemsPage supplierId={params.id} />
    </DashboardLayout>
  );
}