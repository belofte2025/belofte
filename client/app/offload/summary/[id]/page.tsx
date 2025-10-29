"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Download,
  Package,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  getContainerById,
  getOffloadSummary,
} from "@/services/containerService";
import toast from "react-hot-toast";

interface SummaryItem {
  id: string;
  name: string;
  expected: number;
  received: number;
  variance: number;
  percentage: number;
}

interface ContainerMeta {
  containerNo: string;
  supplierName: string;
  arrivalDate: string;
  status: string;
}

export default function OffloadSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [containerMeta, setContainerMeta] = useState<ContainerMeta>({
    containerNo: "",
    supplierName: "",
    arrivalDate: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const containerData = await getContainerById(id);
      setContainerMeta({
        containerNo: containerData.containerNo || "",
        supplierName:
          containerData.supplier?.suppliername || "Unknown Supplier",
        arrivalDate: containerData.arrivalDate || "",
        status: containerData.status || "",
      });

      const summaryData = await getOffloadSummary(id);
      const processedSummary = summaryData.map(
        (item: {
          id: string;
          name: string;
          expected?: number;
          received?: number;
        }) => ({
          id: item.id,
          name: item.name,
          expected: item.expected || 0,
          received: item.received || 0,
          variance: (item.received || 0) - (item.expected || 0),
          percentage:
            item.expected && item.expected > 0
              ? ((item.received || 0) / item.expected) * 100
              : 0,
        })
      );

      setSummary(processedSummary);
    } catch (error) {
      console.error("Failed to load summary data:", error);
      toast.error("Failed to load container summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const getStatusInfo = (expected: number, received: number) => {
    if (received === expected) {
      return {
        text: "Complete",
        icon: CheckCircle2,
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    } else if (received < expected) {
      return {
        text: "Shortage",
        icon: AlertTriangle,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      };
    } else {
      return {
        text: "Overage",
        icon: AlertCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      };
    }
  };

  const calculateTotals = () => {
    const totalExpected = summary.reduce((sum, item) => sum + item.expected, 0);
    const totalReceived = summary.reduce((sum, item) => sum + item.received, 0);
    const totalVariance = totalReceived - totalExpected;
    const overallPercentage =
      totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

    return { totalExpected, totalReceived, totalVariance, overallPercentage };
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const totals = calculateTotals();
      const currentDate = new Date().toLocaleDateString();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .container-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .totals { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #003366; color: white; }
            .complete { color: #4caf50; font-weight: bold; }
            .shortage { color: #ff9800; font-weight: bold; }
            .overage { color: #2196f3; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Container Offload Summary</h1>
            <h2>Container: ${containerMeta.containerNo}</h2>
            <p>Generated on: ${currentDate}</p>
          </div>
          
          <div class="container-info">
            <h3>Container Information</h3>
            <p><strong>Container Number:</strong> ${
              containerMeta.containerNo
            }</p>
            <p><strong>Supplier:</strong> ${containerMeta.supplierName}</p>
            <p><strong>Arrival Date:</strong> ${new Date(
              containerMeta.arrivalDate
            ).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${containerMeta.status}</p>
          </div>

          <div class="totals">
            <h3>Summary Totals</h3>
            <p><strong>Total Expected:</strong> ${
              totals.totalExpected
            } items</p>
            <p><strong>Total Received:</strong> ${
              totals.totalReceived
            } items</p>
            <p><strong>Total Variance:</strong> ${
              totals.totalVariance
            } items</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Expected</th>
                <th>Received</th>
                <th>Variance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${summary
                .map((item) => {
                  const status = getStatusInfo(item.expected, item.received);
                  return `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.expected}</td>
                    <td>${item.received}</td>
                    <td>${item.variance >= 0 ? "+" : ""}${item.variance}</td>
                    <td class="${status.text.toLowerCase()}">${status.text}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;

      html2pdf()
        .from(htmlContent)
        .save(
          `Offload_Summary_${containerMeta.containerNo}_${currentDate}.pdf`
        );
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Failed to export PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const totals = calculateTotals();

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
                <h1 className="text-3xl font-bold text-gray-900">
                  Offload Summary: {containerMeta.containerNo}
                </h1>
                <p className="mt-1 text-gray-600">
                  Complete offload verification report
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading summary...</span>
            </div>
          ) : (
            <>
              {/* Container Info Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Container Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-500">Container Number</p>
                      <p className="font-semibold text-gray-900">
                        {containerMeta.containerNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Supplier</p>
                      <p className="font-semibold text-gray-900">
                        {containerMeta.supplierName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Arrival Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(
                          containerMeta.arrivalDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Totals Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Summary Totals
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {totals.totalExpected}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Expected</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {totals.totalReceived}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Received</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p
                      className={`text-3xl font-bold ${
                        totals.totalVariance === 0
                          ? "text-gray-900"
                          : totals.totalVariance > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {totals.totalVariance >= 0 ? "+" : ""}
                      {totals.totalVariance}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Variance</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {totals.overallPercentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Complete</p>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <div className="mb-6">
                <button
                  onClick={exportToPDF}
                  disabled={exporting}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Download className="w-5 h-5" />
                  {exporting ? "Exporting..." : "Export PDF Report"}
                </button>
              </div>

              {/* Item Details Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Item Details
                  </h2>
                </div>

                {summary.length === 0 ? (
                  <div className="p-16 text-center">
                    <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No Summary Available
                    </h3>
                    <p className="text-gray-600">
                      No offload data found for this container.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Item Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Expected
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Received
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Variance
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {summary.map((item) => {
                          const status = getStatusInfo(
                            item.expected,
                            item.received
                          );
                          const StatusIcon = status.icon;

                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {item.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-sm font-semibold text-gray-900">
                                  {item.expected}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-sm font-semibold text-gray-900">
                                  {item.received}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div
                                  className={`text-sm font-semibold ${
                                    item.variance === 0
                                      ? "text-gray-900"
                                      : item.variance > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {item.variance >= 0 ? "+" : ""}
                                  {item.variance}
                                </div>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status.bgColor} ${status.color}`}
                                >
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {status.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-100">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              TOTAL
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-bold text-gray-900">
                              {totals.totalExpected}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-bold text-gray-900">
                              {totals.totalReceived}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div
                              className={`text-sm font-bold ${
                                totals.totalVariance === 0
                                  ? "text-gray-900"
                                  : totals.totalVariance > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {totals.totalVariance >= 0 ? "+" : ""}
                              {totals.totalVariance}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-bold text-gray-900">
                              -
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
