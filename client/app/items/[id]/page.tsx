import DashboardLayout from "@/components/layout/DashboardLayout";
import ItemDetailsPage from "@/components/pages/items/ItemDetailsPage";

interface ItemPageProps {
  params: { id: string };
}

export default function ItemPage({ params }: ItemPageProps) {
  return (
    <DashboardLayout>
      <ItemDetailsPage itemId={params.id} />
    </DashboardLayout>
  );
}