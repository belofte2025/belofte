import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to convert existing role strings to the new RBAC system
 *
 * This script:
 * 1. Creates permissions
 * 2. Creates roles based on existing role strings
 * 3. Maps existing users to new roles
 */

const permissions = [
  // Dashboard
  { code: 'dashboard.view', name: 'View Dashboard', category: 'dashboard', description: 'Access to view the dashboard' },

  // Customers
  { code: 'customers.view', name: 'View Customers', category: 'customers', description: 'View customer list and details' },
  { code: 'customers.create', name: 'Create Customers', category: 'customers', description: 'Add new customers' },
  { code: 'customers.edit', name: 'Edit Customers', category: 'customers', description: 'Update customer information' },
  { code: 'customers.delete', name: 'Delete Customers', category: 'customers', description: 'Remove customers' },

  // Suppliers
  { code: 'suppliers.view', name: 'View Suppliers', category: 'suppliers', description: 'View supplier list and details' },
  { code: 'suppliers.create', name: 'Create Suppliers', category: 'suppliers', description: 'Add new suppliers' },
  { code: 'suppliers.edit', name: 'Edit Suppliers', category: 'suppliers', description: 'Update supplier information' },
  { code: 'suppliers.delete', name: 'Delete Suppliers', category: 'suppliers', description: 'Remove suppliers' },

  // Items
  { code: 'items.view', name: 'View Items', category: 'items', description: 'View item catalog' },
  { code: 'items.create', name: 'Create Items', category: 'items', description: 'Add new items' },
  { code: 'items.edit', name: 'Edit Items', category: 'items', description: 'Update item information and prices' },
  { code: 'items.delete', name: 'Delete Items', category: 'items', description: 'Remove items' },

  // Containers
  { code: 'containers.view', name: 'View Containers', category: 'containers', description: 'View container list' },
  { code: 'containers.create', name: 'Create Containers', category: 'containers', description: 'Add new containers' },
  { code: 'containers.edit', name: 'Edit Containers', category: 'containers', description: 'Update container information' },
  { code: 'containers.delete', name: 'Delete Containers', category: 'containers', description: 'Remove containers' },

  // Sales
  { code: 'sales.view', name: 'View Sales', category: 'sales', description: 'View sales records' },
  { code: 'sales.create', name: 'Create Sales', category: 'sales', description: 'Record new sales' },
  { code: 'sales.edit', name: 'Edit Sales', category: 'sales', description: 'Modify existing sales' },
  { code: 'sales.delete', name: 'Delete Sales', category: 'sales', description: 'Remove sales records' },

  // Reports
  { code: 'reports.view', name: 'View Reports', category: 'reports', description: 'Access all reports' },
  { code: 'reports.export', name: 'Export Reports', category: 'reports', description: 'Download and export report data' },

  // Payments
  { code: 'payments.view', name: 'View Payments', category: 'payments', description: 'View payment records' },
  { code: 'payments.create', name: 'Record Payments', category: 'payments', description: 'Record customer payments' },

  // Utilities
  { code: 'utilities.view', name: 'Access Utilities', category: 'utilities', description: 'Access utility tools' },
  { code: 'utilities.import', name: 'Import Data', category: 'utilities', description: 'Import customers and suppliers' },

  // User Management
  { code: 'users.view', name: 'View Users', category: 'settings', description: 'View user list' },
  { code: 'users.create', name: 'Create Users', category: 'settings', description: 'Add new users' },
  { code: 'users.edit', name: 'Edit Users', category: 'settings', description: 'Update user information' },
  { code: 'users.delete', name: 'Delete Users', category: 'settings', description: 'Remove users' },
  { code: 'roles.manage', name: 'Manage Roles', category: 'settings', description: 'Create and manage roles and permissions' },
];

