# Audit Trail System

The audit trail system automatically tracks all important user actions in the system, providing a complete history of who did what and when.

---

## Features

✅ **Automatic Logging**: Login events are automatically logged
✅ **Manual Logging**: Controllers can log specific actions
✅ **Company Isolation**: Each company only sees their own audit logs
✅ **Comprehensive Filtering**: Filter by user, action type, entity type, date range
✅ **Pagination Support**: Handle large audit datasets efficiently
✅ **Statistics Dashboard**: View activity summaries and trends
✅ **Permission-Based Access**: Only users with `audit.view` permission can access logs

---

## API Endpoints

### 1. Get Audit Logs
```
GET /api/audit
```

**Query Parameters:**
- `userId` (optional): Filter by specific user ID
- `actionType` (optional): Filter by action (CREATE, UPDATE, DELETE, LOGIN, etc.)
- `entityType` (optional): Filter by entity (Customer, Sale, Container, etc.)
- `from` (optional): Start date (ISO 8601 format)
- `to` (optional): End date (ISO 8601 format)
- `limit` (optional): Number of records per page (default: 100)
- `offset` (optional): Skip N records (default: 0)

**Response:**
```json
{
  "logs": [
    {
      "id": "log-id",
      "userId": "user-id",
      "actionType": "LOGIN",
      "entityType": "User",
      "entityId": "user-id",
      "description": "User logged in: user@example.com",
      "timestamp": "2026-01-06T20:00:00.000Z",
      "user": {
        "userName": "John Doe",
        "email": "user@example.com",
        "company": {
          "companyName": "AndyD"
        }
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

**Example Requests:**
```bash
# Get all audit logs
GET /api/audit

# Get logs for specific user
GET /api/audit?userId=abc-123

# Get all login events
GET /api/audit?actionType=LOGIN

# Get logs for date range
GET /api/audit?from=2026-01-01&to=2026-01-31

# Get customer-related logs
GET /api/audit?entityType=Customer

# Pagination
GET /api/audit?limit=50&offset=100
```

### 2. Get Audit Statistics
```
GET /api/audit/stats
```

**Query Parameters:**
- `from` (optional): Start date
- `to` (optional): End date

**Response:**
```json
{
  "totalLogs": 1523,
  "actionCounts": [
    { "action": "CREATE", "count": 450 },
    { "action": "UPDATE", "count": 320 },
    { "action": "DELETE", "count": 85 },
    { "action": "LOGIN", "count": 560 },
    { "action": "EXPORT", "count": 108 }
  ],
  "entityCounts": [
    { "entity": "Sale", "count": 680 },
    { "entity": "Customer", "count": 245 },
    { "entity": "Payment", "count": 198 },
    { "entity": "User", "count": 152 },
    { "entity": "Container", "count": 98 }
  ],
  "activeUsers": [
    {
      "id": "user-1",
      "userName": "Wilson",
      "email": "info@eyo.com",
      "activityCount": 842
    },
    {
      "id": "user-2",
      "userName": "mabel",
      "email": "mabel@andyd.com",
      "activityCount": 681
    }
  ]
}
```

---

## Action Types

The system tracks the following action types:

| Action Type | Description |
|-------------|-------------|
| `CREATE` | New record created |
| `UPDATE` | Existing record modified |
| `DELETE` | Record deleted |
| `LOGIN` | User logged in |
| `LOGOUT` | User logged out |
| `VIEW` | Sensitive data viewed |
| `EXPORT` | Report exported |
| `IMPORT` | Bulk data imported |

---

## Entity Types

The system tracks actions on these entities:

| Entity Type | Description |
|-------------|-------------|
| `Customer` | Customer records |
| `Supplier` | Supplier records |
| `Item` | Product/item records |
| `Container` | Container shipments |
| `Sale` | Sales transactions |
| `Payment` | Customer payments |
| `Debt` | Customer debt records |
| `User` | User accounts |
| `Role` | User roles |
| `Company` | Company settings |

---

## Using Audit Logging in Controllers

### Import the Utility
```typescript
import {
  logCreate,
  logUpdate,
  logDelete,
  EntityType
} from '../utils/auditLogger';
```

### Log Creation
```typescript
// After creating a customer
const customer = await prisma.customer.create({
  data: { customerName, phone, companyId }
});

