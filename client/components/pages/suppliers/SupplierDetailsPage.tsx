"use client";

import { useEffect, useState } from "react";
import { getSupplierById, updateSupplier } from "@/services/supplierService";
import { toast } from "react-hot-toast";
import { ArrowLeft, Building, Phone, Globe, Package, Container, Edit, Save, X, DollarSign, Hash, Tag, TrendingUp } from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

interface SupplierDetailsPageProps {
  supplierId: string;
}

type Supplier = {
  id: string;
  suppliername: string;
  contact: string;
  country: string;
  createdAt: string;
  containers: unknown[];
  items: unknown[];
};

export default function SupplierDetailsPage({ supplierId }: SupplierDetailsPageProps) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    suppliername: "",
    contact: "",
    country: "",
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const data = await getSupplierById(supplierId);
        setSupplier(data);
        setFormData({
          suppliername: data.suppliername,
          contact: data.contact,
          country: data.country,
        });
      } catch (error) {
        console.error("Failed to load supplier:", error);
        toast.error("Failed to load supplier details");
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId]);

  const handleSave = async () => {
    try {
      await updateSupplier(supplierId, formData);
      setSupplier(prev => prev ? { ...prev, ...formData } : null);
      setEditing(false);
      toast.success("Supplier updated successfully");
    } catch (error) {
      console.error("Failed to update supplier:", error);
      toast.error("Failed to update supplier");
    }
  };

  const handleCancel = () => {
    if (supplier) {
      setFormData({
        suppliername: supplier.suppliername,
        contact: supplier.contact,
        country: supplier.country,
      });
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600" />
        <span className="ml-3 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-16">
        <h3 className="text-sm font-medium text-gray-900">Supplier not found</h3>
        <Link href="/suppliers" className="mt-4 btn btn-primary inline-flex">
          Back to Suppliers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-2">
            <Link href="/suppliers" className="icon-btn text-gray-400 hover:text-gray-700 hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="page-title">{supplier.suppliername}</h1>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={handleCancel} className="btn btn-secondary">
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button onClick={handleSave} className="btn btn-primary">
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.suppliername}
                        onChange={(e) => setFormData(prev => ({ ...prev, suppliername: e.target.value }))}
                        className="input pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.contact}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                        className="input pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="input pl-10"
                      >
                        {/* North America */}
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="Mexico">Mexico</option>
                        
                        {/* Europe */}
                        <option value="Germany">Germany</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="France">France</option>
                        <option value="Italy">Italy</option>
                        <option value="Spain">Spain</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="Belgium">Belgium</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="Austria">Austria</option>
                        <option value="Sweden">Sweden</option>
                        <option value="Norway">Norway</option>
                        <option value="Denmark">Denmark</option>
                        <option value="Finland">Finland</option>
                        <option value="Poland">Poland</option>
                        <option value="Czech Republic">Czech Republic</option>
                        <option value="Hungary">Hungary</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Greece">Greece</option>
                        <option value="Ireland">Ireland</option>
                        <option value="Luxembourg">Luxembourg</option>
                        
                        {/* West Asia */}
                        <option value="Turkey">Turkey</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Oman">Oman</option>
                        <option value="Jordan">Jordan</option>
                        <option value="Lebanon">Lebanon</option>
                        <option value="Israel">Israel</option>
                        <option value="Cyprus">Cyprus</option>
                        
                        {/* South America */}
                        <option value="Brazil">Brazil</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Chile">Chile</option>
                        <option value="Colombia">Colombia</option>
                        <option value="Peru">Peru</option>
                        <option value="Uruguay">Uruguay</option>
                        <option value="Ecuador">Ecuador</option>
                        <option value="Venezuela">Venezuela</option>
                        
                        {/* Africa (Major) */}
                        <option value="Ghana">Ghana</option>
                        <option value="Nigeria">Nigeria</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Egypt">Egypt</option>
                        <option value="Morocco">Morocco</option>
                        <option value="Kenya">Kenya</option>
                        <option value="Ethiopia">Ethiopia</option>
                        
                        {/* Asia Pacific (Major) */}
                        <option value="China">China</option>
                        <option value="Japan">Japan</option>
                        <option value="South Korea">South Korea</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Australia">Australia</option>
                        <option value="New Zealand">New Zealand</option>
                        
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Building className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-sm font-medium text-gray-900">{supplier.suppliername}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Contact</p>
                      <p className="text-sm font-medium text-gray-900">{supplier.contact}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Country</p>
                      <Badge variant="default">{supplier.country}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-5 h-5 text-gray-400 mr-3 flex items-center justify-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Added</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(supplier.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href={`/suppliers/${supplier.id}/items`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200"
                >
                  <Package className="w-4 h-4" />
                  Manage Items
                </Link>

                <Link
                  href={`/containers/new?supplier=${supplier.id}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                >
                  <Container className="w-4 h-4" />
                  Add Container
                </Link>
              </div>
            </div>

            {/* Inventory Management */}
            <div className="bg-white shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Management</h3>
              <div className="grid grid-cols-1 gap-3">
                <Link
                  href={`/suppliers/${supplier.id}/stock-adjustments`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                >
                  <TrendingUp className="w-4 h-4" />
                  Stock Adjustments
                </Link>

                <Link
                  href={`/suppliers/${supplier.id}/quantity-management`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200"
                >
                  <Hash className="w-4 h-4" />
                  Container Quantities
                </Link>

                <Link
                  href={`/suppliers/${supplier.id}/price-management`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200"
                >
                  <DollarSign className="w-4 h-4" />
                  Price Management
                </Link>

                <Link
                  href={`/suppliers/${supplier.id}/alias-management`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors duration-200"
                >
                  <Tag className="w-4 h-4" />
                  Alias Management
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-white shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Container className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">Containers</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {supplier.containers?.length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Items</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {supplier.items?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3 text-sm text-gray-500">
                <p>Supplier created on {new Date(supplier.createdAt).toLocaleDateString()}</p>
                {supplier.containers && supplier.containers.length > 0 && (
                  <p>Latest container added recently</p>
                )}
                {supplier.items && supplier.items.length > 0 && (
                  <p>{supplier.items.length} items in catalog</p>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}