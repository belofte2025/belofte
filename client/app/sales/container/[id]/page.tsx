import DashboardLayout from "@/components/layout/DashboardLayout";
import ContainerSalesForm from "@/components/pages/sales/ContainerSalesForm";

export default function ContainerSalesPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ContainerSalesForm />
      </div>
    </DashboardLayout>
  );
}
