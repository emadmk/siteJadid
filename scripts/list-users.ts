// Script to list all users in the database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== User List ===\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accountType: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (users.length === 0) {
    console.log('No users found in database.');
    console.log('\nTo create a test user, sign up at: /auth/signup');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${users.length} user(s):\n`);

  users.forEach((user: any, index: number) => {
    console.log(`${index + 1}. Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Account Type: ${user.accountType}`);
    console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
    console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    console.log('');
  });

  console.log('\nTo make a user admin, run:');
  console.log('npm run admin:make\n');

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
