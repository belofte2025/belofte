"use client";

import { useRouter } from 'next/navigation';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Users, 
  Building2, 
  BarChart3,
  ArrowRight 
} from 'lucide-react';

export default function UtilitiesContent() {
  const router = useRouter();

  const utilities = [
    {
      id: 'customer-import',
      title: 'Customer Import',
      description: 'Import customer data and opening balances from Excel files',
      icon: Users,
      path: '/utilities/customer-import',
      color: 'blue',
      features: [
        'Import customer master data',
        'Import customer opening balances',
        'Download Excel templates',
        'Bulk data validation'
      ]
    },
    {
      id: 'supplier-import',
      title: 'Supplier Import', 
      description: 'Import supplier data, items, and opening stock from Excel files',
      icon: Building2,
      path: '/utilities/supplier-import',
      color: 'green',
      features: [
        'Import supplier master data',
        'Import supplier items and pricing',
        'Import opening stock quantities',
        'Download Excel templates'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          Utilities
        </h1>
        <p className="text-gray-600 mt-1">
          Data import tools and system utilities to help manage your business data
        </p>
      </div>

      {/* Utilities Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {utilities.map((utility) => {
          const IconComponent = utility.icon;
          const colorClass = utility.color === 'blue' ? 'blue' : 'green';
          return (
            <div key={utility.id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 bg-${colorClass}-100 rounded-lg`}>
                    <IconComponent className={`h-6 w-6 text-${colorClass}-600`} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{utility.title}</h2>
                </div>
                
                <p className="text-gray-600 mb-4">{utility.description}</p>
                
                <div className="space-y-2 mb-6">
                  <h4 className="font-medium text-sm text-gray-700">Features:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {utility.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <button 
                  onClick={() => router.push(utility.path)}
                  className={`w-full bg-${colorClass}-600 text-white px-4 py-2 rounded-lg hover:bg-${colorClass}-700 transition-colors flex items-center justify-center gap-2`}
                >
                  <span>Open {utility.title}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          Quick Actions
        </h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <button 
            onClick={() => router.push('/customers')}
            className="p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow text-left"
          >
            <Users className="h-5 w-5 text-blue-600 mb-2" />
            <p className="font-medium text-sm">View Customers</p>
            <p className="text-xs text-gray-500">Manage customer data</p>
          </button>
          <button 
            onClick={() => router.push('/suppliers')}
            className="p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow text-left"
          >
            <Building2 className="h-5 w-5 text-green-600 mb-2" />
            <p className="font-medium text-sm">View Suppliers</p>
            <p className="text-xs text-gray-500">Manage supplier data</p>
          </button>
          <button 
            onClick={() => router.push('/items')}
            className="p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow text-left"
          >
            <FileSpreadsheet className="h-5 w-5 text-purple-600 mb-2" />
            <p className="font-medium text-sm">View Items</p>
            <p className="text-xs text-gray-500">Manage item catalog</p>
          </button>
          <button 
            onClick={() => router.push('/reports')}
            className="p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow text-left"
          >
            <BarChart3 className="h-5 w-5 text-orange-600 mb-2" />
            <p className="font-medium text-sm">View Reports</p>
            <p className="text-xs text-gray-500">Data analysis</p>
          </button>
        </div>
      </div>

      {/* Import Process Overview */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-600" />
          Import Process Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium mb-2">1. Download Template</h3>
            <p className="text-sm text-gray-600">
              Get the properly formatted Excel template with all required columns
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium mb-2">2. Prepare Data</h3>
            <p className="text-sm text-gray-600">
              Fill in the template with your data following the format guidelines
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-medium mb-2">3. Upload & Import</h3>
            <p className="text-sm text-gray-600">
              Upload your Excel file and review the import results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}