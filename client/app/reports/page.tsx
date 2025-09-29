"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Users,
  Package,
  Container,
  FileText,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";


interface QuickReportProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  href: string;
}

function QuickReportCard({
  icon,
  title,
  description,
  color,
  href,
}: QuickReportProps) {
  return (
    <Link href={href}>
      <div
        className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${color} p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
      >
        <div className="relative z-10">
          <div className="mb-3 inline-flex p-2 rounded-lg bg-white/20 backdrop-blur-sm">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-white/80 text-sm mb-3">{description}</p>
          <div className="flex items-center text-white font-medium text-sm group-hover:translate-x-1 transition-transform duration-200">
            Generate Report
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 rounded-full bg-white/10" />
      </div>
    </Link>
  );
}

export default function ReportsPage() {

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Reports & Analytics
                </h1>
                <p className="mt-1 text-gray-600">
                  Comprehensive insights into your business performance
                </p>
              </div>
            </div>
          </div>

          {/* Quick Reports */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Quick Reports
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <QuickReportCard
                icon={<FileText className="w-6 h-6 text-white" />}
                title="Sales Summary"
                description="Detailed breakdown of all sales activities"
                color="from-blue-500 to-blue-700"
                href="/reports/sales"
              />
              <QuickReportCard
                icon={<Users className="w-6 h-6 text-white" />}
                title="Customer Analytics"
                description="Customer behavior and transaction history"
                color="from-green-500 to-green-700"
                href="/reports/customers"
              />
              <QuickReportCard
                icon={<Container className="w-6 h-6 text-white" />}
                title="Container Reports"
                description="Container processing and inventory status"
                color="from-purple-500 to-purple-700"
                href="/reports/containers"
              />
              <QuickReportCard
                icon={<Package className="w-6 h-6 text-white" />}
                title="Inventory Status"
                description="Current stock levels and movement tracking"
                color="from-orange-500 to-orange-700"
                href="/reports/inventory"
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
