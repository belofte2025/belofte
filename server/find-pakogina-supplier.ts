import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findPakoginaSupplier() {
  console.log('🔍 Searching for Pakogina supplier...\n');

  try {
    // Search for supplier
    const supplier = await prisma.supplier.findFirst({
      where: {
        suppliername: {
          contains: 'pakogina',
          mode: 'insensitive'
        }
      },
      include: {
        company: true
      }
    });

    if (!supplier) {
      console.log('❌ Supplier "Pakogina" not found');
      console.log('\nLet me list all suppliers:\n');

      const allSuppliers = await prisma.supplier.findMany({
        include: { company: true },
        orderBy: { suppliername: 'asc' }
      });

      if (allSuppliers.length === 0) {
        console.log('No suppliers found in database');
      } else {
        console.log(`Found ${allSuppliers.length} suppliers:\n`);
        allSuppliers.forEach((s, idx) => {
          console.log(`${idx + 1}. ${s.suppliername}`);
          console.log(`   Company: ${s.company.companyName}`);
          console.log(`   ID: ${s.id}`);
          console.log('');
        });
      }
      return;
    }

    console.log(`✓ Found supplier: ${supplier.suppliername}`);
    console.log(`  Company: ${supplier.company.companyName}`);
    console.log(`  Supplier ID: ${supplier.id}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findPakoginaSupplier();
