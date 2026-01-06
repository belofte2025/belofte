import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchemaMatch() {
  try {
    console.log('\n🔍 Checking Database Schema Match');
    console.log('='.repeat(60));

    // Test all main tables exist and have expected columns
    const checks = [
      {
        table: 'Company',
        test: async () => {
          const count = await prisma.company.count();
          return { exists: true, count };
        }
      },
      {
        table: 'Container',
        test: async () => {
          const count = await prisma.container.count();
          return { exists: true, count };
        }
      },
      {
        table: 'ContainerItem',
        test: async () => {
          const sample = await prisma.containerItem.findFirst({
            select: {
              id: true,
              itemName: true,
              quantity: true,
              unitPrice: true,
              receivedQty: true,
              soldQty: true,
              containerId: true
            }
          });
          const count = await prisma.containerItem.count();
          return { exists: true, count, hasAllFields: !!sample };
        }
      },
      {
        table: 'Supplier',
        test: async () => {
          const count = await prisma.supplier.count();
          return { exists: true, count };
        }
      },
      {
        table: 'SupplierItem',
        test: async () => {
          const sample = await prisma.supplierItem.findFirst({
            select: {
              id: true,
              itemName: true,
              price: true,
              alias: true,
              supplierId: true
            }
          });
          const count = await prisma.supplierItem.count();
          return { exists: true, count, hasAllFields: !!sample };
        }
      },
      {
        table: 'Sale',
        test: async () => {
          const sample = await prisma.sale.findFirst({
            select: {
              id: true,
              saleType: true,
              sourceType: true,
              sourceId: true,
              customerId: true,
              companyId: true,
              subtotal: true,
              discountType: true,
              discountValue: true,
              totalAmount: true
            }
          });
          const count = await prisma.sale.count();
          return { exists: true, count, hasAllFields: !!sample };
        }
      },
      {
        table: 'SaleItem',
        test: async () => {
          const sample = await prisma.saleItem.findFirst({
            select: {
              id: true,
              itemName: true,
              quantity: true,
              unitPrice: true,
              saleId: true
            }
          });
          const count = await prisma.saleItem.count();
          return { exists: true, count, hasAllFields: !!sample };
        }
      },
      {
        table: 'Customer',
        test: async () => {
          const count = await prisma.customer.count();
          return { exists: true, count };
        }
      },
      {
        table: 'CustomerPayment',
        test: async () => {
          const count = await prisma.customerPayment.count();
          return { exists: true, count };
        }
      },
      {
        table: 'CustomerDebt',
        test: async () => {
          const count = await prisma.customerDebt.count();
          return { exists: true, count };
        }
      },
      {
        table: 'User',
        test: async () => {
          const count = await prisma.user.count();
          return { exists: true, count };
        }
      },
      {
        table: 'Role',
        test: async () => {
          const count = await prisma.role.count();
          return { exists: true, count };
        }
      },
      {
        table: 'Permission',
        test: async () => {
          const count = await prisma.permission.count();
          return { exists: true, count };
        }
      },
      {
        table: 'AuditLog',
        test: async () => {
          const count = await prisma.auditLog.count();
          return { exists: true, count };
        }
      },
      {
        table: 'SMSLog',
        test: async () => {
          const count = await prisma.sMSLog.count();
          return { exists: true, count };
        }
      }
    ];

    console.log('\nChecking tables...\n');

    let allMatch = true;
    for (const check of checks) {
      try {
        const result = await check.test();
        const status = result.exists ? '✅' : '❌';
        console.log(`${status} ${check.table.padEnd(20)} - ${result.count} records`);

        if ('hasAllFields' in result && !result.hasAllFields) {
          console.log(`   ⚠️  Warning: Table exists but may be missing expected fields`);
          allMatch = false;
        }
      } catch (error: any) {
        console.log(`❌ ${check.table.padEnd(20)} - ERROR: ${error.message}`);
        allMatch = false;
      }
    }

    console.log('\n' + '='.repeat(60));

    // Test inventory report query
    console.log('\n📊 Testing Inventory Report Query...');

    try {
      const testCompany = await prisma.company.findFirst({
        select: { id: true, companyName: true }
      });

      if (!testCompany) {
        console.log('⚠️  No companies found to test with');
      } else {
        console.log(`   Testing with: ${testCompany.companyName}`);

        const containerItems = await prisma.containerItem.findMany({
          where: {
            container: { companyId: testCompany.id }
          },
          include: {
            container: {
              include: { supplier: true }
            }
          },
          take: 5
        });

        console.log(`   ✅ Successfully queried ${containerItems.length} container items`);

        if (containerItems.length > 0) {
          const sample = containerItems[0];
          console.log('\n   Sample inventory item structure:');
          console.log(`   - Item Name: ${sample.itemName}`);
          console.log(`   - Supplier: ${sample.container.supplier.suppliername}`);
          console.log(`   - Quantity: ${sample.quantity}`);
          console.log(`   - Unit Price: ${sample.unitPrice}`);
          console.log(`   ✅ All required fields present`);
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Inventory query failed: ${error.message}`);
      allMatch = false;
    }

    console.log('\n' + '='.repeat(60));

    if (allMatch) {
      console.log('\n✅ SUCCESS: Database schema matches the Prisma schema!');
      console.log('   All tables exist and have the expected structure.');
    } else {
      console.log('\n⚠️  WARNING: Schema mismatch detected!');
      console.log('   Some tables or fields may be missing or incompatible.');
      console.log('\n   Run: npx prisma migrate deploy');
      console.log('   to apply any pending migrations.');
    }

  } catch (error) {
    console.error('\n❌ Error checking schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkSchemaMatch();
