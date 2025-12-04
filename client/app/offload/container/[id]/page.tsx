"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  ArrowLeft,
  Search,
  Package,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Save,
  CheckSquare,
} from "lucide-react";
import {
  getContainerItems,
  getContainerById,
  saveOffload,
} from "@/services/containerService";
import { useOffloadContext } from "@/context/offloadContext";
import toast from "react-hot-toast";

interface Item {
  id: string;
  itemName: string;
  quantity: number;
  receivedQty: number;
}

interface Container {
  id: string;
  containerNo: string;
  status: string;
}

export default function OffloadPage() {
  const params = useParams();
  const router = useRouter();
  const containerId = params?.id as string;

  // State management
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [container, setContainer] = useState<Container | null>(null);
  const [receivedCounts, setReceivedCounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { offloadState, saveOffloadState, clearOffloadState } =
    useOffloadContext();

  // Load data on mount and from offload context
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Check if we have saved state
      if (offloadState[containerId]) {
        const { receivedCounts: savedCounts, items: savedItems } =
          offloadState[containerId];
        setItems(savedItems);
        setReceivedCounts(savedCounts);
      } else {
        const fetchedItems = await getContainerItems(containerId);
        setItems(fetchedItems);
        const initialCounts = Object.fromEntries(
          fetchedItems.map((item: Item) => [item.id, item.receivedQty])
        );
        setReceivedCounts(initialCounts);
      }

      // Load container info
      const containerData = await getContainerById(containerId);
      setContainer(containerData);
      setIsInitialLoad(false);
    } catch (error) {
      console.error("Failed to load offload data:", error);
      toast.error("Failed to load container data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [containerId, offloadState]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save offload state when data changes (but not during initial load)
  useEffect(() => {
    if (items.length > 0 && !isInitialLoad) {
      saveOffloadState(containerId, { items, receivedCounts });
    }
  }, [items, receivedCounts, containerId, isInitialLoad, saveOffloadState]);

  // Utility functions
  const incrementQty = (itemId: string) => {
    setReceivedCounts((prev) => {
      const current = prev[itemId] || 0;
      const maxQty = items.find((i) => i.id === itemId)?.quantity ?? 0;

      if (current >= maxQty) {
        toast.error("Cannot exceed expected quantity");
        return prev;
      }

      return { ...prev, [itemId]: current + 1 };
    });
  };

  const decrementQty = (itemId: string) => {
    setReceivedCounts((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 0) return prev;
      return { ...prev, [itemId]: current - 1 };
    });
  };

  const setDirectQty = (itemId: string, quantity: number) => {
    const maxQty = items.find((i) => i.id === itemId)?.quantity ?? 0;
    const validQty = Math.max(0, Math.min(quantity, maxQty));

    setReceivedCounts((prev) => ({
      ...prev,
      [itemId]: validQty,
    }));
  };

  const handleComplete = async () => {
    if (
      !confirm(
        `Complete Offload?\n\nExpected: ${totalExpected} items\nReceived: ${totalReceived} items\n\nAre you sure you want to complete the offload?`
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const updatedItems = items.map((item) => ({
        ...item,
        receivedQty: receivedCounts[item.id] ?? item.receivedQty,
      }));

      await saveOffload(containerId, updatedItems, true);
      clearOffloadState(containerId);

      toast.success("Offload completed successfully!");
      router.push(`/offload/summary/${containerId}`);
    } catch (error) {
      console.error("Failed to complete offload:", error);
      toast.error("Failed to complete offload. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIncomplete = async () => {
    setSaving(true);
    try {
      const updatedItems = items.map((item) => ({
        ...item,
        receivedQty: receivedCounts[item.id] ?? item.receivedQty,
      }));

      await saveOffload(containerId, updatedItems, false);
      clearOffloadState(containerId);

      toast.success("Progress saved successfully!");
      router.back();
    } catch (error) {
      console.error("Failed to save offload:", error);
      toast.error("Failed to save progress. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Filter items based on search
  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.itemName.toLowerCase().includes(search.toLowerCase())
      ),
    [items, search]
  );

  // Calculate progress
  const { totalExpected, totalReceived, progressPercentage } = useMemo(() => {
    const expected = items.reduce((sum, item) => sum + item.quantity, 0);
    const received = Object.values(receivedCounts).reduce(
      (sum, qty) => sum + qty,
      0
    );
    const percentage = expected > 0 ? (received / expected) * 100 : 0;
    return {
      totalExpected: expected,
      totalReceived: received,
      progressPercentage: percentage,
    };
  }, [items, receivedCounts]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Offload: {container?.containerNo || "Container"}
                </h1>
                <p className="mt-1 text-gray-600">
                  Track and record received inventory
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Loading container items...
              </span>
            </div>
          ) : (
            <>
              {/* Progress Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Offload Progress
                </h2>
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div
                    className="absolute top-0 left-0 h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-center text-gray-600">
                  {totalReceived} of {totalExpected} items (
                  {progressPercentage.toFixed(0)}%)
                </p>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 mb-6">
                {filteredItems.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                    <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No Items Found
                    </h3>
                    <p className="text-gray-600">
                      {search
                        ? "Try adjusting your search"
                        : "No items available for offloading"}
                    </p>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const currentQty =
                      receivedCounts[item.id] ?? item.receivedQty;
                    const isComplete = currentQty === item.quantity;
                    const hasVariance = currentQty !== item.quantity;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all duration-200 ${
                          isComplete ? "border-green-500" : "border-gray-200"
                        }`}
                      >
                        {/* Item Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {item.itemName}
                            </h3>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                Expected:{" "}
                                <span className="font-semibold text-gray-900">
                                  {item.quantity}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Received:{" "}
                                <span
                                  className={`font-semibold ${
                                    hasVariance
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {currentQty}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isComplete ? (
                              <div className="flex flex-col items-center gap-1">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                                <span className="text-xs font-semibold text-green-600">
                                  Complete
                                </span>
                              </div>
                            ) : hasVariance ? (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                <span className="text-xs font-semibold text-yellow-600">
                                  Variance
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => decrementQty(item.id)}
                              disabled={currentQty <= 0}
                              className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors duration-200"
                            >
                              <Minus className="w-5 h-5" />
                            </button>

                            <div className="min-w-[40px] text-center">
                              <span className="text-2xl font-bold text-gray-900">
                                {currentQty}
                              </span>
                            </div>

                            <button
                              onClick={() => incrementQty(item.id)}
                              disabled={currentQty >= item.quantity}
                              className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors duration-200"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>

                          <button
                            onClick={() => setDirectQty(item.id, item.quantity)}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-500 text-blue-600 font-semibold text-sm rounded-lg transition-colors duration-200"
                          >
                            Set Max
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg lg:sticky lg:bottom-auto">
                <div className="max-w-7xl mx-auto flex gap-3">
                  <button
                    onClick={handleSaveIncomplete}
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? "Saving..." : "Save Progress"}
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={saving}
                    className="flex-[2] inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <CheckSquare className="w-5 h-5" />
                    {saving ? "Completing..." : "Complete Offload"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
