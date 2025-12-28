/**
 * Fix Variant Prices Script
 *
 * For variants: basePrice should be Price Per Unit (not Base Price)
 * Because minimumOrderQty is on product level, not variant level.
 *
 * Usage: node scripts/fix-variant-prices.js
 */

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('Fix Variant Prices - Set Per Unit Price');
  console.log('='.repeat(60));

  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  const files = fs.readdirSync(uploadsDir).filter(f =>
    f.startsWith('Pricing-') && f.endsWith('.xlsx')
  );

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const file of files) {
    console.log(`\nProcessing: ${file}`);

    const filePath = path.join(uploadsDir, file);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const headers = data[0];

    // Find column indices
    const typeIdx = headers.findIndex(h => h?.toString().toUpperCase() === 'TYPE');
    const skuIdx = headers.findIndex(h => h?.toString().toUpperCase() === 'SKU');
    const pricePerUnitIdx = headers.findIndex(h =>
      h?.toString().toLowerCase().includes('price per unit')
    );

    console.log(`  Type col: ${typeIdx}, SKU col: ${skuIdx}, Price Per Unit col: ${pricePerUnitIdx}`);

    let fileUpdated = 0;
    let fileSkipped = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const type = row[typeIdx]?.toString()?.trim()?.toLowerCase();
      const sku = row[skuIdx]?.toString()?.trim();
      const pricePerUnit = parseFloat(row[pricePerUnitIdx]) || 0;

      if (!sku || pricePerUnit <= 0) continue;

      // Only update variants
      if (type === 'variant') {
        try {
          const variant = await prisma.productVariant.findUnique({
            where: { sku },
          });

          if (variant) {
            await prisma.productVariant.update({
              where: { sku },
              data: { basePrice: pricePerUnit },
            });
            fileUpdated++;
          } else {
            fileSkipped++;
          }
        } catch (e) {
          totalErrors++;
        }
      }
    }

    console.log(`  Updated: ${fileUpdated}, Skipped: ${fileSkipped}`);
    totalUpdated += fileUpdated;
    totalSkipped += fileSkipped;
  }

  console.log('\n' + '='.repeat(60));
  console.log('RESULTS:');
  console.log('='.repeat(60));
  console.log(`Variants updated: ${totalUpdated}`);
  console.log(`Skipped: ${totalSkipped}`);
  console.log(`Errors: ${totalErrors}`);

  // Verify a sample
  console.log('\n--- Sample verification ---');
  const samples = await prisma.productVariant.findMany({
    take: 5,
    include: { product: { select: { minimumOrderQty: true, priceUnit: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  samples.forEach(v => {
    const packPrice = Number(v.basePrice) * v.product.minimumOrderQty;
    console.log(`${v.sku}: Unit=$${Number(v.basePrice).toFixed(2)} × ${v.product.minimumOrderQty} = Pack $${packPrice.toFixed(2)}`);
  });

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
