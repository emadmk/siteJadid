/**
 * Migration script: Move existing variant names to the Size field
 *
 * This script:
 * 1. Finds all variants that have a name but no size value
 * 2. Copies the variant name to the size field
 * 3. Preserves all existing data
 *
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-variant-names-to-size.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Moving variant names to size field...\n');

  // Find all variants that have a name but no size
  const variantsToUpdate = await prisma.productVariant.findMany({
    where: {
      size: null,
      name: {
        not: '',
      },
    },
    select: {
      id: true,
      sku: true,
      name: true,
      size: true,
      product: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(`Found ${variantsToUpdate.length} variants to update.\n`);

  if (variantsToUpdate.length === 0) {
    console.log('No variants need migration. All variants either have a size or no name.');
    return;
  }

  // Preview changes
  console.log('Preview of changes:');
  console.log('-------------------');
  variantsToUpdate.slice(0, 10).forEach((v) => {
    console.log(`SKU: ${v.sku}`);
    console.log(`  Product: ${v.product.name}`);
    console.log(`  Current name: "${v.name}"`);
    console.log(`  Will set size to: "${v.name}"`);
    console.log('');
  });

  if (variantsToUpdate.length > 10) {
    console.log(`... and ${variantsToUpdate.length - 10} more variants.\n`);
  }

  // Ask for confirmation (in non-interactive mode, just proceed)
  console.log('Proceeding with migration...\n');

  // Update variants in batches
  const batchSize = 100;
  let updated = 0;

  for (let i = 0; i < variantsToUpdate.length; i += batchSize) {
    const batch = variantsToUpdate.slice(i, i + batchSize);

    await Promise.all(
      batch.map((v) =>
        prisma.productVariant.update({
          where: { id: v.id },
          data: { size: v.name },
        })
      )
    );

    updated += batch.length;
    console.log(`Updated ${updated}/${variantsToUpdate.length} variants...`);
  }

  console.log('\n✅ Migration completed successfully!');
  console.log(`Total variants updated: ${updated}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
