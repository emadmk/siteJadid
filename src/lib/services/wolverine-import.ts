import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from './image-processor';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Wolverine/Bates Import Service
 *
 * Excel Field Mapping:
 * - manufacturer_part_number → style-size (E01830-3M)
 * - vendor_part_number → SKU (B-E01830-3M)
 * - item_name → product name
 * - item_description → description
 * - commercial_price → basePrice
 * - Website Price 45% GM → salePrice
 * - govt_price_with_fee → gsaPrice
 *
 * Variants:
 * - Same style (E01830) = one product with size variants
 * - Size extracted from manufacturer_part_number (e.g., "3M", "7EW")
 *
 * Images:
 * - Pattern: {STYLE}.jpg, {STYLE}_2.jpg, {STYLE}_3.jpg
 */

export interface WolverineImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface WolverineImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface WolverineImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedNoImage: number;
  errors: WolverineImportError[];
  warnings: WolverineImportWarning[];
  createdProducts: string[];
  updatedProducts: string[];
  createdVariants: number;
}

export interface WolverineImportOptions {
  updateExisting?: boolean;
  importImages?: boolean;
  imageBasePath?: string;
  dryRun?: boolean;
  defaultStockQuantity?: number;
  defaultStatus?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  defaultSupplierId?: string;
  defaultWarehouseId?: string;
  defaultBrandId?: string;
  defaultCategoryId?: string;
}

interface ParsedWolverineRow {
  upc: string;
  itemType: string;
  manufacturer: string;
  manufacturerPartNumber: string;
  vendorPartNumber: string;
  sin: string;
  itemName: string;
  itemDescription: string;
  uom: string;
  commercialPrice: number;
  websitePrice: number;
  supplierCost: number;
  grossMargin: number;
  govtPriceNoFee: number;
  govtPriceWithFee: number;
  countryOfOrigin: string;
  deliveryDays: number;
  warrantyPeriod: number;
  warrantyUnit: string;
  length: number | null;
  width: number | null;
  height: number | null;
  weightLbs: number | null;
  // Extracted fields
  style: string;
  size: string;
  rowNumber: number;
}

interface VariantGroup {
  style: string;
  productName: string;
  description: string;
  commercialPrice: number;
  websitePrice: number;
  govtPrice: number;
  supplierCost: number;
  manufacturer: string;
  sin: string;
  countryOfOrigin: string;
  deliveryDays: number;
  warrantyPeriod: number;
  warrantyUnit: string;
  rows: ParsedWolverineRow[];
}

