// Generate test templates to verify the import system works
const XLSX = require('xlsx');

console.log("🧪 GENERATING TEST TEMPLATES");
console.log("============================");

// Create Customer Template Test
console.log("📝 Creating customer template test file...");

const customerWb = XLSX.utils.book_new();

// Customers sheet
const customersData = [
  ['customerName', 'phone'],
  ['Test Customer 1', '+1234567890'],
  ['Test Customer 2', '+1987654321'],
  ['Test Customer 3', '+1122334455']
];
const customersWs = XLSX.utils.aoa_to_sheet(customersData);
XLSX.utils.book_append_sheet(customerWb, customersWs, 'Customers');

// Opening Balances sheet
const balancesData = [
  ['customerName', 'balanceType', 'amount', 'notes'],
  ['Test Customer 1', 'debit', 1500.00, 'Customer owes us from previous invoices'],
  ['Test Customer 2', 'credit', 750.25, 'Customer has credit balance'],
  ['Test Customer 3', 'debit', 450.00, 'Partial payment pending']
];
const balancesWs = XLSX.utils.aoa_to_sheet(balancesData);
XLSX.utils.book_append_sheet(customerWb, balancesWs, 'Opening Balances');

XLSX.writeFile(customerWb, 'test-customer-import.xlsx');
console.log("✅ Created: test-customer-import.xlsx");

// Create Supplier Template Test
console.log("📝 Creating supplier template test file...");

const supplierWb = XLSX.utils.book_new();

// Suppliers sheet
const suppliersData = [
  ['supplierName', 'contact', 'country'],
  ['Test Electronics Co', '+86-123-456-7890', 'China'],
  ['Test Parts Ltd', '+44-20-1234-5678', 'United Kingdom'],
  ['Test Manufacturing', '+65-6123-4567', 'Singapore']
];
const suppliersWs = XLSX.utils.aoa_to_sheet(suppliersData);
XLSX.utils.book_append_sheet(supplierWb, suppliersWs, 'Suppliers');

// Items & Prices sheet
const itemsData = [
  ['supplierName', 'itemName', 'price'],
  ['Test Electronics Co', 'Test Phone Model X', 599.99],
  ['Test Electronics Co', 'Test Tablet Pro', 899.99],
  ['Test Parts Ltd', 'Test Laptop Air', 1299.99],
  ['Test Parts Ltd', 'Test Monitor 27"', 349.99],
  ['Test Manufacturing', 'Test Headphones', 199.99],
  ['Test Manufacturing', 'Test Speaker Set', 149.99]
];
const itemsWs = XLSX.utils.aoa_to_sheet(itemsData);
XLSX.utils.book_append_sheet(supplierWb, itemsWs, 'Items & Prices');

XLSX.writeFile(supplierWb, 'test-supplier-import.xlsx');
console.log("✅ Created: test-supplier-import.xlsx");

console.log();
console.log("🎯 TEST SUMMARY:");
console.log("================");
console.log();
console.log("Customer Import Test File: test-customer-import.xlsx");
console.log("  - 3 customers");
console.log("  - 3 opening balances (2 debit, 1 credit)");
console.log();
console.log("Supplier Import Test File: test-supplier-import.xlsx");
console.log("  - 3 suppliers");
console.log("  - 6 items with prices");
console.log();
console.log("📋 EXPECTED BEHAVIOR:");
console.log("Customer Import:");
console.log("  • Debit balances (Test Customer 1 & 3) → Create Sales (appear on debit side)");
console.log("  • Credit balance (Test Customer 2) → Create Payment (appear on credit side)");
console.log();
console.log("Supplier Import:");
console.log("  • Creates suppliers and their associated items with prices");
console.log();
console.log("🌐 API ENDPOINTS TO TEST:");
console.log("Template Downloads (no auth required):");
console.log("  GET /api/uploads/templates/customers");
console.log("  GET /api/uploads/templates/suppliers");
console.log();
console.log("Import Uploads (auth required):");
console.log("  POST /api/uploads/import/customers (with test-customer-import.xlsx)");
console.log("  POST /api/uploads/import/suppliers (with test-supplier-import.xlsx)");
console.log();
console.log("✅ Templates generated successfully!");