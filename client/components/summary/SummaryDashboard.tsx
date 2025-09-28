"use client";

import { useRouter } from "next/navigation";
import { 
  Container, 
  Receipt, 
  Package, 
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  Filter,
  ArrowRight
} from "lucide-react";

interface ReportCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  color: string;
  stats?: {
    value: string;
    label: string;
  };
}

function ModernReportCard({ icon, title, description, path, color, stats }: ReportCardProps) {
  const router = useRouter();
  
  return (
    <div 
      onClick={() => router.push(path)}
      className={`group cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
    >
      <div className="relative z-10">
        <div className="mb-6 inline-flex p-4 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-white/80 text-sm mb-4">{description}</p>
        
        {stats && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-2xl font-bold text-white">{stats.value}</div>
            <div className="text-white/70 text-xs">{stats.label}</div>
          </div>
        )}
        
        <div className="flex items-center text-white font-medium text-sm group-hover:translate-x-1 transition-transform duration-200">
          View Report
          <ArrowRight className="w-4 h-4 ml-2" />
        </div>
      </div>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/5" />
    </div>
  );
}

export default function SummaryDashboard() {
  const reports = [
    {
      icon: <Container className="w-8 h-8 text-white" />,
      title: "Container Analytics",
      description: "Comprehensive container sales and inventory tracking with detailed breakdown.",
      path: "/sales/summary/container",
      color: "from-blue-500 to-blue-700",
      stats: {
        value: "23",
        label: "Active Containers"
      }
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      title: "Detailed Sales Report",
      description: "In-depth analysis of sales performance with item breakdowns and trends.",
      path: "/summary/supplier",
      color: "from-green-500 to-green-700",
      stats: {
        value: "₵24.5K",
        label: "This Month"
      }
    },
    {
      icon: <Receipt className="w-8 h-8 text-white" />,
      title: "Sales Summary",
      description: "Complete overview of sales activities filtered by type and date range.",
      path: "/summary/sales/list",
      color: "from-purple-500 to-purple-700",
      stats: {
        value: "156",
        label: "Transactions"
      }
    },
    {
      icon: <Package className="w-8 h-8 text-white" />,
      title: "Inventory Report",
      description: "Physical inventory status with stock levels and movement tracking.",
      path: "/summary/inventory",
      color: "from-orange-500 to-orange-700",
      stats: {
        value: "2.1K",
        label: "Items in Stock"
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="mt-1 text-gray-600">Comprehensive insights and detailed reporting for your business</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Calendar className="w-4 h-4" />
                Date Range
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Export All
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">₵47,250</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +18.2% from last month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900">1,247</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Sold</p>
                <p className="text-3xl font-bold text-gray-900">3,891</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8.5% from last month
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Containers</p>
                <p className="text-3xl font-bold text-gray-900">23</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  3 new this week
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Container className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Detailed Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {reports.map((report, index) => (
              <ModernReportCard key={index} {...report} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Report Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                {
                  title: "Container Sales Report Generated",
                  description: "Monthly container performance analysis",
                  time: "2 hours ago",
                  icon: <Container className="w-4 h-4 text-blue-600" />,
                  color: "bg-blue-100"
                },
                {
                  title: "Inventory Report Updated",
                  description: "Physical stock count completed",
                  time: "4 hours ago",
                  icon: <Package className="w-4 h-4 text-orange-600" />,
                  color: "bg-orange-100"
                },
                {
                  title: "Sales Summary Exported",
                  description: "Weekly sales data exported to CSV",
                  time: "1 day ago",
                  icon: <Receipt className="w-4 h-4 text-green-600" />,
                  color: "bg-green-100"
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`p-2 rounded-lg ${activity.color}`}>
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
