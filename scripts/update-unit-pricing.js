/**
 * Update Unit Pricing Script
 *
 * This script reads pricing Excel files and updates products/variants with:
 * - basePrice = Base Price from Excel (MOU × Per Unit)
 * - minimumOrderQty = MOU from Excel
 * - priceUnit = Unit from Excel (ea, pr, DZ, etc.)
 * - qtyPerPack = Qty Per Pack from Excel
 *
 * Usage:
 *   node scripts/update-unit-pricing.js
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

/**
 * Parse pricing Excel file
 */
function parseExcelFile(filePath) {
  console.log(`\nParsing: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Find header row
  const headers = data[0];
  console.log('Headers:', headers);

  // Map column indices
  const colMap = {};
  headers.forEach((h, i) => {
    if (h) colMap[h.toString().trim()] = i;
  });

  // Determine column positions based on file format
  const typeIdx = colMap['Type'] ?? 0;
  const productSkuIdx = colMap['Product SKU'] ?? 1;
  const skuIdx = colMap['SKU'] ?? 2;

  // Find name column
  let nameIdx = colMap['Name'];
  if (nameIdx === undefined) {
    nameIdx = headers.findIndex(h => h?.toString().toLowerCase() === 'name');
  }

  // Find pricing columns
  const pricePerUnitIdx = headers.findIndex(h =>
    h?.toString().toLowerCase().includes('price per unit')
  );
  const mouIdx = headers.findIndex(h =>
    h?.toString().toUpperCase() === 'MOU'
  );
  const unitIdx = headers.findIndex(h =>
    h?.toString().toUpperCase() === 'UNIT'
  );
  const qtyPerPackIdx = headers.findIndex(h =>
    h?.toString().toLowerCase().includes('qty per pack')
  );
  const basePriceIdx = headers.findIndex(h =>
    h?.toString().toLowerCase() === 'base price'
  );
  const salePriceIdx = headers.findIndex(h =>
    h?.toString().toLowerCase() === 'sale price'
  );
  const gsaPriceIdx = headers.findIndex(h =>
    h?.toString().toLowerCase() === 'gsa price'
  );
  const wholesalePriceIdx = headers.findIndex(h =>
    h?.toString().toLowerCase() === 'wholesale price'
  );
  const costPriceIdx = headers.findIndex(h =>
    h?.toString().toLowerCase() === 'cost price'
  );

  console.log('Column indices:', {
    type: typeIdx,
    productSku: productSkuIdx,
    sku: skuIdx,
    name: nameIdx,
    pricePerUnit: pricePerUnitIdx,
    mou: mouIdx,
    unit: unitIdx,
    qtyPerPack: qtyPerPackIdx,
    basePrice: basePriceIdx,
  });

  const rows = [];

  // Process data rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !Array.isArray(row)) continue;

    const sku = row[skuIdx]?.toString()?.trim();
    if (!sku) continue;

    const parseNumber = (val) => {
      if (val === undefined || val === null || val === '') return null;
      if (typeof val === 'number') return val;
      const cleaned = val.toString().replace(/[$,\s]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    };

    rows.push({
      type: row[typeIdx]?.toString()?.trim() || 'Variant',
      productSku: row[productSkuIdx]?.toString()?.trim() || '',
      sku,
      name: nameIdx >= 0 ? row[nameIdx]?.toString()?.trim() || '' : '',
      pricePerUnit: parseNumber(row[pricePerUnitIdx]) || 0,
      mou: parseNumber(row[mouIdx]) || 1,
      unit: unitIdx >= 0 ? row[unitIdx]?.toString()?.trim()?.toLowerCase() || 'ea' : 'ea',
      qtyPerPack: parseNumber(row[qtyPerPackIdx]) || 1,
      basePrice: parseNumber(row[basePriceIdx]) || 0,
      salePrice: parseNumber(row[salePriceIdx]),
      gsaPrice: parseNumber(row[gsaPriceIdx]),
      wholesalePrice: parseNumber(row[wholesalePriceIdx]),
      costPrice: parseNumber(row[costPriceIdx]),
    });
  }

  console.log(`Parsed ${rows.length} rows`);

  // Log sample rows
  console.log('\nSample data:');
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const r = rows[i];
    console.log(`  ${r.sku}: Per Unit=$${r.pricePerUnit}, MOU=${r.mou}, Unit=${r.unit}, Base=$${r.basePrice}`);
  }

  return rows;
}

/**
 * Update products and variants from pricing data
 */
async function updatePricing(rows) {
  const stats = {
    productsUpdated: 0,
    variantsUpdated: 0,
    skipped: 0,
    errors: [],
  };

  // Group by type
  const products = rows.filter(r => r.type.toLowerCase() === 'product');
  const variants = rows.filter(r => r.type.toLowerCase() === 'variant' || r.type.toLowerCase() !== 'product');

  console.log(`\nProcessing ${products.length} products and ${variants.length} variants...`);

  // Update products
  for (const row of products) {
    try {
      const product = await prisma.product.findUnique({
        where: { sku: row.sku },
      });

      if (!product) {
        stats.skipped++;
        continue;
      }

      const updateData = {
        basePrice: row.basePrice,
        minimumOrderQty: Math.max(1, Math.round(row.mou)),
        priceUnit: row.unit || 'ea',
        qtyPerPack: Math.max(1, Math.round(row.qtyPerPack)),
      };

      if (row.salePrice !== null) updateData.salePrice = row.salePrice;
      if (row.gsaPrice !== null) updateData.gsaPrice = row.gsaPrice;
      if (row.wholesalePrice !== null) updateData.wholesalePrice = row.wholesalePrice;
      if (row.costPrice !== null) updateData.costPrice = row.costPrice;

      await prisma.product.update({
        where: { sku: row.sku },
        data: updateData,
      });

      stats.productsUpdated++;
    } catch (error) {
      stats.errors.push({
        sku: row.sku,
        error: error.message || 'Unknown error',
      });
    }
  }

  // Update variants
  for (const row of variants) {
    try {
      // First check if it's a variant
      const variant = await prisma.productVariant.findUnique({
        where: { sku: row.sku },
      });

      if (variant) {
        const updateData = {
          basePrice: row.basePrice,
        };

        if (row.salePrice !== null) updateData.salePrice = row.salePrice;
        if (row.gsaPrice !== null) updateData.gsaPrice = row.gsaPrice;
        if (row.wholesalePrice !== null) updateData.wholesalePrice = row.wholesalePrice;
        if (row.costPrice !== null) updateData.costPrice = row.costPrice;

        await prisma.productVariant.update({
          where: { sku: row.sku },
          data: updateData,
        });
        stats.variantsUpdated++;

        // Also update parent product's minimumOrderQty and priceUnit
        if (row.productSku) {
          await prisma.product.updateMany({
            where: { sku: row.productSku },
            data: {
              minimumOrderQty: Math.max(1, Math.round(row.mou)),
              priceUnit: row.unit || 'ea',
              qtyPerPack: Math.max(1, Math.round(row.qtyPerPack)),
            },
          });
        }
      } else {
        // Check if it's actually a product SKU
        const product = await prisma.product.findUnique({
          where: { sku: row.sku },
        });

        if (product) {
          const updateData = {
            basePrice: row.basePrice,
            minimumOrderQty: Math.max(1, Math.round(row.mou)),
            priceUnit: row.unit || 'ea',
            qtyPerPack: Math.max(1, Math.round(row.qtyPerPack)),
          };

          if (row.salePrice !== null) updateData.salePrice = row.salePrice;
          if (row.gsaPrice !== null) updateData.gsaPrice = row.gsaPrice;
          if (row.wholesalePrice !== null) updateData.wholesalePrice = row.wholesalePrice;
          if (row.costPrice !== null) updateData.costPrice = row.costPrice;

          await prisma.product.update({
            where: { sku: row.sku },
            data: updateData,
          });
          stats.productsUpdated++;
        } else {
          stats.skipped++;
        }
      }
    } catch (error) {
      stats.errors.push({
        sku: row.sku,
        error: error.message || 'Unknown error',
      });
    }
  }

  return stats;
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Unit Pricing Update Script');
  console.log('='.repeat(60));

  // Find pricing Excel files
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  const files = fs.readdirSync(uploadsDir).filter(f =>
    f.startsWith('Pricing-') && f.endsWith('.xlsx')
  );

  if (files.length === 0) {
    console.log('No pricing files found in public/uploads/');
    console.log('Looking for files matching: Pricing-*.xlsx');
    return;
  }

  console.log(`Found ${files.length} pricing file(s):`);
  files.forEach(f => console.log(`  - ${f}`));

  let totalStats = {
    productsUpdated: 0,
    variantsUpdated: 0,
    skipped: 0,
    errors: [],
  };

  // Process each file
  for (const file of files) {
    const filePath = path.join(uploadsDir, file);

    try {
      const rows = parseExcelFile(filePath);
      const stats = await updatePricing(rows);

      totalStats.productsUpdated += stats.productsUpdated;
      totalStats.variantsUpdated += stats.variantsUpdated;
      totalStats.skipped += stats.skipped;
      totalStats.errors.push(...stats.errors);

      console.log(`\nFile ${file} completed:`);
      console.log(`  Products updated: ${stats.productsUpdated}`);
      console.log(`  Variants updated: ${stats.variantsUpdated}`);
      console.log(`  Skipped: ${stats.skipped}`);
      console.log(`  Errors: ${stats.errors.length}`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('TOTAL RESULTS:');
  console.log('='.repeat(60));
  console.log(`Products updated: ${totalStats.productsUpdated}`);
  console.log(`Variants updated: ${totalStats.variantsUpdated}`);
  console.log(`Skipped (not found): ${totalStats.skipped}`);
  console.log(`Errors: ${totalStats.errors.length}`);

  if (totalStats.errors.length > 0) {
    console.log('\nFirst 10 errors:');
    totalStats.errors.slice(0, 10).forEach(e => {
      console.log(`  ${e.sku}: ${e.error}`);
    });
  }

  await prisma.$disconnect();
}

// Run
main().catch(async (error) => {
  console.error('Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
