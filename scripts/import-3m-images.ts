/**
 * 3M Product Image Import Script
 *
 * Reads images from a zip file, matches them to products by SKU,
 * processes them through ImageProcessor, and updates the database.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/import-3m-images.ts
 */

import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { ImageProcessor } from '../src/lib/services/image-processor';

const db = new PrismaClient();
const imageProcessor = new ImageProcessor();

const IMAGES_DIR = path.join(process.cwd(), 'import-3m-images');

async function main() {
  console.log('=== 3M Product Image Import ===\n');

  // 1. Check if images directory exists
  if (!existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    console.log('Please unzip the images first:');
    console.log('  mkdir -p import-3m-images');
    console.log('  unzip "Final jpg.zip" -d import-3m-images');
    process.exit(1);
  }

  // 2. Read all image files
  const allFiles = await fs.readdir(IMAGES_DIR, { recursive: true });
  const imageFiles = (allFiles as string[]).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });

  console.log(`Found ${imageFiles.length} image files\n`);

  if (imageFiles.length === 0) {
    console.log('No image files found. Exiting.');
    process.exit(0);
  }

  // 3. Parse SKU from filename (format: SKU_result.jpg or SKU.jpg)
  const skuImageMap = new Map<string, string[]>();

  for (const file of imageFiles) {
    const basename = path.basename(file, path.extname(file));
    // Remove _result suffix to get the SKU
    const sku = basename.replace(/_result$/i, '').trim();

    if (!sku) continue;

    if (!skuImageMap.has(sku)) {
      skuImageMap.set(sku, []);
    }
    skuImageMap.get(sku)!.push(file);
  }

  console.log(`Parsed ${skuImageMap.size} unique SKUs from filenames\n`);

  // 4. Match SKUs with products in database
  const skus = Array.from(skuImageMap.keys());

  const products = await db.product.findMany({
    where: {
      sku: { in: skus },
    },
    select: {
      id: true,
      sku: true,
      name: true,
      images: true,
      brand: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  console.log(`Matched ${products.length} products out of ${skus.length} SKUs\n`);

  // Log unmatched SKUs
  const matchedSkus = new Set(products.map(p => p.sku));
  const unmatchedSkus = skus.filter(s => !matchedSkus.has(s));
  if (unmatchedSkus.length > 0) {
    console.log(`Unmatched SKUs (${unmatchedSkus.length}):`);
    unmatchedSkus.forEach(s => console.log(`  - ${s}`));
    console.log('');
  }

  // 5. Process and assign images
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    const files = skuImageMap.get(product.sku);
    if (!files || files.length === 0) continue;

    const brandSlug = product.brand?.slug || product.brand?.name?.toLowerCase().replace(/\s+/g, '-') || '3m';

    console.log(`Processing: ${product.sku} - ${product.name?.substring(0, 60)}...`);

    for (const file of files) {
      try {
        const filePath = path.join(IMAGES_DIR, file);
        const buffer = await fs.readFile(filePath);

        // Process image (creates all sizes + webp)
        const result = await imageProcessor.processImage(buffer, file, {
          brandSlug,
          productSku: product.sku,
          convertToWebp: true,
        });

        // Create ProductImage record
        await db.productImage.create({
          data: {
            productId: product.id,
            originalUrl: result.originalUrl,
            largeUrl: result.largeUrl,
            mediumUrl: result.mediumUrl,
            thumbUrl: result.thumbUrl,
            altText: product.name || product.sku,
            position: 0,
            isPrimary: true,
            originalName: path.basename(file),
            fileSize: result.fileSize,
            mimeType: 'image/webp',
            width: result.width,
            height: result.height,
            hash: result.hash,
            storagePath: result.storagePath,
          },
        });

        // Update legacy images array (add thumb to array if not already there)
        const currentImages = (product.images as string[]) || [];
        if (!currentImages.includes(result.thumbUrl)) {
          await db.product.update({
            where: { id: product.id },
            data: {
              images: [result.thumbUrl, ...currentImages],
            },
          });
        }

        processed++;
        console.log(`  ✓ ${file} → ${result.storagePath}`);
      } catch (err: any) {
        errors++;
        console.error(`  ✗ Error processing ${file}: ${err.message}`);
      }
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Processed: ${processed}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Errors:    ${errors}`);
  console.log(`Unmatched: ${unmatchedSkus.length}`);

  await db.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
