import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from './image-processor';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * PiP (Protective Industrial Products) Import Service
 *
 * Excel Field Mapping:
 * - SKU → sku (for site)
 * - STYLE → style (for variant grouping - same style = variants)
 * - COLOR → color (variant attribute)
 * - SIZE → size (variant attribute)
 * - BRAND WITH MARKS + SHORT DESCRIPTION → product name
 * - DESCRIPTION, FEATURES, SPECS, APPLICATIONS → description
 * - SELECT CODE → parent category
 * - COMMODITY CODE → child category
 *
 * CSV Images Mapping:
 * - SKU → Image filename
 */

export interface PipImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface PipImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface PipImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedNoImage: number;
  errors: PipImportError[];
  warnings: PipImportWarning[];
  createdProducts: string[];
  updatedProducts: string[];
  createdVariants: number;
  createdCategories: string[];
  createdBrands: string[];
}

export interface PipImportOptions {
  updateExisting?: boolean;
  importImages?: boolean;
  imageBasePath?: string;
  dryRun?: boolean;
  defaultStockQuantity?: number;
  defaultStatus?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
}

interface ParsedPipRow {
  styleId: string;
  skuId: string;
  iref: string;
  sku: string;
  style: string;
  color: string;
  size: string;
  selectCode: string;
  commodityCode: string;
  brand: string;
  brandWithMarks: string;
  shortDescription: string;
  description: string;
  features: string;
  specs: string;
  applications: string;
  specsheetLink: string;
  imagesLink: string;
  status: string;
  countryOfOrigin: string;
  rowNumber: number;
}

interface ImageMapping {
  sku: string;
  images: string[];
}

interface VariantGroup {
  style: string;
  styleId: string;
  productName: string;
  brand: string;
  brandWithMarks: string;
  selectCode: string;
  commodityCode: string;
  description: string;
  features: string;
  specs: string;
  applications: string;
  specsheetLink: string;
  rows: ParsedPipRow[];
}

