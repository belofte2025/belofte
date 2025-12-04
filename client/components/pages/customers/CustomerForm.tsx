"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomer,
  updateCustomer,
  getCustomerById,
  checkCustomerName,
} from "@/services/customerService";
import { User, Phone, Save, AlertCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { Dialog } from "@headlessui/react";

type Props = {
  mode: "create" | "edit";
  customerId?: string;
};

export default function CustomerForm({ mode, customerId }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(mode === "edit");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [similarCustomers, setSimilarCustomers] = useState<
    Array<{ id: string; customerName: string; phone: string }>
  >([]);

  const router = useRouter();

  useEffect(() => {
    if (mode === "edit" && customerId) {
      const fetchCustomer = async () => {
        try {
          const data = await getCustomerById(customerId);
          setName(data.customerName || data.name);
          setPhone(data.phone);
        } catch {
          toast.error("Failed to load customer details");
          router.back();
        } finally {
          setLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [mode, customerId, router]);

  const validateForm = () => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Customer name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[+]?[0-9]{10,15}$/.test(phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // For create mode, check for similar customer names first
    if (mode === "create") {
      setSaving(true);
      try {
        const similar = await checkCustomerName(name.trim());
        if (similar.length > 0) {
          setSimilarCustomers(similar);
          setShowDuplicateModal(true);
          setSaving(false);
          return;
        }
        // No duplicates, proceed with creation
        await proceedWithCreation();
      } catch {
        toast.error("Failed to check customer name. Please try again.");
        setSaving(false);
      }
    } else {
      // Edit mode - just update directly
      setSaving(true);
      try {
        await updateCustomer(customerId!, { customerName: name, phone });
        toast.success("Customer updated successfully!");
        router.push("/customers");
      } catch {
        toast.error("Failed to save customer. Please try again.");
      } finally {
        setSaving(false);
      }
    }
  };

  const proceedWithCreation = async () => {
    setSaving(true);
    try {
      await createCustomer({ customerName: name, phone });
      toast.success("Customer created successfully!");
      setName("");
      setPhone("");
      setShowDuplicateModal(false);
      setSimilarCustomers([]);
    } catch {
      toast.error("Failed to save customer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            Loading customer details...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => router.push("/customers")}
          className="inline-flex items-center gap-2 px-3 py-1.5 mb-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customers
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {mode === "edit" ? "Customer Information" : "Add New Customer"}
            </h3>
            <p className="text-sm text-gray-600">
              {mode === "edit"
                ? "Update customer details"
                : "Create a new customer profile"}
            </p>
          </div>
        </div>
      </div>
      <div className="px-6 py-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Name
              </div>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name)
                  setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={`w-full px-4 py-3 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-gray-900 placeholder:text-gray-400 ${
                errors.name
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-200"
              }`}
              placeholder="Enter customer full name"
            />
            {errors.name && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </div>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone)
                  setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              className={`w-full px-4 py-3 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200 text-gray-900 placeholder:text-gray-400 ${
                errors.phone
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-200"
              }`}
              placeholder="Enter phone number (e.g., +233 20 123 4567)"
            />
            {errors.phone && (
              <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {errors.phone}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {mode === "edit" ? "Save Changes" : "Create Customer"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Customer Warning Modal */}
      <Dialog
        open={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border-2 border-amber-400">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <Dialog.Title className="text-xl font-bold text-amber-700 mb-2">
                Warning: Similar Customer Found
              </Dialog.Title>
              <p className="text-gray-600 mb-4">
                A customer with a similar name already exists in the system. Please verify this is not a duplicate before continuing.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-amber-800 mb-3">
                  Existing customers with similar names:
                </p>
                <ul className="space-y-3">
                  {similarCustomers.map((customer) => (
                    <li
                      key={customer.id}
                      className="text-sm text-amber-900 flex items-center gap-2 bg-white p-2 rounded border border-amber-200"
                    >
                      <User className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold">{customer.customerName}</span>
                      <span className="text-amber-600">({customer.phone})</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setSimilarCustomers([]);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Go Back & Edit
                </button>
                <button
                  onClick={proceedWithCreation}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Continue Anyway"}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
