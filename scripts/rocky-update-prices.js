/**
 * Rocky / Georgia Boots - Price-Only Update Script
 *
 * Reads an Excel file and updates ONLY prices for existing products/variants.
 * Does NOT touch: images, descriptions, categories, variants (only prices within variants).
 *
 * Usage:
 *   node scripts/rocky-update-prices.js "GS Import - Rocky (Apr-26)-V3- Working.xlsx"
 *   node scripts/rocky-update-prices.js "GS Import - Rocky (Apr-26)-V3- Working.xlsx" --dry-run
 *
 * Updates:
 *   Product.basePrice        = Personal Buyer Price (from first row of group)
 *   Product.costPrice        = Cost Price
 *   Product.gsaPrice         = Gov Buyer Price
 *   Product.governmentPrice  = Gov Buyer Price
 *   Product.salePrice        = null (cleared)
 *
 *   ProductVariant.basePrice       = Personal Buyer Price (per variant row)
 *   ProductVariant.costPrice       = Cost Price
 *   ProductVariant.gsaPrice        = Gov Buyer Price
 *   ProductVariant.governmentPrice = Gov Buyer Price
 *   ProductVariant.salePrice       = null (cleared)
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');
const filePath = process.argv.find(a => a.endsWith('.xlsx') || a.endsWith('.xls'));

if (!filePath) {
  console.error('Usage: node scripts/rocky-update-prices.js <excel-file> [--dry-run]');
  process.exit(1);
}

function getNum(v) {
  if (v === undefined || v === null || v === '') return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,$]/g, ''));
  return isNaN(n) ? 0 : n;
}

async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Reading ${filePath}...`);

  const wb = XLSX.readFile(filePath);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  console.log(`Found ${rows.length} rows`);

  // Group rows by Supplier Part Number
  const groups = new Map();
  for (const row of rows) {
    const spn = String(row['Supplier Part Number'] || '').trim();
    if (!spn) continue;
    if (!groups.has(spn)) groups.set(spn, []);
    groups.get(spn).push(row);
  }
  console.log(`Grouped into ${groups.size} unique products\n`);

  let productsUpdated = 0;
  let productsNotFound = 0;
  let variantsUpdated = 0;
  let variantsNotFound = 0;

  for (const [spn, groupRows] of groups) {
    const first = groupRows[0];
    const personal = getNum(first['Personal Buyer Price']);
    const cost = getNum(first['Cost Price']);
    const gov = getNum(first['Gov Buyer Price']);

    // Find product by SKU (Supplier Part Number = base SKU)
    const product = await prisma.product.findFirst({
      where: { sku: spn },
    });

    if (!product) {
      productsNotFound++;
      if (productsNotFound <= 10) console.log(`  NOT FOUND: ${spn}`);
      continue;
    }

    // Update product prices
    const productUpdate = {
      basePrice: new Decimal(personal || 0),
      costPrice: cost ? new Decimal(cost) : null,
      gsaPrice: gov ? new Decimal(gov) : null,
      governmentPrice: gov ? new Decimal(gov) : null,
      salePrice: null,
    };

    if (!DRY_RUN) {
      await prisma.product.update({
        where: { id: product.id },
        data: productUpdate,
      });
    }
    productsUpdated++;

    // Update each variant (by Product Code)
    for (const row of groupRows) {
      const variantSku = String(row['Product Code'] || '').trim();
      if (!variantSku) continue;

      const vPersonal = getNum(row['Personal Buyer Price']);
      const vCost = getNum(row['Cost Price']);
      const vGov = getNum(row['Gov Buyer Price']);

      const variant = await prisma.productVariant.findUnique({
        where: { sku: variantSku },
      });

      if (!variant) {
        variantsNotFound++;
        continue;
      }

      if (!DRY_RUN) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            basePrice: new Decimal(vPersonal || personal || 0),
            costPrice: vCost ? new Decimal(vCost) : null,
            gsaPrice: vGov ? new Decimal(vGov) : null,
            governmentPrice: vGov ? new Decimal(vGov) : null,
            salePrice: null,
          },
        });
      }
      variantsUpdated++;
    }

    if (productsUpdated % 50 === 0) {
      console.log(`Progress: ${productsUpdated}/${groups.size} products, ${variantsUpdated} variants`);
    }
  }

  console.log('\n=== Complete ===');
  console.log(`Products updated:     ${productsUpdated}`);
  console.log(`Products not found:   ${productsNotFound}`);
  console.log(`Variants updated:     ${variantsUpdated}`);
  console.log(`Variants not found:   ${variantsNotFound}`);

  if (DRY_RUN) console.log('\n*** DRY RUN - nothing was actually updated ***');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
