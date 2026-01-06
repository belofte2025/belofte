import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listCompanies() {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        companyName: true,
        createdAt: true,
        _count: {
          select: {
            sale: true,
            custpayment: true,
            customerDebt: true,
            users: true,
          }
        }
      }
    });

    console.log('Companies in database:');
    console.log('======================\n');

    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.companyName}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Created: ${company.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Sales: ${company._count.sale}`);
      console.log(`   Payments: ${company._count.custpayment}`);
      console.log(`   Debts: ${company._count.customerDebt}`);
      console.log(`   Users: ${company._count.users}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error listing companies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listCompanies();
