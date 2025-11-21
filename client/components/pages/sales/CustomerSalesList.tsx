"use client";
import { useEffect, useState } from "react";
import { getCustomerById } from "@/services/customerService";
import { getSalesByCustomerId, updateSale, deleteSaleById } from "@/services/salesService";
import { formatCurrency } from "@/utils/format";
import { ShoppingCart, Calendar, TrendingUp, Receipt, Eye, Edit, Trash2, Plus, Minus, X } from "lucide-react";
import { Dialog } from "@headlessui/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type Props = {
  customerId: string;
};

type SaleItem = {
  itemName: string;
  quantity: number;
  unitPrice: number;
};

type Sale = {
  id: string;
  saleDate: string;
  saleType: string;
  totalAmount: number;
  items: SaleItem[];
};

export default function CustomerSalesList({ customerId }: Props) {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editForm, setEditForm] = useState<{
    saleType: string;
    items: SaleItem[];
  }>({ saleType: "", items: [] });

  const loadSales = async () => {
    try {
      const data = await getSalesByCustomerId(customerId);
      setSales(data);
    } catch {
      toast.error("Failed to fetch sales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const data = await getCustomerById(customerId);
        setCustomerName(data.customerName || data.name);
      } catch {
        toast.error("Failed to load customer.");
      }
    };

    loadCustomer();
    loadSales();
  }, [customerId]);

  const handleOpenEditModal = (sale: Sale) => {
    setEditingSale(sale);
    setEditForm({
      saleType: sale.saleType || "cash",
      items: sale.items?.map(item => ({ ...item })) || [],
    });
    setShowEditModal(true);
  };

  const handleEditSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    if (editForm.items.length === 0) {
      toast.error("Sale must have at least one item");
      return;
    }

    try {
      await updateSale(editingSale.id, {
        saleType: editForm.saleType,
        items: editForm.items,
      });
      toast.success("Sale updated successfully");
      setShowEditModal(false);
      setEditingSale(null);
      loadSales();
    } catch (err) {
      console.error("Error updating sale:", err);
      toast.error("Failed to update sale");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;

    try {
      await deleteSaleById(id);
      toast.success("Sale deleted successfully.");
      loadSales();
    } catch (err) {
      console.error("Error deleting sale:", err);
      toast.error("Failed to delete sale.");
    }
  };

  const updateEditItem = (index: number, field: keyof SaleItem, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeEditItem = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addEditItem = () => {
    setEditForm(prev => ({
      ...prev,
      items: [...prev.items, { itemName: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const calculateEditTotal = () => {
    return editForm.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const getSaleTypeColor = (type: string) => {
    return type?.toLowerCase() === "cash"
      ? "bg-green-100 text-green-800"
      : "bg-blue-100 text-blue-800";
  };

  // Calculate statistics
  const totalSales = sales.length;
  const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const averageAmount = totalSales > 0 ? totalAmount / totalSales : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {customerName ? customerName.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Sales History</h1>
              <p className="text-gray-600">
                Sales transactions for {customerName || 'Loading...'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
              </div>
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Sale</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(averageAmount)}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Sales Transactions</h2>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading sales...</span>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Found</h3>
              <p className="text-gray-600">This customer hasn&apos;t made any purchases yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-4 hover:bg-gray-50 transition-colors duration-200"
                >
                  {/* Sale Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-xs font-medium ${getSaleTypeColor(sale.saleType)}`}>
                        {sale.saleType?.toUpperCase() || "SALE"}
                      </span>
                      <span className="text-sm text-gray-500">#{sale.id.slice(-8)}</span>
                      <span className="text-sm text-gray-400">
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => router.push(`/sales/${sale.id}`)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(sale)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sale.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Items Table */}
                  {sale.items && sale.items.length > 0 && (
                    <div className="border border-gray-200 mb-3">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left">
                          <tr>
                            <th className="px-3 py-2 text-xs font-medium text-gray-500">Item</th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Qty</th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Price</th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {sale.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-gray-900">{item.itemName}</td>
                              <td className="px-3 py-2 text-gray-600 text-right">{item.quantity}</td>
                              <td className="px-3 py-2 text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-3 py-2 text-gray-900 font-medium text-right">
                                {formatCurrency(item.quantity * item.unitPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">{sale.items?.length || 0} item(s)</span>
                    <div className="text-right">
                      <span className="text-sm text-gray-500 mr-2">Total:</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(sale.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {totalSales > 0 && (
          <div className="mt-4 bg-blue-50 p-4 border border-blue-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Sales Summary</h3>
              <p className="text-gray-600">
                Customer has made <span className="font-semibold text-blue-600">{totalSales}</span> purchases
                totaling <span className="font-semibold text-green-600">{formatCurrency(totalAmount)}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Sale Modal */}
      <Dialog open={showEditModal} onClose={() => {}} className="relative z-50">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl bg-white p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Edit Sale
              </Dialog.Title>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSale} className="space-y-6">
              {/* Sale Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Type
                </label>
                <select
                  value={editForm.saleType}
                  onChange={(e) => setEditForm(prev => ({ ...prev, saleType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="credit">Credit</option>
                </select>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Items
                  </label>
                  <button
                    type="button"
                    onClick={addEditItem}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {editForm.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => updateEditItem(index, "itemName", e.target.value)}
                          placeholder="Item name"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateEditItem(index, "quantity", parseInt(e.target.value) || 0)}
                          placeholder="Qty"
                          min="1"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateEditItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="w-24 text-right text-sm font-medium text-gray-700">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEditItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                        disabled={editForm.items.length === 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 flex items-center justify-between p-3 bg-green-50">
                  <span className="font-medium text-gray-700">Total Amount</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(calculateEditTotal())}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSale(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