export class WolverineImportService {
  private errors: WolverineImportError[] = [];
  private warnings: WolverineImportWarning[] = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];
  private createdVariants = 0;
  private skippedNoImage = 0;
  private imageIndex = new Map<string, string[]>(); // style -> [image filenames]

  /**
   * Parse Wolverine Excel file from buffer
   */
  async parseExcel(fileBuffer: Buffer): Promise<ParsedWolverineRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // Try Summary sheet first, then first sheet
    const sheetName = workbook.SheetNames.includes('Summary')
      ? 'Summary'
      : workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    // Find header row (row with column names)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      if (data[i] && Array.isArray(data[i]) &&
          (data[i].includes('manufacturer_part_number') || data[i].includes('vendor_part_number'))) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = data[headerRowIdx] as string[];
    const rows: ParsedWolverineRow[] = [];

    // Map column indices
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      if (h) colMap[h.toString().toLowerCase().trim()] = i;
    });

    console.log('Column mapping:', Object.keys(colMap));

    // Process data rows
    for (let i = headerRowIdx + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !Array.isArray(row)) continue;

      const getValue = (colName: string): string => {
        const idx = colMap[colName.toLowerCase()];
        return idx !== undefined && row[idx] !== undefined ? String(row[idx]).trim() : '';
      };

      const getNumber = (colName: string): number => {
        const val = getValue(colName);
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      };

      const mpn = getValue('manufacturer_part_number');
      if (!mpn) continue; // Skip empty rows

      // Extract style and size from manufacturer_part_number (e.g., E01830-3M)
      const parts = mpn.split('-');
      const style = parts[0] || mpn;
      const size = parts.slice(1).join('-') || '';

      rows.push({
        upc: getValue('upc'),
        itemType: getValue('item_type'),
        manufacturer: getValue('manufacturer'),
        manufacturerPartNumber: mpn,
        vendorPartNumber: getValue('vendor_part_number'),
        sin: getValue('sin'),
        itemName: getValue('item_name'),
        itemDescription: getValue('item_description'),
        uom: getValue('uom'),
        commercialPrice: getNumber('commercial_price'),
        websitePrice: getNumber('website price 45% gm'),
        supplierCost: getNumber('sup cost'),
        grossMargin: getNumber('gm'),
        govtPriceNoFee: getNumber('govt_price_no_fee'),
        govtPriceWithFee: getNumber('govt_price_with_fee'),
        countryOfOrigin: getValue('country_of_origin'),
        deliveryDays: getNumber('delivery_days'),
        warrantyPeriod: getNumber('warranty_period'),
        warrantyUnit: getValue('warranty_unit_of_time'),
        length: getNumber('length') || null,
        width: getNumber('width') || null,
        height: getNumber('height') || null,
        weightLbs: getNumber('weight_lbs') || null,
        style,
        size,
        rowNumber: i + 1,
      });
    }

    return rows;
  }

  /**
   * Group rows by style for variant detection
   */
  private groupByStyle(rows: ParsedWolverineRow[]): VariantGroup[] {
    const groups = new Map<string, ParsedWolverineRow[]>();

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

      variantGroups.push({
        style,
        productName: firstRow.itemName,
        description: firstRow.itemDescription,
        commercialPrice: firstRow.commercialPrice,
        websitePrice: firstRow.websitePrice,
        govtPrice: firstRow.govtPriceWithFee,
        supplierCost: firstRow.supplierCost,
        manufacturer: firstRow.manufacturer,
        sin: firstRow.sin,
        countryOfOrigin: firstRow.countryOfOrigin,
        deliveryDays: firstRow.deliveryDays,
        warrantyPeriod: firstRow.warrantyPeriod,
        warrantyUnit: firstRow.warrantyUnit,
        rows: groupRows,
      });
    }

    return variantGroups;
  }

  /**
   * Build image index from folder
   */
  private async buildImageIndex(imageBasePath: string): Promise<void> {
    this.imageIndex.clear();

    try {
      const files = await fs.readdir(imageBasePath);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!imageExtensions.includes(ext)) continue;

        const baseName = path.basename(file, path.extname(file));

        // Extract style from filename (E01830 from E01830.jpg or E01830_2.jpg)
        const styleMatch = baseName.match(/^([A-Z0-9-]+?)(?:_\d+)?$/i);
        if (styleMatch) {
          const style = styleMatch[1].toUpperCase();

          if (!this.imageIndex.has(style)) {
            this.imageIndex.set(style, []);
          }
          this.imageIndex.get(style)!.push(file);
        }
      }

      // Sort images for each style (main image first, then numbered)
      for (const [style, images] of this.imageIndex) {
        images.sort((a, b) => {
          // Main image (no number) comes first
          const aHasNumber = /_\d+\./i.test(a);
          const bHasNumber = /_\d+\./i.test(b);

          if (!aHasNumber && bHasNumber) return -1;
          if (aHasNumber && !bHasNumber) return 1;

          // Then sort by number
          const aNum = a.match(/_(\d+)\./)?.[1] || '0';
          const bNum = b.match(/_(\d+)\./)?.[1] || '0';
          return parseInt(aNum) - parseInt(bNum);
        });
      }

      console.log(`Built image index with ${this.imageIndex.size} styles`);

      // Log sample entries
      const samples = Array.from(this.imageIndex.entries()).slice(0, 5);
      console.log('Sample image index:', samples);

    } catch (error) {
      console.error('Error building image index:', error);
    }
  }

  /**
   * Get images for a style
   */
  private getImagesForStyle(style: string): string[] {
    return this.imageIndex.get(style.toUpperCase()) || [];
  }

  /**
   * Check if style has images
   */
  private styleHasImages(style: string): boolean {
    return this.getImagesForStyle(style).length > 0;
  }

  /**
   * Build full description HTML
   */
  private buildDescription(group: VariantGroup): string {
    const parts: string[] = [];

    // Main description (clean up newlines)
    if (group.description) {
      const cleanDesc = group.description
        .replace(/\r\n/g, '<br>')
        .replace(/\n/g, '<br>');
      parts.push(`<p>${cleanDesc}</p>`);
    }

    // Specifications
    const specs: string[] = [];
    if (group.manufacturer) specs.push(`<li><strong>Manufacturer:</strong> ${group.manufacturer}</li>`);
    if (group.countryOfOrigin) specs.push(`<li><strong>Country of Origin:</strong> ${group.countryOfOrigin}</li>`);
    if (group.warrantyPeriod) specs.push(`<li><strong>Warranty:</strong> ${group.warrantyPeriod} ${group.warrantyUnit || 'days'}</li>`);
    if (group.deliveryDays) specs.push(`<li><strong>Delivery:</strong> ${group.deliveryDays} days</li>`);

    if (specs.length > 0) {
      parts.push(`<h3>Specifications</h3><ul>${specs.join('')}</ul>`);
    }

    // Available sizes
    const sizes = group.rows.map(r => r.size).filter(Boolean);
    if (sizes.length > 0) {
      parts.push(`<h3>Available Sizes</h3><p>${sizes.join(', ')}</p>`);
    }

    return parts.join('\n') || `<p>${group.productName}</p>`;
  }

  /**
   * Generate SEO fields
   */
  private generateSEO(name: string, manufacturer: string): {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } {
    return {
      metaTitle: `${name} | ${manufacturer}`.substring(0, 70),
      metaDescription: `Shop ${name} by ${manufacturer}. Professional footwear for service and duty. Quality boots and shoes.`.substring(0, 160),
      metaKeywords: [name, manufacturer, 'boots', 'shoes', 'footwear', 'service', 'duty', 'tactical'].filter(Boolean).join(', '),
    };
  }

  /**
   * Import products from parsed data
   */
  async importProducts(
    rows: ParsedWolverineRow[],
    options: WolverineImportOptions = {}
  ): Promise<WolverineImportResult> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = path.join(process.cwd(), 'import-images'),
      dryRun = false,
      defaultStockQuantity = 100,
      defaultStatus = 'ACTIVE',
      defaultSupplierId,
      defaultWarehouseId,
      defaultBrandId,
      defaultCategoryId,
    } = options;

    this.errors = [];
    this.warnings = [];
    this.createdProducts = [];
    this.updatedProducts = [];
    this.createdVariants = 0;
    this.skippedNoImage = 0;

    // Build image index
    console.log('Building image index...');
    await this.buildImageIndex(imageBasePath);

    // Group rows by style
    const groups = this.groupByStyle(rows);
    console.log(`Found ${groups.length} product groups from ${rows.length} rows`);

    let processedCount = 0;

    for (const group of groups) {
      try {
        // Skip if no images
        const hasImages = this.styleHasImages(group.style);
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
          defaultSupplierId,
          defaultWarehouseId,
          defaultBrandId,
          defaultCategoryId,
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
    };
  }

  /**
   * Import a product group
   */
  private async importProductGroup(
    group: VariantGroup,
    options: WolverineImportOptions
  ): Promise<void> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = '',
      dryRun = false,
      defaultStockQuantity = 100,
      defaultStatus = 'ACTIVE',
      defaultSupplierId,
      defaultWarehouseId,
      defaultBrandId,
      defaultCategoryId,
    } = options;

    // Check if product exists
    let existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: group.style },
          { slug: group.style.toLowerCase() },
        ],
      },
    });

    // Build description
    const description = this.buildDescription(group);

    // Generate SEO
    const seo = this.generateSEO(group.productName, group.manufacturer);

    const hasVariants = group.rows.length > 1;

    // Use website price or commercial price
    const basePrice = group.websitePrice || group.commercialPrice || 0.01;
    const gsaPrice = group.govtPrice || null;
    const costPrice = group.supplierCost || null;

    const productData: any = {
      name: group.productName,
      slug: group.style.toLowerCase(),
      description,
      shortDescription: group.productName,
      basePrice: new Decimal(basePrice),
      ...(gsaPrice && { gsaPrice: new Decimal(gsaPrice) }),
      ...(costPrice && { costPrice: new Decimal(costPrice) }),
      ...(group.sin && { gsaSin: String(group.sin) }),
      stockQuantity: hasVariants ? 0 : defaultStockQuantity,
      status: defaultStatus,
      hasVariants,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      metaKeywords: seo.metaKeywords,
      ...(defaultBrandId && { brand: { connect: { id: defaultBrandId } } }),
      ...(defaultCategoryId && { category: { connect: { id: defaultCategoryId } } }),
      ...(defaultSupplierId && { defaultSupplier: { connect: { id: defaultSupplierId } } }),
      ...(defaultWarehouseId && { defaultWarehouse: { connect: { id: defaultWarehouseId } } }),
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
    let totalStock = hasVariants ? 0 : defaultStockQuantity;
    if (hasVariants) {
      for (const row of group.rows) {
        const variantPrice = row.websitePrice || row.commercialPrice || basePrice;

        await prisma.productVariant.create({
          data: {
            productId: savedProduct.id,
            sku: row.vendorPartNumber || `${group.style}-${row.size}`,
            name: row.size || 'Default',
            basePrice: new Decimal(variantPrice),
            ...(row.govtPriceWithFee && { gsaPrice: new Decimal(row.govtPriceWithFee) }),
            ...(row.supplierCost && { costPrice: new Decimal(row.supplierCost) }),
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
      const images = this.getImagesForStyle(group.style);
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

    // Create warehouse stock entry if warehouse is specified
    if (defaultWarehouseId && savedProduct) {
      await this.createWarehouseStock(savedProduct.id, defaultWarehouseId, totalStock);
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
        brandSlug: 'wolverine',
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

  /**
   * Create warehouse stock entry
   */
  private async createWarehouseStock(
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<void> {
    const existing = await prisma.warehouseStock.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.warehouseStock.update({
        where: {
          warehouseId_productId: {
            warehouseId,
            productId,
          },
        },
        data: {
          quantity,
          available: quantity,
        },
      });
    } else {
      await prisma.warehouseStock.create({
        data: {
          warehouseId,
          productId,
          quantity,
          available: quantity,
          reserved: 0,
          reorderPoint: 10,
          reorderQuantity: 50,
        },
      });
    }
  }
}

// Singleton instance
export const wolverineImportService = new WolverineImportService();
