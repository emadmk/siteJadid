/**
 * 3M Product Image Import Script - Small Batch
 *
 * Handles filenames like: 7012815817.jpg, 7012818030-2.jpg (multi-image)
 * The -2, -3 suffixes indicate additional images for the same product.
 *
 * Usage:
 *   mkdir -p import-3m-batch2
 *   unzip ~/ADA\ 3M\ Photos\ small\ batch.zip -d import-3m-batch2
 *   npx ts-node --compiler-options '{"module":"commonjs"}' scripts/import-3m-images-batch2.ts
 */

import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { ImageProcessor } from '../src/lib/services/image-processor';

const db = new PrismaClient();
const imageProcessor = new ImageProcessor();

const IMAGES_DIR = path.join(process.cwd(), 'import-3m-batch2');

async function main() {
  console.log('=== 3M Product Image Import (Small Batch) ===\n');

  if (!existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    console.log('Please unzip first:');
    console.log('  mkdir -p import-3m-batch2');
    console.log('  unzip ~/ADA\\ 3M\\ Photos\\ small\\ batch.zip -d import-3m-batch2');
    process.exit(1);
  }

  // Read all image files (recursive to handle subdirectories)
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

  // Parse SKU from filename
  // Formats: 7012815817.jpg, 7012818030-2.jpg, 7012818030_result.jpg, 7012818030-2_result.jpg
  const skuImageMap = new Map<string, { file: string; position: number }[]>();

  for (const file of imageFiles) {
    const basename = path.basename(file, path.extname(file));
    // Remove _result suffix first
    const cleaned = basename.replace(/_result$/i, '').trim();

    // Check for -N suffix (multi-image: 7012818030-2)
    const multiMatch = cleaned.match(/^(.+?)-(\d+)$/);
    let sku: string;
    let position: number;

    if (multiMatch) {
      sku = multiMatch[1];
      position = parseInt(multiMatch[2]);
    } else {
      sku = cleaned;
      position = 1; // Primary image
    }

    if (!sku) continue;

    if (!skuImageMap.has(sku)) {
      skuImageMap.set(sku, []);
    }
    skuImageMap.get(sku)!.push({ file, position });
  }

  // Sort images by position for each SKU
  for (const [, images] of skuImageMap) {
    images.sort((a, b) => a.position - b.position);
  }

  console.log(`Parsed ${skuImageMap.size} unique SKUs from filenames`);
  const totalImages = Array.from(skuImageMap.values()).reduce((sum, imgs) => sum + imgs.length, 0);
  const multiImageSkus = Array.from(skuImageMap.entries()).filter(([, imgs]) => imgs.length > 1);
  console.log(`Total images: ${totalImages} (${multiImageSkus.length} products have multiple images)\n`);

  // Match SKUs with products in database (try with and without 3M- prefix)
  const skus = Array.from(skuImageMap.keys());
  const prefixedSkus = skus.map(s => `3M-${s}`);

  const products = await db.product.findMany({
    where: {
      OR: [
        { sku: { in: skus } },
        { sku: { in: prefixedSkus } },
      ],
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

  // Build map from product ID to image SKU key
  const productToImageSku = new Map<string, string>();
  for (const product of products) {
    if (skuImageMap.has(product.sku)) {
      productToImageSku.set(product.id, product.sku);
    } else {
      const stripped = product.sku.replace(/^3M-/i, '');
      if (skuImageMap.has(stripped)) {
        productToImageSku.set(product.id, stripped);
      }
    }
  }

  // Log unmatched
  const matchedImageSkus = new Set(productToImageSku.values());
  const unmatchedSkus = skus.filter(s => !matchedImageSkus.has(s));
  if (unmatchedSkus.length > 0) {
    console.log(`Unmatched SKUs (${unmatchedSkus.length}):`);
    unmatchedSkus.forEach(s => console.log(`  - ${s}`));
    console.log('');
  }

  // Process and assign images
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const product of products) {
    const imageSku = productToImageSku.get(product.id);
    if (!imageSku) continue;
    const imageEntries = skuImageMap.get(imageSku);
    if (!imageEntries || imageEntries.length === 0) continue;

    const brandSlug = product.brand?.slug || product.brand?.name?.toLowerCase().replace(/\s+/g, '-') || '3m';

    console.log(`Processing: ${product.sku} - ${product.name?.substring(0, 60)}... (${imageEntries.length} images)`);

    const currentImages = (product.images as string[]) || [];
    const newThumbUrls: string[] = [];

    for (let i = 0; i < imageEntries.length; i++) {
      const { file, position } = imageEntries[i];
      try {
        const filePath = path.join(IMAGES_DIR, file);
        const buffer = await fs.readFile(filePath);

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
            position: i,
            isPrimary: i === 0,
            originalName: path.basename(file),
            fileSize: result.fileSize,
            mimeType: 'image/webp',
            width: result.width,
            height: result.height,
            hash: result.hash,
            storagePath: result.storagePath,
          },
        });

        if (!currentImages.includes(result.thumbUrl)) {
          newThumbUrls.push(result.thumbUrl);
        }

        processed++;
        console.log(`  ✓ ${file} (pos: ${position}) → ${result.storagePath}`);
      } catch (err: any) {
        errors++;
        console.error(`  ✗ Error processing ${file}: ${err.message}`);
      }
    }

    // Update legacy images array
    if (newThumbUrls.length > 0) {
      await db.product.update({
        where: { id: product.id },
        data: {
          images: [...newThumbUrls, ...currentImages],
        },
      });
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
