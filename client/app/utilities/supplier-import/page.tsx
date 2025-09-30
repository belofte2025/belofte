import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import SupplierImportContent from "@/components/pages/utilities/SupplierImportContent";

export const metadata: Metadata = {
  title: 'Supplier Import | Belofte Enterprise',
  description: 'Import supplier data, items, and opening stock from Excel files',
  keywords: 'supplier import, excel upload, bulk import, opening stock',
};

export default function SupplierImportPage() {
  return (
    <DashboardLayout>
      <SupplierImportContent />
    </DashboardLayout>
  );
}