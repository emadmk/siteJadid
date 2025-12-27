/**
 * Import Unit Pricing from Excel Files
 *
 * This script reads pricing Excel files and updates:
 * - priceUnit (ea, pk, pr, DZ)
 * - qtyPerPack
 * - minimumOrderQty (MOU)
 * - basePrice
 * - costPrice
 *
 * Usage: npx ts-node scripts/import-unit-pricing.ts [file1.xlsx] [file2.xlsx]
 */

import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExcelRow {
  Type: string;
  'Product SKU': string;
  SKU: string;
  Name?: string;
  Unit: string;
  'Qty Per Pack': number;
  MOU: number;
  'Base Price': number | string;
  'Cost Price': number | string;
  'Sale Price'?: number | string;
  'GSA Price'?: number | string;
  'Wholesale Price'?: number | string;
}

// Map Excel unit codes to full names
const unitLabels: Record<string, string> = {
  'ea': 'each',
  'pk': 'pack',
  'pr': 'pair',
  'DZ': 'dozen',
  'dz': 'dozen',
  'BX': 'box',
  'bx': 'box',
  'CS': 'case',
  'cs': 'case',
};

async function processExcelFile(filePath: string) {
  console.log(`\n📁 Processing: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

  console.log(`   Found ${rows.length} rows`);

  let updatedProducts = 0;
  let updatedVariants = 0;
  let notFound = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const sku = String(row.SKU || '').trim();
      if (!sku) continue;

      const unit = (row.Unit || 'ea').toLowerCase();
      const qtyPerPack = Number(row['Qty Per Pack']) || 1;
      const mou = Number(row.MOU) || 1;
      const basePrice = parseFloat(String(row['Base Price']).replace(/[^0-9.-]/g, '')) || 0;
      const costPrice = parseFloat(String(row['Cost Price']).replace(/[^0-9.-]/g, '')) || 0;
      const salePrice = row['Sale Price'] ? parseFloat(String(row['Sale Price']).replace(/[^0-9.-]/g, '')) : null;
      const gsaPrice = row['GSA Price'] ? parseFloat(String(row['GSA Price']).replace(/[^0-9.-]/g, '')) : null;
      const wholesalePrice = row['Wholesale Price'] ? parseFloat(String(row['Wholesale Price']).replace(/[^0-9.-]/g, '')) : null;

      const type = row.Type;

      if (type === 'Product') {
        // Update product directly
        const product = await prisma.product.findUnique({
          where: { sku },
        });

        if (product) {
          await prisma.product.update({
            where: { sku },
            data: {
              priceUnit: unit,
              qtyPerPack,
              minimumOrderQty: mou,
              basePrice,
              costPrice: costPrice || undefined,
              salePrice: salePrice || undefined,
              gsaPrice: gsaPrice || undefined,
              wholesalePrice: wholesalePrice || undefined,
            },
          });
          updatedProducts++;
        } else {
          console.log(`   ⚠️ Product not found: ${sku}`);
          notFound++;
        }
      } else if (type === 'Variant') {
        // Update variant
        const variant = await prisma.productVariant.findUnique({
          where: { sku },
        });

        if (variant) {
          await prisma.productVariant.update({
            where: { sku },
            data: {
              priceUnit: unit,
              qtyPerPack,
              basePrice,
              costPrice: costPrice || undefined,
              salePrice: salePrice || undefined,
              gsaPrice: gsaPrice || undefined,
              wholesalePrice: wholesalePrice || undefined,
            },
          });

          // Also update parent product's MOU
          const productSku = String(row['Product SKU'] || '').trim();
          if (productSku) {
            await prisma.product.updateMany({
              where: { sku: productSku },
              data: {
                minimumOrderQty: mou,
                priceUnit: unit,
                qtyPerPack,
              },
            });
          }

          updatedVariants++;
        } else {
          console.log(`   ⚠️ Variant not found: ${sku}`);
          notFound++;
        }
      }
    } catch (error: any) {
      console.error(`   ❌ Error processing row: ${error.message}`);
      errors++;
    }
  }

  console.log(`   ✅ Updated: ${updatedProducts} products, ${updatedVariants} variants`);
  console.log(`   ⚠️ Not found: ${notFound}`);
  if (errors > 0) console.log(`   ❌ Errors: ${errors}`);
}

async function updateShoeBrands() {
  console.log('\n👟 Updating shoe brands (Keen, Bates) to use "pair" unit...');

  // Find brands
  const keenBrand = await prisma.brand.findFirst({
    where: { name: { contains: 'Keen', mode: 'insensitive' } },
  });

  const batesBrand = await prisma.brand.findFirst({
    where: { name: { contains: 'Bates', mode: 'insensitive' } },
  });

  const brandIds = [keenBrand?.id, batesBrand?.id].filter(Boolean) as string[];

  if (brandIds.length === 0) {
    console.log('   No Keen or Bates brands found');
    return;
  }

  // Update all products from these brands
  const result = await prisma.product.updateMany({
    where: {
      brandId: { in: brandIds },
    },
    data: {
      priceUnit: 'pr',
      qtyPerPack: 1,
    },
  });

  console.log(`   ✅ Updated ${result.count} shoe products to "pair" unit`);

  // Also update variants
  const products = await prisma.product.findMany({
    where: { brandId: { in: brandIds } },
    select: { id: true },
  });

  const productIds = products.map(p => p.id);

  if (productIds.length > 0) {
    const variantResult = await prisma.productVariant.updateMany({
      where: {
        productId: { in: productIds },
      },
      data: {
        priceUnit: 'pr',
        qtyPerPack: 1,
      },
    });

    console.log(`   ✅ Updated ${variantResult.count} shoe variants to "pair" unit`);
  }
}

async function main() {
  console.log('🚀 Starting Unit Pricing Import\n');

  // Default files if none provided
  const files = process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : [
        'public/uploads/Pricing-22 Percent MG-Occunomix- 27 Dec 25.xlsx',
        'public/uploads/Pricing-22 Percent MG-PIP- 27 Dec 25.xlsx',
      ];

  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);
    try {
      await processExcelFile(filePath);
    } catch (error: any) {
      console.error(`❌ Failed to process ${file}: ${error.message}`);
    }
  }

  // Update shoe brands
  await updateShoeBrands();

  console.log('\n✅ Import complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
