# Excel Import System Guide

## 📋 Overview

This system allows you to import customer and supplier data from Excel files with proper handling of opening balances and pricing.

## 🎯 Key Features

### Customer Import
- ✅ Import customer details (name, phone)
- ✅ Import opening balances with debit/credit handling
- ✅ **Debit** balances (customer owes) → Creates Sales (appears on statement debit side)
- ✅ **Credit** balances (customer has money) → Creates Payments (appears on statement credit side)

### Supplier Import
- ✅ Import supplier details (name, contact, country)
- ✅ Import supplier items with prices
- ✅ Automatic linking of items to suppliers

## 🌐 API Endpoints

### Template Downloads (No Authentication)
```
GET /api/uploads/templates/customers
GET /api/uploads/templates/suppliers
```

### Data Import (Authentication Required)
```
POST /api/uploads/import/customers
POST /api/uploads/import/suppliers
```

## 📊 Excel Template Structure

### Customer Template
**Sheet 1: "Customers"**
| customerName | phone |
|--------------|--------|
| John Smith Trading | +1234567890 |
| ABC Corporation | +1987654321 |

**Sheet 2: "Opening Balances"**
| customerName | balanceType | amount | notes |
|--------------|-------------|--------|--------|
| John Smith Trading | debit | 1500.00 | Customer owes us |
| ABC Corporation | credit | 750.25 | Customer has credit |

**Balance Types:**
- `debit` → Customer owes money (creates Sale record)
- `credit` → Customer has money with us (creates Payment record)

### Supplier Template
**Sheet 1: "Suppliers"**
| supplierName | contact | country |
|--------------|---------|---------|
| China Electronics Co | +86-123-456-7890 | China |
| European Parts Ltd | +44-20-1234-5678 | UK |

**Sheet 2: "Items & Prices"**
| supplierName | itemName | price |
|--------------|----------|-------|
| China Electronics Co | iPhone 14 Pro | 1099.99 |
| European Parts Ltd | MacBook Air M2 | 1199.99 |

## 🔄 Import Process

### Customer Import
1. **Download Template**: GET `/api/uploads/templates/customers`
2. **Fill Excel File**: Add your customer data and opening balances
3. **Upload File**: POST `/api/uploads/import/customers` with Excel file
4. **Review Results**: Check response for created records and errors

### Supplier Import
1. **Download Template**: GET `/api/uploads/templates/suppliers`
2. **Fill Excel File**: Add your suppliers and their items with prices
3. **Upload File**: POST `/api/uploads/import/suppliers` with Excel file
4. **Review Results**: Check response for created records and errors

## 📤 API Response Format

### Success Response (200/207)
```json
{
  "success": true,
  "message": "Import completed: 5 records created, 0 errors",
  "details": {
    "customers": { "created": 3, "errors": [] },
    "balances": { "created": 2, "errors": [] }
  }
}
```

### Error Response (400/500)
```json
{
  "error": "Excel file is required"
}
```

## ⚠️ Important Notes

### Customer Opening Balances
- **Debit Balance**: Customer owes you money
  - Example: Customer has unpaid invoice of $1,500
  - Use: `balanceType: "debit", amount: 1500`
  - Result: Creates a Sale record → Appears on debit side of statement
  
- **Credit Balance**: Customer has money with you
  - Example: Customer paid in advance $750
  - Use: `balanceType: "credit", amount: 750`
  - Result: Creates a Payment record → Appears on credit side of statement

### Data Validation
- **Customer names** must be unique within your company
- **Supplier names** must be unique within your company
- **Phone numbers** are required for customers
- **Balance amounts** must be positive numbers
- **Balance types** must be exactly "debit" or "credit"
- **Prices** must be positive numbers

### Duplicate Handling
- **Customers**: Skipped if name already exists
- **Suppliers**: Skipped if name already exists
- **Opening Balances**: Skipped if already exists for customer
- **Supplier Items**: Skipped if item already exists for supplier

## 🧪 Testing

### Test Files Generated
Run `node generate-test-templates.js` to create:
- `test-customer-import.xlsx` - Sample customer data with balances
- `test-supplier-import.xlsx` - Sample supplier data with items

### Manual Testing Steps
1. **Start your server**: `npm run dev`
2. **Download templates**: Visit template endpoints in browser
3. **Test authentication**: Get JWT token from login endpoint
4. **Upload test files**: Use Postman or similar to upload Excel files
5. **Verify data**: Check database for imported records
6. **Check customer statements**: Verify balances appear on correct sides

## 🔍 Troubleshooting

### Common Issues
1. **"Excel file is required"**
   - Ensure you're uploading with field name "file"
   - Check Content-Type is multipart/form-data

2. **"Company ID is required"**
   - Ensure you're authenticated with valid JWT token
   - Check token contains companyId claim

3. **"Customer not found" for balances**
   - Ensure customer names match exactly between sheets
   - Check for extra spaces or typos

4. **"Invalid balance type"**
   - Use exactly "debit" or "credit" (lowercase)
   - Check for typos or extra characters

### Debug Steps
1. Check server console logs for detailed errors
2. Verify Excel sheet names match exactly: "Customers", "Opening Balances", "Suppliers", "Items & Prices"
3. Ensure column headers match exactly (case-sensitive)
4. Test with smaller sample files first
5. Check database status after import

## 📋 File Naming Convention
- Customer Template: `Customer_Import_Template_YYYY-MM-DD.xlsx`
- Supplier Template: `Supplier_Import_Template_YYYY-MM-DD.xlsx`

The system is ready for use! 🚀