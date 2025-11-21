import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from './src/utils/jwt';

const prisma = new PrismaClient();

async function testRBAC() {
  console.log('🧪 Testing RBAC System\n');

  try {
    // 1. Check if tables exist
    console.log('📋 Step 1: Checking database tables...');
    const tables = await prisma.$queryRaw<any[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('Role', 'Permission', 'RolePermission')
    `;

    if (tables.length === 3) {
      console.log('✅ All RBAC tables exist:', tables.map(t => t.table_name).join(', '));
    } else {
      console.log('❌ Missing tables. Found:', tables.map(t => t.table_name).join(', '));
      console.log('   Please run: npx prisma db push\n');
      return;
    }

    // 2. Check permissions count
    console.log('\n📋 Step 2: Checking permissions...');
    const permissionCount = await prisma.permission.count();
    if (permissionCount > 0) {
      console.log(`✅ Found ${permissionCount} permissions`);
      const samplePerms = await prisma.permission.findMany({ take: 5 });
      console.log('   Sample permissions:', samplePerms.map(p => p.code).join(', '));
    } else {
      console.log('❌ No permissions found. Please run: npx ts-node prisma/migrate-roles.ts\n');
      return;
    }

    // 3. Check roles
    console.log('\n📋 Step 3: Checking roles...');
    const roles = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });

    if (roles.length > 0) {
      console.log(`✅ Found ${roles.length} roles:`);
      roles.forEach(role => {
        console.log(`   - ${role.name}: ${role.permissions.length} permissions, ${role._count.users} users`);
      });
    } else {
      console.log('❌ No roles found. Please run: npx ts-node prisma/migrate-roles.ts\n');
      return;
    }

    // 4. Check if users have roleId
    console.log('\n📋 Step 4: Checking users...');
    const totalUsers = await prisma.user.count();
    const usersWithRole = await prisma.user.count({
      where: { roleId: { not: null } }
    });

    console.log(`✅ Total users: ${totalUsers}`);
    console.log(`✅ Users with roles: ${usersWithRole}`);

    if (usersWithRole < totalUsers) {
      console.log(`⚠️  ${totalUsers - usersWithRole} users don't have roles assigned`);
      console.log('   Run: npx ts-node prisma/migrate-roles.ts\n');
    }

    // 5. Test login flow
    console.log('\n📋 Step 5: Testing login flow...');
    const testUser = await prisma.user.findFirst({
      where: { roleId: { not: null } },
      include: {
        company: { select: { companyName: true } },
        role: {
          include: {
            permissions: { include: { permission: true } }
          }
        }
      }
    });

    if (testUser) {
      const permissions = testUser.role?.permissions.map(rp => rp.permission.code) || [];
      const roleName = testUser.role?.name || 'No Role';

      console.log(`✅ Test user: ${testUser.email}`);
      console.log(`   Role: ${roleName}`);
      console.log(`   Permissions: ${permissions.length}`);

      // Generate a test token
      const token = generateToken({
        userId: testUser.id,
        email: testUser.email,
        userName: testUser.userName,
        companyId: testUser.companyId,
        role: roleName,
        roleId: testUser.roleId,
        permissions,
      });

      console.log(`\n✅ JWT Token generated successfully`);
      console.log(`   Sample permissions in token:`, permissions.slice(0, 5).join(', '));

      // Decode token to verify
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      console.log(`\n✅ Token decoded successfully`);
      console.log(`   Contains ${(decoded as any).permissions?.length || 0} permissions`);

    } else {
      console.log('❌ No users with roles found for testing');
    }

    // 6. Test permission check
    console.log('\n📋 Step 6: Testing permission checks...');
    if (testUser && testUser.role) {
      const userPerms = testUser.role.permissions.map(rp => rp.permission.code);

      // Test various permission checks
      const tests = [
        { perm: 'dashboard.view', expected: true },
        { perm: 'sales.create', expected: userPerms.includes('sales.create') },
        { perm: 'roles.manage', expected: userPerms.includes('roles.manage') },
      ];

      tests.forEach(test => {
        const has = userPerms.includes(test.perm);
        const icon = has ? '✅' : '❌';
        console.log(`   ${icon} ${test.perm}: ${has ? 'GRANTED' : 'DENIED'}`);
      });
    }

    console.log('\n\n🎉 RBAC System Test Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start your server: npm run dev');
    console.log('   2. Log out and log back in to your app');
    console.log('   3. Check browser console for user.permissions');
    console.log('   4. Visit /settings/roles to manage roles');
    console.log('   5. Check sidebar - should only show permitted items\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.log('\n💡 Common issues:');
    console.log('   - Tables not created: Run "npx prisma db push"');
    console.log('   - No permissions: Run "npx ts-node prisma/migrate-roles.ts"');
    console.log('   - Connection error: Check your DATABASE_URL in .env\n');
  }
}

testRBAC()
  .finally(() => prisma.$disconnect());
