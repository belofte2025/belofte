import { Request, Response } from "express";
import * as XLSX from "xlsx";

export const generateCustomerTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // 1. CUSTOMERS SHEET
    const customersData = [
      ['customerName', 'phone'],
      ['John Smith Trading', '+1234567890'],
      ['ABC Corporation', '+1987654321'],
      ['Global Imports Ltd', '+1122334455'],
      ['Local Business Co', '+1555666777']
    ];
    const customersWs = XLSX.utils.aoa_to_sheet(customersData);
    XLSX.utils.book_append_sheet(wb, customersWs, 'Customers');

    // 2. CUSTOMER OPENING BALANCES SHEET
    const openingBalancesData = [
      ['customerName', 'balanceType', 'amount', 'notes'],
      ['John Smith Trading', 'debit', 1500.00, 'Customer owes us from previous invoices'],
      ['ABC Corporation', 'debit', 2300.50, 'Outstanding balance from last month'],
      ['Global Imports Ltd', 'credit', 750.25, 'Customer has credit balance'],
      ['Local Business Co', 'debit', 450.00, 'Partial payment pending']
    ];
    const openingBalancesWs = XLSX.utils.aoa_to_sheet(openingBalancesData);
    XLSX.utils.book_append_sheet(wb, openingBalancesWs, 'Opening Balances');

    // 3. INSTRUCTIONS SHEET
    const instructionsData = [
      ['Sheet Name', 'Description', 'Required Fields', 'Notes'],
      ['Customers', 'Customer information', 'customerName, phone', 'Customer names must be unique'],
      ['Opening Balances', 'Customer opening balances', 'customerName, balanceType, amount', 'balanceType: "debit" (customer owes) or "credit" (customer has money). customerName must match Customers sheet'],
      ['', '', '', ''],
      ['Balance Types:', '', '', ''],
      ['debit', 'Customer owes money to us', 'Use positive amount', 'Will appear as receivable/debt'],
      ['credit', 'Customer has money with us', 'Use positive amount', 'Will appear as credit balance']
    ];
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

    // Auto-size columns
    const sheets = ['Customers', 'Opening Balances', 'Instructions'];
    sheets.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      if (!ws['!cols']) ws['!cols'] = [];
      
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const columnLetter = XLSX.utils.encode_col(col);
        let maxWidth = 10;
        
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellAddress = columnLetter + (row + 1);
          const cell = ws[cellAddress];
          if (cell && cell.v) {
            const cellValueLength = cell.v.toString().length;
            if (cellValueLength > maxWidth) {
              maxWidth = cellValueLength;
            }
          }
        }
        
        ws['!cols'][col] = { width: Math.min(maxWidth + 2, 50) };
      }
    });

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Customer_Import_Template_${currentDate}.xlsx`;

    // Write the workbook to buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error('Error generating customer template:', error);
    res.status(500).json({ error: 'Failed to generate customer template', detail: error });
  }
};

export const generateSupplierTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // 1. SUPPLIERS SHEET
    const suppliersData = [
      ['supplierName', 'contact', 'country'],
      ['China Electronics Co', '+86-123-456-7890', 'China'],
      ['European Parts Ltd', '+44-20-1234-5678', 'United Kingdom'],
      ['Asian Manufacturing', '+65-6123-4567', 'Singapore'],
      ['Tech Components Inc', '+1-555-123-4567', 'United States']
    ];
    const suppliersWs = XLSX.utils.aoa_to_sheet(suppliersData);
    XLSX.utils.book_append_sheet(wb, suppliersWs, 'Suppliers');

    // 2. SUPPLIER ITEMS & PRICES SHEET
    const itemsData = [
      ['supplierName', 'itemName', 'price'],
      ['China Electronics Co', 'iPhone 14 Pro Max', 1099.99],
      ['China Electronics Co', 'Samsung Galaxy S23', 999.99],
      ['European Parts Ltd', 'MacBook Air M2', 1199.99],
      ['European Parts Ltd', 'iPad Pro 12.9"', 1099.99],
      ['Asian Manufacturing', 'Sony WH-1000XM4', 349.99],
      ['Tech Components Inc', 'Dell XPS 13', 899.99]
    ];
    const itemsWs = XLSX.utils.aoa_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, itemsWs, 'Items & Prices');

    // 3. INSTRUCTIONS SHEET
    const instructionsData = [
      ['Sheet Name', 'Description', 'Required Fields', 'Notes'],
      ['Suppliers', 'Supplier information', 'supplierName, contact, country', 'Supplier names must be unique'],
      ['Items & Prices', 'Items supplied by each supplier with prices', 'supplierName, itemName, price', 'supplierName must match Suppliers sheet exactly']
    ];
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

    // Auto-size columns
    const sheets = ['Suppliers', 'Items & Prices', 'Instructions'];
    sheets.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      if (!ws['!cols']) ws['!cols'] = [];
      
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const columnLetter = XLSX.utils.encode_col(col);
        let maxWidth = 10;
        
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellAddress = columnLetter + (row + 1);
          const cell = ws[cellAddress];
          if (cell && cell.v) {
            const cellValueLength = cell.v.toString().length;
            if (cellValueLength > maxWidth) {
              maxWidth = cellValueLength;
            }
          }
        }
        
        ws['!cols'][col] = { width: Math.min(maxWidth + 2, 50) };
      }
    });

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Supplier_Import_Template_${currentDate}.xlsx`;

    // Write the workbook to buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error('Error generating supplier template:', error);
    res.status(500).json({ error: 'Failed to generate supplier template', detail: error });
  }
};

