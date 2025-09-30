import { Metadata } from 'next';
import DashboardLayout from "@/components/layout/DashboardLayout";
import UtilitiesContent from "@/components/pages/utilities/UtilitiesContent";

export const metadata: Metadata = {
  title: 'Utilities | Belofte Enterprise',
  description: 'Data import tools and system utilities to help manage your business data',
  keywords: 'utilities, data import, tools, management',
};

export default function UtilitiesPage() {
  return (
    <DashboardLayout>
      <UtilitiesContent />
    </DashboardLayout>
  );
}