/**
 * Apply 3M UOM fixes from JSON file
 *
 * Usage:
 *   python3 scripts/fix-3m-uom.py > /tmp/3m-uom-fixes.json
 *   node scripts/apply-3m-uom.js                # dry run
 *   node scripts/apply-3m-uom.js --apply        # apply
 */
const fs = require('fs');
const { PrismaClient } = require('/var/www/siteJadid/node_modules/@prisma/client');
const db = new PrismaClient();

async function main() {
  const applyChanges = process.argv.includes('--apply');

  const fixes = JSON.parse(fs.readFileSync('/tmp/3m-uom-fixes.json', 'utf8'));
  const skus = Object.keys(fixes);

  console.log(`=== Fix 3M UOM ===`);
  console.log(`Mode: ${applyChanges ? '⚠️  APPLYING' : '🔍 DRY RUN'}`);
  console.log(`Fixes to apply: ${skus.length}\n`);

  const products = await db.product.findMany({
    where: { sku: { in: skus } },
    select: { id: true, sku: true, priceUnit: true, name: true },
  });

  console.log(`Matched ${products.length} products in DB\n`);

  let count = 0;
  for (const product of products) {
    const newUnit = fixes[product.sku];
    if (!newUnit || product.priceUnit === newUnit) continue;

    console.log(`${product.sku}: "${product.priceUnit}" → "${newUnit}"`);

    if (applyChanges) {
      await db.product.update({
        where: { id: product.id },
        data: { priceUnit: newUnit },
      });
    }
    count++;
  }

  console.log(`\n${applyChanges ? 'Updated' : 'Would update'}: ${count} products`);
  await db.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
