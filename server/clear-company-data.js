const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearCompanyData(companyId) {
  console.log(`🧹 Starting cleanup for company ID: ${companyId}`);
  console.log('⚠️  This will delete ALL business data for the specified company');
  
  try {
    // First verify the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, companyName: true }
    });

    if (!company) {
      console.log('❌ Company not found!');
      return;
    }

    console.log(`🏢 Found company: ${company.companyName}`);

    // Use a transaction to ensure all deletions succeed or fail together
    await prisma.$transaction(async (prisma) => {
      
      // Delete in correct order to avoid foreign key constraint errors
      console.log('🗑️  Deleting AuditLog entries for this company...');
      const auditResult = await prisma.auditLog.deleteMany({
        where: {
          user: {
            companyId: companyId
          }
        }
      });
      console.log(`   ✅ Deleted ${auditResult.count} audit log entries`);

      console.log('🗑️  Deleting SaleItem entries for this company...');
      const saleItemResult = await prisma.saleItem.deleteMany({
        where: {
          sale: {
            companyId: companyId
          }
        }
      });
      console.log(`   ✅ Deleted ${saleItemResult.count} sale items`);

      console.log('🗑️  Deleting Sale entries for this company...');
      const saleResult = await prisma.sale.deleteMany({
        where: { companyId: companyId }
      });
      console.log(`   ✅ Deleted ${saleResult.count} sales`);

      console.log('🗑️  Deleting CustomerPayment entries for this company...');
      const paymentResult = await prisma.customerPayment.deleteMany({
        where: { companyId: companyId }
      });
      console.log(`   ✅ Deleted ${paymentResult.count} customer payments`);

      console.log('🗑️  Deleting Customer entries for this company...');
      const customerResult = await prisma.customer.deleteMany({
        where: { companyId: companyId }
      });
      console.log(`   ✅ Deleted ${customerResult.count} customers`);

      console.log('🗑️  Deleting ContainerItem entries for this company...');
      const containerItemResult = await prisma.containerItem.deleteMany({
        where: {
          container: {
            companyId: companyId
          }
        }
      });
      console.log(`   ✅ Deleted ${containerItemResult.count} container items`);

      console.log('🗑️  Deleting Container entries for this company...');
      const containerResult = await prisma.container.deleteMany({
        where: { companyId: companyId }
      });
      console.log(`   ✅ Deleted ${containerResult.count} containers`);

      console.log('🗑️  Deleting SupplierItem entries for this company...');
      const supplierItemResult = await prisma.supplierItem.deleteMany({
        where: {
          supplier: {
            companyId: companyId
          }
        }
      });
      console.log(`   ✅ Deleted ${supplierItemResult.count} supplier items`);

      console.log('🗑️  Deleting Supplier entries for this company...');
      const supplierResult = await prisma.supplier.deleteMany({
        where: { companyId: companyId }
      });
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
      console.log(`   🏢 Company "${company.companyName}" data cleared`);
    });

    console.log('');
    console.log('✅ COMPANY DATA CLEANUP COMPLETED SUCCESSFULLY!');
    console.log(`   ✅ All business data for "${company.companyName}" has been cleared`);
    console.log('   ✅ User and company records preserved');
    console.log('   🚀 Ready for fresh data import');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR during company data cleanup:');
    console.error(error);
    console.error('');
    console.error('🔄 Database state may be inconsistent.');
    console.error('   Consider checking your data manually.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Show available companies and let user choose
async function showCompaniesAndChoose() {
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        companyName: true,
        _count: {
          select: {
            customer: true,
            suppliers: true,
            containers: true
          }
        }
      }
    });

    if (companies.length === 0) {
      console.log('❌ No companies found in the database.');
      return;
    }

    console.log('🏢 Available companies:');
    console.log('');
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.companyName}`);
      console.log(`   ID: ${company.id}`);
      console.log(`   Customers: ${company._count.customer}`);
      console.log(`   Suppliers: ${company._count.suppliers}`);
      console.log(`   Containers: ${company._count.containers}`);
      console.log('');
    });

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Enter the company ID to clear (or "cancel" to abort): ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase() === 'cancel') {
        console.log('❌ Operation cancelled.');
        process.exit(0);
        return;
      }

      const selectedCompany = companies.find(c => c.id === answer);
      if (!selectedCompany) {
        console.log('❌ Invalid company ID.');
        process.exit(1);
        return;
      }

      console.log('');
      console.log(`⚠️  WARNING: This will permanently delete ALL business data for "${selectedCompany.companyName}"!`);
      console.log('');
      
      const rl2 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl2.question('Type "yes" to confirm deletion: ', (confirmAnswer) => {
        rl2.close();
        
        if (confirmAnswer.toLowerCase() === 'yes') {
          clearCompanyData(answer);
        } else {
          console.log('❌ Operation cancelled.');
          console.log('💡 No data was deleted.');
        }
      });
    });

  } catch (error) {
    console.error('❌ Error fetching companies:', error);
    process.exit(1);
  }
}

showCompaniesAndChoose();