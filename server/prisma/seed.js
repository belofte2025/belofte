const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create or find admin company
  let company = await prisma.company.findFirst({
    where: { companyName: 'Admin Company' }
  });

  if (!company) {
    console.log('Creating admin company...');
    company = await prisma.company.create({
      data: {
        companyName: 'Admin Company',
        address: 'Admin Address',
        phone: '+1234567890'
      }
    });
    console.log('✅ Admin company created with ID:', company.id);
  } else {
    console.log('✅ Admin company already exists with ID:', company.id);
  }

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@belofte.com' }
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists with email: admin@belofte.com');
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  console.log('Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@belofte.com',
      password: hashedPassword,
      userName: 'Administrator',
      role: 'admin',
      companyId: company.id
    }
  });

  console.log('✅ Admin user created successfully!');
  console.log('📧 Email: admin@belofte.com');
  console.log('🔑 Password: admin123');
  console.log('👤 Username: Administrator');
  console.log('🏢 Company:', company.companyName);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔚 Seed completed');
  });