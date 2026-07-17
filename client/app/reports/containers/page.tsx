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
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllContainers } from "@/services/containerService";
import { createHTMLReportTemplate, getHTML2PDFOptions } from "@/lib/pdfTemplates";
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
      setContainers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Failed to fetch containers");
      console.error(error);
      setContainers([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate container statistics for PDF export
  const totalContainers = Array.isArray(containers) ? containers.length : 0;
  const pendingContainers = Array.isArray(containers) ? containers.filter(c => c.status === 'Pending').length : 0;
  const completedContainers = Array.isArray(containers) ? containers.filter(c => c.status === 'Completed').length : 0;
  const processingContainers = Array.isArray(containers) ? containers.filter(c => c.status === 'Processing').length : 0;
  
  const totalItems = Array.isArray(containers) ? containers.reduce((sum, container) =>
    sum + (Array.isArray(container.items) ? container.items.reduce((itemSum, item) => itemSum + item.quantity, 0) : 0), 0
  ) : 0;

  const totalReceived = Array.isArray(containers) ? containers.reduce((sum, container) =>
    sum + (Array.isArray(container.items) ? container.items.reduce((itemSum, item) => itemSum + item.receivedQty, 0) : 0), 0
  ) : 0;


  const exportToPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;

      const tableContent = `
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
                <td>${container.status}</td>
                <td>${container.items.length} items</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      const htmlContent = createHTMLReportTemplate(
        "Container Reports",
        tableContent,
        {
          subtitle: "Container processing and inventory status",
          summaryStats: [
            { label: "Total Containers", value: totalContainers.toString() },
            { label: "Pending", value: pendingContainers.toString() },
            { label: "Processing", value: processingContainers.toString() },
            { label: "Completed", value: completedContainers.toString() },
            { label: "Items Ordered", value: totalItems.toString() },
            { label: "Items Received", value: totalReceived.toString() },
          ]
        }
      );

      const options = {
        ...getHTML2PDFOptions(),
        filename: `Container_Report_${new Date().toISOString().split('T')[0]}.pdf`
      };
      html2pdf().set(options).from(htmlContent).save();
      toast.success("Report exported successfully!");
    } catch {
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
      <div className="space-y-4">
          {/* Header */}
          <div className="page-header">
            <button
              onClick={() => router.back()}
              className="icon-btn text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="page-title">Container Reports</h1>
              <button
                onClick={exportToPDF}
                disabled={loading || containers.length === 0}
                className="btn btn-success"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
          </div>


          {/* Containers Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Container Details</h2>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
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
    </DashboardLayout>
  );
}