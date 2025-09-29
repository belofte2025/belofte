import DashboardLayout from "@/components/layout/DashboardLayout";

export default function SuppliersReportPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Suppliers Report</h1>
            <p className="mt-1 text-gray-600">Analytics and insights for your supplier network</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-gray-900">Suppliers Report</h3>
              <p className="mt-2 text-gray-500">Detailed supplier analytics coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}