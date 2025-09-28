"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Download, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Clock,
  Award,
  Users,
  Package
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

interface PerformanceMetrics {
  salesGrowth: number;
  customerGrowth: number;
  inventoryTurnover: number;
  averageOrderValue: number;
  customerRetention: number;
  salesTarget: number;
  actualSales: number;
  totalCustomers: number;
  activeCustomers: number;
  totalProducts: number;
  lowStockItems: number;
}

export default function PerformanceReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    salesGrowth: 15.2,
    customerGrowth: 8.7,
    inventoryTurnover: 2.4,
    averageOrderValue: 125.50,
    customerRetention: 85.3,
    salesTarget: 50000,
    actualSales: 42750,
    totalCustomers: 247,
    activeCustomers: 189,
    totalProducts: 156,
    lowStockItems: 12
  });

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const exportToPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      
      const targetAchievement = (metrics.actualSales / metrics.salesTarget * 100).toFixed(1);
      
      const content = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1, h2 { color: #1f2937; }
              .summary { background-color: #f9fafb; padding: 15px; margin: 15px 0; }
              .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
              .metric-card { background: #fff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
              .positive { color: #059669; }
              .negative { color: #dc2626; }
              .neutral { color: #6b7280; }
            </style>
          </head>
          <body>
            <h1>Performance Metrics Report</h1>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            
            <div class="summary">
              <h2>Key Performance Indicators</h2>
              <p><strong>Sales Target Achievement:</strong> ${targetAchievement}% (${formatCurrency(metrics.actualSales)} / ${formatCurrency(metrics.salesTarget)})</p>
              <p><strong>Customer Retention Rate:</strong> ${metrics.customerRetention}%</p>
              <p><strong>Average Order Value:</strong> ${formatCurrency(metrics.averageOrderValue)}</p>
              <p><strong>Inventory Turnover:</strong> ${metrics.inventoryTurnover}x</p>
            </div>
            
            <div class="metric-grid">
              <div class="metric-card">
                <h3>Sales Growth</h3>
                <p class="${metrics.salesGrowth > 0 ? 'positive' : 'negative'}">${metrics.salesGrowth > 0 ? '+' : ''}${metrics.salesGrowth}%</p>
              </div>
              <div class="metric-card">
                <h3>Customer Growth</h3>
                <p class="${metrics.customerGrowth > 0 ? 'positive' : 'negative'}">${metrics.customerGrowth > 0 ? '+' : ''}${metrics.customerGrowth}%</p>
              </div>
              <div class="metric-card">
                <h3>Total Customers</h3>
                <p class="neutral">${metrics.totalCustomers}</p>
              </div>
              <div class="metric-card">
                <h3>Active Customers</h3>
                <p class="neutral">${metrics.activeCustomers}</p>
              </div>
              <div class="metric-card">
                <h3>Total Products</h3>
                <p class="neutral">${metrics.totalProducts}</p>
              </div>
              <div class="metric-card">
                <h3>Low Stock Items</h3>
                <p class="negative">${metrics.lowStockItems}</p>
              </div>
            </div>
          </body>
        </html>
      `;

      html2pdf().from(content).save(`Performance_Report_${new Date().toLocaleDateString().replace(/\//g, '_')}.pdf`);
      toast.success("Report exported successfully!");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const targetAchievement = (metrics.actualSales / metrics.salesTarget) * 100;
  const customerActivation = (metrics.activeCustomers / metrics.totalCustomers) * 100;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Performance Metrics</h1>
                <p className="mt-1 text-gray-600">Key business performance indicators</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={exportToPDF}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading performance data...</span>
            </div>
          ) : (
            <>
              {/* Growth Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sales Growth</p>
                      <p className={`text-3xl font-bold ${
                        metrics.salesGrowth > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metrics.salesGrowth > 0 ? '+' : ''}{metrics.salesGrowth}%
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${
                      metrics.salesGrowth > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {metrics.salesGrowth > 0 ? (
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Customer Growth</p>
                      <p className={`text-3xl font-bold ${
                        metrics.customerGrowth > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metrics.customerGrowth > 0 ? '+' : ''}{metrics.customerGrowth}%
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${
                      metrics.customerGrowth > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {formatCurrency(metrics.averageOrderValue)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Inventory Turnover</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {metrics.inventoryTurnover}x
                      </p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Package className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Achievement */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Sales Target Achievement</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Target Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{targetAchievement.toFixed(1)}%</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Current: {formatCurrency(metrics.actualSales)}</span>
                    <span>Target: {formatCurrency(metrics.salesTarget)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(targetAchievement, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Remaining: {formatCurrency(metrics.salesTarget - metrics.actualSales)}
                  </span>
                  <span className={`font-medium ${
                    targetAchievement >= 100 ? 'text-green-600' : 
                    targetAchievement >= 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {targetAchievement >= 100 ? 'Target Achieved! 🎉' : 
                     targetAchievement >= 80 ? 'Almost there!' : 'Needs attention'}
                  </span>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Customer Metrics */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Customer Metrics</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Customer Retention</span>
                        <span className="text-sm font-semibold">{metrics.customerRetention}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${metrics.customerRetention}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Customer Activation</span>
                        <span className="text-sm font-semibold">{customerActivation.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${customerActivation}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Total Customers</span>
                        <span className="font-semibold">{metrics.totalCustomers}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active Customers</span>
                        <span className="font-semibold text-green-600">{metrics.activeCustomers}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operational Metrics */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Package className="w-5 h-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Operational Metrics</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Inventory Turnover</p>
                        <p className="text-xs text-gray-500">Times per period</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">{metrics.inventoryTurnover}x</p>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Total Products</p>
                        <p className="text-xs text-gray-500">In catalog</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{metrics.totalProducts}</p>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Low Stock Items</p>
                        <p className="text-xs text-gray-500">Require attention</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-red-600" />
                        <p className="text-2xl font-bold text-red-600">{metrics.lowStockItems}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      metrics.salesGrowth > 10 ? 'bg-green-100 text-green-800' : 
                      metrics.salesGrowth > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {metrics.salesGrowth > 10 ? '🚀' : metrics.salesGrowth > 0 ? '📈' : '📉'}
                      Sales Growth
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.salesGrowth > 0 ? '+' : ''}{metrics.salesGrowth}%</p>
                  </div>

                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      metrics.customerRetention > 80 ? 'bg-green-100 text-green-800' : 
                      metrics.customerRetention > 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {metrics.customerRetention > 80 ? '⭐' : metrics.customerRetention > 60 ? '👥' : '⚠️'}
                      Retention Rate
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.customerRetention}%</p>
                  </div>

                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      targetAchievement >= 90 ? 'bg-green-100 text-green-800' : 
                      targetAchievement >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {targetAchievement >= 90 ? '🎯' : targetAchievement >= 70 ? '📊' : '⚡'}
                      Target Achievement
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{targetAchievement.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}