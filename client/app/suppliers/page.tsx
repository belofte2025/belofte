import DashboardLayout from "@/components/layout/DashboardLayout";
import SupplierListPage from "@/components/pages/suppliers/SupplierListPage";

export default function SuppliersPage() {
  return (
    <DashboardLayout>
      <SupplierListPage />
    </DashboardLayout>
  );
}