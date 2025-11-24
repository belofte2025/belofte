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

  // Debts
  { code: 'debts.view', name: 'View Debts', category: 'debts', description: 'View customer debt records' },
  { code: 'debts.create', name: 'Create Debts', category: 'debts', description: 'Record new customer debts' },
  { code: 'debts.edit', name: 'Edit Debts', category: 'debts', description: 'Modify existing debt records' },
  { code: 'debts.delete', name: 'Delete Debts', category: 'debts', description: 'Remove debt records' },

  // Audit
  { code: 'audit.view', name: 'View Audit Logs', category: 'audit', description: 'Access system audit logs' },

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

// Default role templates
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
      'debts.view', 'debts.create', 'debts.edit', 'debts.delete',
      'audit.view',
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
      'debts.view', 'debts.create', 'debts.edit',
      'utilities.view',
      'users.view',
    ],
  },
  sales_attendant: {
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
  console.log('Starting seed...');

  // 1. Create all permissions
  console.log('Creating permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: perm,
      create: perm,
    });
  }
  console.log(`✓ Created ${permissions.length} permissions`);

  // 2. Get all companies
  const companies = await prisma.company.findMany();
  console.log(`Found ${companies.length} companies`);

  // 3. Create default roles for each company
  for (const company of companies) {
    console.log(`\nCreating roles for company: ${company.companyName}`);

    for (const [roleKey, template] of Object.entries(roleTemplates)) {
      // Check if role already exists
      const existingRole = await prisma.role.findUnique({
        where: {
          name_companyId: {
            name: template.name,
            companyId: company.id,
          },
        },
      });

      if (existingRole) {
        console.log(`  - Role "${template.name}" already exists, skipping...`);
        continue;
      }

      // Get permission IDs
      const permissionRecords = await prisma.permission.findMany({
        where: {
          code: { in: template.permissionCodes },
        },
      });

      // Create role with permissions
      const role = await prisma.role.create({
        data: {
          name: template.name,
          description: template.description,
          companyId: company.id,
          isDefault: roleKey === 'sales_attendant', // Make sales_attendant the default role
          permissions: {
            create: permissionRecords.map(p => ({
              permissionId: p.id,
            })),
          },
        },
      });

      console.log(`  ✓ Created role "${template.name}" with ${permissionRecords.length} permissions`);
    }
  }

  // 4. Assign existing users to default roles
  console.log('\nAssigning existing users to default roles...');
  const usersWithoutRole = await prisma.user.findMany({
    where: { roleId: null },
    include: { company: true },
  });

  for (const user of usersWithoutRole) {
    // Find the default role for this user's company
    const defaultRole = await prisma.role.findFirst({
      where: {
        companyId: user.companyId,
        isDefault: true,
      },
    });

    if (defaultRole) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: defaultRole.id },
      });
      console.log(`  ✓ Assigned user ${user.email} to role "${defaultRole.name}"`);
    }
  }

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