// Role mappings: old role string -> new role configuration
const roleTemplates = {
  admin: {
    name: 'Admin',
    description: 'Full system access with all permissions',
    permissionCodes: [
      'dashboard.view',
      'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
      'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
      'items.view', 'items.create', 'items.edit', 'items.delete',
      'containers.view', 'containers.create', 'containers.edit', 'containers.delete',
      'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
      'reports.view', 'reports.export',
      'payments.view', 'payments.create',
      'utilities.view', 'utilities.import',
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'roles.manage',
    ],
  },
  manager: {
    name: 'Manager',
    description: 'Management access with reporting and oversight capabilities',
    permissionCodes: [
      'dashboard.view',
      'customers.view', 'customers.create', 'customers.edit',
      'suppliers.view', 'suppliers.create', 'suppliers.edit',
      'items.view', 'items.create', 'items.edit',
      'containers.view', 'containers.create', 'containers.edit',
      'sales.view', 'sales.create', 'sales.edit',
      'reports.view', 'reports.export',
      'payments.view', 'payments.create',
      'utilities.view',
      'users.view',
    ],
  },
  user: {
    name: 'Sales Attendant',
    description: 'Basic sales operations and customer management',
    permissionCodes: [
      'dashboard.view',
      'customers.view', 'customers.create',
      'items.view',
      'sales.view', 'sales.create',
      'payments.view', 'payments.create',
    ],
  },
};

async function main() {
  console.log('🚀 Starting role migration...\n');

  // 1. Create all permissions
  console.log('📝 Creating permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: perm,
      create: perm,
    });
  }
  console.log(`✅ Created ${permissions.length} permissions\n`);

  // 2. Get all companies
  const companies = await prisma.company.findMany();
  console.log(`🏢 Found ${companies.length} companies\n`);

  // 3. For each company, create roles and migrate users
  for (const company of companies) {
    console.log(`\n📦 Processing company: ${company.companyName}`);

    // Get unique role strings used by users in this company
    const usersInCompany = await prisma.user.findMany({
      where: { companyId: company.id },
      select: { id: true, email: true, role: true },
    });

    // Get unique role strings (assuming old role field still exists temporarily)
    const uniqueRoleStrings = [...new Set(usersInCompany.map(u => (u.role as any) || 'user'))];
    console.log(`   Found ${uniqueRoleStrings.length} unique role types: ${uniqueRoleStrings.join(', ')}`);

    // Map to create roles
    const roleMapping: Record<string, string> = {}; // oldRoleString -> newRoleId

    for (const oldRoleString of uniqueRoleStrings) {
      // Normalize role string (convert to lowercase for matching)
      const normalizedRole = oldRoleString.toLowerCase();
      const template = roleTemplates[normalizedRole as keyof typeof roleTemplates] || roleTemplates.user;

      // Check if role already exists
      let role = await prisma.role.findFirst({
        where: {
          name: template.name,
          companyId: company.id,
        },
      });

      if (!role) {
        // Get permission IDs
        const permissionRecords = await prisma.permission.findMany({
          where: {
            code: { in: template.permissionCodes },
          },
        });

        // Create role with permissions
        role = await prisma.role.create({
          data: {
            name: template.name,
            description: template.description,
            companyId: company.id,
            isDefault: normalizedRole === 'user' || normalizedRole === 'sales_attendant',
            permissions: {
              create: permissionRecords.map(p => ({
                permissionId: p.id,
              })),
            },
          },
        });

        console.log(`   ✅ Created role "${template.name}" with ${permissionRecords.length} permissions`);
      } else {
        console.log(`   ℹ️  Role "${template.name}" already exists`);
      }

      roleMapping[oldRoleString] = role.id;
    }

    // 4. Update all users in this company
    console.log(`\n   🔄 Migrating ${usersInCompany.length} users...`);
    for (const user of usersInCompany) {
      const oldRole = (user.role as any) || 'user';
      const newRoleId = roleMapping[oldRole];

      if (newRoleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: newRoleId },
        });
        console.log(`      ✅ ${user.email}: ${oldRole} -> ${newRoleId}`);
      } else {
        console.log(`      ⚠️  ${user.email}: No mapping found for role "${oldRole}"`);
      }
    }
  }

  console.log('\n\n✅ Migration completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${permissions.length} permissions created`);
  console.log(`   - Roles created for ${companies.length} companies`);
  console.log(`   - All existing users have been assigned to new roles`);
  console.log('\n🔐 You can now use the new RBAC system!');
}

main()
  .catch((e) => {
    console.error('\n❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
