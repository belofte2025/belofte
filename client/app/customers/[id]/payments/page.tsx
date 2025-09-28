// app/customers/[id]/payments/page.tsx

import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerPaymentForm from "@/components/pages/customers/CustomerPaymentForm";
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
      title: `Record Payment - ${customerName} | Belofte Enterprise`,
      description: `Record a new payment for customer ${customerName}`,
    };
  } catch {
    return {
      title: 'Record Payment | Belofte Enterprise',
      description: 'Record a new customer payment',
    };
  }
}

export default async function CustomerPaymentPage({ params }: Props) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <CustomerPaymentForm customerId={id} />
    </DashboardLayout>
  );
}
