// app/customers/[id]/statement/page.tsx

import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerStatement from "@/components/pages/customers/CustomerStatement";
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
      title: `Account Statement - ${customerName} | Belofte Enterprise`,
      description: `View account statement and transaction history for ${customerName}`,
      keywords: 'customer statement, account history, transactions, payments, sales',
    };
  } catch {
    return {
      title: 'Customer Statement | Belofte Enterprise',
      description: 'View customer account statement and transaction history',
    };
  }
}

export default async function CustomerStatementPage({ params }: Props) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <CustomerStatement customerId={id} />
    </DashboardLayout>
  );
}
