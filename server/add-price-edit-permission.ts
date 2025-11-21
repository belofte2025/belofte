import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addPriceEditPermission() {
  try {
    console.log("Adding sales.edit_price permission...\n");

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { code: "sales.edit_price" },
    });

    let permission;
    if (existingPermission) {
      console.log("✓ Permission 'sales.edit_price' already exists");
      permission = existingPermission;
    } else {
      // Create the new permission
      permission = await prisma.permission.create({
        data: {
          code: "sales.edit_price",
          name: "Edit Sales Price",
          description: "Allows editing/overriding of item prices during sales",
          category: "sales",
        },
      });
      console.log("✓ Created permission: sales.edit_price");
    }

    // Get all companies
    const companies = await prisma.company.findMany({
      select: { id: true, companyName: true },
    });

    console.log(`\nFound ${companies.length} companies\n`);

    let totalRolesUpdated = 0;

    for (const company of companies) {
      console.log(`Processing company: ${company.companyName}`);

      // Find Admin and Manager roles for this company
      const roles = await prisma.role.findMany({
        where: {
          companyId: company.id,
          name: { in: ["Admin", "Manager"] },
        },
        include: {
          permissions: {
            where: { permissionId: permission.id },
          },
        },
      });

      for (const role of roles) {
        // Check if permission is already assigned
        if (role.permissions.length > 0) {
          console.log(`  - ${role.name} already has sales.edit_price permission`);
        } else {
          // Assign permission to role
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
          console.log(`  ✓ Added sales.edit_price to ${role.name}`);
          totalRolesUpdated++;
        }
      }
    }

    console.log(`\n✅ Permission setup complete!`);
    console.log(`   Total roles updated: ${totalRolesUpdated}`);
    console.log(`\n📋 Summary:`);
    console.log(`   - Admin roles: Can edit prices during sales`);
    console.log(`   - Manager roles: Can edit prices during sales`);
    console.log(`   - Sales Attendant roles: Cannot edit prices (uses default only)`);
  } catch (error) {
    console.error("Error adding price edit permission:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addPriceEditPermission();
