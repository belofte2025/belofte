"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    customers: { created: number; errors: string[] };
    suppliers: { created: number; errors: string[] };
    items: { created: number; errors: string[] };
    containers: { created: number; errors: string[] };
    balances: { created: number; errors: string[] };
  };
}

export default function ImportsContent() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
        setImportResult(null);
      } else {
        alert("Please select a valid Excel file (.xlsx)");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const downloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const response = await api.get("/uploads/template", {
        responseType: 'blob',
      });

      // Get the filename from the response headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'Belofte_Import_Template.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Failed to download template. Please try again.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!file || !user?.companyId) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyId", user.companyId);

      const response = await api.post("/uploads/bulk-import", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;
      setImportResult(result);
      
      if (result.success) {
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportResult({
        success: false,
        message: "Failed to import data. Please try again.",
      });
    } finally {
      setImporting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Upload className="w-8 h-8 text-blue-600" />
              Data Import
            </h1>
            <p className="text-gray-600 mt-1">
              Import customers, suppliers, items, and inventory data from Excel files
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            disabled={downloadingTemplate}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloadingTemplate ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
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
            <h3 className="font-semibold text-blue-900 mb-2">Import Instructions</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Download the Excel template and fill it with your data</li>
              <li>• The template contains 5 sheets: Customers, Customer Opening Balances, Suppliers, Supplier Items & Prices, and Container Items</li>
              <li>• All required fields must be filled according to the Instructions sheet</li>
              <li>• Customer and Supplier names must be unique within your company</li>
              <li>• Dates should be in YYYY-MM-DD format</li>
            </ul>
          </div>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 transition-all ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="text-center">
            {file ? (
              <div className="flex items-center justify-center gap-3 mb-4">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-lg font-medium text-gray-900 mb-1">
                  Choose an Excel file or drag it here
                </p>
                <p className="text-sm text-gray-500">
                  Only .xlsx files are supported
                </p>
              </div>
            )}

            {file && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Data
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
                <div className="space-y-3">
                  {Object.entries(importResult.details).map(([key, data]) => (
                    <div key={key} className="bg-white rounded p-3 border">
                      <h4 className="font-medium text-gray-900 capitalize mb-2">
                        {key}
                      </h4>
                      <p className="text-sm text-gray-700 mb-1">
                        Created: {data.created} records
                      </p>
                      {data.errors.length > 0 && (
                        <div>
                          <p className="text-sm text-red-600 font-medium mb-1">
                            Errors:
                          </p>
                          <ul className="text-sm text-red-600 space-y-1">
                            {data.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}