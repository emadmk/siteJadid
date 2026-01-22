/**
 * Check PIP Product Data
 * Usage: node scripts/check-pip-product.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check product 07-K200
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { sku: { contains: '07-K200' } },
        { vendorPartNumber: { contains: '07-K200' } },
      ]
    },
    include: {
      variants: true
    }
  });

  if (!product) {
    console.log('Product not found');
    return;
  }

  console.log('=== PRODUCT ===');
  console.log('ID:', product.id);
  console.log('SKU:', product.sku);
  console.log('Name:', product.name);
  console.log('priceUnit:', product.priceUnit);
  console.log('basePrice:', product.basePrice);
  console.log('costPrice:', product.costPrice);
  console.log('minimumOrderQty:', product.minimumOrderQty);
  console.log('qtyPerPack:', product.qtyPerPack);
  console.log('');

  console.log('=== VARIANTS ===');
  for (const v of product.variants) {
    console.log(`--- Variant: ${v.sku} ---`);
    console.log('  ID:', v.id);
    console.log('  priceUnit:', v.priceUnit);
    console.log('  basePrice:', v.basePrice);
    console.log('  costPrice:', v.costPrice);
    console.log('  attributes:', JSON.stringify(v.attributes));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
