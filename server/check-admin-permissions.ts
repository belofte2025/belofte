import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminPermissions() {
  try {
    console.log("Checking Admin role permissions...\n");

    // Get all Admin roles with their permissions
    const adminRoles = await prisma.role.findMany({
      where: {
        name: "Admin",
      },
      include: {
        company: {
          select: { companyName: true },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    console.log(`Found ${adminRoles.length} Admin roles\n`);

    for (const role of adminRoles) {
      console.log(`Company: ${role.company.companyName}`);
      console.log(`Role: ${role.name} (ID: ${role.id})`);
      console.log(`Total permissions: ${role.permissions.length}`);

      // Check if sales.edit_price is included
      const hasPriceEditPermission = role.permissions.some(
        (rp) => rp.permission.code === "sales.edit_price"
      );

      console.log(
        `Has sales.edit_price permission: ${hasPriceEditPermission ? "✓ YES" : "✗ NO"}`
      );

      if (hasPriceEditPermission) {
        console.log("✓ This role can edit prices during sales");
      } else {
        console.log("✗ This role CANNOT edit prices during sales");
      }
      console.log("---");
    }

    console.log("\n📋 Summary:");
    console.log("If your Admin role has sales.edit_price permission but you still can't edit prices:");
    console.log("1. Log out from the application");
    console.log("2. Log back in to get a fresh JWT token with updated permissions");
    console.log("3. Check your browser's localStorage to see the current user permissions");
  } catch (error) {
    console.error("Error checking permissions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPermissions();
