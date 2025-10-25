# Customer Debts Feature - Testing & Troubleshooting

## Quick Fixes Applied

1. ✅ Added customerId validation in useEffect
2. ✅ Improved error messages to show API response details
3. ✅ Better error logging in console

## Steps to Test

### 1. Fix Database Connection
Update `server/.env` line 7 - replace `[YOUR-PASSWORD]` with actual password:
```
DATABASE_URL="postgresql://postgres.ttjzkuhdezrjztnirits:Year2025belofte@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### 2. Regenerate Prisma Client
```powershell
cd server
npx prisma generate
```

### 3. Run Database Migrations (if needed)
```powershell
npx prisma migrate deploy
```

### 4. Start the Server
```powershell
cd server
npm run dev
```

### 5. Start the Client (in new terminal)
```powershell
cd client
npm run dev
```

### 6. Test the Feature

1. Open browser to `http://localhost:3000`
2. Login with your credentials
3. Navigate to a customer page: `/customers/[customerId]`
4. Open browser DevTools (F12) → Console tab
5. Try to:
   - View existing debts
   - Add a new debt
   - Check console for any error messages

## Debugging Steps

### Check if API is Running
```powershell
curl http://localhost:4000/api/health
```
Should return: `{"ok":true}`

### Check Authentication
In browser console on customer page:
```javascript
console.log(localStorage.getItem('token'))
```
Should show a JWT token, not null

### Test API Endpoint Directly
Replace `YOUR_TOKEN` and `CUSTOMER_ID`:
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "http://localhost:4000/api/customer-debts/customer/CUSTOMER_ID" -Headers $headers
```

### Check Network Tab
1. Open DevTools → Network tab
2. Try loading customer page
3. Look for request to `/api/customer-debts/customer/[id]`
4. Check:
   - Status code (should be 200)
   - Response (should be array of debts)
   - Request headers (should include Authorization)

## Common Issues & Solutions

### Error: "Failed to load debts"
- **Cause**: Authentication issue
- **Fix**: Check if token exists in localStorage, try logging out and in again

### Error: "Unauthorized"
- **Cause**: Invalid or expired token
- **Fix**: Re-login to get fresh token

### Error: Network request failed
- **Cause**: Server not running or wrong URL
- **Fix**: Ensure server is running on port 4000

### Error: CORS policy
- **Cause**: CORS configuration issue
- **Fix**: Add to `server/.env`:
```
CORS_ORIGIN=http://localhost:3000
```

### No debts showing but no error
- **Cause**: Customer has no debts (expected behavior)
- **Fix**: Try adding a debt using the "Add Debt" button

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customer-debts/customer/:customerId` | Get all debts for a customer |
| POST | `/api/customer-debts` | Create a new debt |
| PUT | `/api/customer-debts/:id` | Update a debt |
| PATCH | `/api/customer-debts/:id/mark-paid` | Mark debt as paid |
| DELETE | `/api/customer-debts/:id` | Delete a debt |

## Next Steps

After following these steps, the error messages in the console should tell you exactly what's wrong. Share the console error output for further assistance.
