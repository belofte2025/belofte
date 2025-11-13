import prisma from './src/utils/prisma';

async function testSupplierFiltering() {
  console.log('='.repeat(80));
  console.log('TESTING SUPPLIER-SPECIFIC INVENTORY CALCULATIONS');
  console.log('='.repeat(80));
  console.log('');

  // Find an item that exists across multiple suppliers
  const itemName = 'HHR'; // We know this exists in 4 suppliers

  console.log(`Testing with item: "${itemName}"`);
  console.log('');

  // Get all containers with this item
  const containerItems = await prisma.containerItem.findMany({
    where: {
      itemName: itemName
    },
    include: {
      container: {
        include: {
          supplier: true
        }
      }
    }
  });

  if (containerItems.length === 0) {
    console.log('❌ No items found with this name');
    await prisma.$disconnect();
    return;
  }

  // Group by supplier
  const supplierMap: Record<string, {
    supplierName: string;
    totalQuantity: number;
    containers: string[];
  }> = {};

  containerItems.forEach(item => {
    const supplierId = item.container.supplierId;
    if (!supplierMap[supplierId]) {
      supplierMap[supplierId] = {
        supplierName: item.container.supplier.suppliername,
        totalQuantity: 0,
        containers: []
      };
    }
    supplierMap[supplierId].totalQuantity += item.quantity;
    if (!supplierMap[supplierId].containers.includes(item.containerId)) {
      supplierMap[supplierId].containers.push(item.containerId);
    }
  });

  console.log('EXPECTED QUANTITIES BY SUPPLIER:');
  console.log('');
  Object.entries(supplierMap).forEach(([supplierId, data]) => {
    console.log(`📦 ${data.supplierName}`);
    console.log(`   Supplier ID: ${supplierId}`);
    console.log(`   Total Quantity: ${data.totalQuantity}`);
    console.log(`   Container IDs: ${data.containers.join(', ')}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('');
  console.log('SALES BREAKDOWN BY SUPPLIER:');
  console.log('');

  // Get all sales for this item
  const sales = await prisma.saleItem.findMany({
    where: {
      itemName: itemName
    },
    include: {
      sale: {
        select: {
          sourceType: true,
          sourceId: true,
          companyId: true
        }
      }
    }
  });

  console.log(`Total sales records for "${itemName}": ${sales.length}`);
  console.log('');

  // Map sales to suppliers
  const salesBySupplier: Record<string, number> = {};

  for (const sale of sales) {
    if (sale.sale.sourceType === 'container') {
      // Find which supplier this container belongs to
      const container = await prisma.container.findUnique({
        where: { id: sale.sale.sourceId },
        select: { supplierId: true }
      });

      if (container) {
        if (!salesBySupplier[container.supplierId]) {
          salesBySupplier[container.supplierId] = 0;
        }
        salesBySupplier[container.supplierId] += sale.quantity;
      }
    }
  }

  Object.entries(supplierMap).forEach(([supplierId, data]) => {
    const sold = salesBySupplier[supplierId] || 0;
    console.log(`📦 ${data.supplierName}`);
    console.log(`   Total Quantity: ${data.totalQuantity}`);
    console.log(`   Total Sold: ${sold}`);
    console.log(`   Expected Balance: ${data.totalQuantity - sold}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('');
  console.log('TESTING getInventoryReport() FUNCTION:');
  console.log('');

  // Get a company ID
  const firstContainer = containerItems[0];
  const companyId = firstContainer.container.companyId;

  // Import and test the service
  const { getInventoryReport } = await import('./src/services/inventory.service');
  const report = await getInventoryReport(companyId);

  // Filter report for our test item
  const testItemReports = report.filter(r => r.itemName === itemName);

  console.log(`Report entries for "${itemName}":`);
  console.log('');

  let allMatch = true;

  testItemReports.forEach(reportItem => {
    // Find the corresponding supplier data
    const supplierEntry = Object.entries(supplierMap).find(
      ([_, data]) => data.supplierName === reportItem.supplierName
    );

    if (!supplierEntry) {
      console.log(`⚠️  Report shows supplier "${reportItem.supplierName}" but not found in expected data`);
      return;
    }

    const [supplierId, expectedData] = supplierEntry;
    const expectedSold = salesBySupplier[supplierId] || 0;
    const expectedBalance = expectedData.totalQuantity - expectedSold;

    const quantityMatch = reportItem.received === expectedData.totalQuantity;
    const soldMatch = reportItem.sold === expectedSold;
    const balanceMatch = reportItem.available === expectedBalance;

    if (quantityMatch && soldMatch && balanceMatch) {
      console.log(`✅ PASS: ${reportItem.supplierName}`);
      console.log(`   Quantity: ${reportItem.received} = ${expectedData.totalQuantity} ✓`);
      console.log(`   Sold: ${reportItem.sold} = ${expectedSold} ✓`);
      console.log(`   Balance: ${reportItem.available} = ${expectedBalance} ✓`);
    } else {
      console.log(`❌ FAIL: ${reportItem.supplierName}`);
      if (!quantityMatch) {
        console.log(`   Quantity: ${reportItem.received} ≠ ${expectedData.totalQuantity} ✗`);
      }
      if (!soldMatch) {
        console.log(`   Sold: ${reportItem.sold} ≠ ${expectedSold} ✗`);
      }
      if (!balanceMatch) {
        console.log(`   Balance: ${reportItem.available} ≠ ${expectedBalance} ✗`);
      }
      allMatch = false;
    }
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('');

  if (allMatch) {
    console.log('✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅');
    console.log('');
    console.log('Sales are now correctly filtered by supplier!');
    console.log('Each supplier\'s stock balance only includes sales from their own containers.');
  } else {
    console.log('❌ ❌ ❌ SOME TESTS FAILED! ❌ ❌ ❌');
  }

  console.log('');
  console.log('='.repeat(80));

  await prisma.$disconnect();
}

testSupplierFiltering().catch(console.error);
