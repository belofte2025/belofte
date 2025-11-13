import prisma from './src/utils/prisma';

async function checkItemNameCollisions() {
  console.log('='.repeat(80));
  console.log('CHECKING FOR ITEM NAME COLLISIONS ACROSS SUPPLIERS');
  console.log('='.repeat(80));
  console.log('');

  // Get all container items with supplier info
  const allItems = await prisma.containerItem.findMany({
    include: {
      container: {
        include: {
          supplier: {
            select: {
              id: true,
              suppliername: true
            }
          }
        }
      }
    }
  });

  // Group by item name to find collisions
  const itemMap: Record<string, Array<{
    supplierId: string;
    supplierName: string;
    containerId: string;
    containerNo: string;
  }>> = {};

  allItems.forEach(item => {
    if (!itemMap[item.itemName]) {
      itemMap[item.itemName] = [];
    }

    const existingSupplier = itemMap[item.itemName].find(
      s => s.supplierId === item.container.supplier.id
    );

    if (!existingSupplier) {
      itemMap[item.itemName].push({
        supplierId: item.container.supplier.id,
        supplierName: item.container.supplier.suppliername,
        containerId: item.container.id,
        containerNo: item.container.containerNo
      });
    }
  });

  // Find items with multiple suppliers
  const collisions = Object.entries(itemMap).filter(([_, suppliers]) => suppliers.length > 1);

  if (collisions.length === 0) {
    console.log('✅ No collisions found!');
    console.log('All item names are unique to their suppliers.');
  } else {
    console.log(`⚠️  Found ${collisions.length} items with same name from different suppliers:`);
    console.log('');

    collisions.forEach(([itemName, suppliers]) => {
      console.log(`📦 Item: "${itemName}"`);
      console.log(`   Found in ${suppliers.length} different suppliers:`);
      suppliers.forEach(s => {
        console.log(`   - Supplier: ${s.supplierName} (ID: ${s.supplierId})`);
        console.log(`     Container: ${s.containerNo}`);
      });
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('');
    console.log('⚠️  ISSUE: Items are currently identified only by itemName');
    console.log('');
    console.log('Current system behavior:');
    console.log('- ContainerItem has: id (unique UUID), itemName (string)');
    console.log('- SaleItem has: id (unique UUID), itemName (string)');
    console.log('- NO link between ContainerItem.id and SaleItem');
    console.log('');
    console.log('Problem:');
    console.log('If "MENS T-SHIRTS" exists from Supplier A and Supplier B,');
    console.log('when you sell "MENS T-SHIRTS", the system deducts from BOTH suppliers!');
    console.log('');
    console.log('Current calculation:');
    console.log('Stock = SUM(quantity for itemName) - SUM(all sales for itemName)');
    console.log('       (across ALL suppliers)');
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('');
  console.log('CURRENT DATA MODEL ANALYSIS:');
  console.log('');
  console.log('ContainerItem:');
  console.log('  - id: UUID (unique per container item)');
  console.log('  - containerId: links to Container');
  console.log('  - itemName: String (NOT unique)');
  console.log('  - Container → Supplier (tracks which supplier)');
  console.log('');
  console.log('SaleItem:');
  console.log('  - id: UUID');
  console.log('  - itemName: String (NOT unique)');
  console.log('  - NO supplierId field');
  console.log('  - NO containerItemId field');
  console.log('');
  console.log('Sale:');
  console.log('  - sourceType: String (e.g., "container", "supplier")');
  console.log('  - sourceId: String (contains container ID or supplier ID)');
  console.log('');
  console.log('='.repeat(80));
  console.log('');
  console.log('HOW THE SYSTEM CURRENTLY WORKS:');
  console.log('');
  console.log('1. Inventory by Supplier (getInventoryBySupplier):');
  console.log('   - Groups items by itemName across ALL containers from that supplier');
  console.log('   - Sums quantity for each itemName');
  console.log('   - Deducts ALL sales with that itemName (regardless of actual source)');
  console.log('');
  console.log('2. Inventory Report (getInventoryReport):');
  console.log('   - Groups items by itemName + supplierName combination');
  console.log('   - This provides supplier-level granularity!');
  console.log('   - Key format: "itemName-supplierName"');
  console.log('   - But sales are still matched by itemName only');
  console.log('');
  console.log('3. Current Sales Tracking:');
  console.log('   - Sale.sourceType tells you if it came from "container" or "supplier"');
  console.log('   - Sale.sourceId tells you WHICH container or supplier');
  console.log('   - But this info is NOT used in inventory calculations!');
  console.log('');
  console.log('='.repeat(80));
  console.log('');
  console.log('CONCLUSION:');
  console.log('');

  if (collisions.length === 0) {
    console.log('✅ Currently NO issues because item names are unique across suppliers.');
    console.log('');
    console.log('However, the system DOES track supplier info in getInventoryReport:');
    console.log('- It groups by "itemName-supplierName"');
    console.log('- This means if you had collisions, inventory would be separated');
    console.log('- But ALL sales for that itemName would deduct from EACH supplier');
    console.log('');
    console.log('The unique identifier is: itemName + supplierName (composite key)');
  } else {
    console.log('⚠️  POTENTIAL ISSUE:');
    console.log(`${collisions.length} items have the same name across different suppliers.`);
    console.log('');
    console.log('When calculating inventory, the system:');
    console.log('- getInventoryReport: Separates by supplier correctly');
    console.log('- But deducts ALL sales with that itemName from EACH supplier');
    console.log('');
    console.log('This could lead to incorrect stock balances unless:');
    console.log('- Sales are always tracked with sourceId (container/supplier)');
    console.log('- Inventory calculations filter sales by sourceId');
  }

  await prisma.$disconnect();
}

checkItemNameCollisions().catch(console.error);
