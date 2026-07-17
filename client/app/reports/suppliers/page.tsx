import DashboardLayout from "@/components/layout/DashboardLayout";

export default function SuppliersReportPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="page-header">
          <h1 className="page-title">Suppliers Report</h1>
        </div>

        <div className="card text-center py-12">
          <p className="text-sm font-medium text-gray-900">Suppliers Report</p>
          <p className="mt-1 text-xs text-gray-500">Detailed supplier analytics coming soon.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
