/**
 * Data Migration Script: User Types & Pricing
 * Run with: node prisma/migrations/data-migration-user-types.mjs
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
  // STEP 3: Create default discount settings
  // ============================================
  console.log('\n⚙️ STEP 3: Creating default discount settings...');

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

  const totalProducts = await prisma.product.count();
  const productsWithGovPrice = await prisma.product.count({
    where: { governmentPrice: { not: null } }
  });
  const productsWithVolPrice = await prisma.product.count({
    where: { volumeBuyerPrice: { not: null } }
  });
  const productsWithTaa = await prisma.product.count({
    where: { taaApproved: true }
  });

  console.log(`   Total Products: ${totalProducts}`);
  console.log(`   Products with governmentPrice: ${productsWithGovPrice}`);
  console.log(`   Products with volumeBuyerPrice: ${productsWithVolPrice}`);
  console.log(`   Products with taaApproved=true: ${productsWithTaa}`);

  const discountSettings = await prisma.userTypeDiscountSettings.findMany();
  console.log('\n   Discount Settings:');
  discountSettings.forEach(s => {
    console.log(`     - ${s.accountType}: ${s.discountPercentage}% discount, min order $${s.minimumOrderAmount}`);
  });

  console.log('\n✨ Migration completed successfully!');
  console.log('\n⚠️ Old columns (gsaPrice, wholesalePrice) are preserved for safety.');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
