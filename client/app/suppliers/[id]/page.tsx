import DashboardLayout from "@/components/layout/DashboardLayout";
import SupplierDetailsPage from "@/components/pages/suppliers/SupplierDetailsPage";

interface SupplierPageProps {
  params: { id: string };
}

export default function SupplierPage({ params }: SupplierPageProps) {
  return (
    <DashboardLayout>
      <SupplierDetailsPage supplierId={params.id} />
    </DashboardLayout>
  );
}