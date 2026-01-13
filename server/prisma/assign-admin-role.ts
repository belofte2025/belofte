import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignAdminRole() {
  try {
    console.log('\n🔐 Assigning Admin Role to Users');
    console.log('='.repeat(60));

    // Get the company
    const company = await prisma.company.findFirst({
      select: {
        id: true,
        companyName: true,
      }
    });

    if (!company) {
      console.log('❌ No company found');
      return;
    }

    console.log(`\nCompany: ${company.companyName}\n`);

    // Get the Admin role for this company
    const adminRole = await prisma.role.findFirst({
      where: {
        companyId: company.id,
        name: 'Admin'
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!adminRole) {
      console.log('❌ Admin role not found. Run seed first.');
      return;
    }

    console.log(`Found Admin role with ${adminRole.permissions.length} permissions\n`);

    // Get all users for this company
    const users = await prisma.user.findMany({
      where: {
        companyId: company.id
      },
      include: {
        role: true
      }
    });

    console.log('Updating users to Admin role:');
    console.log('─'.repeat(60));

    for (const user of users) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { roleId: adminRole.id },
        include: {
          role: {
            select: {
              name: true
            }
          }
        }
      });

      console.log(`\n✓ ${user.userName} (${user.email})`);
      console.log(`  Old Role: ${user.role?.name || 'None'}`);
      console.log(`  New Role: ${updatedUser.role?.name}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ All users now have Admin role with full permissions!');

    console.log('\n📋 Admin Permissions Include:');
    const categories = [...new Set(adminRole.permissions.map(p => p.permission.category))];
    categories.forEach(category => {
      const perms = adminRole.permissions.filter(p => p.permission.category === category);
      console.log(`\n  ${category.toUpperCase()}:`);
      perms.forEach(p => {
        console.log(`    - ${p.permission.name} (${p.permission.code})`);
      });
    });

  } catch (error) {
    console.error('\n❌ Error assigning admin role:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

assignAdminRole();
