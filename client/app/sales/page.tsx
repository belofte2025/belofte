"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Container, 
  Receipt, 
  ArrowRight
} from "lucide-react";
import Link from "next/link";

interface SalesCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  color: string;
}

function ModernSalesCard({ icon, title, description, href, color }: SalesCardProps) {
  return (
    <Link href={href}>
      <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
        <div className="relative z-10">
          <div className="mb-4 inline-flex p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-white/80 text-sm mb-4">{description}</p>
          <div className="flex items-center text-white font-medium text-sm group-hover:translate-x-1 transition-transform duration-200">
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/5" />
      </div>
    </Link>
  );
}


export default function SalesDashboardPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="mt-1 text-gray-600">Choose your preferred sales method and track performance</p>
          </div>


          {/* Sales Methods */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Sales Method</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <ModernSalesCard
                icon={<Container className="w-8 h-8 text-white" />}
                title="Container Sales"
                description="Sell items directly from specific containers with detailed tracking"
                href="/sales/container"
                color="from-blue-500 to-blue-700"
              />
              <ModernSalesCard
                icon={<Receipt className="w-8 h-8 text-white" />}
                title="Regular Sales"
                description="Traditional sales by supplier with flexible inventory management"
                href="/sales/regular"
                color="from-purple-500 to-purple-700"
              />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
