# Database Cleanup Guide

## 🧹 Overview
I've created three scripts to help you safely clear your database while preserving user and company data.

## 📋 Available Scripts

### 1. `show-database-status.js` - Check Current Status
**Purpose**: View what data currently exists in your database
**Usage**:
```bash
node show-database-status.js
```
**What it shows**:
- Count of all record types
- Which data will be preserved (Users, Companies)
- Which data will be cleared (Customers, Suppliers, etc.)
- Company details with record counts

### 2. `clear-database.js` - Clear ALL Business Data
**Purpose**: Clear all business data from the entire database while preserving users and companies
**Usage**:
```bash
node clear-database.js
```
**What it clears**:
- All Customers
- All Customer Payments  
- All Suppliers
- All Supplier Items
- All Containers
- All Container Items
- All Sales
- All Sale Items
- All Audit Logs

**What it preserves**:
- All Users
- All Companies

### 3. `clear-company-data.js` - Clear Data for Specific Company
**Purpose**: Clear business data for only one specific company (safer for multi-company setups)
**Usage**:
```bash
node clear-company-data.js
```
**What it does**:
- Shows list of available companies
- Lets you select which company's data to clear
- Only clears data belonging to that specific company

## 🚀 Recommended Workflow

### Step 1: Check Current Status
```bash
node show-database-status.js
```
This will show you exactly what data exists before you make any changes.

### Step 2: Choose Your Cleanup Method

**Option A - Clear Everything** (if you have only one company):
```bash
node clear-database.js
```

**Option B - Clear Specific Company** (safer, recommended):
```bash
node clear-company-data.js
```

### Step 3: Verify Cleanup
```bash
node show-database-status.js
```
Run this again to confirm the cleanup worked as expected.

### Step 4: Test Import
Now you can test your bulk import functionality with clean data!

## ⚠️ Safety Features

### Confirmation Prompts
All cleanup scripts require you to type "yes" to confirm deletion. This prevents accidental data loss.

### Transaction Safety
All deletions are wrapped in database transactions, so either all deletions succeed or none do (no partial deletions).

### Proper Deletion Order
The scripts delete data in the correct order to avoid foreign key constraint errors:
1. Audit Logs
2. Sale Items → Sales
3. Customer Payments → Customers
4. Container Items → Containers
5. Supplier Items → Suppliers

### Verification
Scripts show exactly how many records were deleted and what remains in the database.

## 🎯 Use Cases

### Before Import Testing
Clean your database before testing the bulk import functionality to ensure clean results.

### Development Reset
Reset your development database to a clean state while keeping your user accounts.

### Company-Specific Cleanup
If you have multiple companies, clear data for just one company without affecting others.

## 📊 Example Output

```
📊 DATABASE STATUS REPORT
========================

🔒 SYSTEM DATA (Preserved):
   🏢 Companies: 1
   👥 Users: 2

🗂️  BUSINESS DATA (Will be cleared):
   👤 Customers: 15
   💰 Customer Payments: 8
   🏭 Suppliers: 5
   📦 Supplier Items: 25
   📋 Containers: 3
   📊 Container Items: 12
   🛒 Sales: 20
   🛍️  Sale Items: 45
   📝 Audit Logs: 100

📈 SUMMARY:
   🔒 System records: 3
   🗂️  Business records: 233
   📊 Total records: 236
```

## 🔄 After Cleanup

Once you've cleared your database, you'll have:
- Clean slate for import testing
- All user accounts preserved (can still log in)
- All company information preserved
- Ready to test bulk import with fresh data

## 🚨 Important Notes

1. **Backup First**: Consider backing up your database before running cleanup scripts
2. **Test Environment**: Use these scripts in development/testing environments first
3. **Irreversible**: The cleanup process is irreversible - deleted data cannot be recovered
4. **Company ID**: When using company-specific cleanup, make sure you select the correct company ID

## 🎉 Ready to Clean?

1. Check status: `node show-database-status.js`
2. Clean data: `node clear-database.js` or `node clear-company-data.js`  
3. Verify: `node show-database-status.js`
4. Test your import! 🚀