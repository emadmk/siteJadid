/**
 * Script to link existing PIP product images to newly imported products
 *
 * Images are already processed and stored at:
 * /public/uploads/products/pip/{STYLE}/
 *
 * This script finds products by SKU (STYLE) and creates ProductImage records
 *
 * Usage: npx ts-node scripts/link-pip-images.ts
 */

import { prisma } from '../src/lib/prisma';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const IMAGES_BASE_PATH = path.join(process.cwd(), 'public/uploads/products/pip');
const PUBLIC_BASE_URL = '/uploads/products/pip';

interface ImageSet {
  original: string | null;
  large: string | null;
  medium: string | null;
  thumb: string | null;
  hash: string;
}

async function findImagesInFolder(folderPath: string): Promise<ImageSet[]> {
  const imageSets: Map<string, ImageSet> = new Map();

  try {
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      if (!file.endsWith('.webp')) continue;

      // Parse filename: {size}-{hash}.webp
      const match = file.match(/^(original|large|medium|thumb)-([a-f0-9]+)\.webp$/);
      if (!match) continue;

      const [, size, hash] = match;

      if (!imageSets.has(hash)) {
        imageSets.set(hash, {
          original: null,
          large: null,
          medium: null,
          thumb: null,
          hash,
        });
      }

      const imageSet = imageSets.get(hash)!;
      imageSet[size as keyof Omit<ImageSet, 'hash'>] = file;
    }
  } catch (error) {
    // Folder doesn't exist or can't be read
    return [];
  }

  return Array.from(imageSets.values()).filter(set => set.thumb); // Only return sets with at least a thumb
}

async function linkProductImages() {
  console.log('Starting to link PIP product images...\n');

  // Get all products that might be PIP products (by checking if image folder exists)
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { sku: { not: null } },
        { slug: { startsWith: '' } }, // All products
      ],
    },
    select: {
      id: true,
      sku: true,
      slug: true,
      name: true,
      images: true,
    },
  });

  console.log(`Found ${products.length} products to check\n`);

  let linked = 0;
  let skipped = 0;
  let noImages = 0;

  for (const product of products) {
    const style = product.sku || product.slug;
    if (!style) {
      skipped++;
      continue;
    }

    // Check if image folder exists for this style
    const imageFolderPath = path.join(IMAGES_BASE_PATH, style);

    if (!existsSync(imageFolderPath)) {
      // Try lowercase
      const lowerFolderPath = path.join(IMAGES_BASE_PATH, style.toLowerCase());
      if (!existsSync(lowerFolderPath)) {
        noImages++;
        continue;
      }
    }

    const actualFolderPath = existsSync(imageFolderPath)
      ? imageFolderPath
      : path.join(IMAGES_BASE_PATH, style.toLowerCase());

    const actualStyle = existsSync(imageFolderPath) ? style : style.toLowerCase();

    // Check if product already has images linked
    const existingImages = await prisma.productImage.count({
      where: { productId: product.id },
    });

    if (existingImages > 0) {
      skipped++;
      continue;
    }

    // Find all image sets in the folder
    const imageSets = await findImagesInFolder(actualFolderPath);

    if (imageSets.length === 0) {
      noImages++;
      continue;
    }

    // Create ProductImage records
    const thumbUrls: string[] = [];

    for (let i = 0; i < imageSets.length; i++) {
      const imageSet = imageSets[i];
      const baseUrl = `${PUBLIC_BASE_URL}/${actualStyle}`;

      const originalUrl = imageSet.original ? `${baseUrl}/${imageSet.original}` : null;
      const largeUrl = imageSet.large ? `${baseUrl}/${imageSet.large}` : null;
      const mediumUrl = imageSet.medium ? `${baseUrl}/${imageSet.medium}` : null;
      const thumbUrl = imageSet.thumb ? `${baseUrl}/${imageSet.thumb}` : null;

      if (thumbUrl) {
        thumbUrls.push(thumbUrl);
      }

      await prisma.productImage.create({
        data: {
          productId: product.id,
          originalUrl: originalUrl || thumbUrl || '',
          largeUrl: largeUrl || originalUrl || thumbUrl || '',
          mediumUrl: mediumUrl || thumbUrl || '',
          thumbUrl: thumbUrl || '',
          originalName: `${style}-${imageSet.hash}.webp`,
          storagePath: `products/pip/${actualStyle}`,
          hash: imageSet.hash,
          position: i,
          isPrimary: i === 0,
        },
      });
    }

    // Update product images array
    if (thumbUrls.length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: thumbUrls },
      });
    }

    linked++;

    if (linked % 100 === 0) {
      console.log(`Progress: ${linked} products linked...`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Linked: ${linked} products`);
  console.log(`Skipped (already has images): ${skipped}`);
  console.log(`No images found: ${noImages}`);
}

async function main() {
  try {
    await linkProductImages();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  process.exit(0);
}

main();
