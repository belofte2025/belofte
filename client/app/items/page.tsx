import DashboardLayout from "@/components/layout/DashboardLayout";
import ItemsListPage from "@/components/pages/items/ItemsListPage";

export default function ItemsPage() {
  return (
    <DashboardLayout>
      <ItemsListPage />
    </DashboardLayout>
  );
}