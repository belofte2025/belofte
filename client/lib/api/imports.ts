import api from "@/lib/api";

export interface ImportResult {
  success: boolean;
  message: string;
  details: {
    customers?: { created: number; errors: string[] };
    balances?: { created: number; errors: string[] };
  };
}

export interface SupplierImportResult {
  success: boolean;
  message: string;
  details: {
    suppliers: { created: number; errors: string[] };
    items: { created: number; errors: string[] };
    stock: { created: number; errors: string[] };
  };
}

// Template download functions
export const downloadCustomerTemplate = async (): Promise<void> => {
  try {
    const response = await api.get("/uploads/templates/customers", {
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"];
    let filename = "Customer_Import_Template.xlsx";

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading customer template:", error);
    throw new Error("Failed to download customer template");
  }
};

export const downloadSupplierTemplate = async (): Promise<void> => {
  try {
    const response = await api.get("/uploads/templates/suppliers", {
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"];
    let filename = "Supplier_Import_Template.xlsx";

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading supplier template:", error);
    throw new Error("Failed to download supplier template");
  }
};

// Import functions - SINGLE FILE IMPORTS ALL DATA
export const importCustomers = async (file: File): Promise<ImportResult> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/uploads/import/customers", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 150000, // 5 minutes
    });

    return response.data;
  } catch (error: unknown) {
    console.error("Error importing customers:", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      if (axiosError.response?.data) {
        return {
          success: false,
          message: axiosError.response.data.error || "Import failed",
          details: {
            customers: {
              created: 0,
              errors: [axiosError.response.data.error || "Unknown error"],
            },
            balances: { created: 0, errors: [] },
          },
        };
      }
    }

    throw new Error("Failed to import customers");
  }
};

export const importSuppliers = async (
  file: File
): Promise<SupplierImportResult> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/uploads/import/suppliers", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 150000, // 5 minutes
    });

    return response.data;
  } catch (error: unknown) {
    console.error("Error importing suppliers:", error);

    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      if (axiosError.response?.data) {
        return {
          success: false,
          message: axiosError.response.data.error || "Import failed",
          details: {
            suppliers: {
              created: 0,
              errors: [axiosError.response.data.error || "Unknown error"],
            },
            items: { created: 0, errors: [] },
            stock: { created: 0, errors: [] },
          },
        };
      }
    }

    throw new Error("Failed to import suppliers");
  }
};

// Alias functions for backward compatibility
export const uploadCustomerData = async (file: File): Promise<ImportResult> => {
  return importCustomers(file);
};

export const uploadSupplierData = async (
  file: File
): Promise<SupplierImportResult> => {
  return importSuppliers(file);
};

// DEPRECATED: These are no longer needed as everything is in one file
// Keeping for backward compatibility but they now just call the main import
export const uploadOpeningBalances = async (file: File) => {
  console.warn(
    "uploadOpeningBalances is deprecated. Use importCustomers with full template instead."
  );
  return importCustomers(file);
};

export const uploadOpeningStockItems = async (
  file: File
): Promise<SupplierImportResult> => {
  console.warn(
    "uploadOpeningStockItems is deprecated. Use importSuppliers with full template instead."
  );
  return importSuppliers(file);
};

// Additional functions for specific use cases
export const uploadSupplierItems = async (
  file: File,
  supplierId?: string
): Promise<Record<string, unknown>> => {
  if (!supplierId) {
    throw new Error(
      "Supplier ID is required for uploading supplier items. Please select a specific supplier first."
    );
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/uploads/supplier/${supplierId}/items`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 150000, // 5 minutes
      }
    );

    return response.data;
  } catch (error: unknown) {
    console.error("Error uploading supplier items:", error);
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(
        axiosError.response?.data?.error || "Failed to upload supplier items"
      );
    }
    throw new Error("Failed to upload supplier items");
  }
};
