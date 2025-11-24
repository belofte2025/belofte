import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testInventoryFix() {
  console.log('🧪 Testing Inventory Calculation Fix\n');
  console.log('═'.repeat(80));

  try {
    // Find the "A and J ENT-CANAFRI" supplier
    const supplier = await prisma.supplier.findFirst({
      where: {
        suppliername: {
          contains: 'A and J ENT-CANAFRI',
          mode: 'insensitive'
        }
      }
    });

    if (!supplier) {
      console.log('❌ Supplier "A and J ENT-CANAFRI" not found');
      return;
    }

    console.log(`✅ Found Supplier: ${supplier.suppliername} (${supplier.id})\n`);

    // Test 1: Check BLANKETS inventory using the actual service
    console.log('TEST 1: Check BLANKETS inventory from service');
    console.log('─'.repeat(80));

    // Get all container items for BLANKETS from this supplier
    const containerItems = await prisma.containerItem.findMany({
      where: {
        container: {
          supplierId: supplier.id
        },
        itemName: {
          contains: 'BLANKET',
          mode: 'insensitive'
        }
      },
      include: {
        container: {
          select: { containerNo: true, id: true }
        }
      }
    });

    const totalReceived = containerItems.reduce((sum, item) => sum + item.quantity, 0);
    const containerIds = [...new Set(containerItems.map(item => item.container.id))];

    console.log(`Received from containers: ${totalReceived}`);
    console.log(`Container IDs: ${containerIds.length} containers\n`);

    // Get container sales
    const containerSales = await prisma.saleItem.findMany({
      where: {
        itemName: {
          contains: 'BLANKET',
          mode: 'insensitive'
        },
        sale: {
          sourceType: 'container',
          sourceId: { in: containerIds }
        }
      },
      select: {
        quantity: true,
        saleId: true
      }
    });

    const containerSoldQty = containerSales.reduce((sum, s) => sum + s.quantity, 0);
    console.log(`Container Sales: ${containerSoldQty} (from ${containerSales.length} sales)`);

    // Get supplier items for this supplier
    const supplierItems = await prisma.supplierItem.findMany({
      where: {
        supplierId: supplier.id,
        itemName: {
          contains: 'BLANKET',
          mode: 'insensitive'
        }
      },
      select: { id: true, itemName: true }
    });

    const supplierItemIds = supplierItems.map(si => si.id);
    console.log(`Supplier Item IDs: ${supplierItemIds.length} items\n`);

    // Get regular sales
    const regularSales = await prisma.saleItem.findMany({
      where: {
        itemName: {
          contains: 'BLANKET',
          mode: 'insensitive'
        },
        sale: {
          sourceType: 'regular',
          sourceId: { in: supplierItemIds }
        }
      },
      select: {
        quantity: true,
        saleId: true
      }
    });

    const regularSoldQty = regularSales.reduce((sum, s) => sum + s.quantity, 0);
    console.log(`Regular Sales: ${regularSoldQty} (from ${regularSales.length} sales)`);

    const totalSold = containerSoldQty + regularSoldQty;
    const balance = totalReceived - totalSold;

    console.log('\n📊 CALCULATION SUMMARY:');
    console.log('─'.repeat(80));
    console.log(`Total Received:     ${totalReceived}`);
    console.log(`Container Sales:    ${containerSoldQty}`);
    console.log(`Regular Sales:      ${regularSoldQty}`);
    console.log(`Total Sold:         ${totalSold}`);
    console.log(`Available Balance:  ${balance} ${balance < 0 ? '❌ NEGATIVE' : '✅ POSITIVE'}`);

    // Test 2: Check all items with negative balances
    console.log('\n\n');
    console.log('TEST 2: Check for ALL negative inventory items');
    console.log('═'.repeat(80));

    const allSuppliers = await prisma.supplier.findMany({
      select: { id: true, suppliername: true }
    });

    let negativeCount = 0;

    for (const sup of allSuppliers) {
      // Get all container items for this supplier
      const items = await prisma.containerItem.findMany({
        where: {
          container: { supplierId: sup.id }
        },
        include: {
          container: { select: { id: true } }
        }
      });

      const itemNames = [...new Set(items.map(i => i.itemName))];
      const supContainerIds = [...new Set(items.map(i => i.container.id))];

      // Get supplier items
      const supItems = await prisma.supplierItem.findMany({
        where: { supplierId: sup.id },
        select: { id: true }
      });
      const supItemIds = supItems.map(si => si.id);

      for (const itemName of itemNames) {
        // Calculate received
        const received = items
          .filter(i => i.itemName === itemName)
          .reduce((sum, i) => sum + i.quantity, 0);

        // Calculate sold from containers
        const contSales = await prisma.saleItem.findMany({
          where: {
            itemName: itemName,
            sale: {
              sourceType: 'container',
              sourceId: { in: supContainerIds }
            }
          }
        });
        const contSold = contSales.reduce((sum, s) => sum + s.quantity, 0);

        // Calculate sold from regular sales
        const regSales = await prisma.saleItem.findMany({
          where: {
            itemName: itemName,
            sale: {
              sourceType: 'regular',
              sourceId: { in: supItemIds }
            }
          }
        });
        const regSold = regSales.reduce((sum, s) => sum + s.quantity, 0);

        const totalSold = contSold + regSold;
        const balance = received - totalSold;

        if (balance < 0) {
          negativeCount++;
          console.log(`❌ ${sup.suppliername} - ${itemName}: ${balance}`);
          console.log(`   Received: ${received}, Container Sales: ${contSold}, Regular Sales: ${regSold}`);
        }
      }
    }

    if (negativeCount === 0) {
      console.log('✅ No negative inventory found!');
    } else {
      console.log(`\n⚠️  Found ${negativeCount} items with negative inventory`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ Test Complete');

  } catch (error) {
    console.error('❌ Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInventoryFix();
