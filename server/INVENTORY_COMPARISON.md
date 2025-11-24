# Inventory Balance Calculation: Current vs Desired Implementation

## 🔴 CURRENT IMPLEMENTATION

### How It Works Now:

#### 1. **getInventoryBySupplier(supplierId)**
```typescript
// Location: server/src/services/inventory.service.ts

Step 1: Get all containers for this supplier
Step 2: Get all container items (received quantities)
Step 3: Get sales where:
   - sourceType = "container"
   - AND sourceId IN (this supplier's container IDs)
Step 4: Calculate: available = received - sold

❌ PROBLEM: IGNORES "regular" sales completely!
```

#### 2. **getInventoryReport(companyId)**
```typescript
Step 1: Get all container items for company
Step 2: Get all sales where sourceType = "container"
Step 3: Group by: itemName + supplierName
Step 4: Only count sales from containers of that supplier
Step 5: Calculate: available = received - sold

❌ PROBLEM: IGNORES "regular" sales completely!
```

### What Gets Tracked:
✅ Container items received
✅ Container sales (sourceType = "container")
❌ Regular sales (sourceType = "regular") - **IGNORED**

### Why You See Negative Balances:
```
Example: BLANKETS from "A and J ENT-CANAFRI"

Container Inventory System sees:
  Received: 3 (from containers)
  Sold: 3 (from container sales)
  Balance: 0 ✅

But reality is:
  Received: 3 (from containers)
  Container Sales: 3
  Regular Sales: 5 ← IGNORED by inventory calculation!
  Actual Balance: -5 ❌

The regular sales exist in the database but are NOT counted
when calculating available inventory!
```

---

## 🟢 YOUR DESIRED IMPLEMENTATION

### How It Should Work:

```typescript
For each supplier:
  For each item name:

    RECEIVED:
    ├─ Sum all quantities from containers belonging to this supplier
    └─ (Opening stock if implemented)

    SOLD:
    ├─ Container Sales:
    │  └─ Sales where sourceType = "container"
    │     AND sourceId = container belonging to this supplier
    │
    └─ Regular Sales:
       └─ Sales where sourceType = "regular"
          AND sourceId = supplierItem belonging to this supplier
          AND supplierItem.itemName matches

    AVAILABLE = RECEIVED - (Container Sales + Regular Sales)
```

### Key Points:
1. ✅ Track sales by **supplier**, not just by item name
2. ✅ For **regular sales**: Trace back to the supplier via `supplierItem`
3. ✅ For **container sales**: Trace back to the supplier via `container`
4. ✅ Group by: **Supplier + Item Name** (already done for containers)
5. ✅ Include **BOTH** types of sales in the calculation

---

## 🔍 DETAILED COMPARISON

### Sale Tracing Logic:

#### Current (Container Sales Only):
```
Sale → sourceType = "container" → sourceId (containerId)
     → Container → supplierId → Supplier ✅
```

#### Missing (Regular Sales):
```
Sale → sourceType = "regular" → sourceId (supplierItemId)
     → SupplierItem → supplierId → Supplier ❌ NOT IMPLEMENTED
```

---

## 📊 EXAMPLE SCENARIO

### Item: "BLANKETS"
### Supplier: "A and J ENT-CANAFRI"

#### Data:
```
Containers:
  - Container "HAMU2812836": 3 BLANKETS

Sales:
  1. Container Sale (Sale ID: 0557ebb5...):
     - sourceType: "container"
     - sourceId: "0cb423e0..." (HAMU2812836)
     - Quantity: 3 BLANKETS

  2. Regular Sale (Sale ID: 5796fa8e...):
     - sourceType: "regular"
     - sourceId: "a10866de..." (supplierItem - doesn't exist!)
     - Quantity: 5 BLANKETS
```

#### Current Calculation:
```
Received: 3 (from container)
Sold: 3 (only container sales counted)
Available: 0 ✅ Looks correct!
```

#### Reality Check (Your Desired Approach):
```
Received: 3 (from container)
Container Sales: 3
Regular Sales: 5 (should be linked to this supplier)
Total Sold: 8
Available: -5 ❌ NEGATIVE!
```

---

## 🛠️ WHAT NEEDS TO BE FIXED

### 1. Update `getInventoryBySupplier()`:
```typescript
// Add regular sales to the calculation
const regularSales = await prisma.saleItem.findMany({
  where: {
    sale: {
      companyId: { in: companyIds },
      sourceType: "regular",
    }
  },
  include: {
    sale: {
      select: { sourceId: true }
    }
  }
});

// For each regular sale, check if sourceId is a supplierItem
// belonging to this supplier
const supplierItemIds = await prisma.supplierItem.findMany({
  where: { supplierId: supplierId },
  select: { id: true }
});

// Filter regular sales that belong to this supplier
const thisSupplierRegularSales = regularSales.filter(
  sale => supplierItemIds.some(si => si.id === sale.sale.sourceId)
);
```

### 2. Update `getInventoryReport()`:
Same logic - include regular sales grouped by supplier

### 3. Add Data Validation:
- Ensure all regular sales have valid `sourceId` pointing to existing `supplierItem`
- Clean up orphaned sales (sales with invalid sourceId)

---

## 🎯 IMPLEMENTATION PRIORITY

1. **High Priority**: Fix inventory calculation to include regular sales
2. **High Priority**: Clean up orphaned sales (invalid sourceId)
3. **Medium Priority**: Add validation to prevent orphaned sales in future
4. **Low Priority**: Consider adding quantity tracking to SupplierItems

---

## 📝 SUMMARY

| Aspect | Current | Desired |
|--------|---------|---------|
| Container Sales | ✅ Tracked | ✅ Tracked |
| Regular Sales | ❌ Ignored | ✅ Should Track |
| Supplier Attribution | ✅ Via Container | ✅ Via Container + SupplierItem |
| Grouping | itemName + supplier | itemName + supplier |
| Calculation | received - containerSales | received - (containerSales + regularSales) |

**Your desired approach is correct** - the system should track BOTH types of sales
and attribute them to the correct supplier!
