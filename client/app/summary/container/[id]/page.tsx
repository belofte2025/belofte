import ContainerSummaryComponent from "@/components/containersummary/ContainerSummaryComponent";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ContainerSalesSummaryPage() {
  return (
    <DashboardLayout>
      <div>
        <ContainerSummaryComponent />
      </div>
    </DashboardLayout>
  );
}
