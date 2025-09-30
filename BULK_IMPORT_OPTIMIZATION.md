# Bulk Import Performance Optimization

## 🔧 **Issue Fixed**
**Prisma Transaction Timeout Error**: `P2028 - Transaction already closed: A commit cannot be executed on an expired transaction. The timeout for this transaction was 5000 ms, however 5575 ms passed since the start of the transaction.`

## ⚡ **Optimizations Applied**

### 1. **Extended Transaction Timeout**
```typescript
await prisma.$transaction(async (prisma) => {
  // Import logic
}, {
  timeout: 60000, // Extended from 5 seconds to 60 seconds
});
```

### 2. **Batch Operations Instead of Individual Inserts**

#### Before (Slow - O(n) database calls):
```typescript
for (const row of customersData) {
  // Individual database queries for each row
  const existingCustomer = await prisma.customer.findFirst({...});
  if (!existingCustomer) {
    await prisma.customer.create({...}); // Individual insert
  }
}
```

#### After (Fast - O(1) database calls):
```typescript
// Single query to get all existing records
const existingCustomers = await prisma.customer.findMany({
  where: { companyId, OR: customerKeys }
});

// Batch insert all new records at once
await prisma.customer.createMany({
  data: newCustomers,
  skipDuplicates: true
});
```

### 3. **In-Memory Lookups Using Maps and Sets**

#### Before (Database lookup per row):
```typescript
for (const row of itemsData) {
  const supplier = await prisma.supplier.findFirst({
    where: { suppliername, companyId }
  }); // Database query per row
}
```

#### After (Single upfront query + fast lookups):
```typescript
// Get all suppliers once
const allSuppliers = await prisma.supplier.findMany({
  where: { companyId }
});
const supplierMap = new Map(allSuppliers.map(s => [s.suppliername, s.id]));

// Fast O(1) lookup per row
const supplierId = supplierMap.get(suppliername);
```

### 4. **Optimized Duplicate Detection**

#### Before (N database queries):
```typescript
for (const item of items) {
  const existingItem = await prisma.supplierItem.findFirst({
    where: { supplierId: item.supplierId, itemName: item.itemName }
  }); // One query per item
}
```

#### After (1 database query + O(1) lookups):
```typescript
const existingItems = await prisma.supplierItem.findMany({
  where: { supplierId: { in: validItems.map(item => item.supplierId) } }
});
const existingSet = new Set(existingItems.map(item => `${item.supplierId}-${item.itemName}`));
const newItems = validItems.filter(item => !existingSet.has(`${item.supplierId}-${item.itemName}`));
```

## 📊 **Performance Improvements**

### Database Queries Reduced:
- **Customers**: From `2n` queries to `3` queries (for n customers)
- **Suppliers**: From `2n` queries to `3` queries (for n suppliers)  
- **Supplier Items**: From `3n` queries to `4` queries (for n items)

### Expected Performance:
- **Small imports (< 100 records)**: ~2-5 seconds → ~1 second
- **Medium imports (100-1000 records)**: ~30-60 seconds → ~3-8 seconds  
- **Large imports (1000+ records)**: Timeout → ~15-30 seconds

### Memory vs Speed Trade-off:
- **Before**: Low memory usage, high database load
- **After**: Moderate memory usage (for lookup maps), much lower database load

## 🚀 **Implementation Status**

✅ **Completed Optimizations:**
- Extended transaction timeout to 60 seconds
- Optimized customer imports with batch operations
- Optimized supplier imports with batch operations  
- Optimized supplier items with upfront lookups and batch operations

🔄 **Remaining Optimizations:**
- Container items processing (still using individual queries)
- Customer opening balances processing (still using individual queries)

## 🧪 **Testing Instructions**

1. **Restart your server** to load the optimized code:
   ```bash
   npm run dev
   ```

2. **Test with progressively larger files**:
   - Start with the template sample data (6 rows total)
   - Try with 50-100 records
   - Scale up to larger datasets

3. **Monitor performance**:
   - Check server logs for timing
   - Watch for timeout errors (should be eliminated)
   - Verify all data imports correctly

## 🔍 **Technical Details**

### Key Algorithm Changes:
1. **Bulk Validation**: Validate all rows before any database operations
2. **Batch Queries**: Single queries to fetch existing records
3. **Set Operations**: Use JavaScript Sets for O(1) duplicate detection
4. **Bulk Inserts**: `createMany()` with `skipDuplicates: true`

### Database Query Pattern:
```
Old Pattern (per entity type):
- Query 1: Check if record exists
- Query 2: Insert if not exists
- Repeat for each row (O(n) complexity)

New Pattern (per entity type):
- Query 1: Fetch all existing records for company
- Query 2: Bulk insert all new records
- Total: O(1) complexity regardless of data size
```

## ✅ **Expected Outcome**

The bulk import should now handle much larger files without timing out, with significant performance improvements for all import sizes. The 5-second timeout error should be completely resolved.