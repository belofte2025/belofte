# Belofte Enterprise Data Import System

This document describes the comprehensive data import system that allows bulk uploading of customers, suppliers, items, inventory, and opening balances through Excel files.

## Overview

The import system consists of:

1. **Excel Template Generator** - Python script to create formatted Excel templates
2. **Web Interface** - User-friendly drag-and-drop import page in the dashboard
3. **API Backend** - Robust server-side processing with validation and error handling
4. **Database Integration** - Direct integration with PostgreSQL through Prisma

## Features

### ✅ What You Can Import

- **Customers** - Customer information with names and phone numbers
- **Customer Opening Balances** - Initial credit/debit balances for customers
- **Suppliers** - Supplier information with contact details and countries
- **Supplier Items & Prices** - Items with their respective prices per supplier
- **Container Items** - Inventory items with quantities, prices, and arrival dates

### ✅ Key Features

- **Multi-sheet Excel Support** - Single file with multiple worksheets
- **Data Validation** - Comprehensive validation with detailed error reporting
- **Duplicate Prevention** - Prevents duplicate entries based on business rules
- **Transaction Safety** - All imports wrapped in database transactions
- **Progress Tracking** - Real-time feedback on import progress and results
- **Error Handling** - Detailed error messages for troubleshooting

## Getting Started

### Step 1: Download Excel Template

You can get the Excel template in two ways:

**Option A: Download from Web Interface (Recommended)**
1. Navigate to the **Imports** menu in the dashboard sidebar
2. Click the "Download Template" button
3. The Excel file will be automatically downloaded to your browser's download folder

**Option B: Generate using Python Script**
```bash
cd scripts
pip install -r requirements.txt
python generate_excel_template.py
```

Both methods create an Excel file with:
- Pre-configured worksheets
- Sample data for reference
- Proper column headers
- Instructions sheet

### Step 2: Fill Excel Template

Open the generated Excel file and fill in your data:

1. **Customers Sheet**: customerName, phone
2. **Customer Opening Balances Sheet**: customerName, openingBalance, notes (optional)
3. **Suppliers Sheet**: suppliername, contact, country
4. **Supplier Items & Prices Sheet**: suppliername, itemName, price
5. **Container Items Sheet**: containerNo, suppliername, itemName, quantity, unitPrice, arrivalDate, year

### Step 3: Upload Through Web Interface

1. Navigate to the **Imports** menu in the dashboard sidebar
2. Drag and drop your filled Excel file or click to select
3. Click "Import Data" to start the process
4. Monitor progress and review results

## Data Validation Rules

### Customers
- `customerName` and `phone` are required
- Combinations of `customerName` + `phone` must be unique per company

### Suppliers  
- `suppliername`, `contact`, and `country` are required
- `suppliername` must be unique per company

### Supplier Items
- `suppliername` must exist (either from Suppliers sheet or already in database)
- `itemName` and `price` are required
- Combinations of `supplierId` + `itemName` must be unique

### Container Items
- All fields are required: `containerNo`, `suppliername`, `itemName`, `quantity`, `unitPrice`, `arrivalDate`, `year`
- `suppliername` must exist
- `arrivalDate` must be in YYYY-MM-DD format
- `quantity` must be a positive integer

### Customer Opening Balances
- `customerName` must exist (either from Customers sheet or already in database)
- `openingBalance` must be a valid number
- Only one opening balance per customer allowed

## API Endpoints

### GET /api/uploads/template
Generates and downloads the Excel import template.

**Request:**
- `Content-Type: application/json`
- No authentication required

**Response:**
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Excel file with all worksheets and sample data

### POST /api/uploads/bulk-import
Handles comprehensive bulk import from Excel templates.

**Request:**
- `Content-Type: multipart/form-data`
- `file`: Excel file (.xlsx)
- Requires authentication (company context)

**Response:**
```json
{
  "success": true,
  "message": "Import completed: 150 records created, 2 errors",
  "details": {
    "customers": { "created": 25, "errors": [] },
    "suppliers": { "created": 10, "errors": ["Duplicate supplier: ABC Corp"] },
    "items": { "created": 50, "errors": [] },
    "containers": { "created": 30, "errors": [] },
    "balances": { "created": 25, "errors": ["Customer not found: XYZ Trading"] }
  }
}
```

## File Structure

```
├── client/
│   └── app/
│       └── imports/
│           └── page.tsx                 # Import interface
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── upload.controller.ts     # Import logic
│   │   └── routes/
│   │       └── uploads.routes.ts        # API routes
│   └── prisma/
│       └── schema.prisma                # Database schema
└── scripts/
    ├── generate_excel_template.py       # Template generator
    ├── requirements.txt                 # Python dependencies
    └── templates/                       # Generated templates
```

## Error Handling

The system provides comprehensive error handling at multiple levels:

### Validation Errors
- Missing required fields
- Invalid data types
- Foreign key violations (e.g., supplier not found)

### Business Logic Errors  
- Duplicate entries
- Invalid date formats
- Negative quantities

### System Errors
- Database connection issues
- File format problems
- Transaction failures

All errors are logged and returned to the user with specific details for troubleshooting.

## Best Practices

### Before Importing
1. **Backup your database** before large imports
2. **Start with small test files** to verify data format
3. **Review the Instructions sheet** in the Excel template
4. **Validate your data** manually for obvious errors

### During Import
1. **Monitor the progress** and error messages
2. **Don't close the browser** during import process
3. **Keep the Excel file** as backup

### After Import
1. **Review the import results** carefully
2. **Check a few records manually** to ensure data accuracy
3. **Run reports** to validate totals and balances

## Troubleshooting

### Common Issues

**"Supplier not found" errors:**
- Ensure supplier names in different sheets match exactly
- Import suppliers before their items
- Check for extra spaces or special characters

**"Customer not found" errors:**
- Ensure customer names match exactly between sheets
- Import customers before their opening balances

**Date format errors:**
- Use YYYY-MM-DD format for all dates
- Ensure dates are valid (e.g., not 2024-02-30)

**File upload failures:**
- Check file size (should be under 10MB)
- Ensure file extension is .xlsx
- Verify file is not corrupted

### Getting Help

1. Check the browser console for JavaScript errors
2. Review server logs for detailed error messages  
3. Verify database connectivity
4. Test with the provided sample data first

## Security Considerations

- All imports are scoped to the authenticated user's company
- File uploads are validated for type and size
- Database operations use parameterized queries to prevent SQL injection
- All imports are wrapped in transactions for data integrity

## Performance Considerations

- Large imports (>1000 records) may take several minutes
- Import operations are atomic - all succeed or all fail
- Database indexes ensure efficient duplicate checking
- File processing uses memory-efficient streaming where possible

---

For technical support or feature requests, please contact the development team.