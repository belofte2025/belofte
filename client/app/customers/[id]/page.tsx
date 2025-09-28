// app/customers/[id]/page.tsx

import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerForm from "@/components/pages/customers/CustomerForm";
import { getCustomerById } from "@/services/customerService";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const customer = await getCustomerById(id);
    const customerName = customer.customerName || customer.name;
    
    return {
      title: `Edit ${customerName} | Belofte Enterprise`,
      description: `Update customer information for ${customerName}`,
      keywords: 'edit customer, customer management, update customer details',
    };
  } catch {
    return {
      title: 'Edit Customer | Belofte Enterprise',
      description: 'Update customer information and details',
    };
  }
}

export default async function EditCustomerPage({ params }: Props) {
  const resolvedParams = await params;

  return (
    <DashboardLayout>
      <CustomerForm mode="edit" customerId={resolvedParams.id} />
    </DashboardLayout>
  );
}
