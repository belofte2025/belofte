import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNegativeInventory() {
  console.log('🔧 Fixing Negative Inventory via Quantity Adjustments\n');
  console.log('═'.repeat(80));

  try {
    // Step 1: Find all negative inventory items
    console.log('\nStep 1: Identifying items with negative inventory...\n');

    const allSuppliers = await prisma.supplier.findMany({
      orderBy: { suppliername: 'asc' }
    });

    const itemsToFix: Array<{
      supplierId: string;
      supplierName: string;
      itemName: string;
      currentBalance: number;
      adjustmentNeeded: number;
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
          itemsToFix.push({
            supplierId: supplier.id,
            supplierName: supplier.suppliername,
            itemName,
            currentBalance: balance,
            adjustmentNeeded: Math.abs(balance) // Positive number to add
          });
        }
      }
    }

    if (itemsToFix.length === 0) {
      console.log('✅ No negative inventory items found! All good.');
      return;
    }

    console.log(`Found ${itemsToFix.length} items with negative inventory:\n`);
    itemsToFix.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.supplierName} - ${item.itemName}`);
      console.log(`   Current Balance: ${item.currentBalance}`);
      console.log(`   Adjustment Needed: +${item.adjustmentNeeded}\n`);
    });

    // Step 2: Apply adjustments
    console.log('═'.repeat(80));
    console.log('\nStep 2: Applying quantity adjustments...\n');

    const results = {
      success: 0,
      failed: 0,
      skipped: 0
    };

    for (const item of itemsToFix) {
      try {
        console.log(`Processing: ${item.supplierName} - ${item.itemName}`);

        // Find the most recent container items for this supplier/item
        const containerItems = await prisma.containerItem.findMany({
          where: {
            itemName: item.itemName,
            container: {
              supplierId: item.supplierId
            }
          },
          include: {
            container: true
          },
          orderBy: {
            container: {
              arrivalDate: 'desc'
            }
          }
        });

        if (containerItems.length === 0) {
          console.log(`  ⚠️  SKIPPED: No container items found\n`);
          results.skipped++;
          continue;
        }

        // Apply adjustment to the most recent container item
        const latestItem = containerItems[0];
        const oldQuantity = latestItem.quantity;
        const newQuantity = oldQuantity + item.adjustmentNeeded;

        await prisma.containerItem.update({
          where: { id: latestItem.id },
          data: { quantity: newQuantity }
        });

        console.log(`  ✅ SUCCESS: Adjusted from ${oldQuantity} to ${newQuantity} (+${item.adjustmentNeeded})`);
        console.log(`     Container: ${latestItem.container.containerNo}\n`);
        results.success++;

      } catch (error) {
        console.error(`  ❌ FAILED: ${error}\n`);
        results.failed++;
      }
    }

    // Step 3: Summary
    console.log('═'.repeat(80));
    console.log('\nSUMMARY');
    console.log('═'.repeat(80));
    console.log(`Total Items Processed: ${itemsToFix.length}`);
    console.log(`✅ Successfully Adjusted: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Skipped: ${results.skipped}`);
    console.log('');

    if (results.success > 0) {
      console.log('🎉 Negative inventory items have been adjusted to zero!');
      console.log('   Run the find-negative-inventory script to verify.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNegativeInventory();
