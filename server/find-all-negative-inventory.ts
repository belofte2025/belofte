import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAllNegativeInventory() {
  console.log('=== Finding ALL Items with Negative Inventory ===\n');

  try {
    // Get the company ID (assuming there's at least one company)
    const companies = await prisma.company.findMany();

    for (const company of companies) {
      console.log(`\n${'═'.repeat(80)}`);
      console.log(`🏢 COMPANY: ${company.companyName}`);
      console.log(`${'═'.repeat(80)}\n`);

      // Get all suppliers for this company
      const suppliers = await prisma.supplier.findMany({
        where: { companyId: company.id }
      });

      for (const supplier of suppliers) {
        console.log(`\n${'─'.repeat(80)}`);
        console.log(`📦 Supplier: ${supplier.suppliername}`);
        console.log(`${'─'.repeat(80)}\n`);

        // Get all container items for this supplier
        const containers = await prisma.container.findMany({
          where: { supplierId: supplier.id },
          include: { items: true }
        });

        const containerIds = containers.map(c => c.id);
        const allContainerItems = containers.flatMap(c => c.items);

        // Get all unique item names
        const itemNames = [...new Set(allContainerItems.map(item => item.itemName))];

        // Get ALL sales for this company (both container and regular)
        const allSales = await prisma.saleItem.findMany({
          where: {
            itemName: { in: itemNames },
            sale: {
              companyId: company.id
            }
          },
          include: {
            sale: {
              select: {
                sourceType: true,
                sourceId: true
              }
            }
          }
        });

        // Check each item
        const negativeItems: any[] = [];

        for (const itemName of itemNames) {
          // Calculate received from containers
          const receivedItems = allContainerItems.filter(item => item.itemName === itemName);
          const totalReceived = receivedItems.reduce((sum, item) => sum + item.quantity, 0);

          // Calculate sold from THIS supplier's containers only
          const containerSales = allSales.filter(
            sale => sale.itemName === itemName &&
                   sale.sale.sourceType === 'container' &&
                   containerIds.includes(sale.sale.sourceId)
          );
          const containerSold = containerSales.reduce((sum, sale) => sum + sale.quantity, 0);

          // Calculate sold from regular sales (all regular sales for this item)
          const regularSales = allSales.filter(
            sale => sale.itemName === itemName &&
                   sale.sale.sourceType === 'regular'
          );
          const regularSold = regularSales.reduce((sum, sale) => sum + sale.quantity, 0);

          const containerBalance = totalReceived - containerSold;
          const totalSold = containerSold + regularSold;
          const totalBalance = totalReceived - totalSold;

          // If we have regular sales or negative balance, report it
          if (regularSold > 0 || totalBalance < 0) {
            negativeItems.push({
              itemName,
              received: totalReceived,
              containerSold,
              regularSold,
              totalSold,
              containerBalance,
              totalBalance,
              hasRegularSales: regularSold > 0,
              isNegative: totalBalance < 0
            });
          }
        }

        if (negativeItems.length > 0) {
          console.log('Items with Regular Sales or Negative Balance:\n');

          negativeItems.forEach(item => {
            if (item.isNegative) {
              console.log(`⚠️  ${item.itemName}`);
            } else {
              console.log(`ℹ️  ${item.itemName}`);
            }
            console.log(`   Received (Containers): ${item.received}`);
            console.log(`   Sold (Container Sales): ${item.containerSold}`);
            console.log(`   Sold (Regular Sales): ${item.regularSold} ${item.regularSold > 0 ? '⚠️' : ''}`);
            console.log(`   Total Sold: ${item.totalSold}`);
            console.log(`   Container Balance: ${item.containerBalance}`);
            console.log(`   TOTAL BALANCE: ${item.totalBalance} ${item.totalBalance < 0 ? '❌ NEGATIVE!' : ''}`);
            console.log('');
          });
        } else {
          console.log('   ✅ No issues found for this supplier\n');
        }
      }
    }

    // Summary: Find items that exist in multiple suppliers
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🔍 ITEMS EXISTING IN MULTIPLE SUPPLIERS`);
    console.log(`${'═'.repeat(80)}\n`);

    const allItems = await prisma.containerItem.findMany({
      include: {
        container: {
          include: {
            supplier: {
              select: {
                suppliername: true
              }
            }
          }
        }
      }
    });

    const itemSupplierMap: Record<string, Set<string>> = {};

    allItems.forEach(item => {
      if (!itemSupplierMap[item.itemName]) {
        itemSupplierMap[item.itemName] = new Set();
      }
      itemSupplierMap[item.itemName].add(item.container.supplier.suppliername);
    });

    const duplicateItems = Object.entries(itemSupplierMap)
      .filter(([_, suppliers]) => suppliers.size > 1)
      .sort((a, b) => b[1].size - a[1].size);

    if (duplicateItems.length > 0) {
      console.log(`Found ${duplicateItems.length} items in multiple suppliers:\n`);

      duplicateItems.forEach(([itemName, suppliers]) => {
        console.log(`📦 ${itemName}`);
        console.log(`   Suppliers: ${Array.from(suppliers).join(', ')}`);
        console.log('');
      });
    } else {
      console.log('✅ No items found in multiple suppliers\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAllNegativeInventory();
