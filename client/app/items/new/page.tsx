import DashboardLayout from "@/components/layout/DashboardLayout";
import AddItemForm from "@/components/pages/items/AddItemForm";

export default function NewItemPage() {
  return (
    <DashboardLayout>
      <AddItemForm />
    </DashboardLayout>
  );
}