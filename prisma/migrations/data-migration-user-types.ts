/**
 * Data Migration Script: User Types & Pricing
 *
 * This script safely migrates data without deleting anything:
 * 1. Copies gsaPrice → governmentPrice
 * 2. Copies wholesalePrice → volumeBuyerPrice
 * 3. Sets taaApproved = true where gsaPrice was set
 * 4. Updates AccountType: B2C → PERSONAL, B2B → VOLUME_BUYER, GSA → GOVERNMENT
 * 5. Updates UserRole for existing users
 *
 * Run with: npx ts-node prisma/migrations/data-migration-user-types.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting data migration...\n');

  // ============================================
  // STEP 1: Migrate Product prices
  // ============================================
  console.log('📦 STEP 1: Migrating Product prices...');

  // Copy gsaPrice to governmentPrice
  const productsWithGsaPrice = await prisma.product.updateMany({
    where: {
      gsaPrice: { not: null },
      governmentPrice: null // Only update if not already set
    },
    data: {
      // Can't copy in updateMany, need to do raw query
    }
  });

  // Use raw SQL for copying gsaPrice to governmentPrice
  await prisma.$executeRaw`
    UPDATE "Product"
    SET "governmentPrice" = "gsaPrice"
    WHERE "gsaPrice" IS NOT NULL
    AND "governmentPrice" IS NULL
  `;
  console.log('   ✅ Copied gsaPrice → governmentPrice for Products');

  // Copy wholesalePrice to volumeBuyerPrice
  await prisma.$executeRaw`
    UPDATE "Product"
    SET "volumeBuyerPrice" = "wholesalePrice"
    WHERE "wholesalePrice" IS NOT NULL
    AND "volumeBuyerPrice" IS NULL
  `;
  console.log('   ✅ Copied wholesalePrice → volumeBuyerPrice for Products');

  // Set taaApproved = true where gsaPrice was set
  await prisma.$executeRaw`
    UPDATE "Product"
    SET "taaApproved" = true
    WHERE "gsaPrice" IS NOT NULL
  `;
  console.log('   ✅ Set taaApproved = true for Products with gsaPrice');

  // ============================================
  // STEP 2: Migrate ProductVariant prices
  // ============================================
  console.log('\n📦 STEP 2: Migrating ProductVariant prices...');

  // Copy gsaPrice to governmentPrice for variants
  await prisma.$executeRaw`
    UPDATE "ProductVariant"
    SET "governmentPrice" = "gsaPrice"
    WHERE "gsaPrice" IS NOT NULL
    AND "governmentPrice" IS NULL
  `;
  console.log('   ✅ Copied gsaPrice → governmentPrice for ProductVariants');

  // Copy wholesalePrice to volumeBuyerPrice for variants
  await prisma.$executeRaw`
    UPDATE "ProductVariant"
    SET "volumeBuyerPrice" = "wholesalePrice"
    WHERE "wholesalePrice" IS NOT NULL
    AND "volumeBuyerPrice" IS NULL
  `;
  console.log('   ✅ Copied wholesalePrice → volumeBuyerPrice for ProductVariants');

  // ============================================
  // STEP 3: Migrate User AccountTypes
  // ============================================
  console.log('\n👤 STEP 3: Migrating User AccountTypes...');

  // B2C → PERSONAL
  const b2cUpdated = await prisma.$executeRaw`
    UPDATE "User"
    SET "accountType" = 'PERSONAL'
    WHERE "accountType" = 'B2C'
  `;
  console.log(`   ✅ Updated B2C → PERSONAL`);

  // B2B → VOLUME_BUYER
  const b2bUpdated = await prisma.$executeRaw`
    UPDATE "User"
    SET "accountType" = 'VOLUME_BUYER'
    WHERE "accountType" = 'B2B'
  `;
  console.log(`   ✅ Updated B2B → VOLUME_BUYER`);

  // GSA → GOVERNMENT
  const gsaUpdated = await prisma.$executeRaw`
    UPDATE "User"
    SET "accountType" = 'GOVERNMENT'
    WHERE "accountType" = 'GSA'
  `;
  console.log(`   ✅ Updated GSA → GOVERNMENT`);

  // ============================================
  // STEP 4: Copy GSA approval status to new field
  // ============================================
  console.log('\n🔐 STEP 4: Copying approval status...');

  await prisma.$executeRaw`
    UPDATE "User"
    SET "approvalStatus" = "gsaApprovalStatus"::text::"UserApprovalStatus"
    WHERE "gsaApprovalStatus" IS NOT NULL
    AND "approvalStatus" IS NULL
  `;
  console.log('   ✅ Copied gsaApprovalStatus → approvalStatus');

  // Copy gsaDepartment to governmentDepartment
  await prisma.$executeRaw`
    UPDATE "User"
    SET "governmentDepartment" = "gsaDepartment"
    WHERE "gsaDepartment" IS NOT NULL
    AND "governmentDepartment" IS NULL
  `;
  console.log('   ✅ Copied gsaDepartment → governmentDepartment');

  // ============================================
  // STEP 5: Update UserRoles
  // ============================================
  console.log('\n👥 STEP 5: Updating UserRoles...');

  // B2B_CUSTOMER → VOLUME_BUYER_CUSTOMER
  await prisma.$executeRaw`
    UPDATE "User"
    SET "role" = 'VOLUME_BUYER_CUSTOMER'
    WHERE "role" = 'B2B_CUSTOMER'
  `;
  console.log('   ✅ Updated B2B_CUSTOMER → VOLUME_BUYER_CUSTOMER');

  // GSA_CUSTOMER → GOVERNMENT_CUSTOMER
  await prisma.$executeRaw`
    UPDATE "User"
    SET "role" = 'GOVERNMENT_CUSTOMER'
    WHERE "role" = 'GSA_CUSTOMER'
  `;
  console.log('   ✅ Updated GSA_CUSTOMER → GOVERNMENT_CUSTOMER');

  // CUSTOMER → PERSONAL_CUSTOMER (only for regular customers)
  await prisma.$executeRaw`
    UPDATE "User"
    SET "role" = 'PERSONAL_CUSTOMER'
    WHERE "role" = 'CUSTOMER'
  `;
  console.log('   ✅ Updated CUSTOMER → PERSONAL_CUSTOMER');

  // ============================================
  // STEP 6: Create default discount settings
  // ============================================
  console.log('\n⚙️ STEP 6: Creating default discount settings...');

  // Check if settings already exist
  const existingSettings = await prisma.userTypeDiscountSettings.count();

  if (existingSettings === 0) {
    // Create default global settings for each user type
    await prisma.userTypeDiscountSettings.createMany({
      data: [
        {
          accountType: 'PERSONAL',
          discountPercentage: 0,
          minimumOrderAmount: 0,
          isActive: true
        },
        {
          accountType: 'VOLUME_BUYER',
          discountPercentage: 5,
          minimumOrderAmount: 500,
          isActive: true
        },
        {
          accountType: 'GOVERNMENT',
          discountPercentage: 0,
          minimumOrderAmount: 0,
          isActive: true
        }
      ]
    });
    console.log('   ✅ Created default discount settings for all user types');
  } else {
    console.log('   ⏭️ Discount settings already exist, skipping...');
  }

  // ============================================
  // VERIFICATION
  // ============================================
  console.log('\n📊 VERIFICATION:');

  const productStats = await prisma.product.aggregate({
    _count: { _all: true },
  });
  const productsWithGovPrice = await prisma.product.count({
    where: { governmentPrice: { not: null } }
  });
  const productsWithTaa = await prisma.product.count({
    where: { taaApproved: true }
  });

  console.log(`   Products: ${productStats._count._all}`);
  console.log(`   Products with governmentPrice: ${productsWithGovPrice}`);
  console.log(`   Products with taaApproved: ${productsWithTaa}`);

  const userStats = await prisma.user.groupBy({
    by: ['accountType'],
    _count: true
  });
  console.log('   User counts by type:');
  userStats.forEach(stat => {
    console.log(`     - ${stat.accountType}: ${stat._count}`);
  });

  console.log('\n✨ Migration completed successfully!');
  console.log('\n⚠️ IMPORTANT: Old columns (gsaPrice, wholesalePrice, gsaApprovalStatus, gsaDepartment) are preserved.');
  console.log('   They can be removed in a future migration after verification.');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
