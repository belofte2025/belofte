const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".envbelofte" });

const prisma = new PrismaClient();

async function findSupplier() {
  try {
    // Search for suppliers with "seven" or "star" in name (case insensitive)
    const suppliers = await prisma.supplier.findMany({
      where: {
        OR: [
          { suppliername: { contains: "seven", mode: "insensitive" } },
          { suppliername: { contains: "star", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        suppliername: true,
        companyId: true,
        Company: { select: { companyName: true } },
      },
    });

    console.log("Found suppliers:");
    suppliers.forEach((s) => {
      console.log(`  - "${s.suppliername}" (company: ${s.Company?.companyName || s.companyId})`);
    });

    // Also search for Brassieres item
    console.log("\nSearching for Brassieres items:");
    const items = await prisma.supplierItem.findMany({
      where: {
        itemName: { contains: "Brassier", mode: "insensitive" },
      },
      include: {
        Supplier: { select: { suppliername: true } },
      },
    });

    items.forEach((item) => {
      console.log(`  - "${item.itemName}" from "${item.Supplier.suppliername}"`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

findSupplier();