await logCreate(
  req.user!.id,           // User ID
  EntityType.CUSTOMER,    // Entity type
  customer.id,            // Entity ID
  customer.customerName   // Entity name
);
```

### Log Update
```typescript
// After updating a customer
await prisma.customer.update({
  where: { id },
  data: { customerName, phone }
});

await logUpdate(
  req.user!.id,
  EntityType.CUSTOMER,
  id,
  customerName,
  'Updated name and phone'  // Optional change description
);
```

### Log Deletion
```typescript
// Before deleting (to get the name)
const customer = await prisma.customer.findUnique({
  where: { id }
});

await prisma.customer.delete({
  where: { id }
});

await logDelete(
  req.user!.id,
  EntityType.CUSTOMER,
  id,
  customer!.customerName
);
```

### Log Export
```typescript
import { logExport } from '../utils/auditLogger';

await logExport(
  req.user!.id,
  'Sales Report',
  `Date: ${from} to ${to}, Customer: ${customerId}`
);
```

### Log Import
```typescript
import { logImport } from '../utils/auditLogger';

// After bulk import
await logImport(
  req.user!.id,
  EntityType.CUSTOMER,
  importedRecords.length
);
```

---

## Automatic Logging

The following actions are **automatically logged**:

✅ **User Login** - Every successful login
✅ **User Registration** - New user accounts

To add automatic logging to more actions, simply add the log calls to the respective controllers after the database operations.

---

## Best Practices

### 1. Log After Success
Always log **after** the database operation succeeds:

```typescript
// ❌ Wrong - logs before operation
await logCreate(userId, EntityType.CUSTOMER, customerId, name);
const customer = await prisma.customer.create({ data });

// ✅ Correct - logs after success
const customer = await prisma.customer.create({ data });
await logCreate(userId, EntityType.CUSTOMER, customer.id, customer.customerName);
```

### 2. Use Descriptive Messages
Provide clear descriptions of what changed:

```typescript
// ❌ Generic
await logUpdate(userId, EntityType.CUSTOMER, id, name);

// ✅ Specific
await logUpdate(
  userId,
  EntityType.CUSTOMER,
  id,
  name,
  'Updated phone from +233... to +233... and email'
);
```

### 3. Don't Log Everything
Focus on important business actions. Don't log:
- Simple read operations (unless sensitive data)
- Internal system operations
- Background jobs (unless they modify data)

### 4. Handle Failures Gracefully
Audit logging failures should **never** break business operations:

```typescript
try {
  // Business operation
  const customer = await prisma.customer.create({ data });

  // Audit logging - errors are caught internally
  await logCreate(userId, EntityType.CUSTOMER, customer.id, name);

  // Response
  res.json(customer);
} catch (error) {
  // Business error handling
  res.status(500).json({ error: 'Failed to create customer' });
}
```

The `auditLogger` utility automatically catches and logs errors without throwing, so business operations continue even if audit logging fails.

---

## Security Considerations

### 1. Company Isolation
Audit logs are automatically filtered by company:
- Users only see logs from their company
- Cross-company data leaks are prevented
- Implemented in the controller layer

### 2. Permission-Based Access
Only users with the `audit.view` permission can:
- View audit logs
- See audit statistics
- Export audit reports

### 3. Sensitive Data
Be careful not to log sensitive information:
- ❌ Don't log passwords or tokens
- ❌ Don't log full credit card numbers
- ✅ Log masked/partial data if needed
- ✅ Log actions, not sensitive content

Example:
```typescript
// ❌ Bad
description: `Updated password to: ${newPassword}`

