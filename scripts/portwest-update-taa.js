/**
 * PortWest TAA Update Script
 *
 * Reads TAA status from Excel (COO sheet + GS Upload column 55)
 * and ONLY updates taaApproved field on existing PortWest products.
 *
 * Does NOT touch: images, prices, categories, status, variants, or anything else.
 *
 * Usage:
 *   node scripts/portwest-update-taa.js                    # dry run
 *   node scripts/portwest-update-taa.js --apply            # apply changes
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--apply');
const EXCEL_FILE = 'GS Import - PortWest (Apr-26)-working (2).xlsx';

async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Reading ${EXCEL_FILE}...`);

  const wb = XLSX.readFile(EXCEL_FILE);
  console.log(`Sheets: ${wb.SheetNames.join(', ')}`);

  // Read COO sheet (style-level TAA)
  const cooSheet = wb.Sheets['COO'];
  const cooRows = XLSX.utils.sheet_to_json(cooSheet, { defval: '' });
  console.log(`\nCOO sheet: ${cooRows.length} rows`);

  // Build style → TAA map
  const taaMap = new Map();
  let taaCount = 0;
  let nonTaaCount = 0;

  for (const row of cooRows) {
    const style = String(row['STYLE'] || '').trim();
    const taa = String(row['TAA'] || '').trim().toLowerCase();
    if (!style) continue;

    if (taa.includes('approved') && !taa.includes('not')) {
      taaMap.set(style, true);
      taaCount++;
    } else {
      taaMap.set(style, false);
      nonTaaCount++;
    }
  }

  console.log(`TAA Approved: ${taaCount}, Not TAA: ${nonTaaCount}`);

  // Find all PortWest products
  const portwestProducts = await prisma.product.findMany({
    where: {
      originalCategory: { startsWith: 'PortWest' },
    },
    select: { id: true, sku: true, taaApproved: true },
  });

  console.log(`\nPortWest products in DB: ${portwestProducts.length}`);

  let updated = 0;
  let alreadyCorrect = 0;
  let notFound = 0;

  for (const product of portwestProducts) {
    const sku = product.sku;
    const shouldBeTaa = taaMap.get(sku);

    if (shouldBeTaa === undefined) {
      notFound++;
      continue;
    }

    if (product.taaApproved === shouldBeTaa) {
      alreadyCorrect++;
      continue;
    }

    if (!DRY_RUN) {
      await prisma.product.update({
        where: { id: product.id },
        data: { taaApproved: shouldBeTaa },
      });
    }
    updated++;
    if (updated <= 10 || DRY_RUN) {
      console.log(`  ${shouldBeTaa ? '✓ TAA' : '✗ Non-TAA'}: ${sku}`);
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Updated:         ${updated}`);
  console.log(`Already correct: ${alreadyCorrect}`);
  console.log(`Not in COO:      ${notFound} (no TAA data for these styles)`);

  if (DRY_RUN) {
    console.log(`\n*** DRY RUN - nothing changed. Run with --apply to update ***`);
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
