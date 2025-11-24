import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBlanketInventory() {
  console.log('=== Checking BLANKET Inventory from A and J ENT-CANAFRI ===\n');

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
      console.log('❌ Supplier "A and J ENT-CANAFRI" not found');
      return;
    }

    console.log(`✅ Found Supplier: ${supplier.suppliername} (ID: ${supplier.id})\n`);

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

    console.log(`📦 Found ${containers.length} containers with BLANKET items\n`);

    // Calculate total received
    let totalReceived = 0;
    const containerDetails: any[] = [];

    containers.forEach(container => {
      container.items.forEach(item => {
        totalReceived += item.quantity;
        containerDetails.push({
          containerNo: container.containerNo,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        });
      });
    });

    console.log('📥 RECEIVED QUANTITIES:');
    containerDetails.forEach(detail => {
      console.log(`   Container: ${detail.containerNo}`);
      console.log(`   Item: ${detail.itemName}`);
      console.log(`   Quantity: ${detail.quantity}`);
      console.log(`   Unit Price: ${detail.unitPrice}`);
      console.log('   ---');
    });
    console.log(`   TOTAL RECEIVED: ${totalReceived}\n`);

    // Get all sales for BLANKET from this supplier's containers
    const containerIds = containers.map(c => c.id);

    const saleItems = await prisma.saleItem.findMany({
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

    console.log(`📤 SOLD QUANTITIES (${saleItems.length} sales):`);
    let totalSold = 0;
    saleItems.forEach(saleItem => {
      totalSold += saleItem.quantity;
      console.log(`   Sale ID: ${saleItem.saleId}`);
      console.log(`   Customer: ${saleItem.sale.customer?.customerName || 'Unknown'}`);
      console.log(`   Item: ${saleItem.itemName}`);
      console.log(`   Quantity Sold: ${saleItem.quantity}`);
      console.log('   ---');
    });
    console.log(`   TOTAL SOLD: ${totalSold}\n`);

    // Calculate balance
    const balance = totalReceived - totalSold;
    console.log('📊 SUMMARY:');
    console.log(`   Total Received: ${totalReceived}`);
    console.log(`   Total Sold: ${totalSold}`);
    console.log(`   Available Balance: ${balance}`);

    if (balance < 0) {
      console.log(`\n⚠️  ISSUE: Negative balance of ${balance}!`);
      console.log(`   This means ${Math.abs(balance)} more items were sold than received.`);
      console.log('\n💡 POSSIBLE CAUSES:');
      console.log('   1. Sales recorded before container items were added');
      console.log('   2. Container quantity was reduced after sales were made');
      console.log('   3. Sales were incorrectly linked to this supplier');
      console.log('   4. Duplicate sales entries');
      console.log('\n🔧 SOLUTIONS:');
      console.log('   1. Adjust container received quantity to match reality');
      console.log('   2. Review and remove duplicate sales');
      console.log('   3. Correct sales that should be from a different supplier');
      console.log('   4. Add opening stock adjustment if items existed before containers');
    } else {
      console.log(`\n✅ Inventory balance is correct!`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlanketInventory();
