// components/companies/DeleteCompanyModal.tsx
"use client";

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { deleteCompany, Company } from '@/services/companyService';
import toast from 'react-hot-toast';

interface DeleteCompanyModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteCompanyModal({ company, isOpen, onClose, onSuccess }: DeleteCompanyModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText !== company.companyName) {
      toast.error('Company name does not match');
      return;
    }

    setLoading(true);
    try {
      await deleteCompany(company.id);
      toast.success('Company deleted successfully!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to delete company');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Delete Company</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. This will permanently delete the company and all associated data.
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Please type <span className="font-semibold text-gray-900">{company.companyName}</span> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Type company name"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== company.companyName}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Deleting...' : 'Delete Company'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}