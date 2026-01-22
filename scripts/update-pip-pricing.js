/**
 * PIP Pricing Update Script
 *
 * Updates PIP products from Excel file:
 * - priceUnit = 'pr' (Pair)
 * - costPrice = Price Per UM
 * - basePrice = Website Price 22%
 * - minimumOrderQty = 1
 * - qtyPerPack = 1
 *
 * Usage: node scripts/update-pip-pricing.js
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

const EXCEL_FILE = path.join(__dirname, '../public/uploads/PIP-Price-updated dozen to single MOU-21 Jan 26.xlsx');

// SKU normalization: Excel has "07-K200/L", DB might have "PIP-07-K200/L" or "07-K200/L"
function normalizeSkuForSearch(sku) {
  return [
    sku,
    `PIP-${sku}`,
    sku.replace('PIP-', ''),
  ];
}

async function main() {
  console.log('='.repeat(60));
  console.log('PIP Pricing Update Script');
  console.log('='.repeat(60));
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
    updated: 0,
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
    const umNew = String(row[colMap['UM (New)']] || 'PR').trim().toUpperCase();
    const pricePerUM = parseFloat(row[colMap['Price Per UM']]) || 0;
    const websitePrice = parseFloat(row[colMap['Website Price 22%']]) || 0;
    const minSellQty = parseInt(row[colMap['MIN SELL QTY']]) || 1;

    // Map UM to priceUnit
    const priceUnitMap = {
      'PR': 'pr',
      'EA': 'ea',
      'PK': 'pk',
      'DZ': 'DZ',
      'PAIR': 'pr',
      'EACH': 'ea',
    };
    const priceUnit = priceUnitMap[umNew] || 'pr';

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
        }
      });

      if (product) {
        try {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              priceUnit,
              costPrice: pricePerUM,
              basePrice: websitePrice,
              minimumOrderQty: 1,
              qtyPerPack: 1,
            }
          });
          results.updated++;
          found = true;

          if (results.updated % 100 === 0) {
            console.log(`Progress: ${results.updated} products updated...`);
          }
          break;
        } catch (err) {
          results.errors.push({ sku, error: err.message });
        }
      }
    }

    // If not found in Product, try ProductVariant
    if (!found) {
      for (const searchSku of skuVariants) {
        const variant = await prisma.productVariant.findFirst({
          where: { sku: searchSku },
          include: { product: true }
        });

        if (variant) {
          try {
            // Update variant - also update priceUnit!
            await prisma.productVariant.update({
              where: { id: variant.id },
              data: {
                priceUnit,
                costPrice: pricePerUM,
                basePrice: websitePrice,
              }
            });

            // Also update parent product's priceUnit, qtyPerPack, AND prices
            await prisma.product.update({
              where: { id: variant.productId },
              data: {
                priceUnit,
                costPrice: pricePerUM,
                basePrice: websitePrice,
                minimumOrderQty: 1,
                qtyPerPack: 1,
              }
            });

            results.updated++;
            found = true;

            if (results.updated % 100 === 0) {
              console.log(`Progress: ${results.updated} items updated...`);
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
  console.log(`✅ Updated: ${results.updated}`);
  console.log(`⏭️  Skipped (empty rows): ${results.skipped}`);
  console.log(`❌ Not Found: ${results.notFound.length}`);
  console.log(`⚠️  Errors: ${results.errors.length}`);
  console.log('');

  if (results.notFound.length > 0) {
    console.log('--- SKUs Not Found (first 50) ---');
    results.notFound.slice(0, 50).forEach(sku => {
      console.log(`  - ${sku}`);
    });
    if (results.notFound.length > 50) {
      console.log(`  ... and ${results.notFound.length - 50} more`);
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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
