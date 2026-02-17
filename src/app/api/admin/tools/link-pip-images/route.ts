export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
      (imageSet as any)[size] = file;
    }
  } catch (error) {
    return [];
  }

  return Array.from(imageSets.values()).filter(set => set.thumb);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    console.log(`Found ${products.length} products to check`);

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
      const lowerFolderPath = path.join(IMAGES_BASE_PATH, style.toLowerCase());

      let actualFolderPath: string | null = null;
      let actualStyle: string | null = null;

      if (existsSync(imageFolderPath)) {
        actualFolderPath = imageFolderPath;
        actualStyle = style;
      } else if (existsSync(lowerFolderPath)) {
        actualFolderPath = lowerFolderPath;
        actualStyle = style.toLowerCase();
      }

      if (!actualFolderPath || !actualStyle) {
        noImages++;
        continue;
      }

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

    return NextResponse.json({
      success: true,
      linked,
      skipped,
      noImages,
      message: `Linked images for ${linked} products. Skipped ${skipped} (already have images). ${noImages} products have no image folder.`,
    });
  } catch (error: any) {
    console.error('Error linking images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to link images' },
      { status: 500 }
    );
  }
}
