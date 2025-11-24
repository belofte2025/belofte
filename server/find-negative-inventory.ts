import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findNegativeInventory() {
  console.log('🔍 Finding All Items with Negative Inventory\n');
  console.log('═'.repeat(80));

  try {
    const allSuppliers = await prisma.supplier.findMany({
      orderBy: { suppliername: 'asc' }
    });

    let totalNegativeItems = 0;
    const negativeItemsBySupplier: Array<{
      supplier: string;
      items: Array<{
        itemName: string;
        received: number;
        containerSales: number;
        regularSales: number;
        totalSold: number;
        balance: number;
      }>;
    }> = [];

    for (const supplier of allSuppliers) {
      // Get all container items for this supplier
      const containerItems = await prisma.containerItem.findMany({
        where: {
          container: { supplierId: supplier.id }
        },
        include: {
          container: { select: { id: true } }
        }
      });

      // Get unique item names
      const itemNames = [...new Set(containerItems.map(i => i.itemName))];
      const containerIds = [...new Set(containerItems.map(i => i.container.id))];

      // Get supplier items for this supplier
      const supplierItems = await prisma.supplierItem.findMany({
        where: { supplierId: supplier.id },
        select: { id: true }
      });
      const supplierItemIds = supplierItems.map(si => si.id);

      const negativeItems: Array<{
        itemName: string;
        received: number;
        containerSales: number;
        regularSales: number;
        totalSold: number;
        balance: number;
      }> = [];

      for (const itemName of itemNames) {
        // Calculate received
        const received = containerItems
          .filter(i => i.itemName === itemName)
          .reduce((sum, i) => sum + i.quantity, 0);

        // Calculate container sales
        const containerSales = await prisma.saleItem.findMany({
          where: {
            itemName: itemName,
            sale: {
              sourceType: 'container',
              sourceId: { in: containerIds }
            }
          }
        });
        const containerSold = containerSales.reduce((sum, s) => sum + s.quantity, 0);

        // Calculate regular sales
        const regularSales = await prisma.saleItem.findMany({
          where: {
            itemName: itemName,
            sale: {
              sourceType: 'regular',
              sourceId: { in: supplierItemIds }
            }
          }
        });
        const regularSold = regularSales.reduce((sum, s) => sum + s.quantity, 0);

        const totalSold = containerSold + regularSold;
        const balance = received - totalSold;

        if (balance < 0) {
          negativeItems.push({
            itemName,
            received,
            containerSales: containerSold,
            regularSales: regularSold,
            totalSold,
            balance
          });
        }
      }

      if (negativeItems.length > 0) {
        negativeItemsBySupplier.push({
          supplier: supplier.suppliername,
          items: negativeItems.sort((a, b) => a.balance - b.balance) // Sort by most negative first
        });
        totalNegativeItems += negativeItems.length;
      }
    }

    // Display results
    if (negativeItemsBySupplier.length === 0) {
      console.log('\n✅ No items with negative inventory found!');
    } else {
      console.log(`\n⚠️  Found ${totalNegativeItems} items with negative inventory across ${negativeItemsBySupplier.length} suppliers\n`);

      negativeItemsBySupplier.forEach(supplierData => {
        console.log('═'.repeat(80));
        console.log(`📦 ${supplierData.supplier}`);
        console.log('═'.repeat(80));
        console.log(`   ${supplierData.items.length} items with negative stock:\n`);

        supplierData.items.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.itemName}`);
          console.log(`      Received:        ${item.received.toString().padStart(6)}`);
          console.log(`      Container Sales: ${item.containerSales.toString().padStart(6)}`);
          console.log(`      Regular Sales:   ${item.regularSales.toString().padStart(6)}`);
          console.log(`      Total Sold:      ${item.totalSold.toString().padStart(6)}`);
          console.log(`      Balance:         ${item.balance.toString().padStart(6)} ❌`);
          console.log('');
        });
      });

      console.log('═'.repeat(80));
      console.log(`SUMMARY: ${totalNegativeItems} total items with negative inventory`);
      console.log('═'.repeat(80));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findNegativeInventory();
