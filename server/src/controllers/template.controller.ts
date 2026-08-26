import { Request, Response } from "express";
import * as XLSX from "xlsx";

export const generateCustomerTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // 1. CUSTOMERS SHEET
    const customersData = [
      ["customerName", "phone"],
      ["John Smith Trading", "+1234567890"],
      ["ABC Corporation", "+1987654321"],
      ["Global Imports Ltd", "+1122334455"],
      ["Local Business Co", "+1555666777"],
    ];
    const customersWs = XLSX.utils.aoa_to_sheet(customersData);
    XLSX.utils.book_append_sheet(wb, customersWs, "Customers");

    // 2. CUSTOMER OPENING BALANCES SHEET
    const openingBalancesData = [
      ["customerName", "amount", "notes"],
      ["John Smith Trading", 1500.0, "Previous debt from 2024"],
      ["ABC Corporation", 2300.5, "Unpaid invoices"],
      ["Global Imports Ltd", 300.0, "Opening balance"],
    ];
    const openingBalancesWs = XLSX.utils.aoa_to_sheet(openingBalancesData);
    XLSX.utils.book_append_sheet(wb, openingBalancesWs, "Opening Balances");

    // Auto-size columns
    const sheets = ["Customers", "Opening Balances"];
    sheets.forEach((sheetName) => {
      const ws = wb.Sheets[sheetName];
      if (!ws["!cols"]) ws["!cols"] = [];

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
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

        ws["!cols"][col] = { width: Math.min(maxWidth + 2, 50) };
      }
    });

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `Customer_Import_Template_${currentDate}.xlsx`;

    // Write the workbook to buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error generating customer template:", error);
    res
      .status(500)
      .json({ error: "Failed to generate customer template", detail: error });
  }
};

export const generateSupplierTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // 1. SUPPLIERS SHEET
    const suppliersData = [
      ["supplierName", "contact", "country"],
      ["China Electronics Co", "+86-123-456-7890", "China"],
      ["European Parts Ltd", "+44-20-1234-5678", "United Kingdom"],
      ["Asian Manufacturing", "+65-6123-4567", "Singapore"],
      ["Tech Components Inc", "+1-555-123-4567", "United States"],
    ];
    const suppliersWs = XLSX.utils.aoa_to_sheet(suppliersData);
    XLSX.utils.book_append_sheet(wb, suppliersWs, "Suppliers");

    // 2. SUPPLIER ITEMS & PRICES SHEET
    const itemsData = [
      ["supplierName", "itemName", "alias", "price"],
      ["China Electronics Co", "iPhone 14 Pro Max", "iphone14", 1099.99],
      ["China Electronics Co", "Samsung Galaxy S23", "s23", 999.99],
      ["European Parts Ltd", "MacBook Air M2", "", 1199.99],
      ["European Parts Ltd", 'iPad Pro 12.9"', "", 1099.99],
      ["Asian Manufacturing", "Sony WH-1000XM4", "", 349.99],
      ["Tech Components Inc", "Dell XPS 13", "", 899.99],
    ];
    const itemsWs = XLSX.utils.aoa_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, itemsWs, "Items & Prices");

    // 3. OPENING STOCK SHEET
    const stockData = [
      ["supplierName", "itemName", "quantity", "unitPrice"],
      ["China Electronics Co", "iPhone 14 Pro Max", 100, 1099.99],
      ["China Electronics Co", "Samsung Galaxy S23", 50, 999.99],
      ["European Parts Ltd", "MacBook Air M2", 75, 1199.99],
      ["Asian Manufacturing", "Sony WH-1000XM4", 200, 349.99],
      ["Tech Components Inc", "Dell XPS 13", 150, 899.99],
    ];
    const stockWs = XLSX.utils.aoa_to_sheet(stockData);
    XLSX.utils.book_append_sheet(wb, stockWs, "Opening Stock");

    // Auto-size columns
    const sheets = ["Suppliers", "Items & Prices", "Opening Stock"];
    sheets.forEach((sheetName) => {
      const ws = wb.Sheets[sheetName];
      if (!ws["!cols"]) ws["!cols"] = [];

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
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

        ws["!cols"][col] = { width: Math.min(maxWidth + 2, 50) };
      }
    });

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `Supplier_Import_Template_${currentDate}.xlsx`;

    // Write the workbook to buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error generating supplier template:", error);
    res
      .status(500)
      .json({ error: "Failed to generate supplier template", detail: error });
  }
};

