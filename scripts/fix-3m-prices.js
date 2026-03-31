/**
 * Fix 3M Product Prices - Divide by MinOrderQty
 *
 * The importer multiplied prices by minOrderQty, but prices should be per-unit.
 * This script reads the Excel file and corrects basePrice, gsaPrice, costPrice, and priceUnit.
 *
 * Usage:
 *   DRY RUN (preview only):  node scripts/fix-3m-prices.js
 *   APPLY CHANGES:           node scripts/fix-3m-prices.js --apply
 */

const { PrismaClient, Decimal } = require('/var/www/siteJadid/node_modules/@prisma/client');
const openpyxl = null; // We'll use a different approach

const db = new PrismaClient();

// UOM mapping from Excel Sales UOM to priceUnit
const UOM_MAP = {
  'Each': 'ea',
  'Roll': 'roll',
  'Case': 'case',
  'Carton': 'carton',
  'Pack': 'pack',
  'Bag': 'bag',
  'Sheet': 'sheet',
  'Kit': 'kit',
  'Pair': 'pair',
  'Assortment': 'assortment',
  'Drum': 'drum',
};

async function main() {
  const applyChanges = process.argv.includes('--apply');

  console.log('=== Fix 3M Product Prices ===');
  console.log(`Mode: ${applyChanges ? '⚠️  APPLYING CHANGES' : '🔍 DRY RUN (preview only)'}\n`);

  // Find all 3M products (SKU starts with 3M-)
  const products = await db.product.findMany({
    where: {
      sku: { startsWith: '3M-' },
    },
    select: {
      id: true,
      sku: true,
      name: true,
      basePrice: true,
      gsaPrice: true,
      costPrice: true,
      minimumOrderQty: true,
      priceUnit: true,
    },
  });

  console.log(`Found ${products.length} 3M products\n`);

  let fixCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const changes = [];

  for (const product of products) {
    const minQty = product.minimumOrderQty || 1;

    // Skip products with minQty=1 (no multiplication happened)
    if (minQty <= 1) {
      skipCount++;
      continue;
    }

    const currentBase = Number(product.basePrice);
    const currentGsa = product.gsaPrice ? Number(product.gsaPrice) : null;
    const currentCost = product.costPrice ? Number(product.costPrice) : null;

    // Calculate correct unit prices (divide by minQty)
    const correctBase = Math.round((currentBase / minQty) * 100) / 100;
    const correctGsa = currentGsa ? Math.round((currentGsa / minQty) * 100) / 100 : null;
    const correctCost = currentCost ? Math.round((currentCost / minQty) * 100) / 100 : null;

    // Skip if price seems already correct (very small, probably already unit price)
    if (currentBase < 1 && minQty > 1) {
      skipCount++;
      continue;
    }

    changes.push({
      id: product.id,
      sku: product.sku,
      name: product.name?.substring(0, 60),
      minQty,
      oldBase: currentBase,
      newBase: correctBase,
      oldGsa: currentGsa,
      newGsa: correctGsa,
      oldCost: currentCost,
      newCost: correctCost,
    });

    fixCount++;
  }

  // Show preview
  console.log(`Products to fix: ${fixCount}`);
  console.log(`Skipped (minQty=1 or already low): ${skipCount}`);
  console.log('');

  // Show first 20 changes
  console.log('=== Preview (first 20) ===');
  for (const change of changes.slice(0, 20)) {
    console.log(`${change.sku} | minQty=${change.minQty}`);
    console.log(`  basePrice: $${change.oldBase} → $${change.newBase}`);
    if (change.oldGsa) console.log(`  gsaPrice:  $${change.oldGsa} → $${change.newGsa}`);
    if (change.oldCost) console.log(`  costPrice: $${change.oldCost} → $${change.newCost}`);
  }
  if (changes.length > 20) {
    console.log(`  ... and ${changes.length - 20} more`);
  }

  console.log('');

  if (!applyChanges) {
    console.log('✅ DRY RUN complete. Run with --apply to apply changes:');
    console.log('   node scripts/fix-3m-prices.js --apply');
    await db.$disconnect();
    return;
  }

  // Apply changes
  console.log('⚠️  Applying changes...');
  let applied = 0;

  for (const change of changes) {
    try {
      const updateData = {
        basePrice: new Decimal(change.newBase.toString()),
      };

      if (change.newGsa !== null) {
        updateData.gsaPrice = new Decimal(change.newGsa.toString());
      }
      if (change.newCost !== null) {
        updateData.costPrice = new Decimal(change.newCost.toString());
      }

      await db.product.update({
        where: { id: change.id },
        data: updateData,
      });

      applied++;
      if (applied % 100 === 0) {
        console.log(`  Updated ${applied}/${changes.length}...`);
      }
    } catch (err) {
      errorCount++;
      console.error(`  ✗ Error updating ${change.sku}: ${err.message}`);
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Applied: ${applied}`);
  console.log(`Errors:  ${errorCount}`);
  console.log(`Skipped: ${skipCount}`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
