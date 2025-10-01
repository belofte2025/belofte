# Database User Credentials

This document contains the login credentials for all seeded users in the Belofte Enterprise system.

## Companies

### 1. Admin Company
- **Address**: Admin Address
- **Phone**: +1234567890
- **Users**: 4

### 2. Demo Company Ltd
- **Address**: 123 Business Street, Demo City  
- **Phone**: +1987654321
- **Users**: 1

---

## User Accounts

### Admin Company Users

#### 1. Administrator (Admin)
- **Email**: `admin@belofte.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Company**: Admin Company
- **Created**: 9/28/2025

#### 2. Demo User
- **Email**: `demo@belofte.com`
- **Password**: `demo123`
- **Role**: `user`
- **Company**: Admin Company
- **Created**: 10/1/2025

#### 3. Manager
- **Email**: `manager@belofte.com`
- **Password**: `manager123`
- **Role**: `admin`
- **Company**: Admin Company
- **Created**: 10/1/2025

#### 4. Employee
- **Email**: `employee@belofte.com`
- **Password**: `employee123`
- **Role**: `user`
- **Company**: Admin Company
- **Created**: 10/1/2025

### Demo Company Ltd Users

#### 1. Demo Company User
- **Email**: `user@demo.com`
- **Password**: `user123`
- **Role**: `user`
- **Company**: Demo Company Ltd
- **Created**: 10/1/2025

---

## Seeding Utilities

### Available Scripts

#### 1. Check Database State
```bash
node -e "const DatabaseSeeder = require('./seed-utils.js'); (async () => { await DatabaseSeeder.checkDatabase(); await DatabaseSeeder.disconnect(); })()"
```

#### 2. Run Full Seeding Utility
```bash
node seed-utils.js
```

#### 3. Original Seed Script
```bash
npm run seed
# or
npx prisma db seed
```

### Creating Custom Users

You can use the `seed-utils.js` module to create custom users:

```javascript
const DatabaseSeeder = require('./seed-utils.js');

async function createCustomUser() {
  const companies = await DatabaseSeeder.getCompanies();
  
  await DatabaseSeeder.createUser({
    email: 'custom@example.com',
    password: 'custom123',
    userName: 'Custom User',
    role: 'user', // or 'admin'
    companyId: companies[0].id // or create new company
  });
  
  await DatabaseSeeder.disconnect();
}
```

### Creating New Companies

```javascript
const newCompany = await DatabaseSeeder.createCompany({
  companyName: 'New Company Name',
  address: 'Company Address',
  phone: '+1234567890'
});
```

---

## Notes

- All passwords are hashed using bcrypt with salt rounds = 10
- Email addresses must be unique across the system
- Users are scoped to their respective companies
- Admin role users have elevated permissions
- Regular users have standard access permissions