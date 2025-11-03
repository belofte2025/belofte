// components/companies/CompanyList.tsx
"use client";

import { useState } from "react";
import { Building2, Edit, Trash2, MapPin, Phone } from "lucide-react";
import { Company } from "@/services/companyService";
import EditCompanyModal from "./EditCompanyModal";
import DeleteCompanyModal from "./DeleteCompanyModal";

interface CompanyListProps {
  companies: Company[];
  loading: boolean;
  onRefresh: () => void;
}

export default function CompanyList({
  companies,
  loading,
  onRefresh,
}: CompanyListProps) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading companies...</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
        <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No Companies Found
        </h3>
        <p className="text-gray-600">
          Get started by creating your first company.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CompanyID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {company.companyName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {company.id || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      {company.address || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {company.phone || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingCompany(company)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingCompany(company)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          isOpen={!!editingCompany}
          onClose={() => setEditingCompany(null)}
          onSuccess={() => {
            setEditingCompany(null);
            onRefresh();
          }}
        />
      )}

      {/* Delete Modal */}
      {deletingCompany && (
        <DeleteCompanyModal
          company={deletingCompany}
          isOpen={!!deletingCompany}
          onClose={() => setDeletingCompany(null)}
          onSuccess={() => {
            setDeletingCompany(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