// ✅ Good
description: `Password updated successfully`
```

---

## Frontend Integration

### Fetch Audit Logs
```typescript
const response = await fetch('/api/audit?limit=50&offset=0', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { logs, pagination } = await response.json();
```

### Filter Logs
```typescript
// Filter by date range
const response = await fetch(
  `/api/audit?from=2026-01-01&to=2026-01-31`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

// Filter by user
const response = await fetch(
  `/api/audit?userId=${selectedUserId}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

// Filter by action type
const response = await fetch(
  `/api/audit?actionType=LOGIN`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### Get Statistics
```typescript
const response = await fetch('/api/audit/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const stats = await response.json();
console.log(`Total logs: ${stats.totalLogs}`);
console.log('Most active users:', stats.activeUsers);
```

---

## Database Schema

The audit log is stored in the `AuditLog` table:

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  actionType  String
  entityType  String
  entityId    String
  description String
  timestamp   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}
```

**Fields:**
- `id`: Unique identifier
- `userId`: ID of user who performed the action
- `actionType`: Type of action (CREATE, UPDATE, etc.)
- `entityType`: Type of entity affected
- `entityId`: ID of the affected entity
- `description`: Human-readable description
- `timestamp`: When the action occurred
- `user`: Related user record (includes company info)

---

## Performance Considerations

### 1. Pagination
Always use pagination for large datasets:
```typescript
// Good for displaying in UI
GET /api/audit?limit=50&offset=0

// Bad for large datasets
GET /api/audit  // Returns 100 by default, could be slow
```

### 2. Date Range Filters
Use date filters to limit the query scope:
```typescript
// Query last 30 days only
const from = new Date();
from.setDate(from.getDate() - 30);

GET /api/audit?from=${from.toISOString()}&limit=100
```

### 3. Indexes
The database should have indexes on:
- `userId` - For user-specific queries
- `timestamp` - For date range queries
- `actionType` - For action filtering
- `entityType` - For entity filtering

---

## Troubleshooting

### Audit Logs Not Appearing

**1. Check Permission**
Ensure user has `audit.view` permission:
```typescript
// Check user's permissions
console.log(req.user.permissions);  // Should include 'audit.view'
```

**2. Check Company ID**
Logs are filtered by company. Verify user's companyId:
```typescript
// All logs must belong to users in the same company
console.log(req.user.companyId);
```

**3. Check Date Range**
If using date filters, ensure they're valid:
```typescript
// ISO 8601 format required
const from = new Date('2026-01-01').toISOString();
const to = new Date('2026-01-31').toISOString();
```

### Audit Logging Not Working

**1. Check if logged in controllers**
Verify the controller has audit logging calls:
```typescript
// Check if logCreate, logUpdate, etc. are called
await logCreate(userId, EntityType.CUSTOMER, id, name);
```

**2. Check console for errors**
Audit logging errors are logged to console:
```bash
# Look for these in server logs
Audit logging failed: [error details]
```

**3. Verify database connection**
Ensure Prisma can connect to the database:
```bash
npx prisma db pull  # Should succeed
```

---

## Future Enhancements

Potential improvements for the audit system:

- [ ] Add IP address tracking
- [ ] Add browser/device information
- [ ] Add before/after field values for updates
- [ ] Add audit log export functionality
- [ ] Add real-time audit log streaming
- [ ] Add audit log retention policies
- [ ] Add audit log archiving
- [ ] Add graphical audit log viewer UI
- [ ] Add anomaly detection (unusual activity patterns)
- [ ] Add audit log integrity verification

---

## Summary

The audit trail system provides:

✅ **Accountability**: Know who did what
✅ **Security**: Track unauthorized access attempts
✅ **Compliance**: Meet audit requirements
✅ **Debugging**: Trace issues back to specific actions
✅ **Analytics**: Understand user behavior patterns

By automatically tracking all important actions, the system ensures complete visibility into all operations, helping maintain security and accountability.
