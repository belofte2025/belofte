import StockAdjustmentPage from "@/components/pages/suppliers/StockAdjustmentPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StockAdjustmentPage supplierId={id} />;
}
