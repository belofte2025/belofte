// app/companies/page.tsx
"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Building2 } from "lucide-react";
import { getCompanies, Company } from "@/services/companyService";
import toast from "react-hot-toast";
import CompanyList from "@/components/companies/CompanyList";
import CreateCompanyModal from "@/components/companies/CreateCompanyModel";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      toast.error("Failed to load companies");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
                <p className="mt-1 text-gray-600">
                  Manage your company organizations
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Add Company
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Companies</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {companies.length}
              </p>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Company List */}
        <CompanyList
          companies={companies}
          loading={loading}
          onRefresh={loadCompanies}
        />

        {/* Create Company Modal */}
        <CreateCompanyModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={loadCompanies}
        />
      </div>
    </div>
  );
}
