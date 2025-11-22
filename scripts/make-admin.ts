// Script to make a user admin
import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('\n=== Make User Admin Script ===\n');

  // List all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      accountType: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (users.length === 0) {
    console.log('No users found in database.');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  console.log('Current Users:\n');
  users.forEach((user: any, index: number) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Account Type: ${user.accountType}`);
    console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
    console.log('');
  });

  const emailInput = await question('Enter the email address of the user you want to make admin: ');

  const user = users.find((u) => u.email.toLowerCase() === emailInput.toLowerCase().trim());

  if (!user) {
    console.log(`\nUser with email "${emailInput}" not found.`);
    rl.close();
    await prisma.$disconnect();
    return;
  }

  console.log(`\nSelected user: ${user.email} (${user.name || 'No name'})`);
  console.log(`Current role: ${user.role}`);

  const roleChoice = await question(
    '\nChoose role:\n1. SUPER_ADMIN (full access)\n2. ADMIN (admin access)\n3. WAREHOUSE_MANAGER\n4. ACCOUNTANT\n5. CUSTOMER_SERVICE\n\nEnter choice (1-5): '
  );

  let newRole = 'ADMIN';
  switch (roleChoice.trim()) {
    case '1':
      newRole = 'SUPER_ADMIN';
      break;
    case '2':
      newRole = 'ADMIN';
      break;
    case '3':
      newRole = 'WAREHOUSE_MANAGER';
      break;
    case '4':
      newRole = 'ACCOUNTANT';
      break;
    case '5':
      newRole = 'CUSTOMER_SERVICE';
      break;
    default:
      console.log('Invalid choice, defaulting to ADMIN');
      newRole = 'ADMIN';
  }

  const confirm = await question(`\nConfirm: Change ${user.email}'s role to ${newRole}? (yes/no): `);

  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('\nOperation cancelled.');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  // Update user role
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: newRole as any },
  });

  console.log(`\n✅ Success! User ${updatedUser.email} is now a ${newRole}`);
  console.log('\nYou can now login and access the admin panel at /admin');

  rl.close();
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => {
    rl.close();
  });
