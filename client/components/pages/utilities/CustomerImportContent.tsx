"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Info,
  ArrowLeft,
  Users,
} from "lucide-react";
import {
  downloadCustomerTemplate,
  importCustomers,
  ImportResult,
} from "@/lib/api/imports";

export default function CustomerImportContent() {
  const router = useRouter();
  const [customerFile, setCustomerFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const customerFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      await downloadCustomerTemplate();
    } catch (error) {
      console.error("Failed to download template:", error);
      alert("Failed to download template. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCustomerFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomerFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleCustomerUpload = async () => {
    if (!customerFile) return;

    setIsUploading(true);
    setImportResult(null);

    try {
      const result = await importCustomers(customerFile);
      setImportResult(result);
      setCustomerFile(null);
      if (customerFileInputRef.current) {
        customerFileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setImportResult({
        success: false,
        message: "Failed to import customer data",
        details: {
          customers: { created: 0, errors: [errorMessage] },
          balances: { created: 0, errors: [] },
        },
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearCustomerFile = () => {
    setCustomerFile(null);
    if (customerFileInputRef.current) {
      customerFileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Upload className="w-8 h-8 text-blue-600" />
                Customer Import
              </h1>
            </div>
            <p className="text-gray-600">
              Import customers and opening balances from a single Excel file
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Template
              </>
            )}
          </button>
        </div>
      </div>

      {/* Import Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Import Instructions
            </h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>
                • Download the Excel template which contains two sheets:
                &ldquo;Customers&rdquo; and &ldquo;Opening Balances&rdquo;
              </li>
              <li>
                • Fill in the Customers sheet with customer names and phone
                numbers
              </li>
              <li>
                • Fill in the Opening Balances sheet with customer names,
                amounts, and optional notes
              </li>
              <li>• Customer names must match exactly between both sheets</li>
              <li>
                • Upload the single Excel file to import both customers and
                their opening balances
              </li>
              <li>• Do not change sheet names or column headers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Customer Data Upload */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Import Customer Data & Opening Balances
        </h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors relative">
          <input
            ref={customerFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleCustomerFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          <div className="text-center">
            {customerFile ? (
              <div className="flex items-center justify-center gap-3 mb-4">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {customerFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(customerFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={clearCustomerFile}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-medium text-gray-900 mb-1">
                  Choose customer data Excel file
                </p>
                <p className="text-sm text-gray-500">
                  Excel files (.xlsx, .xls) with both Customers and Opening
                  Balances sheets
                </p>
              </div>
            )}

            {customerFile && (
              <button
                onClick={handleCustomerUpload}
                disabled={isUploading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Customer Data
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Import Results */}
      {importResult && (
        <div
          className={`rounded-lg border p-6 ${
            importResult.success
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {importResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3
                className={`font-semibold mb-2 ${
                  importResult.success ? "text-green-900" : "text-red-900"
                }`}
              >
                {importResult.success ? "Import Successful!" : "Import Failed"}
              </h3>
              <p
                className={`mb-4 ${
                  importResult.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {importResult.message}
              </p>

              {importResult.details && (
                <div className="bg-white rounded p-4 border space-y-3">
                  <div>
                    <p className="font-medium text-sm text-gray-700 mb-1">
                      Customers:
                    </p>
                    <p className="text-sm text-gray-600">
                      {importResult.details.customers?.created || 0} created,{" "}
                      {importResult.details.customers?.errors?.length || 0}{" "}
                      errors
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-700 mb-1">
                      Opening Balances:
                    </p>
                    <p className="text-sm text-gray-600">
                      {importResult.details.balances?.created || 0} created,{" "}
                      {importResult.details.balances?.errors?.length || 0}{" "}
                      errors
                    </p>
                  </div>

                  {/* Show errors if any */}
                  {importResult.details.customers?.errors &&
                    importResult.details.customers.errors.length > 0 && (
                      <div>
                        <p className="text-sm text-red-600 font-medium mb-1">
                          Customer Errors:
                        </p>
                        <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                          {importResult.details.customers.errors.map(
                            (error, index) => (
                              <li key={index}>• {error}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {importResult.details.balances?.errors &&
                    importResult.details.balances.errors.length > 0 && (
                      <div>
                        <p className="text-sm text-red-600 font-medium mb-1">
                          Balance Errors:
                        </p>
                        <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                          {importResult.details.balances.errors.map(
                            (error, index) => (
                              <li key={index}>• {error}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
