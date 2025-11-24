import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBlanketDetailed() {
  console.log('=== Detailed BLANKET Inventory Check - A and J ENT-CANAFRI ===\n');

  try {
    // Find the supplier
    const supplier = await prisma.supplier.findFirst({
      where: {
        suppliername: {
          contains: 'A and J ENT-CANAFRI',
          mode: 'insensitive'
        }
      }
    });

    if (!supplier) {
      console.log('❌ Supplier not found');
      return;
    }

    console.log(`✅ Supplier: ${supplier.suppliername}\n`);

    // Get all containers from this supplier
    const containers = await prisma.container.findMany({
      where: { supplierId: supplier.id },
      include: {
        items: {
          where: {
            itemName: {
              contains: 'BLANKET',
              mode: 'insensitive'
            }
          }
        }
      }
    });

    const containerIds = containers.map(c => c.id);

    // Get all unique item names
    const allItems = containers.flatMap(c => c.items);
    const uniqueItemNames = [...new Set(allItems.map(item => item.itemName))];

    console.log(`📋 Found ${uniqueItemNames.length} unique BLANKET item variations:\n`);

    // Check each item variation separately
    for (const itemName of uniqueItemNames) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 ITEM: "${itemName}"`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      // Get received quantity for this specific item name
      const receivedItems = allItems.filter(item => item.itemName === itemName);
      const totalReceived = receivedItems.reduce((sum, item) => sum + item.quantity, 0);

      console.log('\n📥 RECEIVED:');
      receivedItems.forEach(item => {
        const container = containers.find(c => c.id === item.containerId);
        console.log(`   Container: ${container?.containerNo}`);
        console.log(`   Quantity: ${item.quantity}`);
      });
      console.log(`   ➜ Total Received: ${totalReceived}`);

      // Get sales for this specific item name
      const saleItems = await prisma.saleItem.findMany({
        where: {
          itemName: itemName, // Exact match
          sale: {
            sourceType: 'container',
            sourceId: { in: containerIds }
          }
        },
        include: {
          sale: {
            include: {
              customer: {
                select: {
                  customerName: true
                }
              }
            }
          }
        }
      });

      const totalSold = saleItems.reduce((sum, item) => sum + item.quantity, 0);

      console.log('\n📤 SOLD:');
      if (saleItems.length === 0) {
        console.log('   (No sales for this item)');
      } else {
        saleItems.forEach(saleItem => {
          console.log(`   Customer: ${saleItem.sale.customer?.customerName || 'Unknown'}`);
          console.log(`   Quantity: ${saleItem.quantity}`);
          console.log(`   ---`);
        });
      }
      console.log(`   ➜ Total Sold: ${totalSold}`);

      // Calculate balance
      const balance = totalReceived - totalSold;

      console.log('\n📊 BALANCE:');
      console.log(`   Received: ${totalReceived}`);
      console.log(`   Sold: ${totalSold}`);
      console.log(`   Available: ${balance}`);

      if (balance < 0) {
        console.log(`   ⚠️  NEGATIVE BALANCE: ${balance}`);
        console.log(`   ❌ OVERSOLD by ${Math.abs(balance)} units!`);
      } else if (balance === 0) {
        console.log(`   ✅ Fully sold out`);
      } else {
        console.log(`   ✅ ${balance} units available`);
      }

      console.log('\n');
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlanketDetailed();
