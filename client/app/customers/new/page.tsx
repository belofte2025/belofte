import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerForm from "@/components/pages/customers/CustomerForm";

export const metadata: Metadata = {
  title: 'Add New Customer | Belofte Enterprise',
  description: 'Create a new customer profile and add them to your customer database',
  keywords: 'new customer, add customer, customer registration, create customer profile',
};

export default function NewCustomerPage() {
  return (
    <DashboardLayout>
      <CustomerForm mode="create" />
    </DashboardLayout>
  );
}
