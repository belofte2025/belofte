import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ORPHANED SALES CLEANUP STRATEGY
 *
 * An "orphaned sale" is a sale where:
 * - sourceType = "regular"
 * - sourceId points to a non-existent supplierItem (or is null)
 *
 * This script provides multiple cleanup approaches:
 * 1. IDENTIFY - Find all orphaned sales
 * 2. ANALYZE - Determine best fix for each
 * 3. FIX - Apply the appropriate solution
 */

interface OrphanedSale {
  saleId: string;
  sourceId: string | null;
  items: Array<{ itemName: string; quantity: number }>;
  customer: string;
  saleDate: Date;
  issue: string;
  suggestedFix: string;
  supplier?: string;
}

async function identifyOrphanedSales() {
  console.log('═'.repeat(80));
  console.log('STEP 1: IDENTIFYING ORPHANED SALES');
  console.log('═'.repeat(80));
  console.log();

  // Get all regular sales
  const regularSales = await prisma.sale.findMany({
    where: {
      sourceType: 'regular'
    },
    include: {
      items: {
        select: {
          itemName: true,
          quantity: true
        }
      },
      customer: {
        select: {
          customerName: true
        }
      }
    }
  });

  console.log(`Found ${regularSales.length} regular sales\n`);

  const orphanedSales: OrphanedSale[] = [];

  for (const sale of regularSales) {
    let isOrphaned = false;
    let issue = '';
    let suggestedFix = '';
    let supplier = undefined;

    // Check if sourceId is null
    if (!sale.sourceId) {
      isOrphaned = true;
      issue = 'sourceId is NULL';
      suggestedFix = 'FIND_OR_CREATE_SUPPLIER_ITEM';
    } else {
      // Check if sourceId points to existing supplierItem
      const supplierItem = await prisma.supplierItem.findUnique({
        where: { id: sale.sourceId },
        include: {
          supplier: {
            select: {
              suppliername: true
            }
          }
        }
      });

      if (!supplierItem) {
        isOrphaned = true;
        issue = `sourceId points to non-existent supplierItem: ${sale.sourceId}`;
        suggestedFix = 'FIND_OR_CREATE_SUPPLIER_ITEM';
      } else {
        // Valid supplierItem exists
        supplier = supplierItem.supplier.suppliername;
      }
    }

    if (isOrphaned) {
      orphanedSales.push({
        saleId: sale.id,
        sourceId: sale.sourceId,
        items: sale.items,
        customer: sale.customer?.customerName || 'Unknown',
        saleDate: sale.createdAt,
        issue,
        suggestedFix,
        supplier
      });
    }
  }

  console.log(`Found ${orphanedSales.length} ORPHANED sales\n`);

  if (orphanedSales.length > 0) {
    console.log('Sample of orphaned sales:');
    orphanedSales.slice(0, 5).forEach((sale, idx) => {
      console.log(`\n${idx + 1}. Sale ID: ${sale.saleId}`);
      console.log(`   Customer: ${sale.customer}`);
      console.log(`   Items: ${sale.items.map(i => `${i.itemName} (${i.quantity})`).join(', ')}`);
      console.log(`   Issue: ${sale.issue}`);
      console.log(`   Suggested Fix: ${sale.suggestedFix}`);
    });
  }

  return orphanedSales;
}

async function analyzeFixOptions(orphanedSales: OrphanedSale[]) {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('STEP 2: ANALYZING FIX OPTIONS');
  console.log('═'.repeat(80));
  console.log();

  const fixStrategies = [];

  for (const sale of orphanedSales) {
    // Get the first item from the sale to determine supplier
    const firstItem = sale.items[0];
    if (!firstItem) continue;

    // Strategy 1: Find existing supplierItem with matching itemName
    const matchingSupplierItems = await prisma.supplierItem.findMany({
      where: {
        itemName: {
          equals: firstItem.itemName,
          mode: 'insensitive'
        }
      },
      include: {
        supplier: {
          select: {
            id: true,
            suppliername: true
          }
        }
      }
    });

    if (matchingSupplierItems.length === 1) {
      // Perfect match - one supplier has this item
      fixStrategies.push({
        saleId: sale.saleId,
        strategy: 'LINK_TO_EXISTING_SUPPLIER_ITEM',
        supplierItemId: matchingSupplierItems[0].id,
        supplier: matchingSupplierItems[0].supplier.suppliername,
        confidence: 'HIGH'
      });
    } else if (matchingSupplierItems.length > 1) {
      // Multiple suppliers have this item - need to determine which one
      // Check if any of these suppliers have containers with this item
      const suppliersWithContainers = await prisma.container.findMany({
        where: {
          supplierId: { in: matchingSupplierItems.map(si => si.supplier.id) },
          items: {
            some: {
              itemName: {
                equals: firstItem.itemName,
                mode: 'insensitive'
              }
            }
          }
        },
        include: {
          supplier: true,
          items: {
            where: {
              itemName: {
                equals: firstItem.itemName,
                mode: 'insensitive'
              }
            }
          }
        }
      });

      if (suppliersWithContainers.length === 1) {
        // One supplier has this item in containers - likely the right one
        const supplierItem = matchingSupplierItems.find(
          si => si.supplier.id === suppliersWithContainers[0].supplierId
        );

        fixStrategies.push({
          saleId: sale.saleId,
          strategy: 'LINK_TO_SUPPLIER_WITH_CONTAINERS',
          supplierItemId: supplierItem?.id,
          supplier: suppliersWithContainers[0].supplier.suppliername,
          confidence: 'MEDIUM'
        });
      } else {
        // Multiple suppliers or no containers - need manual review
        fixStrategies.push({
          saleId: sale.saleId,
          strategy: 'MANUAL_REVIEW_REQUIRED',
          options: matchingSupplierItems.map(si => ({
            supplierItemId: si.id,
            supplier: si.supplier.suppliername
          })),
          confidence: 'LOW'
        });
      }
    } else {
      // No matching supplierItem exists - need to create one
      // Try to find supplier from containers
      const containersWithItem = await prisma.container.findMany({
        where: {
          items: {
            some: {
              itemName: {
                equals: firstItem.itemName,
                mode: 'insensitive'
              }
            }
          }
        },
        include: {
          supplier: true
        },
        distinct: ['supplierId']
      });

      if (containersWithItem.length === 1) {
        fixStrategies.push({
          saleId: sale.saleId,
          strategy: 'CREATE_SUPPLIER_ITEM',
          supplierId: containersWithItem[0].supplierId,
          supplier: containersWithItem[0].supplier.suppliername,
          itemName: firstItem.itemName,
          confidence: 'MEDIUM'
        });
      } else {
        fixStrategies.push({
          saleId: sale.saleId,
          strategy: 'CONVERT_TO_CONTAINER_SALE',
          itemName: firstItem.itemName,
          confidence: 'LOW'
        });
      }
    }
  }

  // Print summary
  const strategyCounts = fixStrategies.reduce((acc: any, fix) => {
    acc[fix.strategy] = (acc[fix.strategy] || 0) + 1;
    return acc;
  }, {});

  console.log('Fix Strategy Summary:');
  Object.entries(strategyCounts).forEach(([strategy, count]) => {
    console.log(`  ${strategy}: ${count} sales`);
  });

  return fixStrategies;
}

