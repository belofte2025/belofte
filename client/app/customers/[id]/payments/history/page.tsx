// app/customers/[id]/payments/history/page.tsx

import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerPaymentsList from "@/components/pages/customers/CustomerPaymentsList";
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
      title: `Payment History - ${customerName} | Belofte Enterprise`,
      description: `View complete payment history and transaction records for ${customerName}`,
      keywords: 'payment history, customer payments, transaction history, payment records',
    };
  } catch {
    return {
      title: 'Customer Payment History | Belofte Enterprise',
      description: 'View customer payment history and transaction records',
    };
  }
}

export default async function PaymentHistoryPage({ params }: Props) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <CustomerPaymentsList customerId={id} />
    </DashboardLayout>
  );
}
