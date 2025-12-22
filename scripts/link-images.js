/**
 * Script to link existing PIP product images to products
 * Run with: node scripts/link-images.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const { existsSync } = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const IMAGES_BASE_PATH = path.join(process.cwd(), 'public/uploads/products/pip');
const PUBLIC_BASE_URL = '/uploads/products/pip';

async function findImagesInFolder(folderPath) {
  const imageSets = new Map();

  try {
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      if (!file.endsWith('.webp')) continue;

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

      imageSets.get(hash)[size] = file;
    }
  } catch (error) {
    return [];
  }

  return Array.from(imageSets.values()).filter(set => set.thumb);
}

async function main() {
  console.log('Starting to link PIP product images...\n');
  console.log(`Looking for images in: ${IMAGES_BASE_PATH}\n`);

  // Check if base path exists
  if (!existsSync(IMAGES_BASE_PATH)) {
    console.error(`ERROR: Images base path does not exist: ${IMAGES_BASE_PATH}`);
    process.exit(1);
  }

  // Get all products
  const products = await prisma.product.findMany({
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

    // Check if image folder exists
    const imageFolderPath = path.join(IMAGES_BASE_PATH, style);
    const lowerFolderPath = path.join(IMAGES_BASE_PATH, style.toLowerCase());

    let actualFolderPath = null;
    let actualStyle = null;

    if (existsSync(imageFolderPath)) {
      actualFolderPath = imageFolderPath;
      actualStyle = style;
    } else if (existsSync(lowerFolderPath)) {
      actualFolderPath = lowerFolderPath;
      actualStyle = style.toLowerCase();
    }

    if (!actualFolderPath) {
      noImages++;
      continue;
    }

    // Check if product already has images
    const existingImages = await prisma.productImage.count({
      where: { productId: product.id },
    });

    if (existingImages > 0) {
      skipped++;
      continue;
    }

    // Find images
    const imageSets = await findImagesInFolder(actualFolderPath);

    if (imageSets.length === 0) {
      noImages++;
      continue;
    }

    // Create ProductImage records
    const thumbUrls = [];

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

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
