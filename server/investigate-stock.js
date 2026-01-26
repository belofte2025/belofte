const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".envbelofte" });

const prisma = new PrismaClient();

async function investigate() {
  try {
    const itemName = "BRASSIERES";
    const supplierName = "SEVEN STAR-AR";

    console.log(`\n=== Investigating ${itemName} from ${supplierName} ===\n`);

    // Find the supplier
    const supplier = await prisma.supplier.findFirst({
      where: { suppliername: supplierName },
    });

    if (!supplier) {
      console.log("Supplier not found!");
      return;
    }

    console.log(`Supplier ID: ${supplier.id}`);
    console.log(`Company ID: ${supplier.companyId}\n`);

    // 1. Get container items (received)
    const containerItems = await prisma.containerItem.findMany({
      where: {
        itemName: itemName,
        Container: { supplierId: supplier.id },
      },
      include: {
        Container: { select: { id: true, containerNo: true } },
      },
    });

    const totalReceived = containerItems.reduce((sum, item) => sum + item.quantity, 0);
    console.log(`=== RECEIVED (Container Items) ===`);
    containerItems.forEach((item) => {
      console.log(`  Container ${item.Container.containerNo}: ${item.quantity}`);
    });
    console.log(`  TOTAL RECEIVED: ${totalReceived}\n`);

    // Get container IDs for this supplier
    const containerIds = containerItems.map((item) => item.Container.id);

    // 2. Get supplierItem for this item
    const supplierItem = await prisma.supplierItem.findFirst({
      where: {
        itemName: itemName,
        supplierId: supplier.id,
      },
    });

    console.log(`=== SUPPLIER ITEM ===`);
    if (supplierItem) {
      console.log(`  SupplierItem ID: ${supplierItem.id}`);
    } else {
      console.log(`  No supplierItem found`);
    }
    console.log();

    // 3. Get container sales
    const containerSales = await prisma.saleItem.findMany({
      where: {
        itemName: itemName,
        Sale: {
          companyId: supplier.companyId,
          sourceType: "container",
          sourceId: { in: containerIds },
        },
      },
      include: {
        Sale: { select: { sourceType: true, sourceId: true, createdAt: true } },
      },
    });

    const containerSoldQty = containerSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
    console.log(`=== CONTAINER SALES ===`);
    containerSales.forEach((sale) => {
      console.log(`  ${sale.quantity} units (container: ${sale.Sale.sourceId})`);
    });
    console.log(`  TOTAL CONTAINER SOLD: ${containerSoldQty}\n`);

    // 4. Get regular sales
    const regularSales = supplierItem
      ? await prisma.saleItem.findMany({
          where: {
            itemName: itemName,
            Sale: {
              companyId: supplier.companyId,
              sourceType: "regular",
              sourceId: supplierItem.id,
            },
          },
          include: {
            Sale: { select: { sourceType: true, sourceId: true, createdAt: true } },
          },
        })
      : [];

    const regularSoldQty = regularSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
    console.log(`=== REGULAR SALES ===`);
    regularSales.forEach((sale) => {
      console.log(`  ${sale.quantity} units (sourceId: ${sale.Sale.sourceId})`);
    });
    console.log(`  TOTAL REGULAR SOLD: ${regularSoldQty}\n`);

    // 5. Get stock adjustments
    const stockAdjustments = await prisma.stockAdjustment.findMany({
      where: {
        itemName: itemName,
        supplierId: supplier.id,
      },
    });

    const totalAdjustments = stockAdjustments.reduce((sum, adj) => sum + adj.adjustmentQty, 0);
    console.log(`=== STOCK ADJUSTMENTS ===`);
    stockAdjustments.forEach((adj) => {
      console.log(`  ${adj.adjustmentQty > 0 ? "+" : ""}${adj.adjustmentQty} (${adj.adjustmentType}: ${adj.reason || "no reason"})`);
    });
    console.log(`  TOTAL ADJUSTMENTS: ${totalAdjustments}\n`);

    // 6. Calculate expected values
    const totalSold = containerSoldQty + regularSoldQty;
    const expectedAvailable = totalReceived - totalSold + totalAdjustments;

    console.log(`=== CALCULATION ===`);
    console.log(`  Received: ${totalReceived}`);
    console.log(`  Container Sold: ${containerSoldQty}`);
    console.log(`  Regular Sold: ${regularSoldQty}`);
    console.log(`  Total Sold: ${totalSold}`);
    console.log(`  Adjustments: ${totalAdjustments}`);
    console.log(`  ---------------------------------`);
    console.log(`  EXPECTED AVAILABLE: ${totalReceived} - ${totalSold} + ${totalAdjustments} = ${expectedAvailable}\n`);

    // Check if there are any sales with wrong sourceId
    console.log(`=== CHECKING FOR ORPHAN SALES ===`);
    const allSalesForItem = await prisma.saleItem.findMany({
      where: {
        itemName: itemName,
        Sale: { companyId: supplier.companyId },
      },
      include: {
        Sale: { select: { sourceType: true, sourceId: true } },
      },
    });

    const orphanSales = allSalesForItem.filter((sale) => {
      if (sale.Sale.sourceType === "container") {
        return !containerIds.includes(sale.Sale.sourceId);
      }
      if (sale.Sale.sourceType === "regular") {
        return supplierItem ? sale.Sale.sourceId !== supplierItem.id : true;
      }
      return true;
    });

    if (orphanSales.length > 0) {
      console.log(`  Found ${orphanSales.length} sales NOT linked to this supplier:`);
      orphanSales.forEach((sale) => {
        console.log(`    ${sale.quantity} units (${sale.Sale.sourceType}, sourceId: ${sale.Sale.sourceId})`);
      });
    } else {
      console.log(`  No orphan sales found`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

investigate();
