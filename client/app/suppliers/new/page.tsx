import DashboardLayout from "@/components/layout/DashboardLayout";
import AddSupplierForm from "@/components/pages/suppliers/AddSupplierForm";

export default function NewSupplierPage() {
  return (
    <DashboardLayout>
      <AddSupplierForm />
    </DashboardLayout>
  );
}