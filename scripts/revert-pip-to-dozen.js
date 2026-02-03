/**
 * Revert PIP Products to Dozen Pricing
 *
 * Updates PIP products from Excel file:
 * - basePrice = Website Price 22% / 12 (per pair)
 * - costPrice = Price Per UM / 12 (per pair)
 * - priceUnit = 'pr' (pair)
 * - minimumOrderQty = 12 (1 dozen)
 * - qtyPerPack = 1
 *
 * IMPORTANT: Updates both Product AND all ProductVariants
 *
 * Usage: node scripts/revert-pip-to-dozen.js
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

const EXCEL_FILE = path.join(__dirname, '../public/uploads/PIP-Price-updated Single revert to  dozen MOU-1- Feb 26.xlsx');

// SKU normalization: Excel has "07-K200/L", DB might have "PIP-07-K200/L" or "07-K200/L"
function normalizeSkuForSearch(sku) {
  return [
    sku,
    `PIP-${sku}`,
    sku.replace('PIP-', ''),
    sku.replace(/\//g, '-'), // Replace / with -
    `PIP-${sku.replace(/\//g, '-')}`,
  ];
}

async function main() {
  console.log('='.repeat(60));
  console.log('PIP Revert to Dozen Pricing Script');
  console.log('='.repeat(60));
  console.log('');
  console.log('Logic:');
  console.log('  - basePrice = Website Price 22% / 12 (per pair)');
  console.log('  - costPrice = Price Per UM / 12 (per pair)');
  console.log('  - priceUnit = "pr" (pair)');
  console.log('  - minimumOrderQty = 12 (1 dozen)');
  console.log('');

  // Read Excel file
  console.log(`Reading Excel file: ${EXCEL_FILE}`);
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Find header row (row 4, index 4)
  const headers = data[4];
  const colMap = {};
  headers.forEach((h, i) => {
    if (h) colMap[h] = i;
  });

  console.log(`Found ${data.length - 5} data rows`);
  console.log('');

  // Process rows
  const results = {
    productsUpdated: 0,
    variantsUpdated: 0,
    notFound: [],
    errors: [],
    skipped: 0,
  };

  // Start from row 5 (index 5, after header)
  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[colMap['SKU']]) {
      results.skipped++;
      continue;
    }

    const sku = String(row[colMap['SKU']]).trim();
    const pricePerUM = parseFloat(row[colMap['Price Per UM']]) || 0;
    const websitePrice = parseFloat(row[colMap['Website Price 22%']]) || 0;

    // Calculate per-pair prices (divide dozen price by 12)
    const costPricePerPair = Math.round((pricePerUM / 12) * 100) / 100;
    const basePricePerPair = Math.round((websitePrice / 12) * 100) / 100;

    // Skip if prices are invalid
    if (basePricePerPair <= 0) {
      results.skipped++;
      continue;
    }

    // Try to find product or variant
    const skuVariants = normalizeSkuForSearch(sku);

    let found = false;

    // Try Product table first
    for (const searchSku of skuVariants) {
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { sku: searchSku },
            { vendorPartNumber: searchSku },
          ]
        },
        include: {
          variants: true
        }
      });

      if (product) {
        try {
          // Update product
          await prisma.product.update({
            where: { id: product.id },
            data: {
              priceUnit: 'pr',
              costPrice: costPricePerPair,
              basePrice: basePricePerPair,
              minimumOrderQty: 12,
              qtyPerPack: 1,
            }
          });
          results.productsUpdated++;

          // Update ALL variants of this product
          if (product.variants && product.variants.length > 0) {
            for (const variant of product.variants) {
              await prisma.productVariant.update({
                where: { id: variant.id },
                data: {
                  priceUnit: 'pr',
                  costPrice: costPricePerPair,
                  basePrice: basePricePerPair,
                  qtyPerPack: 1,
                }
              });
              results.variantsUpdated++;
            }
          }

          found = true;

          if ((results.productsUpdated + results.variantsUpdated) % 200 === 0) {
            console.log(`Progress: ${results.productsUpdated} products, ${results.variantsUpdated} variants updated...`);
          }
          break;
        } catch (err) {
          results.errors.push({ sku, error: err.message });
        }
      }
    }

    // If not found in Product, try ProductVariant directly
    if (!found) {
      for (const searchSku of skuVariants) {
        const variant = await prisma.productVariant.findFirst({
          where: { sku: searchSku },
          include: { product: { include: { variants: true } } }
        });

        if (variant) {
          try {
            // Update the variant
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: {
                priceUnit: 'pr',
                costPrice: costPricePerPair,
                basePrice: basePricePerPair,
                qtyPerPack: 1,
              }
            });
            results.variantsUpdated++;

            // Also update parent product
            await prisma.product.update({
              where: { id: variant.productId },
              data: {
                priceUnit: 'pr',
                costPrice: costPricePerPair,
                basePrice: basePricePerPair,
                minimumOrderQty: 12,
                qtyPerPack: 1,
              }
            });
            results.productsUpdated++;

            // Update ALL other variants of the same product
            if (variant.product.variants && variant.product.variants.length > 1) {
              for (const otherVariant of variant.product.variants) {
                if (otherVariant.id !== variant.id) {
                  await prisma.productVariant.update({
                    where: { id: otherVariant.id },
                    data: {
                      priceUnit: 'pr',
                      // Keep their own prices, just update unit
                      qtyPerPack: 1,
                    }
                  });
                }
              }
            }

            found = true;

            if ((results.productsUpdated + results.variantsUpdated) % 200 === 0) {
              console.log(`Progress: ${results.productsUpdated} products, ${results.variantsUpdated} variants updated...`);
            }
            break;
          } catch (err) {
            results.errors.push({ sku, error: err.message });
          }
        }
      }
    }

    if (!found) {
      results.notFound.push(sku);
    }
  }

  // Print results
  console.log('');
  console.log('='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Products Updated: ${results.productsUpdated}`);
  console.log(`✅ Variants Updated: ${results.variantsUpdated}`);
  console.log(`⏭️  Skipped (empty/invalid rows): ${results.skipped}`);
  console.log(`❌ Not Found: ${results.notFound.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}`);
  console.log('');

  if (results.notFound.length > 0) {
    console.log('--- SKUs Not Found (first 30) ---');
    results.notFound.slice(0, 30).forEach(sku => {
      console.log(`  - ${sku}`);
    });
    if (results.notFound.length > 30) {
      console.log(`  ... and ${results.notFound.length - 30} more`);
    }
    console.log('');
  }

  if (results.errors.length > 0) {
    console.log('--- Errors ---');
    results.errors.forEach(({ sku, error }) => {
      console.log(`  - ${sku}: ${error}`);
    });
    console.log('');
  }

  console.log('Done!');
  console.log('');
  console.log('New pricing structure:');
  console.log('  - Price shown: per pair');
  console.log('  - Minimum order: 12 pairs (1 dozen)');
  console.log('  - Total = 12 × price per pair');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
