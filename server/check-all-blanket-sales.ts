import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllBlanketSales() {
  console.log('=== Checking ALL BLANKET Sales (Including Non-Container) ===\n');

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

    // Get company IDs that have this supplier
    const containers = await prisma.container.findMany({
      where: { supplierId: supplier.id },
      select: { companyId: true, id: true }
    });

    const companyIds = [...new Set(containers.map(c => c.companyId))];
    const containerIds = containers.map(c => c.id);

    console.log(`✅ Found ${containers.length} containers across ${companyIds.length} companies\n`);

    // Get ALL sales with BLANKET in the name for these companies
    const allBlanketSales = await prisma.saleItem.findMany({
      where: {
        itemName: {
          contains: 'BLANKET',
          mode: 'insensitive'
        },
        sale: {
          companyId: { in: companyIds }
        }
      },
      include: {
        sale: {
          include: {
            customer: {
              select: { customerName: true }
            }
          }
        }
      }
    });

    console.log(`📋 Found ${allBlanketSales.length} total BLANKET sales\n`);

    // Group by sourceType
    const bySourceType = allBlanketSales.reduce((acc: any, sale) => {
      const sourceType = sale.sale.sourceType || 'NO_SOURCE';
      if (!acc[sourceType]) {
        acc[sourceType] = [];
      }
      acc[sourceType].push(sale);
      return acc;
    }, {});

    Object.entries(bySourceType).forEach(([sourceType, sales]: [string, any]) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 Sales with sourceType: "${sourceType}"`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      let totalQty = 0;

      sales.forEach((saleItem: any) => {
        totalQty += saleItem.quantity;
        console.log(`   Sale ID: ${saleItem.saleId}`);
        console.log(`   Item: ${saleItem.itemName}`);
        console.log(`   Customer: ${saleItem.sale.customer?.customerName || 'Unknown'}`);
        console.log(`   Quantity: ${saleItem.quantity}`);
        console.log(`   SourceType: ${saleItem.sale.sourceType || 'NULL'}`);
        console.log(`   SourceId: ${saleItem.sale.sourceId || 'NULL'}`);

        // Check if this sale is linked to THIS supplier's containers
        const isFromThisSupplier = saleItem.sale.sourceId && containerIds.includes(saleItem.sale.sourceId);
        console.log(`   From A&J Containers: ${isFromThisSupplier ? 'YES ✅' : 'NO ❌'}`);
        console.log('   ---');
      });

      console.log(`   TOTAL QUANTITY: ${totalQty}\n`);
    });

    // Now check what inventory system sees
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 Checking what getInventoryBySupplier() would show`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Get all container items
    const allContainerItems = await prisma.containerItem.findMany({
      where: {
        container: {
          supplierId: supplier.id,
        },
        itemName: {
          contains: 'BLANKET',
          mode: 'insensitive'
        }
      },
    });

    // Get sales ONLY from this supplier's containers
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
    });

    // Build summary by item name
    const summaryMap: Record<string, { received: number; sold: number }> = {};

    allContainerItems.forEach((item) => {
      if (!summaryMap[item.itemName]) {
        summaryMap[item.itemName] = { received: 0, sold: 0 };
      }
      summaryMap[item.itemName].received += item.quantity;
    });

    containerSales.forEach((sale) => {
      if (!summaryMap[sale.itemName]) {
        summaryMap[sale.itemName] = { received: 0, sold: 0 };
      }
      summaryMap[sale.itemName].sold += sale.quantity;
    });

    Object.entries(summaryMap).forEach(([itemName, data]) => {
      const available = data.received - data.sold;
      console.log(`   ${itemName}:`);
      console.log(`      Received: ${data.received}`);
      console.log(`      Sold: ${data.sold}`);
      console.log(`      Available: ${available} ${available < 0 ? '❌ NEGATIVE!' : '✅'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllBlanketSales();
