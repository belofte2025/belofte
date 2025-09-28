"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Download, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calculator,
  CreditCard,
  Wallet,
  Building
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/utils/format";
import toast from "react-hot-toast";

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  totalReceivables: number;
  totalPayables: number;
  cashFlow: number;
  revenueGrowth: number;
  expenseGrowth: number;
}

export default function FinancialReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 125750,
    totalExpenses: 89250,
    grossProfit: 36500,
    netProfit: 32400,
    profitMargin: 25.8,
    totalReceivables: 18500,
    totalPayables: 12300,
    cashFlow: 28900,
    revenueGrowth: 18.4,
    expenseGrowth: 12.1
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
      
      const content = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1, h2 { color: #1f2937; }
              .summary { background-color: #f9fafb; padding: 15px; margin: 15px 0; }
              .financial-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
              .financial-card { background: #fff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
              .positive { color: #059669; }
              .negative { color: #dc2626; }
              .neutral { color: #6b7280; }
              .profit { background-color: #f0fdf4; }
              .loss { background-color: #fef2f2; }
            </style>
          </head>
          <body>
            <h1>Financial Overview Report</h1>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            
            <div class="summary">
              <h2>Financial Summary</h2>
              <p><strong>Total Revenue:</strong> ${formatCurrency(financialData.totalRevenue)}</p>
              <p><strong>Total Expenses:</strong> ${formatCurrency(financialData.totalExpenses)}</p>
              <p><strong>Gross Profit:</strong> ${formatCurrency(financialData.grossProfit)}</p>
              <p><strong>Net Profit:</strong> ${formatCurrency(financialData.netProfit)}</p>
              <p><strong>Profit Margin:</strong> ${financialData.profitMargin}%</p>
            </div>
            
            <div class="financial-grid">
              <div class="financial-card ${financialData.netProfit > 0 ? 'profit' : 'loss'}">
                <h3>Profitability</h3>
                <p class="${financialData.netProfit > 0 ? 'positive' : 'negative'}">Net Profit: ${formatCurrency(financialData.netProfit)}</p>
                <p class="neutral">Profit Margin: ${financialData.profitMargin}%</p>
              </div>
              
              <div class="financial-card">
                <h3>Cash Flow</h3>
                <p class="${financialData.cashFlow > 0 ? 'positive' : 'negative'}">${formatCurrency(financialData.cashFlow)}</p>
              </div>
              
              <div class="financial-card">
                <h3>Receivables</h3>
                <p class="neutral">${formatCurrency(financialData.totalReceivables)}</p>
              </div>
              
              <div class="financial-card">
                <h3>Payables</h3>
                <p class="neutral">${formatCurrency(financialData.totalPayables)}</p>
              </div>
              
              <div class="financial-card">
                <h3>Revenue Growth</h3>
                <p class="${financialData.revenueGrowth > 0 ? 'positive' : 'negative'}">${financialData.revenueGrowth > 0 ? '+' : ''}${financialData.revenueGrowth}%</p>
              </div>
              
              <div class="financial-card">
                <h3>Expense Growth</h3>
                <p class="${financialData.expenseGrowth > 0 ? 'negative' : 'positive'}">${financialData.expenseGrowth > 0 ? '+' : ''}${financialData.expenseGrowth}%</p>
              </div>
            </div>
          </body>
        </html>
      `;

      html2pdf().from(content).save(`Financial_Report_${new Date().toLocaleDateString().replace(/\//g, '_')}.pdf`);
      toast.success("Report exported successfully!");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const netWorkingCapital = financialData.totalReceivables - financialData.totalPayables;

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
                <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
                <p className="mt-1 text-gray-600">Profit margins and financial analysis</p>
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
              <span className="ml-3 text-gray-600">Loading financial data...</span>
            </div>
          ) : (
            <>
              {/* Key Financial Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(financialData.totalRevenue)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                      <p className="text-3xl font-bold text-red-600">
                        {formatCurrency(financialData.totalExpenses)}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full">
                      <CreditCard className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Profit</p>
                      <p className={`text-3xl font-bold ${
                        financialData.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(financialData.netProfit)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${
                      financialData.netProfit > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {financialData.netProfit > 0 ? (
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
                      <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                      <p className={`text-3xl font-bold ${
                        financialData.profitMargin > 20 ? 'text-green-600' :
                        financialData.profitMargin > 10 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {financialData.profitMargin}%
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <PieChart className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Profit & Loss Summary */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Calculator className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Profit & Loss Summary</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-semibold text-green-600">
                      +{formatCurrency(financialData.totalRevenue)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Total Expenses</span>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(financialData.totalExpenses)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 border-b border-gray-200 border-b-2">
                    <span className="text-gray-900 font-medium">Gross Profit</span>
                    <span className={`font-bold text-lg ${
                      financialData.grossProfit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(financialData.grossProfit)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-900 font-semibold text-lg">Net Profit</span>
                    <span className={`font-bold text-xl ${
                      financialData.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(financialData.netProfit)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Health Indicators */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Cash Flow & Liquidity */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-cyan-100 rounded-full">
                      <Wallet className="w-5 h-5 text-cyan-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Cash Flow & Liquidity</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Cash Flow</p>
                        <p className="text-xs text-gray-500">Net cash movement</p>
                      </div>
                      <p className={`text-2xl font-bold ${
                        financialData.cashFlow > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {financialData.cashFlow > 0 ? '+' : ''}{formatCurrency(financialData.cashFlow)}
                      </p>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Accounts Receivable</p>
                        <p className="text-xs text-gray-500">Money owed to us</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(financialData.totalReceivables)}
                      </p>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Accounts Payable</p>
                        <p className="text-xs text-gray-500">Money we owe</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(financialData.totalPayables)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">Net Working Capital</span>
                        <span className={`font-bold ${
                          netWorkingCapital > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(netWorkingCapital)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Receivables - Payables</p>
                    </div>
                  </div>
                </div>

                {/* Growth Metrics */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Growth Analysis</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Revenue Growth</span>
                        <span className={`text-sm font-semibold ${
                          financialData.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {financialData.revenueGrowth > 0 ? '+' : ''}{financialData.revenueGrowth}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            financialData.revenueGrowth > 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.abs(financialData.revenueGrowth)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Expense Growth</span>
                        <span className={`text-sm font-semibold ${
                          financialData.expenseGrowth < financialData.revenueGrowth ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {financialData.expenseGrowth > 0 ? '+' : ''}{financialData.expenseGrowth}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            financialData.expenseGrowth < financialData.revenueGrowth ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.abs(financialData.expenseGrowth)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Financial Health Score</p>
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            financialData.profitMargin > 20 && financialData.cashFlow > 0 
                              ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="font-semibold text-gray-900">
                            {financialData.profitMargin > 20 && financialData.cashFlow > 0 
                              ? 'Excellent' : financialData.profitMargin > 10 
                                ? 'Good' : 'Needs Attention'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Building className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      financialData.netProfit > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {financialData.netProfit > 0 ? '💰' : '📉'}
                      Profitability
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(financialData.netProfit)}
                    </p>
                    <p className="text-sm text-gray-600">{financialData.profitMargin}% margin</p>
                  </div>

                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      financialData.cashFlow > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {financialData.cashFlow > 0 ? '💵' : '💸'}
                      Cash Flow
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(financialData.cashFlow)}
                    </p>
                    <p className="text-sm text-gray-600">Net movement</p>
                  </div>

                  <div className="text-center">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      financialData.revenueGrowth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {financialData.revenueGrowth > 0 ? '📈' : '📉'}
                      Growth
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {financialData.revenueGrowth > 0 ? '+' : ''}{financialData.revenueGrowth}%
                    </p>
                    <p className="text-sm text-gray-600">Revenue growth</p>
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