async function applyFixes(fixStrategies: any[], dryRun = true) {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log(`STEP 3: APPLYING FIXES (${dryRun ? 'DRY RUN' : 'LIVE'})`);
  console.log('═'.repeat(80));
  console.log();

  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  };

  for (const fix of fixStrategies) {
    try {
      console.log(`\nProcessing Sale ID: ${fix.saleId}`);
      console.log(`Strategy: ${fix.strategy}`);
      console.log(`Confidence: ${fix.confidence}`);

      switch (fix.strategy) {
        case 'LINK_TO_EXISTING_SUPPLIER_ITEM':
          console.log(`  → Linking to SupplierItem: ${fix.supplierItemId} (${fix.supplier})`);
          if (!dryRun) {
            await prisma.sale.update({
              where: { id: fix.saleId },
              data: { sourceId: fix.supplierItemId }
            });
          }
          results.success++;
          break;

        case 'LINK_TO_SUPPLIER_WITH_CONTAINERS':
          console.log(`  → Linking to SupplierItem: ${fix.supplierItemId} (${fix.supplier})`);
          if (!dryRun) {
            await prisma.sale.update({
              where: { id: fix.saleId },
              data: { sourceId: fix.supplierItemId }
            });
          }
          results.success++;
          break;

        case 'CREATE_SUPPLIER_ITEM':
          console.log(`  → Creating SupplierItem for: ${fix.itemName} under ${fix.supplier}`);
          if (!dryRun) {
            const newSupplierItem = await prisma.supplierItem.create({
              data: {
                itemName: fix.itemName,
                supplierId: fix.supplierId,
                price: 0 // Will need to be updated manually
              }
            });
            await prisma.sale.update({
              where: { id: fix.saleId },
              data: { sourceId: newSupplierItem.id }
            });
          }
          results.success++;
          break;

        case 'MANUAL_REVIEW_REQUIRED':
          console.log(`  ⚠️  Requires manual review - multiple suppliers found:`);
          fix.options?.forEach((opt: any) => {
            console.log(`     - ${opt.supplier} (${opt.supplierItemId})`);
          });
          results.skipped++;
          break;

        case 'CONVERT_TO_CONTAINER_SALE':
          console.log(`  ⚠️  Requires manual intervention - consider converting to container sale`);
          results.skipped++;
          break;

        default:
          console.log(`  ⚠️  Unknown strategy`);
          results.skipped++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
      results.failed++;
    }
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('RESULTS');
  console.log('═'.repeat(80));
  console.log(`Success: ${results.success}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped (Manual Review): ${results.skipped}`);
  console.log();

  if (dryRun) {
    console.log('⚠️  This was a DRY RUN - no changes were made');
    console.log('To apply fixes, run: npx tsx cleanup-orphaned-sales.ts --live');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isLive = args.includes('--live');

  console.log('\n🔧 ORPHANED SALES CLEANUP TOOL\n');

  try {
    // Step 1: Identify orphaned sales
    const orphanedSales = await identifyOrphanedSales();

    if (orphanedSales.length === 0) {
      console.log('\n✅ No orphaned sales found! Database is clean.');
      return;
    }

    // Step 2: Analyze fix options
    const fixStrategies = await analyzeFixOptions(orphanedSales);

    // Step 3: Apply fixes
    await applyFixes(fixStrategies, !isLive);

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { identifyOrphanedSales, analyzeFixOptions, applyFixes };
