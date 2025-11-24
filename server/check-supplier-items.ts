import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSupplierItems() {
  console.log('=== Checking Supplier Items for BLANKETS ===\n');

  try {
    const supplierItems = await prisma.supplierItem.findMany({
      where: {
        itemName: {
          contains: 'BLANKET',
          mode: 'insensitive'
        },
        supplier: {
          suppliername: {
            contains: 'A and J ENT-CANAFRI',
            mode: 'insensitive'
          }
        }
      },
      include: {
        supplier: {
          select: {
            suppliername: true
          }
        }
      }
    });

    console.log(`Found ${supplierItems.length} supplier items:\n`);

    supplierItems.forEach(item => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Item: ${item.itemName}`);
      console.log(`Supplier: ${item.supplier.suppliername}`);
      console.log(`Price: ${item.price}`);
      console.log(`ID: ${item.id}`);
      console.log('');
    });

    // Now check the specific sale that used supplier items
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Checking the "regular" sale that shows -5:\n');

    const sale = await prisma.sale.findFirst({
      where: {
        id: '5796fa8e-ec87-47fb-a7ce-92df14c09a3d'
      },
      include: {
        customer: true,
        items: true
      }
    });

    if (sale) {
      console.log(`Sale ID: ${sale.id}`);
      console.log(`Customer: ${sale.customer?.customerName}`);
      console.log(`Sale Type: ${sale.saleType}`);
      console.log(`Source Type: ${sale.sourceType}`);
      console.log(`Source ID: ${sale.sourceId}`);
      console.log('\nSale Items:');
      sale.items.forEach(item => {
        console.log(`  - ${item.itemName}: ${item.quantity} units @ ${item.unitPrice}`);
      });

      // Check if the sourceId matches a supplier item
      if (sale.sourceId) {
        const supplierItem = await prisma.supplierItem.findUnique({
          where: { id: sale.sourceId },
          include: { supplier: true }
        });

        if (supplierItem) {
          console.log('\n✅ Source is a Supplier Item:');
          console.log(`   Item: ${supplierItem.itemName}`);
          console.log(`   Supplier: ${supplierItem.supplier.suppliername}`);
          console.log(`   Price: ${supplierItem.price}`);
        } else {
          console.log('\n❌ Source ID does not match any supplier item');
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSupplierItems();
