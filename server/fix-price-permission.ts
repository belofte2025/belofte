import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixPricePermission() {
  try {
    console.log("Fixing sales.edit_price permission...\n");

    // Step 1: Get or create the permission
    let permission = await prisma.permission.findUnique({
      where: { code: "sales.edit_price" },
    });

    if (!permission) {
      permission = await prisma.permission.create({
        data: {
          code: "sales.edit_price",
          name: "Edit Sales Price",
          description: "Allows editing/overriding of item prices during sales",
          category: "sales",
        },
      });
      console.log("✓ Created permission: sales.edit_price");
    } else {
      console.log("✓ Permission exists: sales.edit_price (ID:", permission.id, ")");
    }

    // Step 2: Get all Admin roles across all companies
    const adminRoles = await prisma.role.findMany({
      where: { name: "Admin" },
      include: {
        company: { select: { companyName: true } },
      },
    });

    console.log(`\nFound ${adminRoles.length} Admin roles\n`);

    // Step 3: Check and add permission to each Admin role
    for (const role of adminRoles) {
      console.log(`Processing: ${role.company.companyName} - ${role.name}`);

      // Check if permission already assigned
      const existingLink = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
      });

      if (existingLink) {
        console.log("  ✓ Already has permission");
      } else {
        // Add the permission
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
        console.log("  ✓ Added sales.edit_price permission");
      }

      // Verify it was added
      const roleWithPerms = await prisma.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: {
            where: { permissionId: permission.id },
            include: { permission: true },
          },
        },
      });

      const hasPermission = roleWithPerms?.permissions.length ?? 0 > 0;
      console.log(`  Verification: ${hasPermission ? "✓ SUCCESS" : "✗ FAILED"}`);
      console.log("");
    }

    console.log("✅ Done! Next steps:");
    console.log("1. Log out from the application");
    console.log("2. Log back in to get a fresh JWT token");
    console.log("3. Try editing prices during sales");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPricePermission();
