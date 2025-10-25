// app/customers/[id]/page.tsx

import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerForm from "@/components/pages/customers/CustomerForm";
import CustomerDebtsSection from "@/components/pages/customers/CustomerDebtsSection";
import { getCustomerById } from "@/services/customerService";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const customer = await getCustomerById(id);
    const customerName = customer.customerName || customer.name;
    
    return {
      title: `${customerName} | Belofte Enterprise`,
      description: `Manage customer information and debts for ${customerName}`,
      keywords: 'customer management, customer debts, customer details',
    };
  } catch {
    return {
      title: 'Customer Details | Belofte Enterprise',
      description: 'Manage customer information and debts',
    };
  }
}

export default async function CustomerDetailsPage({ params }: Props) {
  const resolvedParams = await params;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Link 
            href="/customers"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
          <p className="text-gray-600 mt-1">Manage customer information and debts</p>
        </div>

        {/* Customer Form and Debts */}
        <div className="space-y-6">
          <CustomerForm mode="edit" customerId={resolvedParams.id} />
          <CustomerDebtsSection customerId={resolvedParams.id} />
        </div>
      </div>
    </DashboardLayout>
  );
}
