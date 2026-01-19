import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findNegativeInventoryForPakogina() {
  console.log('🔍 Finding Negative Inventory for Pakogina Company\n');
  console.log('═'.repeat(80));

  try {
    // Find Pakogina company
    const company = await prisma.company.findFirst({
      where: {
        companyName: {
          contains: 'pakogina',
          mode: 'insensitive'
        }
      }
    });

    if (!company) {
      console.log('❌ Company "Pakogina" not found');
      return;
    }

    console.log(`✓ Found company: ${company.companyName} (ID: ${company.id})\n`);

    // Get all suppliers for Pakogina
    const suppliers = await prisma.supplier.findMany({
      where: { companyId: company.id },
      orderBy: { suppliername: 'asc' }
    });

    console.log(`Found ${suppliers.length} suppliers for ${company.companyName}\n`);

    let totalNegativeItems = 0;
    const negativeItemsDetails: Array<{
      supplier: string;
      supplierId: string;
      items: Array<{
        itemName: string;
        received: number;
        containerSales: number;
        regularSales: number;
        totalSold: number;
        balance: number;
        containerIds: string[];
        supplierItemIds: string[];
      }>;
    }> = [];

    for (const supplier of suppliers) {
      console.log(`Checking supplier: ${supplier.suppliername}...`);

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
        select: { id: true, itemName: true }
      });
      const supplierItemIds = supplierItems.map(si => si.id);

      const negativeItems: Array<{
        itemName: string;
        received: number;
        containerSales: number;
        regularSales: number;
        totalSold: number;
        balance: number;
        containerIds: string[];
        supplierItemIds: string[];
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
            balance,
            containerIds,
            supplierItemIds
          });
        }
      }

      if (negativeItems.length > 0) {
        negativeItemsDetails.push({
          supplier: supplier.suppliername,
          supplierId: supplier.id,
          items: negativeItems.sort((a, b) => a.balance - b.balance)
        });
        totalNegativeItems += negativeItems.length;
      }
    }

    // Display results
    console.log('\n');
    console.log('═'.repeat(80));
    if (negativeItemsDetails.length === 0) {
      console.log('\n✅ No items with negative inventory found for Pakogina!');
    } else {
      console.log(`\n⚠️  Found ${totalNegativeItems} items with negative inventory\n`);

      negativeItemsDetails.forEach(supplierData => {
        console.log('═'.repeat(80));
        console.log(`📦 ${supplierData.supplier}`);
        console.log(`   Supplier ID: ${supplierData.supplierId}`);
        console.log('═'.repeat(80));
        console.log(`   ${supplierData.items.length} items with negative stock:\n`);

        supplierData.items.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.itemName}`);
          console.log(`      Received:        ${item.received.toString().padStart(6)}`);
          console.log(`      Container Sales: ${item.containerSales.toString().padStart(6)}`);
          console.log(`      Regular Sales:   ${item.regularSales.toString().padStart(6)}`);
          console.log(`      Total Sold:      ${item.totalSold.toString().padStart(6)}`);
          console.log(`      Balance:         ${item.balance.toString().padStart(6)} ❌`);
          console.log(`      Oversold by:     ${Math.abs(item.balance)}`);
          console.log('');
        });
      });

      console.log('═'.repeat(80));
      console.log(`SUMMARY: ${totalNegativeItems} total items with negative inventory for Pakogina`);
      console.log('═'.repeat(80));

      // Save details to a file for the fix script
      const fs = require('fs');
      fs.writeFileSync(
        'negative-inventory-pakogina.json',
        JSON.stringify(negativeItemsDetails, null, 2)
      );
      console.log('\n📄 Details saved to: negative-inventory-pakogina.json');
      console.log('💡 Run: npx ts-node fix-negative-pakogina.ts to fix these issues\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findNegativeInventoryForPakogina();
