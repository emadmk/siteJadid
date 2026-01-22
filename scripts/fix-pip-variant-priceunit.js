/**
 * Fix PIP Variant priceUnit
 *
 * Sets priceUnit to 'pr' (pair) for all PIP variants that currently have 'DZ' (dozen)
 *
 * Usage: node scripts/fix-pip-variant-priceunit.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('Fix PIP Variant priceUnit');
  console.log('='.repeat(60));
  console.log('');

  // Find all PIP variants that have priceUnit = 'DZ' or 'dz'
  const variants = await prisma.productVariant.findMany({
    where: {
      product: {
        OR: [
          { sku: { startsWith: 'PIP-' } },
          { vendorPartNumber: { startsWith: 'PIP-' } },
          { brand: { name: { contains: 'PIP' } } },
        ]
      },
      priceUnit: { in: ['DZ', 'dz', 'dozen'] }
    },
    include: {
      product: {
        select: { sku: true, name: true, priceUnit: true }
      }
    }
  });

  console.log(`Found ${variants.length} PIP variants with 'DZ' priceUnit`);
  console.log('');

  if (variants.length === 0) {
    console.log('No variants to fix!');
    return;
  }

  // Update each variant
  let updated = 0;
  for (const variant of variants) {
    try {
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { priceUnit: 'pr' }
      });
      updated++;

      if (updated % 100 === 0) {
        console.log(`Progress: ${updated}/${variants.length} variants updated...`);
      }
    } catch (err) {
      console.error(`Error updating variant ${variant.sku}: ${err.message}`);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`Done! Updated ${updated} variants from 'DZ' to 'pr'`);
  console.log('='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
