"use client";

import { useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { Camera, Upload, X, ScanLine, Trash2, CheckCircle } from "lucide-react";
import { scanPackingListImage } from "@/services/containerService";

type ExtractedItem = {
  itemName: string;
  quantity: number;
  unitPrice: number;
};

type Props = {
  onClose: () => void;
  onAddItems: (items: ExtractedItem[]) => void;
};

export default function ScanPackingListModal({ onClose, onAddItems }: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [rows, setRows] = useState<ExtractedItem[] | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRows(null);
    e.target.value = "";
  };

  const handleExtract = async () => {
    if (!imageFile) return;
    setExtracting(true);
    try {
      const items = await scanPackingListImage(imageFile);
      if (items.length === 0) {
        toast.error("Couldn't detect any item rows in this image. Try a clearer photo or add items manually.");
      }
      setRows(items);
    } catch {
      toast.error("Image analysis failed. Try a clearer photo.");
    } finally {
      setExtracting(false);
    }
  };

  const updateRow = (index: number, field: keyof ExtractedItem, value: string) => {
    setRows((prev) =>
      prev
        ? prev.map((r, i) =>
            i === index
              ? {
                  ...r,
                  [field]: field === "itemName" ? value : parseFloat(value) || 0,
                }
              : r
          )
        : prev
    );
  };

  const removeRow = (index: number) => {
    setRows((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleConfirm = () => {
    const valid = (rows || []).filter((r) => r.itemName && r.quantity > 0);
    if (valid.length === 0) {
      toast.error("No valid items to add");
      return;
    }
    onAddItems(valid);
    toast.success(`Added ${valid.length} item${valid.length > 1 ? "s" : ""} from image`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Scan Packing List</h2>
              <p className="text-indigo-100 text-sm">Take a photo or upload an image to extract items</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!imagePreview && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 group flex flex-col items-center"
              >
                <Camera className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Take Photo</span>
              </button>
              <button
                onClick={() => uploadInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 group flex flex-col items-center"
              >
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-green-500 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">Upload Image</span>
              </button>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFileSelected} />
              <input ref={uploadInputRef} type="file" accept="image/*" hidden onChange={handleFileSelected} />
            </div>
          )}

          {imagePreview && (
            <div className="space-y-4">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Packing list" className="w-full max-h-64 object-contain rounded-xl border border-gray-200 bg-gray-50" />
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null); setRows(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:bg-gray-100"
                  title="Remove image"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>

              {rows === null && (
                <button
                  onClick={handleExtract}
                  disabled={extracting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {extracting ? "Analyzing image…" : "Extract Items From Image"}
                </button>
              )}
            </div>
          )}

          {rows !== null && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  Review extracted items ({rows.length})
                </h3>
                <p className="text-xs text-gray-500">Edit anything that looks wrong before adding</p>
              </div>
              {rows.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No items detected — try a clearer photo, or close this and add items manually.</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Price</th>
                          <th className="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rows.map((row, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5">
                              <input
                                value={row.itemName}
                                onChange={(e) => updateRow(i, "itemName", e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-gray-900"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="number"
                                value={row.quantity}
                                onChange={(e) => updateRow(i, "quantity", e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-gray-900"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="number"
                                step="0.01"
                                value={row.unitPrice}
                                onChange={(e) => updateRow(i, "unitPrice", e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-gray-900"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-center">
                              <button onClick={() => removeRow(i)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          {rows !== null && rows.length > 0 && (
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Add {rows.filter((r) => r.itemName && r.quantity > 0).length} Item(s)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
