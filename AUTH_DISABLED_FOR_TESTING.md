# Authentication Temporarily Disabled for Testing

## ⚠️ WARNING: SECURITY DISABLED
**This configuration should ONLY be used for testing/debugging. DO NOT deploy to production!**

## Changes Made

### 1. Routes (`server/src/routes/customerDebt.routes.ts`)
- ✅ Commented out authentication middleware: `router.use(authenticate)`
- ✅ Commented out role authorization on delete route
- ✅ Commented out role authorization on mark-paid route

### 2. Controller (`server/src/controllers/customerDebt.controller.ts`)

#### `getCustomerDebts` Function
- ✅ Removed companyId requirement from req.user
- ✅ Fetches ALL debts for a customer regardless of company
- ✅ No authentication check

#### `createCustomerDebt` Function
- ✅ Accepts optional `companyId` in request body
- ✅ Falls back to getting companyId from customer record
- ✅ No authentication check

## Testing the API

You can now call the API endpoints without a token:

### Get Customer Debts
```bash
curl http://localhost:4000/api/customer-debts/customer/CUSTOMER_ID
```

### Create Customer Debt
```bash
curl -X POST http://localhost:4000/api/customer-debts \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUSTOMER_ID",
    "amount": 100.50,
    "description": "Test debt",
    "debtType": "manual"
  }'
```

### Update Customer Debt
```bash
curl -X PUT http://localhost:4000/api/customer-debts/DEBT_ID \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.00,
    "description": "Updated debt"
  }'
```

### Mark Debt as Paid
```bash
curl -X PATCH http://localhost:4000/api/customer-debts/DEBT_ID/mark-paid
```

### Delete Customer Debt
```bash
curl -X DELETE http://localhost:4000/api/customer-debts/DEBT_ID
```

## Frontend Changes

The frontend will now work without requiring login. The API calls in `customerDebtService.ts` will succeed even if there's no token in localStorage.

## Restoring Authentication

When ready to restore security, reverse these changes:

### 1. Uncomment in routes file:
```typescript
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/authoriseRole";

router.use(authenticate);
```

And restore role checks:
```typescript
router.patch("/:id/mark-paid", authorizeRoles("admin", "staff"), markDebtAsPaid);
router.delete("/:id", authorizeRoles("admin"), deleteCustomerDebt);
```

### 2. Restore controller companyId checks:
In `getCustomerDebts`:
```typescript
const companyId = req.user?.companyId;
if (!companyId) {
  res.status(401).json({ error: "Unauthorized" });
  return;
}

const debts = await prisma.customerDebt.findMany({
  where: {
    customerId,
    companyId, // Add this back
  },
  // ...
});
```

In `createCustomerDebt`:
```typescript
const companyId = req.user?.companyId;
if (!companyId) {
  res.status(401).json({ error: "Unauthorized" });
  return;
}
```

## Testing Checklist

- [ ] Server starts without errors
- [ ] Can fetch customer debts without token
- [ ] Can create debt without token  
- [ ] Can update debt without token
- [ ] Can mark debt as paid without token
- [ ] Can delete debt without token
- [ ] Frontend loads customer page successfully
- [ ] Frontend can add new debts
- [ ] Frontend can edit debts
- [ ] Frontend can delete debts

## Remember

**RESTORE AUTHENTICATION BEFORE PRODUCTION DEPLOYMENT!**

This configuration exposes all customer debt data without any access control.
