"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getContainerById, getContainerItems, receiveWithVerification } from "@/services/containerService";
import { getSupplierItems } from "@/services/supplierService";
import Select from "react-select";
import { toast } from "react-hot-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";

type ContainerItem = {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
};

type SupplierItem = {
  itemName: string;
  price: number;
};

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function bestMatch(name: string, knownItems: SupplierItem[]): string {
  let best = name;
  let bestScore = 0;
  const normalized = name.trim().toLowerCase();
  for (const item of knownItems) {
    const kn = item.itemName.trim().toLowerCase();
    if (kn === normalized) return item.itemName;
    const dist = levenshtein(normalized, kn);
    const score = 1 - dist / Math.max(normalized.length, kn.length, 1);
    if (score > bestScore && score >= 0.7) {
      bestScore = score;
      best = item.itemName;
    }
  }
  return best;
}

export default function ReceiveContainerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [container, setContainer] = useState<any>(null);
  const [items, setItems] = useState<ContainerItem[]>([]);
  const [supplierItems, setSupplierItems] = useState<SupplierItem[]>([]);
  const [corrections, setCorrections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [containerData, containerItems] = await Promise.all([
          getContainerById(id),
          getContainerItems(id),
        ]);
        setContainer(containerData);

        const sItems: SupplierItem[] = await getSupplierItems(containerData.supplierId);
        setSupplierItems(sItems);

        const initialCorrections: Record<string, string> = {};
        for (const item of containerItems) {
          initialCorrections[item.itemName] = bestMatch(item.itemName, sItems);
        }
        setCorrections(initialCorrections);
        setItems(containerItems);
      } catch {
        toast.error("Failed to load container data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Supplier items as canonical options; also include any packing list names not already covered
  // so users can always "keep original" even if no supplier item matches
  const supplierOptionValues = new Set(supplierItems.map((s) => s.itemName));
  const packingListNames = items
    .map((i) => i.itemName)
    .filter((n) => !supplierOptionValues.has(n));
  const options = [
    ...supplierItems.map((s) => ({ value: s.itemName, label: s.itemName, group: "Supplier Items" })),
    ...packingListNames.map((n) => ({ value: n, label: `${n} (packing list)`, group: "Packing List" })),
  ];

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await receiveWithVerification(id, corrections);
      toast.success("Container received and items verified");
      router.push("/containers");
    } catch {
      toast.error("Failed to mark container as received");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="icon-btn text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="page-title">Verify &amp; Receive Container</h1>
            {container && (
              <p className="text-sm text-gray-500 mt-0.5">
                #{container.containerNo} &mdash; {container.supplier?.suppliername}
              </p>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Match each packing list item to its canonical supplier item name before stock goes live.
          Items already matched correctly are pre-filled — review and confirm.
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Packing List Name</span>
              <span>Canonical Item Name</span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const corrected = corrections[item.itemName] ?? item.itemName;
              const changed = corrected !== item.itemName;
              return (
                <div key={item.id} className="px-4 py-3 grid grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.itemName}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity} &bull; GH₵{item.unitPrice}</p>
                  </div>
                  <div>
                    <Select
                      options={options}
                      value={{ value: corrected, label: corrected }}
                      onChange={(opt) => {
                        if (!opt) return;
                        setCorrections((prev) => ({ ...prev, [item.itemName]: opt.value }));
                      }}
                      isSearchable
                      classNamePrefix="rselect"
                      styles={{ container: (base) => ({ ...base, width: "100%" }) }}
                    />
                    {changed && (
                      <p className="text-xs text-amber-600 mt-1">
                        Will be renamed from &quot;{item.itemName}&quot;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {saving ? "Confirming..." : "Confirm Receipt"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
