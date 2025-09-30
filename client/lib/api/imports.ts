import api from '@/lib/api';

export interface ImportResult {
  success: boolean;
  message: string;
  details: {
    customers?: { created: number; errors: string[] };
    balances?: { created: number; errors: string[] };
    suppliers?: { created: number; errors: string[] };
    items?: { created: number; errors: string[] };
  };
}

export interface SupplierImportResult {
  success: boolean;
  message: string;
  details: {
    suppliers: { created: number; errors: string[] };
    items: { created: number; errors: string[] };
  };
}

export interface OpeningStockImportResult {
  success: boolean;
  message: string;
  details: {
    containers: { created: number; errors: string[] };
    items: { created: number; errors: string[] };
  };
}

// Template download functions
export const downloadCustomerTemplate = async (): Promise<void> => {
  try {
    const response = await api.get('/uploads/templates/customers', {
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'];
    let filename = 'Customer_Import_Template.xlsx';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading customer template:', error);
    throw new Error('Failed to download customer template');
  }
};

export const downloadSupplierTemplate = async (): Promise<void> => {
  try {
    const response = await api.get('/uploads/templates/suppliers', {
      responseType: 'blob',
    });

    const contentDisposition = response.headers['content-disposition'];
    let filename = 'Supplier_Import_Template.xlsx';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading supplier template:', error);
    throw new Error('Failed to download supplier template');
  }
};

// Import functions
export const importCustomers = async (file: File): Promise<ImportResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploads/import/customers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: unknown) {
    console.error('Error importing customers:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      if (axiosError.response?.data) {
      return {
        success: false,
        message: axiosError.response.data.error || 'Import failed',
        details: {
          customers: { created: 0, errors: [axiosError.response.data.error || 'Unknown error'] },
          balances: { created: 0, errors: [] }
        }
      };
    }
    }
    
    throw new Error('Failed to import customers');
  }
};

export const importSuppliers = async (file: File): Promise<SupplierImportResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploads/import/suppliers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: unknown) {
    console.error('Error importing suppliers:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      if (axiosError.response?.data) {
        return {
          success: false,
          message: axiosError.response.data.error || 'Import failed',
        details: {
          suppliers: { created: 0, errors: [axiosError.response.data.error || 'Unknown error'] },
          items: { created: 0, errors: [] }
        }
      };
    }
    }
    
    throw new Error('Failed to import suppliers');
  }
};

// Additional import functions needed by the frontend components
export const uploadCustomerData = async (file: File): Promise<ImportResult> => {
  return importCustomers(file);
};

export const uploadSupplierData = async (file: File): Promise<SupplierImportResult> => {
  return importSuppliers(file);
};


export const uploadOpeningBalances = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploads/uploadopeningbalances', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: unknown) {
    console.error('Error uploading opening balances:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to upload opening balances');
    }
    throw new Error('Failed to upload opening balances');
  }
};

export const uploadSupplierItems = async (file: File, supplierId?: string): Promise<Record<string, unknown>> => {
  // For now, if no supplierId is provided, we'll throw an error with a helpful message
  // In a future enhancement, this could be modified to handle bulk supplier item imports
  if (!supplierId) {
    throw new Error('Supplier ID is required for uploading supplier items. Please select a specific supplier first.');
  }
  
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/uploads/supplier/${supplierId}/items`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: unknown) {
    console.error('Error uploading supplier items:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to upload supplier items');
    }
    throw new Error('Failed to upload supplier items');
  }
};

export const uploadOpeningStockItems = async (file: File): Promise<OpeningStockImportResult> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/uploads/openingstock', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: unknown) {
    console.error('Error uploading opening stock items:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      throw new Error(axiosError.response?.data?.error || 'Failed to upload opening stock items');
    }
    throw new Error('Failed to upload opening stock items');
  }
};
