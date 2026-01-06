import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testInventoryReport() {
  try {
    // Get a company to test with
    const company = await prisma.company.findFirst({
      select: {
        id: true,
        companyName: true,
      }
    });

    if (!company) {
      console.log('❌ No companies found in database');
      return;
    }

    console.log(`\n📊 Testing inventory report for: ${company.companyName}`);
    console.log(`   Company ID: ${company.id}`);
    console.log('='.repeat(60));

    // Test database structure - Check if we have container items
    const containerItems = await prisma.containerItem.findMany({
      where: {
        container: {
          companyId: company.id
        }
      },
      include: {
        container: {
          include: {
            supplier: true
          }
        }
      },
      take: 3
    });

    console.log(`\n✓ Found ${containerItems.length} sample container items`);

    if (containerItems.length > 0) {
      console.log('\nSample container item:');
      const sample = containerItems[0];
      console.log(`   Item Name: ${sample.itemName}`);
      console.log(`   Supplier: ${sample.container.supplier.suppliername}`);
      console.log(`   Quantity: ${sample.quantity}`);
      console.log(`   Unit Price: $${sample.unitPrice}`);
    }

    // Check sales data
    const sales = await prisma.sale.count({
      where: { companyId: company.id }
    });
    console.log(`\n✓ Found ${sales} sales records`);

    // Test the actual inventory report logic
    const allContainerItems = await prisma.containerItem.findMany({
      where: {
        container: { companyId: company.id },
      },
      include: {
        container: {
          include: {
            supplier: true,
          },
        },
      },
    });

    console.log(`\n✓ Total container items for company: ${allContainerItems.length}`);

    // Build a simple inventory map
    const inventoryMap = new Map<string, {
      itemName: string;
      supplierName: string;
      received: number;
    }>();

    for (const item of allContainerItems) {
      const key = `${item.itemName}-${item.container.supplier.suppliername}`;
      const existing = inventoryMap.get(key);

      if (existing) {
        existing.received += item.quantity;
      } else {
        inventoryMap.set(key, {
          itemName: item.itemName,
          supplierName: item.container.supplier.suppliername,
          received: item.quantity,
        });
      }
    }

    console.log(`\n✓ Unique item-supplier combinations: ${inventoryMap.size}`);

    // Show sample inventory items
    console.log('\nSample inventory items (first 5):');
    console.log('─'.repeat(60));
    let count = 0;
    for (const [key, item] of inventoryMap) {
      if (count >= 5) break;
      console.log(`${count + 1}. ${item.itemName}`);
      console.log(`   Supplier: ${item.supplierName}`);
      console.log(`   Received: ${item.received} units`);
      console.log('');
      count++;
    }

    console.log('\n✅ Database schema is compatible with inventory report!');
    console.log('\nExpected API Response Format:');
    console.log(JSON.stringify({
      itemName: "string",
      supplierName: "string",
      available: "number"
    }, null, 2));

  } catch (error) {
    console.error('\n❌ Error testing inventory report:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testInventoryReport();
