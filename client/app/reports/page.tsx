"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  BarChart3, 
  TrendingUp, 
  Download,
  Filter,
  RefreshCw,
  DollarSign,
  Users,
  Package,
  Container,
  FileText,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ReportCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  href?: string;
}

function ReportCard({ icon, title, description, value, change, changeType, href }: ReportCardProps) {
  const content = (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
              <div className={`flex items-center text-sm ${
                changeType === "increase" ? "text-green-600" : "text-red-600"
              }`}>
                {changeType === "increase" ? (
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 mr-1" />
                )}
                {change}
              </div>
            </div>
            {href && (
              <Link 
                href={href}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Details →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

interface QuickReportProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  href: string;
}

function QuickReportCard({ icon, title, description, color, href }: QuickReportProps) {
  return (
    <Link href={href}>
      <div className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${color} p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
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
  const [dateRange, setDateRange] = useState("7d");

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                <p className="mt-1 text-gray-600">Comprehensive insights into your business performance</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1d">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ReportCard
              icon={<DollarSign className="w-5 h-5 text-blue-600" />}
              title="Total Revenue"
              description="Last 30 days"
              value="₵24,450"
              change="+18.2%"
              changeType="increase"
            />
            <ReportCard
              icon={<Users className="w-5 h-5 text-blue-600" />}
              title="Active Customers"
              description="Currently engaged"
              value="847"
              change="+12.5%"
              changeType="increase"
            />
            <ReportCard
              icon={<Package className="w-5 h-5 text-blue-600" />}
              title="Items Sold"
              description="Total units moved"
              value="2,156"
              change="+8.3%"
              changeType="increase"
            />
            <ReportCard
              icon={<Container className="w-5 h-5 text-blue-600" />}
              title="Containers Processed"
              description="Completed this month"
              value="23"
              change="-2.1%"
              changeType="decrease"
            />
          </div>

          {/* Chart Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Sales Analytics Chart</p>
                <p className="text-gray-500 text-sm">Chart component will be integrated here</p>
              </div>
            </div>
          </div>

          {/* Quick Reports */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Reports</h2>
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
              <QuickReportCard
                icon={<TrendingUp className="w-6 h-6 text-white" />}
                title="Performance Metrics"
                description="Key business performance indicators"
                color="from-red-500 to-red-700"
                href="/reports/performance"
              />
              <QuickReportCard
                icon={<PieChart className="w-6 h-6 text-white" />}
                title="Financial Overview"
                description="Profit margins and financial analysis"
                color="from-indigo-500 to-indigo-700"
                href="/reports/financial"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Performing Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Performing Items</h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { name: "Premium Widget A", sales: 156, revenue: "₵3,120" },
                  { name: "Standard Component B", sales: 89, revenue: "₵1,780" },
                  { name: "Deluxe Package C", sales: 67, revenue: "₵2,010" },
                  { name: "Basic Unit D", sales: 45, revenue: "₵900" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.sales} units sold</p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">{item.revenue}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { type: "Container Sale", amount: "₵1,250", status: "completed", time: "2 min ago" },
                  { type: "Regular Sale", amount: "₵89", status: "completed", time: "15 min ago" },
                  { type: "Bulk Order", amount: "₵2,450", status: "processing", time: "1 hr ago" },
                  { type: "Container Sale", amount: "₵675", status: "completed", time: "2 hr ago" },
                ].map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        <Activity className={`w-4 h-4 ${
                          transaction.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.type}</p>
                        <p className="text-sm text-gray-500">{transaction.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{transaction.amount}</span>
                      <p className={`text-xs capitalize ${
                        transaction.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}