const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".envbelofte" });

const prisma = new PrismaClient();

async function fixAdjustmentNames() {
  try {
    console.log("=== Finding Stock Adjustments with Untrimmed Item Names ===\n");

    // Get all stock adjustments
    const allAdjustments = await prisma.stockAdjustment.findMany({
      select: {
        id: true,
        itemName: true,
        supplierId: true,
        adjustmentQty: true,
      },
    });

    // Find ones that need trimming
    const needsTrimming = allAdjustments.filter(
      (adj) => adj.itemName !== adj.itemName.trim()
    );

    console.log(`Total adjustments: ${allAdjustments.length}`);
    console.log(`Adjustments needing trim: ${needsTrimming.length}\n`);

    if (needsTrimming.length === 0) {
      console.log("No adjustments need fixing!");
      return;
    }

    console.log("Adjustments to fix:");
    needsTrimming.forEach((adj) => {
      console.log(`  "${adj.itemName}" -> "${adj.itemName.trim()}" (qty: ${adj.adjustmentQty})`);
    });

    console.log("\nFixing...\n");

    let fixed = 0;
    for (const adj of needsTrimming) {
      await prisma.stockAdjustment.update({
        where: { id: adj.id },
        data: { itemName: adj.itemName.trim() },
      });
      fixed++;
    }

    console.log(`Fixed ${fixed} stock adjustment records.\n`);

    // Verify the BRASSIERES item specifically
    console.log("=== Verifying BRASSIERES ===");
    const brassiereAdj = await prisma.stockAdjustment.findMany({
      where: {
        itemName: { contains: "BRASSIER", mode: "insensitive" },
      },
    });

    brassiereAdj.forEach((adj) => {
      console.log(`  "${adj.itemName}": ${adj.adjustmentQty}`);
    });

    const totalBrassiereAdj = brassiereAdj.reduce((sum, adj) => sum + adj.adjustmentQty, 0);
    console.log(`  Total BRASSIERES adjustments: ${totalBrassiereAdj}`);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdjustmentNames();
