// Quick script to set a user as admin
// Usage: npm run admin:set user@example.com SUPER_ADMIN
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const role = process.argv[3] || 'SUPER_ADMIN';

  if (!email) {
    console.log('\n❌ Error: Email is required\n');
    console.log('Usage: npm run admin:set <email> [role]');
    console.log('\nExample:');
    console.log('  npm run admin:set user@example.com SUPER_ADMIN');
    console.log('  npm run admin:set user@example.com ADMIN');
    console.log('\nAvailable roles:');
    console.log('  - SUPER_ADMIN (full access)');
    console.log('  - ADMIN (admin access)');
    console.log('  - WAREHOUSE_MANAGER');
    console.log('  - ACCOUNTANT');
    console.log('  - CUSTOMER_SERVICE\n');
    process.exit(1);
  }

  const validRoles = [
    'SUPER_ADMIN',
    'ADMIN',
    'WAREHOUSE_MANAGER',
    'ACCOUNTANT',
    'CUSTOMER_SERVICE',
  ];

  if (!validRoles.includes(role)) {
    console.log(`\n❌ Error: Invalid role "${role}"\n`);
    console.log('Valid roles:', validRoles.join(', '));
    console.log('');
    process.exit(1);
  }

  console.log(`\nSearching for user: ${email}...`);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accountType: true,
    },
  });

  if (!user) {
    console.log(`\n❌ User not found: ${email}`);
    console.log('\nTo see all users, run: npm run admin:list\n');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`\nFound user:`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Name: ${user.name || 'N/A'}`);
  console.log(`  Current Role: ${user.role}`);
  console.log(`  Account Type: ${user.accountType}`);

  if (user.role === role) {
    console.log(`\n✅ User already has role: ${role}\n`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\nUpdating role from ${user.role} to ${role}...`);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: role as any },
  });

  console.log(`\n✅ Success! ${updatedUser.email} is now a ${role}`);
  console.log('\nYou can now login and access the admin panel at /admin\n');

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e.message);
    console.log('');
    process.exit(1);
  });