// Comprehensive bulk import template generator
export const generateBulkImportTemplate = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // 1. CUSTOMERS SHEET
    const customersData = [
      ["customerName", "phone"],
      ["John Smith Trading", "+1234567890"],
      ["ABC Corporation", "+1987654321"],
      ["Global Imports Ltd", "+1122334455"],
    ];
    const customersWs = XLSX.utils.aoa_to_sheet(customersData);
    XLSX.utils.book_append_sheet(wb, customersWs, "Customers");

    // 2. CUSTOMER OPENING BALANCES SHEET
    const customerBalancesData = [
      ["customerName", "amount", "notes"],
      ["John Smith Trading", 1500.0, "Previous invoice balance"],
      ["ABC Corporation", 2300.5, "Outstanding balance"],
      ["Global Imports Ltd", 300.0, "Opening balance"],
    ];
    const customerBalancesWs = XLSX.utils.aoa_to_sheet(customerBalancesData);
    XLSX.utils.book_append_sheet(
      wb,
      customerBalancesWs,
      "Customer Opening Balances"
    );

    // 3. SUPPLIERS SHEET
    const suppliersData = [
      ["supplierName", "contact", "country"],
      ["China Electronics Co", "+86-123-456-7890", "China"],
      ["European Parts Ltd", "+44-20-1234-5678", "United Kingdom"],
      ["Asian Manufacturing", "+65-6123-4567", "Singapore"],
    ];
    const suppliersWs = XLSX.utils.aoa_to_sheet(suppliersData);
    XLSX.utils.book_append_sheet(wb, suppliersWs, "Suppliers");

    // 4. SUPPLIER ITEMS & PRICES SHEET
    const supplierItemsData = [
      ["supplierName", "itemName", "price"],
      ["China Electronics Co", "iPhone 14 Pro Max", 1099.99],
      ["China Electronics Co", "Samsung Galaxy S23", 999.99],
      ["European Parts Ltd", "MacBook Air M2", 1199.99],
      ["Asian Manufacturing", "Sony WH-1000XM4", 349.99],
    ];
    const supplierItemsWs = XLSX.utils.aoa_to_sheet(supplierItemsData);
    XLSX.utils.book_append_sheet(
      wb,
      supplierItemsWs,
      "Supplier Items & Prices"
    );

    // 5. OPENING STOCK SHEET
    const openingStockData = [
      ["supplierName", "itemName", "quantity", "unitPrice"],
      ["China Electronics Co", "iPhone 14 Pro Max", 50, 1099.99],
      ["China Electronics Co", "Samsung Galaxy S23", 30, 999.99],
      ["European Parts Ltd", "MacBook Air M2", 25, 1199.99],
      ["Asian Manufacturing", "Sony WH-1000XM4", 100, 349.99],
    ];
    const openingStockWs = XLSX.utils.aoa_to_sheet(openingStockData);
    XLSX.utils.book_append_sheet(wb, openingStockWs, "Opening Stock");

    // 6. CONTAINER ITEMS SHEET
    const containerItemsData = [
      [
        "containerNo",
        "supplierName",
        "itemName",
        "quantity",
        "unitPrice",
        "arrivalDate",
        "year",
      ],
      [
        "CONT2024001",
        "China Electronics Co",
        "iPhone 14 Pro Max",
        50,
        1099.99,
        "2024-01-15",
        2024,
      ],
      [
        "CONT2024001",
        "China Electronics Co",
        "Samsung Galaxy S23",
        30,
        999.99,
        "2024-01-15",
        2024,
      ],
      [
        "CONT2024002",
        "European Parts Ltd",
        "MacBook Air M2",
        25,
        1199.99,
        "2024-01-20",
        2024,
      ],
    ];
    const containerItemsWs = XLSX.utils.aoa_to_sheet(containerItemsData);
    XLSX.utils.book_append_sheet(wb, containerItemsWs, "Container Items");

    // Auto-size columns for all sheets
    const sheets = [
      "Customers",
      "Customer Opening Balances",
      "Suppliers",
      "Supplier Items & Prices",
      "Opening Stock",
      "Container Items",
    ];
    sheets.forEach((sheetName) => {
      const ws = wb.Sheets[sheetName];
      if (!ws["!cols"]) ws["!cols"] = [];

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
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

        ws["!cols"][col] = { width: Math.min(maxWidth + 2, 50) };
      }
    });

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `Belofte_Import_Template_${currentDate}.xlsx`;

    // Write the workbook to buffer
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error generating bulk import template:", error);
    res
      .status(500)
      .json({
        error: "Failed to generate bulk import template",
        detail: error,
      });
  }
};
