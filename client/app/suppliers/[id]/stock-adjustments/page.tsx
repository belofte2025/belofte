import StockAdjustmentPage from "@/components/pages/suppliers/StockAdjustmentPage";

export default function Page({ params }: { params: { id: string } }) {
  return <StockAdjustmentPage supplierId={params.id} />;
}
