const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Utility functions for database seeding
class DatabaseSeeder {
  
  // Check current database state
  static async checkDatabase() {
    console.log('🔍 Checking current database state...\n');
    
    try {
      const companies = await prisma.company.findMany({
        include: { _count: { select: { users: true } } }
      });
      
      const users = await prisma.user.findMany({
        include: { company: { select: { companyName: true } } }
      });
      
      console.log(`📊 Companies: ${companies.length}`);
      companies.forEach(company => {
        console.log(`  • ${company.companyName} (${company._count.users} users)`);
      });
      
      console.log(`\n👥 Users: ${users.length}`);
      users.forEach(user => {
        console.log(`  • ${user.userName} (${user.email}) - ${user.role} @ ${user.company.companyName}`);
      });
      
      return { companies, users };
      
    } catch (error) {
      console.error('❌ Error checking database:', error);
    }
  }
  
  // Create a new company
  static async createCompany(companyData) {
    console.log(`🏢 Creating company: ${companyData.companyName}...`);
    
    try {
      const company = await prisma.company.create({
        data: {
          companyName: companyData.companyName,
          address: companyData.address || null,
          phone: companyData.phone || null
        }
      });
      
      console.log(`✅ Company created: ${company.companyName} (ID: ${company.id})`);
      return company;
      
    } catch (error) {
      console.error('❌ Error creating company:', error);
      throw error;
    }
  }
  
  // Create a new user
  static async createUser(userData) {
    console.log(`👤 Creating user: ${userData.userName} (${userData.email})...`);
    
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        console.log(`⚠️  User with email ${userData.email} already exists.`);
        return null;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          userName: userData.userName,
          role: userData.role || 'user',
          companyId: userData.companyId
        },
        include: {
          company: { select: { companyName: true } }
        }
      });
      
      console.log(`✅ User created: ${user.userName} (${user.email}) @ ${user.company.companyName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: ${userData.password}`);
      
      return user;
      
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }
  
  // Get all companies
  static async getCompanies() {
    return await prisma.company.findMany({
      select: { id: true, companyName: true }
    });
  }
  
  // Quick seed presets
  static async seedTestUsers() {
    console.log('🌱 Seeding test users...\n');
    
    try {
      const companies = await this.getCompanies();
      if (companies.length === 0) {
        console.log('❌ No companies found. Create a company first.');
        return;
      }
      
      const testUsers = [
        {
          email: 'manager@belofte.com',
          password: 'manager123',
          userName: 'Manager',
          role: 'admin',
          companyId: companies[0].id
        },
        {
          email: 'employee@belofte.com',
          password: 'employee123',
          userName: 'Employee',
          role: 'user',
          companyId: companies[0].id
        }
      ];
      
      for (const userData of testUsers) {
        await this.createUser(userData);
      }
      
      console.log('\n✅ Test users seeding completed!');
      
    } catch (error) {
      console.error('❌ Error seeding test users:', error);
    }
  }
  
  static async disconnect() {
    await prisma.$disconnect();
  }
}

// Example usage functions
async function main() {
  console.log('🌱 Database Seeding Utility\n');
  
  // Check current state
  await DatabaseSeeder.checkDatabase();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Seed additional test users if needed
  await DatabaseSeeder.seedTestUsers();
  
  // Disconnect
  await DatabaseSeeder.disconnect();
  console.log('\n🔚 Seeding utility completed');
}

// Export for use in other scripts
module.exports = DatabaseSeeder;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}