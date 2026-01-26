const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: ".envbelofte" });

const prisma = new PrismaClient();

async function testSale() {
  try {
    // Get a container with items
    const container = await prisma.container.findFirst({
      where: { status: { in: ["Received", "Done"] } },
      include: {
        ContainerItem: { take: 1 },
        Supplier: { select: { companyId: true } },
      },
    });

    if (!container) {
      console.log("No container found");
      return;
    }

    console.log("Container:", container.containerNo);
    console.log("Status:", container.status);
    console.log("Company ID:", container.companyId);

    // Get a customer
    const customer = await prisma.customer.findFirst({
      where: { companyId: container.companyId },
    });

    if (!customer) {
      console.log("No customer found");
      return;
    }

    console.log("Customer:", customer.name);

    if (container.ContainerItem.length === 0) {
      console.log("No container items found");
      return;
    }

    const item = container.ContainerItem[0];
    console.log("Item:", item.itemName, "Qty:", item.quantity, "Price:", item.unitPrice);

    // Try to create a test sale
    console.log("\nAttempting to create sale...");

    const saleData = {
      saleType: "cash",
      sourceType: "container",
      sourceId: container.id,
      customerId: customer.id,
      companyId: container.companyId,
      subtotal: item.unitPrice * 1,
      discountType: null,
      discountValue: 0,
      totalAmount: item.unitPrice * 1,
      SaleItem: {
        createMany: {
          data: [{
            itemName: item.itemName,
            quantity: 1,
            unitPrice: item.unitPrice,
          }],
        },
      },
    };

    console.log("Sale data:", JSON.stringify(saleData, null, 2));

    const sale = await prisma.sale.create({
      data: saleData,
    });

    console.log("\nSale created successfully:", sale.id);

    // Clean up - delete the test sale
    await prisma.saleItem.deleteMany({ where: { saleId: sale.id } });
    await prisma.sale.delete({ where: { id: sale.id } });
    console.log("Test sale cleaned up");

  } catch (error) {
    console.error("Error creating sale:", error.message);
    console.error("Full error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSale();
