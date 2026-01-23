import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listCompanies() {
  console.log('📋 Listing all companies in the database:\n');

  try {
    const companies = await prisma.company.findMany({
      orderBy: { companyName: 'asc' }
    });

    if (companies.length === 0) {
      console.log('No companies found');
      return;
    }

    console.log(`Found ${companies.length} companies:\n`);
    companies.forEach((company, idx) => {
      console.log(`${idx + 1}. ${company.companyName}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Phone: ${company.phone || 'N/A'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listCompanies();
