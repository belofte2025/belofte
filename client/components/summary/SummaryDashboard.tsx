"use client";

import { useRouter } from "next/navigation";
import { 
  Container, 
  Receipt, 
  Package, 
  BarChart3,
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
      path: "/reports/containers",
      color: "from-blue-500 to-blue-700",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      title: "Sales Reports",
      description: "In-depth analysis of sales performance with item breakdowns and trends.",
      path: "/reports/sales",
      color: "from-green-500 to-green-700",
    },
    {
      icon: <Package className="w-8 h-8 text-white" />,
      title: "Inventory Report",
      description: "Physical inventory status with stock levels and movement tracking.",
      path: "/reports/inventory",
      color: "from-orange-500 to-orange-700",
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
          </div>
        </div>


        {/* Report Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <ModernReportCard key={index} {...report} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
