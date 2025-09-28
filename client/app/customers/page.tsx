import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerList from "@/components/pages/customers/CustomerList";

export const metadata: Metadata = {
  title: 'Customers | Belofte Enterprise',
  description: 'Manage your customer database, view balances, and track customer relationships',
  keywords: 'customers, client management, customer database, balances, CRM',
};

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <CustomerList />
    </DashboardLayout>
  );
}
