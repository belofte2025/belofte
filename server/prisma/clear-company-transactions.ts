import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COMPANY_NAME = 'BELOFTE';
const COMPANY_ID = '0753270c-562d-46e5-b8b5-6c40e7575867';

async function clearCompanyTransactions() {
  try {
    console.log(`\n🗑️  Starting transaction cleanup for ${COMPANY_NAME}`);
    console.log('='.repeat(60));

    // Step 1: Get current counts
    console.log('\n📊 Current state:');

    const salesCount = await prisma.sale.count({
      where: { companyId: COMPANY_ID }
    });

    const paymentsCount = await prisma.customerPayment.count({
      where: { companyId: COMPANY_ID }
    });

    const debtsCount = await prisma.customerDebt.count({
      where: { companyId: COMPANY_ID }
    });

    // Get user IDs for this company to delete their audit logs
    const companyUsers = await prisma.user.findMany({
      where: { companyId: COMPANY_ID },
      select: { id: true }
    });
    const userIds = companyUsers.map(u => u.id);

    const auditLogsCount = await prisma.auditLog.count({
      where: { userId: { in: userIds } }
    });

    console.log(`   - Sales: ${salesCount}`);
    console.log(`   - Payments: ${paymentsCount}`);
    console.log(`   - Debts: ${debtsCount}`);
    console.log(`   - Audit Logs: ${auditLogsCount}`);

    if (salesCount === 0 && paymentsCount === 0 && debtsCount === 0 && auditLogsCount === 0) {
      console.log('\n✅ No transactions to delete. Company already clean.');
      return;
    }

    // Step 2: Delete everything in a transaction
    console.log('\n🔄 Deleting transactions...');

    await prisma.$transaction(async (tx) => {
      // Delete SaleItems first (child records)
      const saleIds = await tx.sale.findMany({
        where: { companyId: COMPANY_ID },
        select: { id: true }
      });

      if (saleIds.length > 0) {
        const deletedSaleItems = await tx.saleItem.deleteMany({
          where: {
            saleId: { in: saleIds.map(s => s.id) }
          }
        });
        console.log(`   ✓ Deleted ${deletedSaleItems.count} sale items`);
      }

      // Delete Sales
      const deletedSales = await tx.sale.deleteMany({
        where: { companyId: COMPANY_ID }
      });
      console.log(`   ✓ Deleted ${deletedSales.count} sales`);

      // Delete Customer Payments
      const deletedPayments = await tx.customerPayment.deleteMany({
        where: { companyId: COMPANY_ID }
      });
      console.log(`   ✓ Deleted ${deletedPayments.count} payments`);

      // Delete Customer Debts
      const deletedDebts = await tx.customerDebt.deleteMany({
        where: { companyId: COMPANY_ID }
      });
      console.log(`   ✓ Deleted ${deletedDebts.count} debts`);

      // Delete Audit Logs
      if (userIds.length > 0) {
        const deletedAuditLogs = await tx.auditLog.deleteMany({
          where: { userId: { in: userIds } }
        });
        console.log(`   ✓ Deleted ${deletedAuditLogs.count} audit logs`);
      }
    });

    // Step 3: Verify deletion
    console.log('\n📊 After cleanup:');

    const finalSalesCount = await prisma.sale.count({
      where: { companyId: COMPANY_ID }
    });

    const finalPaymentsCount = await prisma.customerPayment.count({
      where: { companyId: COMPANY_ID }
    });

    const finalDebtsCount = await prisma.customerDebt.count({
      where: { companyId: COMPANY_ID }
    });

    const finalAuditLogsCount = await prisma.auditLog.count({
      where: { userId: { in: userIds } }
    });

    console.log(`   - Sales: ${finalSalesCount}`);
    console.log(`   - Payments: ${finalPaymentsCount}`);
    console.log(`   - Debts: ${finalDebtsCount}`);
    console.log(`   - Audit Logs: ${finalAuditLogsCount}`);

    console.log('\n✅ Transaction cleanup completed successfully!');
    console.log('\n⚠️  Note: Customer balances may need recalculation.');
    console.log('   Container inventory quantities were NOT restored.');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearCompanyTransactions();
