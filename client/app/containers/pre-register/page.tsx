import DashboardLayout from "@/components/layout/DashboardLayout";
import AddContainerForm from "@/components/pages/containers/AddContainerForm";

export default function PreRegisterContainerPage() {
  return (
    <DashboardLayout>
      <AddContainerForm initialStatus="Pending" />
    </DashboardLayout>
  );
}
