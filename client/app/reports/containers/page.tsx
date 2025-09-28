"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  ArrowLeft, 
  Download, 
  Container,
  Package,
  TrendingUp,
  Calendar,
  Truck,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllContainers } from "@/services/containerService";
import toast from "react-hot-toast";

interface ContainerData {
  id: string;
  containerNo: string;
  arrivalDate: string;
  year: number;
  status: string;
  supplier: {
    suppliername: string;
  };
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    receivedQty: number;
    soldQty: number;
    unitPrice: number;
  }>;
}

export default function ContainersReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [containers, setContainers] = useState<ContainerData[]>([]);

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const data = await getAllContainers();
      setContainers(data);
    } catch (error) {
      toast.error("Failed to fetch containers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate container statistics
  const totalContainers = containers.length;
  const pendingContainers = containers.filter(c => c.status === 'Pending').length;
  const completedContainers = containers.filter(c => c.status === 'Completed').length;
  const processingContainers = containers.filter(c => c.status === 'Processing').length;
  
  const totalItems = containers.reduce((sum, container) => 
    sum + container.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  
  const totalReceived = containers.reduce((sum, container) => 
    sum + container.items.reduce((itemSum, item) => itemSum + item.receivedQty, 0), 0
  );
  
  const totalSold = containers.reduce((sum, container) => 
    sum + container.items.reduce((itemSum, item) => itemSum + item.soldQty, 0), 0
  );

  const recentContainers = containers
    .sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime())
    .slice(0, 10);

  const exportToPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      
      const content = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1, h2 { color: #1f2937; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; }
              .summary { background-color: #f9fafb; padding: 15px; margin: 15px 0; }
              .status-pending { color: #f59e0b; }
              .status-processing { color: #3b82f6; }
              .status-completed { color: #059669; }
            </style>
          </head>
          <body>
            <h1>Container Reports</h1>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            
            <div class="summary">
              <h2>Container Summary</h2>
              <p><strong>Total Containers:</strong> ${totalContainers}</p>
              <p><strong>Pending:</strong> ${pendingContainers}</p>
              <p><strong>Processing:</strong> ${processingContainers}</p>
              <p><strong>Completed:</strong> ${completedContainers}</p>
              <p><strong>Total Items Ordered:</strong> ${totalItems}</p>
              <p><strong>Total Items Received:</strong> ${totalReceived}</p>
              <p><strong>Total Items Sold:</strong> ${totalSold}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Container No</th>
                  <th>Supplier</th>
                  <th>Arrival Date</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Items Count</th>
                </tr>
              </thead>
              <tbody>
                ${containers.map(container => `
                  <tr>
                    <td>${container.containerNo}</td>
                    <td>${container.supplier.suppliername}</td>
                    <td>${new Date(container.arrivalDate).toLocaleDateString()}</td>
                    <td>${container.year}</td>
                    <td class="status-${container.status.toLowerCase()}">${container.status}</td>
                    <td>${container.items.length} items</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      html2pdf().from(content).save(`Container_Report_${new Date().toLocaleDateString().replace(/\//g, '_')}.pdf`);
      toast.success("Report exported successfully!");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'processing': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'completed': return <Package className="w-4 h-4 text-green-600" />;
      default: return <Container className="w-4 h-4 text-gray-600" />;
    }
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Container Reports</h1>
                <p className="mt-1 text-gray-600">Container processing and inventory status</p>
              </div>
              <div className="ml-auto">
                <button
                  onClick={exportToPDF}
                  disabled={loading || containers.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Containers</p>
                  <p className="text-3xl font-bold text-blue-600">{totalContainers}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Container className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-3xl font-bold text-purple-600">{totalItems}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Items Received</p>
                  <p className="text-3xl font-bold text-green-600">{totalReceived}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Truck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Items Sold</p>
                  <p className="text-3xl font-bold text-orange-600">{totalSold}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Pending</h3>
                <p className="text-3xl font-bold text-yellow-600">{pendingContainers}</p>
                <p className="text-sm text-gray-500">
                  {totalContainers > 0 ? Math.round((pendingContainers / totalContainers) * 100) : 0}% of total
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Processing</h3>
                <p className="text-3xl font-bold text-blue-600">{processingContainers}</p>
                <p className="text-sm text-gray-500">
                  {totalContainers > 0 ? Math.round((processingContainers / totalContainers) * 100) : 0}% of total
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Completed</h3>
                <p className="text-3xl font-bold text-green-600">{completedContainers}</p>
                <p className="text-sm text-gray-500">
                  {totalContainers > 0 ? Math.round((completedContainers / totalContainers) * 100) : 0}% of total
                </p>
              </div>
            </div>
          </div>

          {/* Containers Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Container Details</h2>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading container data...</span>
              </div>
            ) : containers.length === 0 ? (
              <div className="text-center py-16">
                <Container className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Containers Found</h3>
                <p className="text-gray-600">No container records available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Container
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Arrival Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {containers.map((container) => {
                      const totalQuantity = container.items.reduce((sum, item) => sum + item.quantity, 0);
                      const receivedQuantity = container.items.reduce((sum, item) => sum + item.receivedQty, 0);
                      const soldQuantity = container.items.reduce((sum, item) => sum + item.soldQty, 0);
                      const receivedPercentage = totalQuantity > 0 ? Math.round((receivedQuantity / totalQuantity) * 100) : 0;
                      
                      return (
                        <tr key={container.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm mr-4">
                                {container.containerNo.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {container.containerNo}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Year {container.year}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {container.supplier.suppliername}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              {new Date(container.arrivalDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(container.status)}
                              <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(container.status)}`}>
                                {container.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <p className="font-medium">{container.items.length} different items</p>
                              <p className="text-xs text-gray-500">
                                {totalQuantity} total quantity
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Received</span>
                                <span>{receivedPercentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${receivedPercentage}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {receivedQuantity}/{totalQuantity} received, {soldQuantity} sold
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}