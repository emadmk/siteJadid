/**
 * Fix ALL Prices Script
 *
 * For BOTH products AND variants: basePrice should be Price Per Unit
 * The total pack price is calculated: basePrice × minimumOrderQty
 *
 * Usage: node scripts/fix-all-prices.js
 */

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('Fix ALL Prices - Products & Variants');
  console.log('Set basePrice = Price Per Unit (not pack price)');
  console.log('='.repeat(60));

  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  const files = fs.readdirSync(uploadsDir).filter(f =>
    f.startsWith('Pricing-') && f.endsWith('.xlsx')
  );

  let totalProductsUpdated = 0;
  let totalVariantsUpdated = 0;
  let totalSkipped = 0;

  for (const file of files) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Processing: ${file}`);
    console.log('='.repeat(50));

    const filePath = path.join(uploadsDir, file);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const headers = data[0];

    // Find column indices
    const typeIdx = headers.findIndex(h => h?.toString().toUpperCase() === 'TYPE');
    const productSkuIdx = headers.findIndex(h => h?.toString().toUpperCase() === 'PRODUCT SKU');
    const skuIdx = headers.findIndex(h => h?.toString().toUpperCase() === 'SKU');
    const pricePerUnitIdx = headers.findIndex(h =>
      h?.toString().toLowerCase().includes('price per unit')
    );
    const mouIdx = headers.findIndex(h => h?.toString().toUpperCase() === 'MOU');
    const unitIdx = headers.findIndex(h => h?.toString().toUpperCase() === 'UNIT');
    const qtyPerPackIdx = headers.findIndex(h =>
      h?.toString().toLowerCase().includes('qty per pack')
    );

    console.log(`Column indices: Type=${typeIdx}, SKU=${skuIdx}, PricePerUnit=${pricePerUnitIdx}, MOU=${mouIdx}`);

    let productsUpdated = 0;
    let variantsUpdated = 0;
    let skipped = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const type = row[typeIdx]?.toString()?.trim()?.toLowerCase() || '';
      const sku = row[skuIdx]?.toString()?.trim();
      const productSku = row[productSkuIdx]?.toString()?.trim();
      const pricePerUnit = parseFloat(row[pricePerUnitIdx]) || 0;
      const mou = parseInt(row[mouIdx]) || 1;
      const unit = row[unitIdx]?.toString()?.trim()?.toLowerCase() || 'ea';
      const qtyPerPack = parseInt(row[qtyPerPackIdx]) || 1;

      if (!sku || pricePerUnit <= 0) continue;

      if (type === 'product') {
        // Update product
        try {
          const product = await prisma.product.findUnique({ where: { sku } });
          if (product) {
            await prisma.product.update({
              where: { sku },
              data: {
                basePrice: pricePerUnit,  // Unit price, NOT pack price!
                minimumOrderQty: mou,
                priceUnit: unit,
                qtyPerPack: qtyPerPack,
              },
            });
            productsUpdated++;
          } else {
            skipped++;
          }
        } catch (e) {
          // Skip errors
        }
      } else {
        // Update variant (type === 'variant' or anything else)
        try {
          const variant = await prisma.productVariant.findUnique({ where: { sku } });
          if (variant) {
            await prisma.productVariant.update({
              where: { sku },
              data: {
                basePrice: pricePerUnit,  // Unit price, NOT pack price!
              },
            });
            variantsUpdated++;

            // Also update parent product's MOU and unit if we have productSku
            if (productSku) {
              await prisma.product.updateMany({
                where: { sku: productSku },
                data: {
                  minimumOrderQty: mou,
                  priceUnit: unit,
                  qtyPerPack: qtyPerPack,
                },
              });
            }
          } else {
            // Maybe it's actually a product?
            const product = await prisma.product.findUnique({ where: { sku } });
            if (product) {
              await prisma.product.update({
                where: { sku },
                data: {
                  basePrice: pricePerUnit,
                  minimumOrderQty: mou,
                  priceUnit: unit,
                  qtyPerPack: qtyPerPack,
                },
              });
              productsUpdated++;
            } else {
              skipped++;
            }
          }
        } catch (e) {
          // Skip errors
        }
      }

      // Progress log every 1000
      if ((productsUpdated + variantsUpdated) % 1000 === 0 && (productsUpdated + variantsUpdated) > 0) {
        console.log(`  Progress: ${productsUpdated} products, ${variantsUpdated} variants...`);
      }
    }

    console.log(`\nFile completed:`);
    console.log(`  Products updated: ${productsUpdated}`);
    console.log(`  Variants updated: ${variantsUpdated}`);
    console.log(`  Skipped: ${skipped}`);

    totalProductsUpdated += productsUpdated;
    totalVariantsUpdated += variantsUpdated;
    totalSkipped += skipped;
  }

  console.log('\n' + '='.repeat(60));
  console.log('TOTAL RESULTS:');
  console.log('='.repeat(60));
  console.log(`Products updated: ${totalProductsUpdated}`);
  console.log(`Variants updated: ${totalVariantsUpdated}`);
  console.log(`Skipped: ${totalSkipped}`);

  // Verify samples
  console.log('\n--- Sample Products ---');
  const sampleProducts = await prisma.product.findMany({
    where: { minimumOrderQty: { gt: 1 } },
    take: 5,
    select: { sku: true, name: true, basePrice: true, minimumOrderQty: true, priceUnit: true },
    orderBy: { updatedAt: 'desc' },
  });

  sampleProducts.forEach(p => {
    const packPrice = Number(p.basePrice) * p.minimumOrderQty;
    console.log(`${p.sku}:`);
    console.log(`  Unit Price: $${Number(p.basePrice).toFixed(2)} per ${p.priceUnit}`);
    console.log(`  Pack Price: $${packPrice.toFixed(2)} for ${p.minimumOrderQty} ${p.priceUnit}s`);
  });

  console.log('\n--- Sample Variants ---');
  const sampleVariants = await prisma.productVariant.findMany({
    take: 5,
    include: { product: { select: { minimumOrderQty: true, priceUnit: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  sampleVariants.forEach(v => {
    const packPrice = Number(v.basePrice) * v.product.minimumOrderQty;
    console.log(`${v.sku}: Unit=$${Number(v.basePrice).toFixed(2)} × ${v.product.minimumOrderQty} = Pack $${packPrice.toFixed(2)}`);
  });

  await prisma.$disconnect();
  console.log('\nDone!');
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