export class PipImportService {
  private errors: PipImportError[] = [];
  private warnings: PipImportWarning[] = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];
  private createdVariants = 0;
  private createdCategories: string[] = [];
  private createdBrands: string[] = [];
  private skippedNoImage = 0;
  private categoryCache = new Map<string, string>();
  private brandCache = new Map<string, string>();

  /**
   * Parse PiP Excel file from buffer
   */
  async parseExcel(fileBuffer: Buffer): Promise<ParsedPipRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    // Find header row (row with column names)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      if (data[i] && Array.isArray(data[i]) && data[i].includes('SKU')) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = data[headerRowIdx] as string[];
    const rows: ParsedPipRow[] = [];

    // Map column indices
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      if (h) colMap[h.toString().toUpperCase().trim()] = i;
    });

    console.log('Column mapping:', colMap);

    // Process data rows
    for (let i = headerRowIdx + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !Array.isArray(row)) continue;

      const getValue = (colName: string): string => {
        const idx = colMap[colName.toUpperCase()];
        return idx !== undefined && row[idx] !== undefined ? String(row[idx]).trim() : '';
      };

      const sku = getValue('SKU');
      const style = getValue('STYLE');

      if (!sku && !style) continue; // Skip empty rows

      rows.push({
        styleId: getValue('STYLE ID'),
        skuId: getValue('SKU ID'),
        iref: getValue('IREF'),
        sku: sku || style,
        style: style || sku,
        color: getValue('COLOR'),
        size: getValue('SIZE'),
        selectCode: getValue('SELECT CODE'),
        commodityCode: getValue('COMMODITY CODE'),
        brand: getValue('BRAND'),
        brandWithMarks: getValue('BRAND WITH MARKS'),
        shortDescription: getValue('SHORT DESCRIPTION'),
        description: getValue('DESCRIPTION'),
        features: getValue('FEATURES'),
        specs: getValue('SPECS'),
        applications: getValue('APPLICATIONS'),
        specsheetLink: getValue('SPECSHEET LINK'),
        imagesLink: getValue('IMAGES LINK'),
        status: getValue('STATUS'),
        countryOfOrigin: getValue('COO'),
        rowNumber: i + 1,
      });
    }

    return rows;
  }

  /**
   * Group rows by STYLE for variant detection
   */
  private groupByStyle(rows: ParsedPipRow[]): VariantGroup[] {
    const groups = new Map<string, ParsedPipRow[]>();

    for (const row of rows) {
      const style = row.style;
      if (!groups.has(style)) {
        groups.set(style, []);
      }
      groups.get(style)!.push(row);
    }

    const variantGroups: VariantGroup[] = [];
    for (const [style, groupRows] of groups) {
      const firstRow = groupRows[0];

      // Product name = BRAND WITH MARKS + SHORT DESCRIPTION
      const productName = [firstRow.brandWithMarks, firstRow.shortDescription]
        .filter(Boolean)
        .join(' ')
        .trim() || style;

      variantGroups.push({
        style,
        styleId: firstRow.styleId,
        productName,
        brand: firstRow.brand,
        brandWithMarks: firstRow.brandWithMarks,
        selectCode: firstRow.selectCode,
        commodityCode: firstRow.commodityCode,
        description: firstRow.description,
        features: firstRow.features,
        specs: firstRow.specs,
        applications: firstRow.applications,
        specsheetLink: firstRow.specsheetLink,
        rows: groupRows,
      });
    }

    return variantGroups;
  }

  /**
   * Check if any variant in the group has images in the import folder
   */
  private async groupHasImages(group: VariantGroup, imageBasePath: string): Promise<boolean> {
    for (const row of group.rows) {
      // Check for images by SKU or STYLE
      const possibleNames = [row.sku, row.style, row.sku.replace('/', '-'), row.style.replace('/', '-')];
      for (const name of possibleNames) {
        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
        for (const ext of extensions) {
          const filePath = path.join(imageBasePath, name + ext);
          if (existsSync(filePath)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Get images for a group (looks in import-images folder by SKU/STYLE)
   */
  private getGroupImageNames(group: VariantGroup, imageBasePath: string): string[] {
    const images: string[] = [];

    // Try to find images for each variant
    for (const row of group.rows) {
      const possibleNames = [row.sku, row.style, row.sku.replace('/', '-'), row.style.replace('/', '-')];
      for (const name of possibleNames) {
        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
        for (const ext of extensions) {
          const filePath = path.join(imageBasePath, name + ext);
          if (existsSync(filePath)) {
            const fileName = name + ext;
            if (!images.includes(fileName)) {
              images.push(fileName);
            }
          }
          // Also check for _2, _3 variants
          for (let i = 2; i <= 5; i++) {
            const variantPath = path.join(imageBasePath, `${name}_${i}${ext}`);
            if (existsSync(variantPath)) {
              const fileName = `${name}_${i}${ext}`;
              if (!images.includes(fileName)) {
                images.push(fileName);
              }
            }
          }
        }
      }
      // If we found images, stop looking
      if (images.length > 0) break;
    }

    return images;
  }

  /**
   * Find or create brand
   */
  private async findOrCreateBrand(brandName: string): Promise<string | null> {
    if (!brandName) return null;

    const cleanBrand = brandName.replace(/[®™©]/g, '').trim();
    const brandKey = cleanBrand.toLowerCase();

    // Check cache
    if (this.brandCache.has(brandKey)) {
      return this.brandCache.get(brandKey)!;
    }

    const slug = cleanBrand
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');

    // Try to find existing
    let brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { name: { equals: cleanBrand, mode: 'insensitive' } },
          { slug },
        ],
      },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: cleanBrand,
          slug,
          description: `${brandName} - Protective Industrial Products`,
          isActive: true,
        },
      });
      this.createdBrands.push(cleanBrand);
      console.log(`Created brand: ${cleanBrand}`);
    }

    this.brandCache.set(brandKey, brand.id);
    return brand.id;
  }

  /**
   * Find or create category (parent/child)
   */
  private async findOrCreateCategory(
    parentName: string,
    childName: string
  ): Promise<string | null> {
    if (!parentName && !childName) return null;

    const categoryName = childName || parentName;
    const cacheKey = `${parentName}::${childName}`.toLowerCase();

    // Check cache
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey)!;
    }

    // Create or find parent first
    let parentId: string | null = null;
    if (parentName) {
      const parentSlug = parentName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');

      let parent = await prisma.category.findFirst({
        where: {
          OR: [
            { name: { equals: parentName, mode: 'insensitive' } },
            { slug: parentSlug },
          ],
          parentId: null,
        },
      });

      if (!parent) {
        parent = await prisma.category.create({
          data: {
            name: parentName,
            slug: parentSlug,
            isActive: true,
            description: `${parentName} products`,
          },
        });
        this.createdCategories.push(parentName);
        console.log(`Created parent category: ${parentName}`);
      }
      parentId = parent.id;
    }

    // If no child, return parent
    if (!childName || childName === parentName) {
      if (parentId) {
        this.categoryCache.set(cacheKey, parentId);
      }
      return parentId;
    }

    // Create or find child category
    const childSlug = childName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');

    let child = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: childName, mode: 'insensitive' } },
          { slug: childSlug },
        ],
      },
    });

    if (!child) {
      child = await prisma.category.create({
        data: {
          name: childName,
          slug: childSlug,
          isActive: true,
          description: `${childName} products`,
          parentId,
        },
      });
      this.createdCategories.push(childName);
      console.log(`Created child category: ${childName} under ${parentName}`);
    }

    this.categoryCache.set(cacheKey, child.id);
    return child.id;
  }

  /**
   * Build product description from all available fields
   */
  private buildDescription(group: VariantGroup): string {
    const parts: string[] = [];

    // Short description
    if (group.description) {
      parts.push(`<p>${group.description}</p>`);
    }

    // Features
    if (group.features) {
      parts.push(`<h3>Features</h3>`);
      const features = group.features.split('|').filter(Boolean);
      if (features.length > 1) {
        parts.push(`<ul>${features.map(f => `<li>${f.trim()}</li>`).join('')}</ul>`);
      } else {
        parts.push(`<p>${group.features}</p>`);
      }
    }

    // Specifications
    if (group.specs) {
      parts.push(`<h3>Specifications</h3>`);
      const specs = group.specs.split('|').filter(Boolean);
      if (specs.length > 1) {
        parts.push(`<ul>${specs.map(s => `<li>${s.trim()}</li>`).join('')}</ul>`);
      } else {
        parts.push(`<p>${group.specs}</p>`);
      }
    }

    // Applications
    if (group.applications) {
      parts.push(`<h3>Applications</h3>`);
      // Applications format: --App1--App2--App3--
      const apps = group.applications
        .split('--')
        .filter(Boolean)
        .map(a => a.trim())
        .filter(Boolean);
      if (apps.length > 0) {
        parts.push(`<ul>${apps.map(a => `<li>${a}</li>`).join('')}</ul>`);
      }
    }

    // Spec sheet link
    if (group.specsheetLink) {
      parts.push(`<p><a href="${group.specsheetLink}" target="_blank">View Specification Sheet</a></p>`);
    }

    return parts.join('\n') || `<p>${group.productName}</p>`;
  }

  /**
   * Generate SEO fields
   */
  private generateSEO(name: string, category: string, brand: string): {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } {
    return {
      metaTitle: `${name} | ${brand}`.substring(0, 70),
      metaDescription: `Shop ${name} by ${brand}. Professional safety equipment. Quality ${category.toLowerCase()} products.`.substring(0, 160),
      metaKeywords: [name, brand, category, 'safety', 'PPE', 'industrial'].filter(Boolean).join(', '),
    };
  }

  /**
   * Import products from parsed data
   */
  async importProducts(
    rows: ParsedPipRow[],
    options: PipImportOptions = {}
  ): Promise<PipImportResult> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = path.join(process.cwd(), 'import-images'),
      dryRun = false,
      defaultStockQuantity = 100,
      defaultStatus = 'ACTIVE',
    } = options;

    this.errors = [];
    this.warnings = [];
    this.createdProducts = [];
    this.updatedProducts = [];
    this.createdVariants = 0;
    this.createdCategories = [];
    this.createdBrands = [];
    this.skippedNoImage = 0;
    this.categoryCache.clear();
    this.brandCache.clear();

    // Group rows by STYLE
    const groups = this.groupByStyle(rows);
    console.log(`Found ${groups.length} product groups from ${rows.length} rows`);

    let processedCount = 0;

    for (const group of groups) {
      try {
        // Skip if no images (check in import-images folder)
        const hasImages = await this.groupHasImages(group, imageBasePath);
        if (!hasImages) {
          this.skippedNoImage++;
          continue;
        }

        await this.importProductGroup(group, {
          updateExisting,
          importImages,
          imageBasePath,
          dryRun,
          defaultStockQuantity,
          defaultStatus,
        });

        processedCount += group.rows.length;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.errors.push({
          row: group.rows[0].rowNumber,
          field: 'general',
          value: group.style,
          message: `Failed to import ${group.style}: ${errorMessage}`,
        });
        console.error(`Error importing ${group.style}:`, error);
      }
    }

    return {
      success: this.errors.length === 0,
      totalRows: rows.length,
      processedRows: processedCount,
      successCount: this.createdProducts.length + this.updatedProducts.length,
      errorCount: this.errors.length,
      skippedNoImage: this.skippedNoImage,
      errors: this.errors,
      warnings: this.warnings,
      createdProducts: this.createdProducts,
      updatedProducts: this.updatedProducts,
      createdVariants: this.createdVariants,
      createdCategories: this.createdCategories,
      createdBrands: this.createdBrands,
    };
  }

  /**
   * Import a product group (with or without variants)
   */
  private async importProductGroup(
    group: VariantGroup,
    options: PipImportOptions
  ): Promise<void> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = '',
      dryRun = false,
      defaultStockQuantity = 100,
      defaultStatus = 'ACTIVE',
    } = options;

    // Find or create brand
    const brandId = await this.findOrCreateBrand(group.brand);

    // Find or create category
    const categoryId = await this.findOrCreateCategory(
      group.selectCode,
      group.commodityCode
    );

    // Check if product exists
    let existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: group.style },
          { slug: group.style.toLowerCase().replace(/[^\w]+/g, '-') },
        ],
      },
    });

    // Build description
    const description = this.buildDescription(group);

    // Generate SEO
    const seo = this.generateSEO(
      group.productName,
      group.commodityCode || group.selectCode || 'Safety',
      group.brandWithMarks || group.brand || 'PIP'
    );

    const hasVariants = group.rows.length > 1;

    const productData = {
      name: group.productName,
      slug: group.style.toLowerCase().replace(/[^\w]+/g, '-'),
      description,
      shortDescription: group.productName,
      basePrice: new Decimal(0.01), // $0.01 as requested
      stockQuantity: hasVariants ? 0 : defaultStockQuantity,
      status: defaultStatus,
      hasVariants,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      metaKeywords: seo.metaKeywords,
      ...(brandId && { brand: { connect: { id: brandId } } }),
      ...(categoryId && { category: { connect: { id: categoryId } } }),
    };

    if (dryRun) {
      if (existingProduct) {
        this.updatedProducts.push(group.style);
      } else {
        this.createdProducts.push(group.style);
      }
      if (hasVariants) {
        this.createdVariants += group.rows.length;
      }
      return;
    }

    let savedProduct;
    if (existingProduct && updateExisting) {
      savedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
      this.updatedProducts.push(group.style);

      // Delete existing variants if has variants
      if (hasVariants) {
        await prisma.productVariant.deleteMany({
          where: { productId: savedProduct.id },
        });
      }
    } else if (!existingProduct) {
      savedProduct = await prisma.product.create({
        data: {
          sku: group.style,
          ...productData,
        },
      });
      this.createdProducts.push(group.style);
    } else {
      savedProduct = existingProduct;
    }

    // Create variants if multiple rows
    if (hasVariants) {
      let totalStock = 0;
      for (const row of group.rows) {
        const variantName = [row.color, row.size].filter(Boolean).join(' / ') || 'Default';

        await prisma.productVariant.create({
          data: {
            productId: savedProduct.id,
            sku: row.sku,
            name: variantName,
            basePrice: new Decimal(0.01),
            stockQuantity: defaultStockQuantity,
            isActive: true,
            images: [],
          },
        });
        this.createdVariants++;
        totalStock += defaultStockQuantity;
      }

      // Update total stock
      await prisma.product.update({
        where: { id: savedProduct.id },
        data: { stockQuantity: totalStock },
      });
    }

    // Import images
    if (importImages && savedProduct) {
      const images = this.getGroupImageNames(group, imageBasePath);
      if (images.length > 0) {
        await this.processProductImages(
          savedProduct.id,
          group.style,
          images,
          imageBasePath,
          existingProduct !== null
        );
      }
    }
  }

  /**
   * Find images in local folder
   */
  private async findProductImages(
    imageNames: string[],
    imageBasePath: string
  ): Promise<Array<{ buffer: Buffer; filename: string }>> {
    const images: Array<{ buffer: Buffer; filename: string }> = [];

    for (const imageName of imageNames) {
      const filePath = path.join(imageBasePath, imageName);
      if (existsSync(filePath)) {
        try {
          const buffer = await fs.readFile(filePath);
          images.push({ buffer, filename: imageName });
        } catch (error) {
          console.error(`Error reading image ${filePath}:`, error);
        }
      } else {
        // Try without extension or with different extensions
        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const baseName = imageName.replace(/\.[^/.]+$/, '');

        for (const ext of extensions) {
          const tryPath = path.join(imageBasePath, baseName + ext);
          if (existsSync(tryPath)) {
            try {
              const buffer = await fs.readFile(tryPath);
              images.push({ buffer, filename: baseName + ext });
              break;
            } catch (error) {
              console.error(`Error reading image ${tryPath}:`, error);
            }
          }
        }
      }
    }

    return images;
  }

  /**
   * Process and save product images
   */
  private async processProductImages(
    productId: string,
    sku: string,
    imageNames: string[],
    imageBasePath: string,
    isUpdate: boolean
  ): Promise<void> {
    const imageFiles = await this.findProductImages(imageNames, imageBasePath);

    if (imageFiles.length === 0) {
      this.warnings.push({
        row: 0,
        field: 'images',
        message: `No images found for ${sku} in ${imageBasePath}`,
      });
      return;
    }

    // Delete existing images if updating
    if (isUpdate) {
      await prisma.productImage.deleteMany({
        where: { productId },
      });
    }

    try {
      const processedImages = await imageProcessor.processImages(imageFiles, {
        brandSlug: 'pip',
        productSku: sku,
        convertToWebp: true,
      });

      for (let i = 0; i < processedImages.length; i++) {
        const img = processedImages[i];
        await prisma.productImage.create({
          data: {
            productId,
            originalUrl: img.originalUrl,
            largeUrl: img.largeUrl,
            mediumUrl: img.mediumUrl,
            thumbUrl: img.thumbUrl,
            originalName: imageFiles[i].filename,
            fileSize: img.fileSize,
            width: img.width,
            height: img.height,
            hash: img.hash,
            storagePath: img.storagePath,
            position: i,
            isPrimary: i === 0,
          },
        });
      }

      // Update product images array
      await prisma.product.update({
        where: { id: productId },
        data: {
          images: processedImages.map(img => img.thumbUrl).filter(Boolean) as string[],
        },
      });
    } catch (error) {
      console.error(`Error processing images for ${sku}:`, error);
      this.warnings.push({
        row: 0,
        field: 'images',
        message: `Failed to process images for ${sku}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
}

// Singleton instance
export const pipImportService = new PipImportService();
