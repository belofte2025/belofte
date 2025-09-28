"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Container, 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package,
  ArrowRight,
  BarChart3
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

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  color: string;
}

function StatCard({ icon, title, value, change, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className={`text-xs font-medium ${color}`}>{change}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
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

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<DollarSign className="w-6 h-6 text-green-600" />}
              title="Today's Sales"
              value="₵2,450"
              change="+12% from yesterday"
              color="text-green-600"
            />
            <StatCard
              icon={<Receipt className="w-6 h-6 text-blue-600" />}
              title="Transactions"
              value="47"
              change="+8% from yesterday"
              color="text-blue-600"
            />
            <StatCard
              icon={<Users className="w-6 h-6 text-purple-600" />}
              title="Active Customers"
              value="23"
              change="+3 new customers"
              color="text-purple-600"
            />
            <StatCard
              icon={<Package className="w-6 h-6 text-orange-600" />}
              title="Items Sold"
              value="156"
              change="+15% from yesterday"
              color="text-orange-600"
            />
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

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Sales Activity</h3>
                <Link 
                  href="/reports" 
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  View Reports
                </Link>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Container #C001 - Sale Completed</p>
                      <p className="text-xs text-gray-500">2 minutes ago</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">₵245.00</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Regular Sale - ABC Supplier</p>
                      <p className="text-xs text-gray-500">15 minutes ago</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">₵89.50</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Bulk Sale - Container #C002</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-purple-600">₵1,250.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
