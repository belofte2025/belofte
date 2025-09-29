import DashboardLayout from "@/components/layout/DashboardLayout";
import SupplierDetailsPage from "@/components/pages/suppliers/SupplierDetailsPage";

interface SupplierPageProps {
  params: Promise<{ id: string }>;
}

export default async function SupplierPage({ params }: SupplierPageProps) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <SupplierDetailsPage supplierId={id} />
    </DashboardLayout>
  );
}
