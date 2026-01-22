/**
 * Fix Variant priceUnit Mismatch
 *
 * Finds variants where parent product has priceUnit='pr' but variant has 'DZ'
 * and updates the variant to match the parent product.
 *
 * Usage: node scripts/fix-variant-priceunit.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('Fix Variant priceUnit Mismatch');
  console.log('='.repeat(60));
  console.log('');

  // Find all variants where product.priceUnit is 'pr' but variant.priceUnit is NOT 'pr'
  const variants = await prisma.productVariant.findMany({
    where: {
      product: {
        priceUnit: 'pr'
      },
      NOT: {
        priceUnit: 'pr'
      }
    },
    include: {
      product: {
        select: { sku: true, name: true, priceUnit: true }
      }
    }
  });

  console.log(`Found ${variants.length} variants with mismatched priceUnit`);
  console.log('');

  if (variants.length === 0) {
    console.log('No variants to fix!');
    return;
  }

  // Show first 5 examples
  console.log('Sample variants to fix:');
  variants.slice(0, 5).forEach(v => {
    console.log(`  Product: ${v.product.sku} (priceUnit: ${v.product.priceUnit})`);
    console.log(`  Variant: ${v.sku} (priceUnit: ${v.priceUnit})`);
    console.log('');
  });

  // Update all variants
  const result = await prisma.productVariant.updateMany({
    where: {
      product: {
        priceUnit: 'pr'
      },
      NOT: {
        priceUnit: 'pr'
      }
    },
    data: {
      priceUnit: 'pr'
    }
  });

  console.log('='.repeat(60));
  console.log(`Done! Updated ${result.count} variants to priceUnit='pr'`);
  console.log('='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
