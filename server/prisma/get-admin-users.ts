import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAdminUsers() {
  try {
    console.log('\n🔍 Finding Admin Users');
    console.log('='.repeat(60));

    // Get all companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        companyName: true,
      }
    });

    console.log(`\nFound ${companies.length} companies\n`);

    // Get all users with their company info
    const users = await prisma.user.findMany({
      include: {
        company: {
          select: {
            companyName: true
          }
        },
        role: {
          select: {
            name: true
          }
        }
      }
    });

    console.log('All Users:');
    console.log('─'.repeat(60));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.userName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Company: ${user.company.companyName}`);
      console.log(`   Role: ${user.role?.name || 'No role assigned'}`);
      console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log(`\nTotal Users: ${users.length}`);

  } catch (error) {
    console.error('\n❌ Error fetching users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

getAdminUsers();
