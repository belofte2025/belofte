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
  Building2,
} from "lucide-react";
import {
  downloadSupplierTemplate,
  importSuppliers,
  SupplierImportResult,
} from "@/lib/api/imports";

export default function SupplierImportContent() {
  const router = useRouter();
  const [supplierFile, setSupplierFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [importResult, setImportResult] = useState<SupplierImportResult | null>(
    null
  );

  const supplierFileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      await downloadSupplierTemplate();
    } catch (error) {
      console.error("Failed to download template:", error);
      alert("Failed to download template. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSupplierFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSupplierFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleSupplierUpload = async () => {
    if (!supplierFile) return;

    setIsUploading(true);
    setImportResult(null);

    try {
      const result = await importSuppliers(supplierFile);
      setImportResult(result);
      setSupplierFile(null);
      if (supplierFileInputRef.current) {
        supplierFileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setImportResult({
        success: false,
        message: "Failed to import supplier data",
        details: {
          suppliers: { created: 0, errors: [errorMessage] },
          items: { created: 0, errors: [] },
          stock: { created: 0, errors: [] },
        },
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSupplierFile = () => {
    setSupplierFile(null);
    if (supplierFileInputRef.current) {
      supplierFileInputRef.current.value = "";
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
                Supplier Import
              </h1>
            </div>
            <p className="text-gray-600">
              Import suppliers, items, and opening stock from a single Excel
              file
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
                • Download the Excel template which contains three sheets:
                &ldquo;Suppliers&rdquo;, &ldquo;Items & Prices&rdquo;, and
                &ldquo;Opening Stock&rdquo;
              </li>
              <li>
                • Fill in the Suppliers sheet with supplier information (name,
                contact, country)
              </li>
              <li>
                • Fill in the Items & Prices sheet with items and their prices
                for each supplier
              </li>
              <li>
                • Fill in the Opening Stock sheet with initial inventory
                quantities and unit prices
              </li>
              <li>• Supplier names must match exactly across all sheets</li>
              <li>• Upload the single Excel file to import all data at once</li>
              <li>• Do not change sheet names or column headers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Supplier Data Upload */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Import Supplier Data, Items & Opening Stock
        </h2>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors relative">
          <input
            ref={supplierFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleSupplierFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          <div className="text-center">
            {supplierFile ? (
              <div className="flex items-center justify-center gap-3 mb-4">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {supplierFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(supplierFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={clearSupplierFile}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-medium text-gray-900 mb-1">
                  Choose supplier data Excel file
                </p>
                <p className="text-sm text-gray-500">
                  Excel files (.xlsx, .xls) with Suppliers, Items & Prices, and
                  Opening Stock sheets
                </p>
              </div>
            )}

            {supplierFile && (
              <button
                onClick={handleSupplierUpload}
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
                    Import Supplier Data
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
                      Suppliers:
                    </p>
                    <p className="text-sm text-gray-600">
                      {importResult.details.suppliers?.created || 0} created,{" "}
                      {importResult.details.suppliers?.errors?.length || 0}{" "}
                      errors
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-700 mb-1">
                      Items & Prices:
                    </p>
                    <p className="text-sm text-gray-600">
                      {importResult.details.items?.created || 0} created,{" "}
                      {importResult.details.items?.errors?.length || 0} errors
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-700 mb-1">
                      Opening Stock:
                    </p>
                    <p className="text-sm text-gray-600">
                      {importResult.details.stock?.created || 0} created,{" "}
                      {importResult.details.stock?.errors?.length || 0} errors
                    </p>
                  </div>

                  {/* Show errors if any */}
                  {importResult.details.suppliers?.errors &&
                    importResult.details.suppliers.errors.length > 0 && (
                      <div>
                        <p className="text-sm text-red-600 font-medium mb-1">
                          Supplier Errors:
                        </p>
                        <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                          {importResult.details.suppliers.errors.map(
                            (error, index) => (
                              <li key={index}>• {error}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {importResult.details.items?.errors &&
                    importResult.details.items.errors.length > 0 && (
                      <div>
                        <p className="text-sm text-red-600 font-medium mb-1">
                          Items Errors:
                        </p>
                        <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                          {importResult.details.items.errors.map(
                            (error, index) => (
                              <li key={index}>• {error}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {importResult.details.stock?.errors &&
                    importResult.details.stock.errors.length > 0 && (
                      <div>
                        <p className="text-sm text-red-600 font-medium mb-1">
                          Stock Errors:
                        </p>
                        <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                          {importResult.details.stock.errors.map(
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
