const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Starting database cleanup...');
  console.log('⚠️  This will delete ALL data except Users and Companies');
  
  try {
    // Use a transaction to ensure all deletions succeed or fail together
    await prisma.$transaction(async (prisma) => {
      
      // Delete in correct order to avoid foreign key constraint errors
      console.log('🗑️  Deleting AuditLog entries...');
      const auditResult = await prisma.auditLog.deleteMany({});
      console.log(`   ✅ Deleted ${auditResult.count} audit log entries`);

      console.log('🗑️  Deleting SaleItem entries...');
      const saleItemResult = await prisma.saleItem.deleteMany({});
      console.log(`   ✅ Deleted ${saleItemResult.count} sale items`);

      console.log('🗑️  Deleting Sale entries...');
      const saleResult = await prisma.sale.deleteMany({});
      console.log(`   ✅ Deleted ${saleResult.count} sales`);

      console.log('🗑️  Deleting CustomerPayment entries...');
      const paymentResult = await prisma.customerPayment.deleteMany({});
      console.log(`   ✅ Deleted ${paymentResult.count} customer payments`);

      console.log('🗑️  Deleting Customer entries...');
      const customerResult = await prisma.customer.deleteMany({});
      console.log(`   ✅ Deleted ${customerResult.count} customers`);

      console.log('🗑️  Deleting ContainerItem entries...');
      const containerItemResult = await prisma.containerItem.deleteMany({});
      console.log(`   ✅ Deleted ${containerItemResult.count} container items`);

      console.log('🗑️  Deleting Container entries...');
      const containerResult = await prisma.container.deleteMany({});
      console.log(`   ✅ Deleted ${containerResult.count} containers`);

      console.log('🗑️  Deleting SupplierItem entries...');
      const supplierItemResult = await prisma.supplierItem.deleteMany({});
      console.log(`   ✅ Deleted ${supplierItemResult.count} supplier items`);

      console.log('🗑️  Deleting Supplier entries...');
      const supplierResult = await prisma.supplier.deleteMany({});
      console.log(`   ✅ Deleted ${supplierResult.count} suppliers`);

      // Summary
      const totalDeleted = 
        auditResult.count + 
        saleItemResult.count + 
        saleResult.count + 
        paymentResult.count + 
        customerResult.count + 
        containerItemResult.count + 
        containerResult.count + 
        supplierItemResult.count + 
        supplierResult.count;

      console.log('');
      console.log('📊 CLEANUP SUMMARY:');
      console.log(`   🗑️  Total records deleted: ${totalDeleted}`);
    });

    // Verify what's left in the database
    console.log('');
    console.log('🔍 Verifying remaining data...');
    
    const remainingUsers = await prisma.user.count();
    const remainingCompanies = await prisma.company.count();
    
    console.log(`   👥 Users remaining: ${remainingUsers}`);
    console.log(`   🏢 Companies remaining: ${remainingCompanies}`);

    console.log('');
    console.log('✅ DATABASE CLEANUP COMPLETED SUCCESSFULLY!');
    console.log('   ✅ All business data has been cleared');
    console.log('   ✅ User and company data preserved');
    console.log('   🚀 Ready for fresh data import');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR during database cleanup:');
    console.error(error);
    console.error('');
    console.error('🔄 Database state may be inconsistent.');
    console.error('   Consider checking your data manually.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Add confirmation prompt for safety
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will permanently delete ALL data except Users and Companies!');
console.log('📋 The following data will be DELETED:');
console.log('   • All Customers');
console.log('   • All Customer Payments'); 
console.log('   • All Suppliers');
console.log('   • All Supplier Items');
console.log('   • All Containers');
console.log('   • All Container Items');
console.log('   • All Sales');
console.log('   • All Sale Items');
console.log('   • All Audit Logs');
console.log('');
console.log('✅ The following data will be PRESERVED:');
console.log('   • All Users');
console.log('   • All Companies');
console.log('');

rl.question('Are you sure you want to proceed? Type "yes" to continue: ', (answer) => {
  rl.close();
  
  if (answer.toLowerCase() === 'yes') {
    clearDatabase();
  } else {
    console.log('❌ Operation cancelled.');
    console.log('💡 No data was deleted.');
    process.exit(0);
  }
});