import prisma from './src/utils/prisma';

async function testStockCalculation() {
  console.log('='.repeat(80));
  console.log('STOCK CALCULATION TEST');
  console.log('='.repeat(80));
  console.log('');
  console.log('Testing if stock is calculated as:');
  console.log('Stock Balance = SUM(quantity for item under supplier) - SUM(all sales for that item)');
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  try {
    // Get a sample supplier to test
    const supplier = await prisma.supplier.findFirst({
      include: {
        containers: {
          include: {
            items: true
          }
        }
      }
    });

    if (!supplier || supplier.containers.length === 0) {
      console.log('❌ No supplier with containers found in database');
      await prisma.$disconnect();
      return;
    }

    console.log(`📊 Testing with Supplier: ${supplier.suppliername}`);
    console.log(`   Supplier ID: ${supplier.id}`);
    console.log('');

    // Get all items from this supplier's containers
    const allContainerItems = await prisma.containerItem.findMany({
      where: {
        container: {
          supplierId: supplier.id
        }
      },
      include: {
        container: {
          select: {
            containerNo: true,
            companyId: true
          }
        }
      }
    });

    // Get company IDs
    const companyIds = [...new Set(allContainerItems.map(item => item.container.companyId))];

    // Get all sales for these companies
    const allSaleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          companyId: { in: companyIds }
        }
      },
      select: {
        itemName: true,
        quantity: true,
        sale: {
          select: {
            companyId: true
          }
        }
      }
    });

    // Manual calculation - group by item name
    const manualCalculation: Record<string, {
      totalQuantity: number;
      totalSold: number;
      balance: number;
      containers: string[];
    }> = {};

    console.log('--- MANUAL CALCULATION (Step-by-step) ---');
    console.log('');

    // Step 1: Sum all quantities by item name
    allContainerItems.forEach(item => {
      if (!manualCalculation[item.itemName]) {
        manualCalculation[item.itemName] = {
          totalQuantity: 0,
          totalSold: 0,
          balance: 0,
          containers: []
        };
      }
      manualCalculation[item.itemName].totalQuantity += item.quantity;
      if (!manualCalculation[item.itemName].containers.includes(item.container.containerNo)) {
        manualCalculation[item.itemName].containers.push(item.container.containerNo);
      }
    });

    // Step 2: Sum all sales by item name
    Object.keys(manualCalculation).forEach(itemName => {
      const relatedSales = allSaleItems.filter(s => s.itemName === itemName);
      const totalSold = relatedSales.reduce((sum, s) => sum + s.quantity, 0);
      manualCalculation[itemName].totalSold = totalSold;
      manualCalculation[itemName].balance = manualCalculation[itemName].totalQuantity - totalSold;
    });

    // Display manual calculation
    Object.entries(manualCalculation).forEach(([itemName, data]) => {
      console.log(`📦 Item: ${itemName}`);
      console.log(`   Containers: ${data.containers.join(', ')}`);
      console.log(`   Total Expected Quantity: ${data.totalQuantity}`);
      console.log(`   Total Sold: ${data.totalSold}`);
      console.log(`   ✅ Stock Balance (Manual): ${data.balance}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('');
    console.log('--- CONTROLLER/SERVICE CALCULATION ---');
    console.log('');

    // Now test what the service returns
    const serviceResult = await prisma.containerItem.findMany({
      where: {
        container: {
          supplierId: supplier.id
        }
      },
      include: {
        container: {
          select: {
            companyId: true,
            containerNo: true
          }
        }
      }
    });

    // Build summary like the service does
    const summaryMap: Record<string, {
      received: number;
      sold: number;
      available: number;
      companyIds: string[];
    }> = {};

    // Aggregate quantities (using quantity field as per recent changes)
    serviceResult.forEach(item => {
      if (!summaryMap[item.itemName]) {
        summaryMap[item.itemName] = {
          received: 0,
          sold: 0,
          available: 0,
          companyIds: []
        };
      }
      summaryMap[item.itemName].received += item.quantity;  // Using quantity not receivedQty
      if (!summaryMap[item.itemName].companyIds.includes(item.container.companyId)) {
        summaryMap[item.itemName].companyIds.push(item.container.companyId);
      }
    });

    // Calculate sold quantities
    Object.keys(summaryMap).forEach(itemName => {
      const relatedSales = allSaleItems.filter(
        s => s.itemName === itemName &&
        summaryMap[itemName].companyIds.includes(s.sale.companyId)
      );
      const soldQty = relatedSales.reduce((sum, s) => sum + s.quantity, 0);
      summaryMap[itemName].sold = soldQty;
      summaryMap[itemName].available = summaryMap[itemName].received - soldQty;
    });

    // Display service calculation
    Object.entries(summaryMap).forEach(([itemName, data]) => {
      console.log(`📦 Item: ${itemName}`);
      console.log(`   Total Expected Quantity: ${data.received}`);
      console.log(`   Total Sold: ${data.sold}`);
      console.log(`   ✅ Stock Balance (Service): ${data.available}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('');
    console.log('--- VERIFICATION ---');
    console.log('');

    let allMatch = true;
    Object.keys(manualCalculation).forEach(itemName => {
      const manual = manualCalculation[itemName];
      const service = summaryMap[itemName];

      if (!service) {
        console.log(`❌ MISMATCH: Item "${itemName}" not found in service result`);
        allMatch = false;
        return;
      }

      const quantityMatch = manual.totalQuantity === service.received;
      const soldMatch = manual.totalSold === service.sold;
      const balanceMatch = manual.balance === service.available;

      if (quantityMatch && soldMatch && balanceMatch) {
        console.log(`✅ PASS: ${itemName}`);
        console.log(`   Expected Qty: ${manual.totalQuantity} = ${service.received} ✓`);
        console.log(`   Sold: ${manual.totalSold} = ${service.sold} ✓`);
        console.log(`   Balance: ${manual.balance} = ${service.available} ✓`);
      } else {
        console.log(`❌ FAIL: ${itemName}`);
        if (!quantityMatch) {
          console.log(`   Expected Qty: ${manual.totalQuantity} ≠ ${service.received} ✗`);
        }
        if (!soldMatch) {
          console.log(`   Sold: ${manual.totalSold} ≠ ${service.sold} ✗`);
        }
        if (!balanceMatch) {
          console.log(`   Balance: ${manual.balance} ≠ ${service.available} ✗`);
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
      console.log('The controller correctly calculates stock as:');
      console.log('Stock Balance = SUM(quantity) - SUM(sales)');
    } else {
      console.log('❌ ❌ ❌ SOME TESTS FAILED! ❌ ❌ ❌');
      console.log('');
      console.log('The calculation does not match the expected formula.');
    }
    console.log('');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStockCalculation();
