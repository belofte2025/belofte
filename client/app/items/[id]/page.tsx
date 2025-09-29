import DashboardLayout from "@/components/layout/DashboardLayout";
import ItemDetailsPage from "@/components/pages/items/ItemDetailsPage";

interface ItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { id } = await params;
  return (
    <DashboardLayout>
      <ItemDetailsPage itemId={id} />
    </DashboardLayout>
  );
}
