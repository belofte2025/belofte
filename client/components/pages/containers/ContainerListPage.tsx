"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getContainers,
  markAsShipped,
  markAsArrived,
  markAsDone,
  deleteContainer,
} from "@/services/containerService";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { Dialog } from "@headlessui/react";
import {
  Container, Plus, MoreVertical, Truck, CheckCircle, Clock,
  Building, Calendar, X, FileText, List, Ship, Anchor, ChevronDown,
} from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";
import Badge from "@/components/ui/Badge";
import clsx from "clsx";

type ContainerStatus = "Pending" | "Shipped" | "Arrived" | "Received" | "Incomplete" | "Done";

type ContainerData = {
  id: string;
  number: string;
  company: string;
  deliveryDate: string;
  status: ContainerStatus;
};

const ITEMS_PER_PAGE = 10;

const PRE_WAREHOUSE: ContainerStatus[] = ["Pending", "Shipped", "Arrived"];

export default function ContainerListPage() {
  const router = useRouter();
  const [containers, setContainers] = useState<ContainerData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = containers.filter((c) =>
    c.number.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const statusUpdate = async (
    id: string,
    action: () => Promise<unknown>,
    newStatus: ContainerStatus,
    successMsg: string,
    then?: (id: string) => void,
  ) => {
    try {
      await action();
      setContainers((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c));
      toast.success(successMsg);
      then?.(id);
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

  const statusVariant = (s: ContainerStatus) => {
    if (s === "Pending") return "warning";
    if (s === "Shipped") return "info";
    if (s === "Arrived") return "default";
    if (s === "Received" || s === "Incomplete") return "success";
    return "info"; // Done
  };

  const statusLabel = (s: ContainerStatus) => {
    if (s === "Arrived") return "At Port";
    return s;
  };

  const statusIcon = (s: ContainerStatus) => {
    if (s === "Pending") return <Clock className="w-3.5 h-3.5" />;
    if (s === "Shipped") return <Ship className="w-3.5 h-3.5" />;
    if (s === "Arrived") return <Anchor className="w-3.5 h-3.5" />;
    if (s === "Received" || s === "Incomplete") return <CheckCircle className="w-3.5 h-3.5" />;
    return <Truck className="w-3.5 h-3.5" />;
  };

  const pending   = containers.filter((c) => c.status === "Pending").length;
  const inTransit = containers.filter((c) => c.status === "Shipped" || c.status === "Arrived").length;
  const received  = containers.filter((c) => c.status === "Received" || c.status === "Incomplete").length;
  const done      = containers.filter((c) => c.status === "Done").length;

  const selectedContainer = containers.find((c) => c.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Containers</h1>
        {/* Add button with dropdown */}
        <div className="relative" ref={addMenuRef}>
          <button
            onClick={() => setAddMenuOpen((o) => !o)}
            className="btn btn-primary flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Container</span>
            <span className="sm:hidden">Add</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {addMenuOpen && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
              <Link
                href="/containers/new"
                onClick={() => setAddMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="font-medium">Direct Arrival</p>
                  <p className="text-xs text-gray-400">Already at warehouse</p>
                </div>
              </Link>
              <Link
                href="/containers/pre-register"
                onClick={() => setAddMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
              >
                <Ship className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-medium">Register Shipment</p>
                  <p className="text-xs text-gray-400">Container in transit</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats — 5 columns */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        <div className="stat-card">
          <p className="stat-label">Total</p>
          <p className="stat-value">{containers.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pending</p>
          <p className="stat-value text-yellow-600">{pending}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">In Transit</p>
          <p className="stat-value text-blue-600">{inTransit}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Received</p>
          <p className="stat-value text-green-600">{received}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Completed</p>
          <p className="stat-value text-blue-600">{done}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by container number..."
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
          <span className="ml-3 text-sm text-gray-500">Loading...</span>
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Container className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No containers found</p>
          <p className="text-xs text-gray-500 mt-1">Add your first container to get started</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="mobile-list lg:hidden">
            {paginated.map((item) => (
              <div key={item.id} className="mobile-list-item flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {item.number.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">#{item.number}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3" />{item.company}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />{format(new Date(item.deliveryDate), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge variant={statusVariant(item.status) as "default" | "success" | "warning" | "danger" | "info"}>
                    <span className="flex items-center gap-1">{statusIcon(item.status)}{statusLabel(item.status)}</span>
                  </Badge>
                  <button onClick={() => setSelectedId(item.id)} className="icon-btn text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="table-wrapper hidden lg:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Container</th>
                  <th>Company</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                          {item.number.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">#{item.number}</span>
                      </div>
                    </td>
                    <td className="text-gray-600">
                      <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-gray-400" />{item.company}</span>
                    </td>
                    <td className="text-gray-600">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" />{format(new Date(item.deliveryDate), "MMM dd, yyyy")}</span>
                    </td>
                    <td>
                      <Badge variant={statusVariant(item.status) as "default" | "success" | "warning" | "danger" | "info"}>
                        <span className="flex items-center gap-1">{statusIcon(item.status)}{statusLabel(item.status)}</span>
                      </Badge>
                    </td>
                    <td className="text-right">
                      <button onClick={() => setSelectedId(item.id)} className="icon-btn text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
              <span className="text-xs text-gray-500">
                {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className={clsx("px-3 py-1.5 text-xs font-medium rounded-lg border", page === 1 ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400" : "border-gray-300 text-gray-700 hover:bg-gray-50")}
                >Prev</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={clsx("px-3 py-1.5 text-xs font-medium rounded-lg", page === p ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50")}>
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className={clsx("px-3 py-1.5 text-xs font-medium rounded-lg border", page === totalPages ? "opacity-40 cursor-not-allowed border-gray-200 text-gray-400" : "border-gray-300 text-gray-700 hover:bg-gray-50")}
                >Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Actions dialog */}
      <Dialog open={!!selectedId} onClose={() => setSelectedId(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <Dialog.Panel className="w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl sm:max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Dialog.Title className="text-base font-semibold text-gray-900">
                {selectedContainer ? `Container #${selectedContainer.number}` : "Container Actions"}
              </Dialog.Title>
              <button onClick={() => setSelectedId(null)} className="icon-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2">

              {/* Lifecycle actions by status */}
              {selectedContainer?.status === "Pending" && (
                <button
                  onClick={() => {
                    const id = selectedId!;
                    setSelectedId(null);
                    statusUpdate(id, () => markAsShipped(id), "Shipped", "Container marked as shipped");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors"
                >
                  <Ship className="w-4 h-4" />
                  Mark as Shipped
                </button>
              )}

              {selectedContainer?.status === "Shipped" && (
                <button
                  onClick={() => {
                    const id = selectedId!;
                    setSelectedId(null);
                    statusUpdate(id, () => markAsArrived(id), "Arrived", "Container marked as arrived at port");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-sm font-medium transition-colors"
                >
                  <Anchor className="w-4 h-4" />
                  Mark as Arrived at Port
                </button>
              )}

              {selectedContainer?.status === "Arrived" && (
                <button
                  onClick={() => { setSelectedId(null); router.push(`/containers/${selectedId}/receive`); }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-medium transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Verify &amp; Mark as Received
                </button>
              )}

              {(selectedContainer?.status === "Received" || selectedContainer?.status === "Incomplete") && (
                <>
                  <button
                    onClick={() => { setSelectedId(null); window.location.href = `/offload/container/${selectedId}`; }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-sm font-medium transition-colors"
                  >
                    <List className="w-4 h-4" />
                    Perform Offload
                  </button>
                  <button
                    onClick={() => {
                      const id = selectedId!;
                      setSelectedId(null);
                      statusUpdate(id, () => markAsDone(id), "Done", "Container marked as complete");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Complete
                  </button>
                </>
              )}

              {/* Always-visible actions (not for pre-warehouse containers) */}
              {!PRE_WAREHOUSE.includes(selectedContainer?.status ?? "Pending") && (
                <button
                  onClick={() => { setSelectedId(null); window.location.href = `/sales/container/${selectedId}`; }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors"
                >
                  <Container className="w-4 h-4" />
                  Make Sale in Container
                </button>
              )}

              <button
                onClick={() => { setSelectedId(null); window.location.href = `/reports/sales/container/${selectedId}`; }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-sm font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                Container Sales Report
              </button>
              <button
                onClick={() => { setSelectedId(null); window.location.href = `/offload/parkinglist/${selectedId}`; }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-xl text-sm font-medium transition-colors"
              >
                <List className="w-4 h-4" />
                Container Parking List
              </button>
              <button
                onClick={() => handleDelete(selectedId!)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors"
              >
                <Truck className="w-4 h-4" />
                Delete Container
              </button>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={() => setSelectedId(null)}
                className="btn btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
