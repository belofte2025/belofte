# Customer Debts 404 Error - Root Cause & Solution

## Error Details
- **Error**: `Request failed with status code 404`
- **Location**: `services\customerDebtService.ts (41:17)`
- **Function**: `getCustomerDebts`
- **Endpoint**: `GET /api/customer-debts/customer/:customerId`

## Root Cause

The 404 error occurs because the client-side component `CustomerDebtsSection` is trying to call the API endpoint `http://localhost:4000/api/customer-debts/customer/:customerId`, but one of the following is happening:

1. **Server is not running** on port 4000
2. **Authentication token is missing or invalid**
3. **The customer ID is undefined or malformed**

## Issues Fixed

### 1. ✅ API Route Inconsistencies
Fixed inconsistent endpoint names in `customerDebtService.ts`:
- Line 54: `/customerdebts` → `/customer-debts` 
- Line 116: `/customerdebts/bulk` → `/customer-debts/bulk`

### 2. ✅ Added Comprehensive Logging
- Client service logs (all operations)
- Server controller logs (all operations)
- API interceptor logs (requests/responses)

### 3. ✅ Enhanced Error Handling
- Better error messages from API responses
- Customer ID validation before fetching debts

## How to Debug

### Step 1: Check if Server is Running
```powershell
# Test health endpoint
curl http://localhost:4000/api/health
# Should return: {"ok":true}
```

If this fails, the server is not running. Start it:
```powershell
cd server
npm run dev
```

### Step 2: Check Console Logs
Open browser DevTools (F12) → Console tab. You should see:

**When page loads:**
```
[API] Request: { method: 'GET', url: '/customer-debts/customer/xxx', ... }
[customerDebtService] Fetching debts for customer: xxx
```

**If token is missing:**
```
[API] No token found in localStorage
```

**If API fails:**
```
[API] Response error: { status: 404, statusText: 'Not Found', ... }
[customerDebtService] Error fetching debts: ...
```

### Step 3: Verify Authentication
In browser console:
```javascript
console.log(localStorage.getItem('token'))
```

If null → **You need to login first**

### Step 4: Check Customer ID
The console logs will show the customer ID being used. Make sure:
- The customer ID is valid (not undefined)
- The customer exists in the database
- The customer belongs to your company

### Step 5: Check Server Logs
In the terminal where server is running, you should see:
```
[customerDebt.controller] GET_CUSTOMER_DEBTS - Customer ID: xxx
[customerDebt.controller] GET_CUSTOMER_DEBTS - User: { userId: 'yyy', companyId: 'zzz' }
[customerDebt.controller] GET_CUSTOMER_DEBTS - Fetching with: { customerId: 'xxx', companyId: 'zzz' }
[customerDebt.controller] GET_CUSTOMER_DEBTS - Found debts: 0
```

## Common Solutions

### Solution 1: Server Not Running
```powershell
cd server
npm run dev
```

### Solution 2: Authentication Issue
1. Navigate to `/login`
2. Login with valid credentials
3. Go back to customer page

### Solution 3: Database Issue
```powershell
cd server
npx prisma generate
npx prisma migrate deploy
```

### Solution 4: Wrong Customer ID
- Check the URL: `/customers/[id]`
- Make sure the ID in the URL is valid
- Try navigating from the customers list page

### Solution 5: CORS Issue (if running on different ports)
Add to `server/.env`:
```
CORS_ORIGIN=http://localhost:3000
```

## Expected Console Output (When Working)

**Client Console:**
```
[API] Request: { method: 'GET', url: '/customer-debts/customer/123-abc', ... }
[API] Token attached: eyJhbGciOiJIUzI1NiIs...
[customerDebtService] Fetching debts for customer: 123-abc
[API] Response: { status: 200, url: '/customer-debts/customer/123-abc', dataLength: 2 }
[customerDebtService] Debts fetched successfully: [Object, Object]
```

**Server Console:**
```
[customerDebt.controller] GET_CUSTOMER_DEBTS - Customer ID: 123-abc
[customerDebt.controller] GET_CUSTOMER_DEBTS - User: { userId: 'user-1', companyId: 'company-1' }
[customerDebt.controller] GET_CUSTOMER_DEBTS - Fetching with: { customerId: '123-abc', companyId: 'company-1' }
[customerDebt.controller] GET_CUSTOMER_DEBTS - Found debts: 2
```

## Testing Checklist

- [ ] Server is running on port 4000
- [ ] Client is running on port 3000
- [ ] You are logged in
- [ ] Token exists in localStorage
- [ ] Customer ID in URL is valid
- [ ] Console shows request being made
- [ ] Server console shows request received
- [ ] Database is accessible

## Next Steps

1. Start both server and client
2. Login to the application
3. Navigate to a customer page
4. Open browser console (F12)
5. Check the logs to see where the request fails
6. Share the console output if issue persists