// Comprehensive bulk import template generator
export const generateBulkImportTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // 1. CUSTOMERS SHEET
    const customersData = [
      ['customerName', 'phone'],
      ['John Smith Trading', '+1234567890'],
      ['ABC Corporation', '+1987654321'],
      ['Global Imports Ltd', '+1122334455']
    ];
    const customersWs = XLSX.utils.aoa_to_sheet(customersData);
    XLSX.utils.book_append_sheet(wb, customersWs, 'Customers');

    // 2. CUSTOMER OPENING BALANCES SHEET
    const customerBalancesData = [
      ['customerName', 'openingBalance', 'notes'],
      ['John Smith Trading', 1500.00, 'Previous invoice balance'],
      ['ABC Corporation', 2300.50, 'Outstanding balance'],
      ['Global Imports Ltd', -750.25, 'Credit balance']
    ];
    const customerBalancesWs = XLSX.utils.aoa_to_sheet(customerBalancesData);
    XLSX.utils.book_append_sheet(wb, customerBalancesWs, 'Customer Opening Balances');

    // 3. SUPPLIERS SHEET
    const suppliersData = [
      ['suppliername', 'contact', 'country'],
      ['China Electronics Co', '+86-123-456-7890', 'China'],
      ['European Parts Ltd', '+44-20-1234-5678', 'United Kingdom'],
      ['Asian Manufacturing', '+65-6123-4567', 'Singapore']
    ];
    const suppliersWs = XLSX.utils.aoa_to_sheet(suppliersData);
    XLSX.utils.book_append_sheet(wb, suppliersWs, 'Suppliers');

    // 4. SUPPLIER ITEMS & PRICES SHEET
    const supplierItemsData = [
      ['suppliername', 'itemName', 'price'],
      ['China Electronics Co', 'iPhone 14 Pro Max', 1099.99],
      ['China Electronics Co', 'Samsung Galaxy S23', 999.99],
      ['European Parts Ltd', 'MacBook Air M2', 1199.99],
      ['Asian Manufacturing', 'Sony WH-1000XM4', 349.99]
    ];
    const supplierItemsWs = XLSX.utils.aoa_to_sheet(supplierItemsData);
    XLSX.utils.book_append_sheet(wb, supplierItemsWs, 'Supplier Items & Prices');

    // 5. CONTAINER ITEMS SHEET
    const containerItemsData = [
      ['containerNo', 'suppliername', 'itemName', 'quantity', 'unitPrice', 'arrivalDate', 'year'],
      ['CONT2024001', 'China Electronics Co', 'iPhone 14 Pro Max', 50, 1099.99, '2024-01-15', 2024],
      ['CONT2024001', 'China Electronics Co', 'Samsung Galaxy S23', 30, 999.99, '2024-01-15', 2024],
      ['CONT2024002', 'European Parts Ltd', 'MacBook Air M2', 25, 1199.99, '2024-01-20', 2024]
    ];
    const containerItemsWs = XLSX.utils.aoa_to_sheet(containerItemsData);
    XLSX.utils.book_append_sheet(wb, containerItemsWs, 'Container Items');

    // 6. INSTRUCTIONS SHEET
    const instructionsData = [
      ['Sheet Name', 'Description', 'Required Fields', 'Notes'],
      ['Customers', 'Customer information', 'customerName, phone', 'Customer names must be unique within your company'],
      ['Customer Opening Balances', 'Customer opening balances', 'customerName, openingBalance', 'customerName must match Customers sheet. Positive = customer owes, Negative = credit balance'],
      ['Suppliers', 'Supplier information', 'suppliername, contact, country', 'Supplier names must be unique within your company'],
      ['Supplier Items & Prices', 'Items with prices per supplier', 'suppliername, itemName, price', 'suppliername must exist in Suppliers sheet'],
      ['Container Items', 'Container inventory items', 'containerNo, suppliername, itemName, quantity, unitPrice, arrivalDate, year', 'All fields required. Date format: YYYY-MM-DD'],
      ['', '', '', ''],
      ['Data Validation Rules:', '', '', ''],
      ['• Customer and supplier names must be unique', '', '', ''],
      ['• Customer names must match exactly between sheets', '', '', ''],
      ['• Supplier names must match exactly between sheets', '', '', ''],
      ['• Dates must be in YYYY-MM-DD format', '', '', ''],
      ['• Quantities and prices must be positive numbers', '', '', ''],
      ['• Phone numbers should include country codes', '', '', '']
    ];
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

    // Auto-size columns for all sheets
    const sheets = ['Customers', 'Customer Opening Balances', 'Suppliers', 'Supplier Items & Prices', 'Container Items', 'Instructions'];
    sheets.forEach(sheetName => {
      const ws = wb.Sheets[sheetName];
      if (!ws['!cols']) ws['!cols'] = [];
      
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const columnLetter = XLSX.utils.encode_col(col);
        let maxWidth = 10;
        
        for (let row = range.s.r; row <= range.e.r; row++) {
          const cellAddress = columnLetter + (row + 1);
          const cell = ws[cellAddress];
          if (cell && cell.v) {
            const cellValueLength = cell.v.toString().length;
            if (cellValueLength > maxWidth) {
              maxWidth = cellValueLength;
            }
          }
        }
        
        ws['!cols'][col] = { width: Math.min(maxWidth + 2, 50) };
      }
    });

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Belofte_Import_Template_${currentDate}.xlsx`;

    // Write the workbook to buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error('Error generating bulk import template:', error);
    res.status(500).json({ error: 'Failed to generate bulk import template', detail: error });
  }
};
