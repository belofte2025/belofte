const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showDatabaseStatus() {
  try {
    console.log('📊 DATABASE STATUS REPORT');
    console.log('========================');
    console.log('');

    // Count all entities
    const [
      companyCount,
      userCount,
      customerCount,
      supplierCount,
      supplierItemCount,
      containerCount,
      containerItemCount,
      saleCount,
      saleItemCount,
      paymentCount,
      auditCount
    ] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.supplierItem.count(),
      prisma.container.count(),
      prisma.containerItem.count(),
      prisma.sale.count(),
      prisma.saleItem.count(),
      prisma.customerPayment.count(),
      prisma.auditLog.count()
    ]);

    // System data (preserved during cleanup)
    console.log('🔒 SYSTEM DATA (Preserved):');
    console.log(`   🏢 Companies: ${companyCount}`);
    console.log(`   👥 Users: ${userCount}`);
    console.log('');

    // Business data (cleared during cleanup)
    console.log('🗂️  BUSINESS DATA (Will be cleared):');
    console.log(`   👤 Customers: ${customerCount}`);
    console.log(`   💰 Customer Payments: ${paymentCount}`);
    console.log(`   🏭 Suppliers: ${supplierCount}`);
    console.log(`   📦 Supplier Items: ${supplierItemCount}`);
    console.log(`   📋 Containers: ${containerCount}`);
    console.log(`   📊 Container Items: ${containerItemCount}`);
    console.log(`   🛒 Sales: ${saleCount}`);
    console.log(`   🛍️  Sale Items: ${saleItemCount}`);
    console.log(`   📝 Audit Logs: ${auditCount}`);
    console.log('');

    const totalBusinessRecords = 
      customerCount + paymentCount + supplierCount + supplierItemCount +
      containerCount + containerItemCount + saleCount + saleItemCount + auditCount;

    console.log('📈 SUMMARY:');
    console.log(`   🔒 System records: ${companyCount + userCount}`);
    console.log(`   🗂️  Business records: ${totalBusinessRecords}`);
    console.log(`   📊 Total records: ${companyCount + userCount + totalBusinessRecords}`);

    if (totalBusinessRecords === 0) {
      console.log('');
      console.log('✅ Database is already clean! No business data to remove.');
    } else {
      console.log('');
      console.log('🧹 Ready for cleanup if needed.');
    }

    // Show companies if any exist
    if (companyCount > 0) {
      console.log('');
      console.log('🏢 COMPANIES:');
      const companies = await prisma.company.findMany({
        select: {
          id: true,
          companyName: true,
          _count: {
            select: {
              customer: true,
              suppliers: true,
              containers: true,
              users: true
            }
          }
        }
      });

      companies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.companyName}`);
        console.log(`      ID: ${company.id}`);
        console.log(`      Users: ${company._count.users}`);
        console.log(`      Customers: ${company._count.customer}`);
        console.log(`      Suppliers: ${company._count.suppliers}`);
        console.log(`      Containers: ${company._count.containers}`);
      });
    }

  } catch (error) {
    console.error('❌ Error fetching database status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showDatabaseStatus();