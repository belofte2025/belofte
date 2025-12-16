import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding items.deduplicate permission to existing roles...');

  // Get the deduplicate permission
  const deduplicatePermission = await prisma.permission.findUnique({
    where: { code: 'items.deduplicate' },
  });

  if (!deduplicatePermission) {
    console.log('❌ items.deduplicate permission not found. Run seed first.');
    return;
  }

  console.log(`✓ Found permission: ${deduplicatePermission.name}`);

  // Get all companies
  const companies = await prisma.company.findMany();
  console.log(`Found ${companies.length} companies`);

  let updatedCount = 0;

  // For each company, update Admin and Manager roles
  for (const company of companies) {
    console.log(`\nProcessing company: ${company.companyName}`);

    // Get Admin role
    const adminRole = await prisma.role.findUnique({
      where: {
        name_companyId: {
          name: 'Admin',
          companyId: company.id,
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (adminRole) {
      // Check if permission already exists
      const hasPermission = adminRole.permissions.some(
        (rp) => rp.permission.code === 'items.deduplicate'
      );

      if (!hasPermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: deduplicatePermission.id,
          },
        });
        console.log(`  ✓ Added to Admin role`);
        updatedCount++;
      } else {
        console.log(`  - Admin role already has permission`);
      }
    }

    // Get Manager role
    const managerRole = await prisma.role.findUnique({
      where: {
        name_companyId: {
          name: 'Manager',
          companyId: company.id,
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (managerRole) {
      // Check if permission already exists
      const hasPermission = managerRole.permissions.some(
        (rp) => rp.permission.code === 'items.deduplicate'
      );

      if (!hasPermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: managerRole.id,
            permissionId: deduplicatePermission.id,
          },
        });
        console.log(`  ✓ Added to Manager role`);
        updatedCount++;
      } else {
        console.log(`  - Manager role already has permission`);
      }
    }
  }

  console.log(`\n✅ Updated ${updatedCount} role(s)`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
