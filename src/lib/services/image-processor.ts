import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import crypto from 'crypto';

// Image size configurations
export const IMAGE_SIZES = {
  original: { width: null, height: null, quality: 90 },
  large: { width: 1200, height: null, quality: 85 },
  medium: { width: 600, height: null, quality: 80 },
  thumb: { width: 200, height: 200, quality: 75 },
} as const;

export type ImageSize = keyof typeof IMAGE_SIZES;

export interface ProcessedImage {
  originalUrl: string;
  largeUrl: string;
  mediumUrl: string;
  thumbUrl: string;
  width: number;
  height: number;
  fileSize: number;
  hash: string;
  storagePath: string;
}

export interface ImageProcessorOptions {
  brandSlug?: string;
  productSku?: string;
  partNumber?: string;
  convertToWebp?: boolean;
}

/**
 * Professional Image Processing Service
 * - Converts images to WebP for optimal compression
 * - Generates multiple sizes (original, large, medium, thumbnail)
 * - Organizes files in brand/product folder structure
 * - Calculates hash for deduplication
 */
export class ImageProcessor {
  private uploadBasePath: string;
  private publicBasePath: string;

  constructor() {
    this.uploadBasePath = path.join(process.cwd(), 'public', 'uploads');
    this.publicBasePath = '/uploads';
  }

  /**
   * Generate storage path based on brand and product
   */
  private generateStoragePath(options: ImageProcessorOptions): string {
    const parts: string[] = ['products'];

    if (options.brandSlug) {
      parts.push(this.slugify(options.brandSlug));
    }

    if (options.productSku) {
      parts.push(this.slugify(options.productSku));
    } else if (options.partNumber) {
      parts.push(this.slugify(options.partNumber));
    }

    return parts.join('/');
  }

  /**
   * Slugify a string for safe file/folder names
   */
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Calculate file hash for deduplication
   */
  private async calculateHash(buffer: Buffer): Promise<string> {
    return crypto.createHash('md5').update(buffer).digest('hex').substring(0, 12);
  }

  /**
   * Ensure directory exists
   */
  private async ensureDir(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Process a single image and generate all sizes
   */
  async processImage(
    inputBuffer: Buffer,
    originalFilename: string,
    options: ImageProcessorOptions = {}
  ): Promise<ProcessedImage> {
    const hash = await this.calculateHash(inputBuffer);
    const storagePath = this.generateStoragePath(options);
    const fullStoragePath = path.join(this.uploadBasePath, storagePath);

    await this.ensureDir(fullStoragePath);

    // Get original image metadata
    const metadata = await sharp(inputBuffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    const results: Record<string, string> = {};
    const extension = options.convertToWebp !== false ? '.webp' : path.extname(originalFilename);
    const format = options.convertToWebp !== false ? 'webp' : undefined;

    // Process each size
    for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
      const filename = `${sizeName}-${hash}${extension}`;
      const filePath = path.join(fullStoragePath, filename);
      const publicUrl = `${this.publicBasePath}/${storagePath}/${filename}`;

      let sharpInstance = sharp(inputBuffer);

      // Resize if dimensions are specified
      if (config.width || config.height) {
        sharpInstance = sharpInstance.resize({
          width: config.width || undefined,
          height: config.height || undefined,
          fit: sizeName === 'thumb' ? 'cover' : 'inside',
          withoutEnlargement: true,
        });
      }

      // Convert to WebP or maintain original format with compression
      if (format === 'webp') {
        sharpInstance = sharpInstance.webp({ quality: config.quality });
      } else {
        // Apply compression based on original format
        const originalFormat = metadata.format;
        if (originalFormat === 'jpeg' || originalFormat === 'jpg') {
          sharpInstance = sharpInstance.jpeg({ quality: config.quality });
        } else if (originalFormat === 'png') {
          sharpInstance = sharpInstance.png({ quality: config.quality });
        }
      }

      await sharpInstance.toFile(filePath);
      results[sizeName] = publicUrl;
    }

    // Get the file size of original
    const originalStats = await fs.stat(
      path.join(fullStoragePath, `original-${hash}${extension}`)
    );

    return {
      originalUrl: results.original,
      largeUrl: results.large,
      mediumUrl: results.medium,
      thumbUrl: results.thumb,
      width: originalWidth,
      height: originalHeight,
      fileSize: originalStats.size,
      hash,
      storagePath,
    };
  }

  /**
   * Process multiple images in batch
   */
  async processImages(
    images: Array<{ buffer: Buffer; filename: string }>,
    options: ImageProcessorOptions = {}
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];

    for (const image of images) {
      try {
        const processed = await this.processImage(image.buffer, image.filename, options);
        results.push(processed);
      } catch (error) {
        console.error(`Error processing image ${image.filename}:`, error);
        // Continue with other images
      }
    }

    return results;
  }

  /**
   * Delete all sizes of an image
   */
  async deleteImage(storagePath: string, hash: string): Promise<void> {
    const fullPath = path.join(this.uploadBasePath, storagePath);

    for (const sizeName of Object.keys(IMAGE_SIZES)) {
      const webpFile = path.join(fullPath, `${sizeName}-${hash}.webp`);
      const jpgFile = path.join(fullPath, `${sizeName}-${hash}.jpg`);
      const pngFile = path.join(fullPath, `${sizeName}-${hash}.png`);

      for (const file of [webpFile, jpgFile, pngFile]) {
        try {
          if (existsSync(file)) {
            await fs.unlink(file);
          }
        } catch (error) {
          console.error(`Error deleting ${file}:`, error);
        }
      }
    }
  }

  /**
   * Check if an image with this hash already exists
   */
  async imageExists(storagePath: string, hash: string): Promise<boolean> {
    const fullPath = path.join(this.uploadBasePath, storagePath);
    const webpFile = path.join(fullPath, `original-${hash}.webp`);
    return existsSync(webpFile);
  }

  /**
   * Get image URLs if image exists
   */
  getImageUrls(storagePath: string, hash: string): ProcessedImage | null {
    const fullPath = path.join(this.uploadBasePath, storagePath);
    const webpFile = path.join(fullPath, `original-${hash}.webp`);

    if (!existsSync(webpFile)) {
      return null;
    }

    const baseUrl = `${this.publicBasePath}/${storagePath}`;
    return {
      originalUrl: `${baseUrl}/original-${hash}.webp`,
      largeUrl: `${baseUrl}/large-${hash}.webp`,
      mediumUrl: `${baseUrl}/medium-${hash}.webp`,
      thumbUrl: `${baseUrl}/thumb-${hash}.webp`,
      width: 0,
      height: 0,
      fileSize: 0,
      hash,
      storagePath,
    };
  }
}

// Singleton instance
export const imageProcessor = new ImageProcessor();
