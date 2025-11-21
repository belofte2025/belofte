import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeAllUsersAdmin() {
  try {
    console.log("Making all users Admin...\n");

    // Get all companies
    const companies = await prisma.company.findMany({
      select: { id: true, companyName: true },
    });

    console.log(`Found ${companies.length} companies\n`);

    for (const company of companies) {
      console.log(`\nProcessing company: ${company.companyName}`);

      // Find the Admin role for this company
      const adminRole = await prisma.role.findFirst({
        where: {
          companyId: company.id,
          name: "Admin",
        },
      });

      if (!adminRole) {
        console.log(`  ⚠️  No Admin role found for ${company.companyName}`);
        continue;
      }

      console.log(`  Found Admin role: ${adminRole.name} (ID: ${adminRole.id})`);

      // Get all users in this company
      const users = await prisma.user.findMany({
        where: { companyId: company.id },
        select: {
          id: true,
          userName: true,
          email: true,
          roleId: true,
        },
      });

      console.log(`  Found ${users.length} users`);

      // Update all users to Admin role
      let updatedCount = 0;
      for (const user of users) {
        if (user.roleId !== adminRole.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { roleId: adminRole.id },
          });
          console.log(`  ✓ Updated ${user.userName} (${user.email}) to Admin`);
          updatedCount++;
        } else {
          console.log(`  - ${user.userName} is already Admin`);
        }
      }

      console.log(
        `  Completed: ${updatedCount} user(s) updated to Admin in ${company.companyName}`
      );
    }

    console.log("\n✅ All users have been made Admin!");
  } catch (error) {
    console.error("Error making users admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

makeAllUsersAdmin();
