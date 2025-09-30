"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSupplierTemplate = exports.generateCustomerTemplate = void 0;
const XLSX = __importStar(require("xlsx"));
const generateCustomerTemplate = async (req, res) => {
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
            if (!ws['!cols'])
                ws['!cols'] = [];
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
    }
    catch (error) {
        console.error('Error generating customer template:', error);
        res.status(500).json({ error: 'Failed to generate customer template', detail: error });
    }
};
exports.generateCustomerTemplate = generateCustomerTemplate;
const generateSupplierTemplate = async (req, res) => {
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
            if (!ws['!cols'])
                ws['!cols'] = [];
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
    }
    catch (error) {
        console.error('Error generating supplier template:', error);
        res.status(500).json({ error: 'Failed to generate supplier template', detail: error });
    }
};
exports.generateSupplierTemplate = generateSupplierTemplate;
