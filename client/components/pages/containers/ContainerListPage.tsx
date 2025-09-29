"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getContainers,
  markAsReceived,
  deleteContainer,
} from "@/services/containerService";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { Dialog } from "@headlessui/react";
import { 
  Container, 
  Plus, 
  MoreVertical, 
  Truck, 
  CheckCircle, 
  Clock, 
  Building,
  Calendar
} from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";

type ContainerData = {
  id: string;
  number: string;
  company: string;
  deliveryDate: string;
  status: "Pending" | "Received" | "Done";
};

export default function ContainerListPage() {
  const [containers, setContainers] = useState<ContainerData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getContainers();
      setContainers(data);
    } catch {
      toast.error("Failed to fetch containers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = containers.filter((c) =>
    c.number.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleMarkReceived = async (id: string) => {
    try {
      await markAsReceived(id);
      setContainers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "Received" } : c))
      );
      toast.success("Marked as received");
      window.location.href = `/offload/${id}`;
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContainer(id);
      setContainers((prev) => prev.filter((c) => c.id !== id));
      toast.success("Container deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setSelectedId(null);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "Received":
        return "success";
      case "Done":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "Received":
        return <CheckCircle className="w-4 h-4" />;
      case "Done":
        return <Truck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const totalContainers = containers.length;
  const pendingContainers = containers.filter(c => c.status === "Pending").length;
  const receivedContainers = containers.filter(c => c.status === "Received").length;
  const doneContainers = containers.filter(c => c.status === "Done").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Containers</h1>
              <p className="mt-1 text-gray-600">Track and manage your container shipments</p>
            </div>
            <Link
              href="/containers/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Add Container
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Containers</p>
              <p className="text-3xl font-bold text-gray-900">{totalContainers}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingContainers}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Received</p>
              <p className="text-3xl font-bold text-green-600">{receivedContainers}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-blue-600">{doneContainers}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search containers by number..."
            className="max-w-md"
          />
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading containers...</span>
            </div>
          ) : (
            <>
              {paginated.length === 0 ? (
                <div className="text-center py-16">
                  <Container className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No containers found</h3>
                  <p className="mt-2 text-gray-500">Get started by adding your first container.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Container
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Delivery Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginated.map((item, i) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                                  {item.number.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  #{item.number}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Container {(page - 1) * ITEMS_PER_PAGE + i + 1}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Building className="w-4 h-4 text-gray-400 mr-2" />
                              <div className="text-sm text-gray-900">{item.company}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              {format(new Date(item.deliveryDate), "MMM dd, yyyy")}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStatusVariant(item.status) as "default" | "success" | "warning" | "danger" | "info"}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(item.status)}
                                {item.status}
                              </div>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedId(item.id)}
                              className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Enhanced Pagination */}
              {filtered.length > ITEMS_PER_PAGE && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * ITEMS_PER_PAGE + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(page * ITEMS_PER_PAGE, filtered.length)}
                      </span>{" "}
                      of <span className="font-medium">{filtered.length}</span> containers
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Previous
                      </button>
                      
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(Math.ceil(filtered.length / ITEMS_PER_PAGE), 5) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                page === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setPage((p) => Math.min(p + 1, Math.ceil(filtered.length / ITEMS_PER_PAGE)))}
                        disabled={page === Math.ceil(filtered.length / ITEMS_PER_PAGE)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-200">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-6 text-center">
              Container Actions
            </Dialog.Title>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedId(null);
                  window.location.href = `/sales/container/${selectedId}`;
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors duration-200"
              >
                <Container className="w-4 h-4" />
                Make Sale in Container
              </button>
              <button
                onClick={() => {
                  setSelectedId(null);
                  handleMarkReceived(selectedId!);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-medium transition-colors duration-200"
              >
                <CheckCircle className="w-4 h-4" />
                Perform Offload
              </button>
              <button
                onClick={() => {
                  setSelectedId(null);
                  window.location.href = `/summary/container/${selectedId}`;
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors duration-200"
              >
                <Truck className="w-4 h-4" />
                Container Sales Report
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedId!);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors duration-200"
              >
                <Clock className="w-4 h-4" />
                Delete Container
              </button>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="w-full mt-6 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
