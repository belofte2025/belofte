import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
};

async function main() {
  console.log('🚀 Creating missing Admin and Manager roles...\n');

  // 1. Ensure all permissions exist
  console.log('📝 Ensuring all permissions exist...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: perm,
      create: perm,
    });
  }
  console.log(`✅ Ensured ${permissions.length} permissions exist\n`);

  // 2. Get all companies
  const companies = await prisma.company.findMany();
  console.log(`🏢 Found ${companies.length} companies\n`);

  // 3. For each company, create Admin and Manager roles if they don't exist
  for (const company of companies) {
    console.log(`\n📦 Processing company: ${company.companyName}`);

    // Check existing roles
    const existingRoles = await prisma.role.findMany({
      where: { companyId: company.id },
      select: { name: true },
    });
    const existingRoleNames = existingRoles.map(r => r.name);
    console.log(`   Existing roles: ${existingRoleNames.join(', ')}`);

    // Create Admin role if missing
    if (!existingRoleNames.includes('Admin')) {
      const template = roleTemplates.admin;
      const permissionRecords = await prisma.permission.findMany({
        where: { code: { in: template.permissionCodes } },
      });

      const role = await prisma.role.create({
        data: {
          name: template.name,
          description: template.description,
          companyId: company.id,
          isDefault: false,
          permissions: {
            create: permissionRecords.map(p => ({
              permissionId: p.id,
            })),
          },
        },
      });

      console.log(`   ✅ Created Admin role with ${permissionRecords.length} permissions`);
    } else {
      console.log(`   ℹ️  Admin role already exists`);
    }

    // Create Manager role if missing
    if (!existingRoleNames.includes('Manager')) {
      const template = roleTemplates.manager;
      const permissionRecords = await prisma.permission.findMany({
        where: { code: { in: template.permissionCodes } },
      });

      const role = await prisma.role.create({
        data: {
          name: template.name,
          description: template.description,
          companyId: company.id,
          isDefault: false,
          permissions: {
            create: permissionRecords.map(p => ({
              permissionId: p.id,
            })),
          },
        },
      });

      console.log(`   ✅ Created Manager role with ${permissionRecords.length} permissions`);
    } else {
      console.log(`   ℹ️  Manager role already exists`);
    }
  }

  console.log('\n\n✅ Role creation complete!');
  console.log('\n📊 Final Summary:');
  const allRoles = await prisma.role.findMany({
    include: {
      company: { select: { companyName: true } },
      _count: { select: { users: true, permissions: true } },
    },
  });

  allRoles.forEach(role => {
    console.log(`\n   ${role.company.companyName} - ${role.name}`);
    console.log(`   └─ ${role._count.permissions} permissions, ${role._count.users} users`);
  });

  console.log('\n\n🎉 All done! You can now:');
  console.log('   1. Visit /settings/roles to manage roles');
  console.log('   2. Assign Admin/Manager roles to users');
  console.log('   3. Log out and log back in to test permissions\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
