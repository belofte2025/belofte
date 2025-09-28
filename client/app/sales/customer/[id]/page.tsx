// app/sales/customer/[id]/page.tsx

import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerSalesList from "@/components/pages/sales/CustomerSalesList";
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
      title: `Sales History - ${customerName} | Belofte Enterprise`,
      description: `View sales history and transaction details for customer ${customerName}`,
      keywords: 'customer sales, sales history, purchase history, transaction records',
    };
  } catch {
    return {
      title: 'Customer Sales History | Belofte Enterprise',
      description: 'View customer sales history and transaction details',
    };
  }
}

export default async function CustomerSalesPage({ params }: Props) {
  const { id } = await params;

  return (
    <DashboardLayout>
      <CustomerSalesList customerId={id} />
    </DashboardLayout>
  );
}
