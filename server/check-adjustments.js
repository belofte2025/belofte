const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".envbelofte" });

const prisma = new PrismaClient();

async function checkAdjustments() {
  try {
    const supplierName = "SEVEN STAR-AR";

    // Find supplier
    const supplier = await prisma.supplier.findFirst({
      where: { suppliername: supplierName },
    });

    console.log(`Checking stock adjustments for ${supplierName}...\n`);

    // Get ALL stock adjustments for this supplier (any itemName)
    const allAdjustments = await prisma.stockAdjustment.findMany({
      where: { supplierId: supplier.id },
    });

    console.log(`Total adjustments for this supplier: ${allAdjustments.length}`);

    if (allAdjustments.length > 0) {
      console.log("\nAll adjustments:");
      allAdjustments.forEach((adj) => {
        console.log(`  - "${adj.itemName}": ${adj.adjustmentQty} (${adj.adjustmentType})`);
      });
    }

    // Also check if there are any adjustments with "brassiere" in any casing
    const brassiereAdjustments = await prisma.stockAdjustment.findMany({
      where: {
        itemName: { contains: "brassier", mode: "insensitive" },
      },
    });

    console.log(`\nAdjustments with "brassier" in name: ${brassiereAdjustments.length}`);
    brassiereAdjustments.forEach((adj) => {
      console.log(`  - "${adj.itemName}": ${adj.adjustmentQty}`);
    });

    // Check what the stock adjustment page API would return
    console.log("\n=== Checking getInventoryBySupplier calculation ===");

    // Get all container items for this supplier
    const containerItems = await prisma.containerItem.findMany({
      where: {
        Container: { supplierId: supplier.id },
      },
      include: {
        Container: { select: { companyId: true } },
      },
    });

    const companyIds = [...new Set(containerItems.map(c => c.Container.companyId))];
    const containerIds = await prisma.container.findMany({
      where: { supplierId: supplier.id },
      select: { id: true },
    });

    // Get stock adjustments for this supplier
    const stockAdjustments = await prisma.stockAdjustment.findMany({
      where: {
        supplierId: supplier.id,
        companyId: { in: companyIds },
      },
    });

    console.log(`Company IDs: ${companyIds}`);
    console.log(`Container count: ${containerIds.length}`);
    console.log(`Stock adjustments count: ${stockAdjustments.length}`);

    // Build the summary map like getInventoryBySupplier does
    const summaryMap = {};

    containerItems.forEach((item) => {
      if (!summaryMap[item.itemName]) {
        summaryMap[item.itemName] = { received: 0, sold: 0, adjustments: 0 };
      }
      summaryMap[item.itemName].received += item.quantity;
    });

    // Add adjustments
    stockAdjustments.forEach((adj) => {
      if (!summaryMap[adj.itemName]) {
        summaryMap[adj.itemName] = { received: 0, sold: 0, adjustments: 0 };
      }
      summaryMap[adj.itemName].adjustments += adj.adjustmentQty;
    });

    // Show BRASSIERES specifically
    if (summaryMap["BRASSIERES"]) {
      console.log(`\nBRASSIERES in summaryMap:`);
      console.log(`  Received: ${summaryMap["BRASSIERES"].received}`);
      console.log(`  Sold: ${summaryMap["BRASSIERES"].sold}`);
      console.log(`  Adjustments: ${summaryMap["BRASSIERES"].adjustments}`);
      console.log(`  Available: ${summaryMap["BRASSIERES"].received - summaryMap["BRASSIERES"].sold + summaryMap["BRASSIERES"].adjustments}`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdjustments();
