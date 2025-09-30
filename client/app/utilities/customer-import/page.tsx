import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerImportContent from "@/components/pages/utilities/CustomerImportContent";

export const metadata: Metadata = {
  title: 'Customer Import | Belofte Enterprise',
  description: 'Import customer data and opening balances from Excel files',
  keywords: 'customer import, excel upload, bulk import, opening balances',
};

export default function CustomerImportPage() {
  return (
    <DashboardLayout>
      <CustomerImportContent />
    </DashboardLayout>
  );
}