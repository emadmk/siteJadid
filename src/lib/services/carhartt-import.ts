import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, readdirSync, statSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from './image-processor';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Carhartt Import Service
 *
 * Excel Field Mapping:
 * - manufacturer_part_number → Original manufacturer part number (CMW6095)
 * - ADA vendor_part_number → Our SKU displayed to customers (CHT-CMW6095-7M)
 * - item_name → product name
 * - item_description → description
 * - commercial_price → basePrice (MSRP)
 * - Website Sale Price → salePrice
 * - Sup Cost → costPrice
 * - GSA/Federal Price → gsaPrice
 * - sin → GSA Special Item Number
 *
 * Variants:
 * - Same manufacturer_part_number base (CMW6095) = one product with size variants
 * - Size extracted from ADA vendor_part_number (e.g., "7M", "8W")
 *
 * Images:
 * - Base path: /root/ada/siteJadid/import-images/Images/
 * - Structure: {Category}/{Style}/{PartNumber}/JPEG/ or {Category}/{Style}/{PartNumber}/JPG/
 * - Pattern: {PartNumber} 1.jpg, {PartNumber} 2.jpg, ... {PartNumber} 8.jpg
 */

export interface CarharttImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface CarharttImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface CarharttImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedNoImage: number;
  errors: CarharttImportError[];
  warnings: CarharttImportWarning[];
  createdProducts: string[];
  updatedProducts: string[];
  createdVariants: number;
}

export interface CarharttImportOptions {
  updateExisting?: boolean;
  importImages?: boolean;
  imageBasePath?: string;
  dryRun?: boolean;
  defaultStockQuantity?: number;
  defaultStatus?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'PRERELEASE';
  defaultSupplierId?: string;
  defaultWarehouseId?: string;
  defaultBrandId?: string;
  defaultCategoryId?: string;
}

interface ParsedCarharttRow {
  upcStyle: string;
  itemType: string;
  manufacturer: string;
  manufacturerPartNumber: string;  // Original part number (CMW6095)
  adaVendorPartNumber: string;     // ADA's SKU (CHT-CMW6095-7M)
  sin: string;
  itemName: string;
  itemDescription: string;
  recycledContentPercent: string;
  uom: string;
  quantityPerPack: number;
  quantityUnitUom: string;
  commercialPrice: number;         // MSRP
  mfcName: string;
  mfcPrice: number;
  websiteSalePrice: number;        // Website price
  supCost: number;                 // Supplier cost
  gsaFederalPrice: number;         // GSA price
  countryOfOrigin: string;
  deliveryDays: number;
  leadTimeCode: string;
  fobUs: string;
  fobAk: string;
  fobHi: string;
  fobPr: string;
  nsn: string;
  upc: string;
  unspsc: string;
  defaultPhoto: string;
  photo2: string;
  photo3: string;
  photo4: string;
  warrantyPeriod: number;
  warrantyUnit: string;
  length: number | null;
  width: number | null;
  height: number | null;
  physicalUom: string;
  weightLbs: number | null;
  // Extracted fields
  basePartNumber: string;  // Base part number without size (CMW6095)
  size: string;            // Size extracted from ADA part number
  rowNumber: number;
}

interface VariantGroup {
  basePartNumber: string;
  productName: string;
  description: string;
  commercialPrice: number;
  websitePrice: number;
  gsaPrice: number;
  supplierCost: number;
  manufacturer: string;
  sin: string;
  countryOfOrigin: string;
  deliveryDays: number;
  warrantyPeriod: number;
  warrantyUnit: string;
  uom: string;
  quantityPerPack: number;
  // Physical dimensions
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  rows: ParsedCarharttRow[];
}

export class CarharttImportService {
  private errors: CarharttImportError[] = [];
  private warnings: CarharttImportWarning[] = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];
  private createdVariants = 0;
  private skippedNoImage = 0;
  private imageCache = new Map<string, string[]>(); // partNumber -> [image paths]

  /**
   * Parse Carhartt Excel file from buffer
   */
  async parseExcel(fileBuffer: Buffer): Promise<ParsedCarharttRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    // Find header row (row with column names)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      if (data[i] && Array.isArray(data[i]) &&
          (data[i].includes('manufacturer_part_number') ||
           data[i].includes('ADA vendor_part_number'))) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = data[headerRowIdx] as string[];
    const rows: ParsedCarharttRow[] = [];

    // Map column indices
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      if (h) colMap[h.toString().toLowerCase().trim()] = i;
    });

    console.log('Carhartt Column mapping:', Object.keys(colMap));

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
      const adaVpn = getValue('ada vendor_part_number');
      if (!mpn && !adaVpn) continue; // Skip empty rows

      // Extract base part number and size from ADA vendor part number
      // Format: CHT-CMW6095-7M → base=CMW6095, size=7M
      let basePartNumber = mpn;
      let size = '';

      if (adaVpn) {
        const parts = adaVpn.split('-');
        if (parts.length >= 3) {
          // CHT-CMW6095-7M → size is last part
          size = parts[parts.length - 1];
        } else if (parts.length === 2) {
          size = parts[1];
        }
      }

      rows.push({
        upcStyle: getValue('upc - style'),
        itemType: getValue('item_type'),
        manufacturer: getValue('manufacturer'),
        manufacturerPartNumber: mpn,
        adaVendorPartNumber: adaVpn,
        sin: getValue('sin'),
        itemName: getValue('item_name'),
        itemDescription: getValue('item_description'),
        recycledContentPercent: getValue('recycled_content_percent'),
        uom: getValue('uom'),
        quantityPerPack: getNumber('quantity_per_pack') || 1,
        quantityUnitUom: getValue('quantity_unit_uom'),
        commercialPrice: getNumber('commercial_price'),
        mfcName: getValue('mfc_name'),
        mfcPrice: getNumber('mfc_price'),
        websiteSalePrice: getNumber('website sale price'),
        supCost: getNumber('sup cost'),
        gsaFederalPrice: getNumber('gsa/federal price'),
        countryOfOrigin: getValue('country_of_origin'),
        deliveryDays: getNumber('delivery_days'),
        leadTimeCode: getValue('lead_time_code'),
        fobUs: getValue('fob_us'),
        fobAk: getValue('fob_ak'),
        fobHi: getValue('fob_hi'),
        fobPr: getValue('fob_pr'),
        nsn: getValue('nsn'),
        upc: getValue('upc'),
        unspsc: getValue('unspsc'),
        defaultPhoto: getValue('default_photo'),
        photo2: getValue('photo_2'),
        photo3: getValue('photo_3'),
        photo4: getValue('photo_4'),
        warrantyPeriod: getNumber('warranty_period'),
        warrantyUnit: getValue('warranty_unit_of_time'),
        length: getNumber('length') || null,
        width: getNumber('width') || null,
        height: getNumber('height') || null,
        physicalUom: getValue('physical_uom'),
        weightLbs: getNumber('weight_lbs') || null,
        basePartNumber,
        size,
        rowNumber: i + 1,
      });
    }

    return rows;
  }

  /**
   * Group rows by base part number for variant detection
   */
  private groupByBasePartNumber(rows: ParsedCarharttRow[]): VariantGroup[] {
    const groups = new Map<string, ParsedCarharttRow[]>();

    for (const row of rows) {
      const key = row.basePartNumber || row.manufacturerPartNumber;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    }

    const variantGroups: VariantGroup[] = [];
    for (const [basePartNumber, groupRows] of groups) {
      const firstRow = groupRows[0];

      variantGroups.push({
        basePartNumber,
        productName: firstRow.itemName,
        description: firstRow.itemDescription,
        commercialPrice: firstRow.commercialPrice,
        websitePrice: firstRow.websiteSalePrice,
        gsaPrice: firstRow.gsaFederalPrice,
        supplierCost: firstRow.supCost,
        manufacturer: firstRow.manufacturer,
        sin: firstRow.sin,
        countryOfOrigin: firstRow.countryOfOrigin,
        deliveryDays: firstRow.deliveryDays,
        warrantyPeriod: firstRow.warrantyPeriod,
        warrantyUnit: firstRow.warrantyUnit,
        uom: firstRow.uom,
        quantityPerPack: firstRow.quantityPerPack,
        length: firstRow.length,
        width: firstRow.width,
        height: firstRow.height,
        weight: firstRow.weightLbs,
        rows: groupRows,
      });
    }

    return variantGroups;
  }

  /**
   * Recursively search for images in the image base path
   * Looks for folders matching the part number
   */
  private async buildImageIndex(imageBasePath: string): Promise<void> {
    this.imageCache.clear();

    const searchRecursively = async (dir: string): Promise<void> => {
      try {
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // Check if this is a JPEG/JPG folder with images
            if (entry.name.toLowerCase() === 'jpeg' || entry.name.toLowerCase() === 'jpg') {
              // Get parent folder name (should be part number)
              const parentDir = path.dirname(fullPath);
              const partNumber = path.basename(parentDir);

              // Find all images in this folder
              const imageFiles = readdirSync(fullPath)
                .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
                .sort((a, b) => {
                  // Sort by number in filename
                  const numA = parseInt(a.match(/(\d+)\./)?.[1] || '0');
                  const numB = parseInt(b.match(/(\d+)\./)?.[1] || '0');
                  return numA - numB;
                })
                .map(f => path.join(fullPath, f));

              if (imageFiles.length > 0) {
                this.imageCache.set(partNumber.toUpperCase(), imageFiles);
              }
            } else {
              // Continue searching in subdirectories
              await searchRecursively(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    console.log(`Building image index from: ${imageBasePath}`);
    await searchRecursively(imageBasePath);
    console.log(`Found images for ${this.imageCache.size} products`);

    // Log some samples
    const samples = Array.from(this.imageCache.entries()).slice(0, 5);
    for (const [pn, paths] of samples) {
      console.log(`  ${pn}: ${paths.length} images`);
    }
  }

  /**
   * Get images for a part number
   */
  private getImagesForPartNumber(partNumber: string): string[] {
    // Try exact match first
    let images = this.imageCache.get(partNumber.toUpperCase());
    if (images) return images;

    // Try without suffix (e.g., CMW6095-M → CMW6095)
    const basePart = partNumber.split('-')[0];
    images = this.imageCache.get(basePart.toUpperCase());
    if (images) return images;

    return [];
  }

  /**
   * Build full description HTML
   */
  private buildDescription(group: VariantGroup): string {
    const parts: string[] = [];

    if (group.description) {
      const cleanDesc = group.description
        .replace(/\r\n/g, '<br>')
        .replace(/\n/g, '<br>');
      parts.push(`<p>${cleanDesc}</p>`);
    }

    // Add specs
    const specs: string[] = [];
    if (group.countryOfOrigin) specs.push(`<li><strong>Country of Origin:</strong> ${group.countryOfOrigin}</li>`);
    if (group.warrantyPeriod) specs.push(`<li><strong>Warranty:</strong> ${group.warrantyPeriod} ${group.warrantyUnit || 'days'}</li>`);
    if (group.uom) specs.push(`<li><strong>Unit:</strong> ${group.uom}</li>`);

    if (specs.length > 0) {
      parts.push(`<ul class="specs-list">${specs.join('')}</ul>`);
    }

    return parts.join('');
  }

  /**
   * Generate short description from full description
   */
  private generateShortDescription(description: string, maxLength: number = 200): string {
    const text = description
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string, partNumber: string): string {
    const base = name || partNumber;
    return base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  /**
   * Get or create Carhartt brand
   */
  private async getOrCreateBrand(): Promise<string> {
    let brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { slug: 'carhartt' },
          { name: { contains: 'Carhartt', mode: 'insensitive' } }
        ]
      },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: 'Carhartt',
          slug: 'carhartt',
          description: 'Carhartt - Premium workwear and safety footwear',
          isActive: true,
        },
      });
      console.log('Created Carhartt brand');
    }

    return brand.id;
  }

  /**
   * Get Footwear category
   */
  private async getFootwearCategory(): Promise<string | null> {
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: 'footwear' },
          { name: { contains: 'Footwear', mode: 'insensitive' } }
        ]
      },
    });

    return category?.id || null;
  }

  /**
   * Import products from parsed data
   */
  async importProducts(
    rows: ParsedCarharttRow[],
    options: CarharttImportOptions = {}
  ): Promise<CarharttImportResult> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = '/root/ada/siteJadid/import-images/Images',
      dryRun = false,
      defaultStockQuantity = 0,
      defaultStatus = 'PRERELEASE',
      defaultSupplierId,
      defaultWarehouseId,
      defaultBrandId,
      defaultCategoryId,
    } = options;

    // Reset counters
    this.errors = [];
    this.warnings = [];
    this.createdProducts = [];
    this.updatedProducts = [];
    this.createdVariants = 0;
    this.skippedNoImage = 0;

    // Build image index
    if (importImages) {
      await this.buildImageIndex(imageBasePath);
    }

    // Get or create brand
    const brandId = defaultBrandId || await this.getOrCreateBrand();

    // Get category
    const categoryId = defaultCategoryId || await this.getFootwearCategory();

    // Group by base part number
    const groups = this.groupByBasePartNumber(rows);
    console.log(`Processing ${groups.length} product groups from ${rows.length} rows`);

    let processedRows = 0;

    for (const group of groups) {
      try {
        await this.processGroup(group, {
          updateExisting,
          importImages,
          imageBasePath,
          dryRun,
          defaultStockQuantity,
          defaultStatus,
          brandId,
          categoryId,
          defaultSupplierId,
          defaultWarehouseId,
        });
        processedRows += group.rows.length;
      } catch (error) {
        console.error(`Error processing group ${group.basePartNumber}:`, error);
        this.errors.push({
          row: group.rows[0].rowNumber,
          field: 'general',
          value: group.basePartNumber,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      success: this.errors.length === 0,
      totalRows: rows.length,
      processedRows,
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
   * Process a single variant group
   */
  private async processGroup(
    group: VariantGroup,
    options: {
      updateExisting: boolean;
      importImages: boolean;
      imageBasePath: string;
      dryRun: boolean;
      defaultStockQuantity: number;
      defaultStatus: string;
      brandId: string;
      categoryId: string | null;
      defaultSupplierId?: string;
      defaultWarehouseId?: string;
    }
  ): Promise<void> {
    const {
      updateExisting,
      importImages,
      imageBasePath,
      dryRun,
      defaultStockQuantity,
      defaultStatus,
      brandId,
      categoryId,
      defaultSupplierId,
      defaultWarehouseId,
    } = options;

    const hasVariants = group.rows.length > 1;
    const firstRow = group.rows[0];

    // Check if product exists (by manufacturer part number)
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: group.basePartNumber },
          { vendorPartNumber: firstRow.adaVendorPartNumber },
        ],
      },
    });

    if (existingProduct && !updateExisting) {
      this.warnings.push({
        row: firstRow.rowNumber,
        field: 'sku',
        message: `Product ${group.basePartNumber} already exists, skipping`,
      });
      return;
    }

    // Build product data
    const description = this.buildDescription(group);
    const shortDescription = this.generateShortDescription(group.productName + '. ' + group.description);
    const basePrice = group.websitePrice || group.commercialPrice || 0;

    // Generate unique slug
    let slug = this.generateSlug(group.productName, group.basePartNumber);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug && existingSlug.sku !== group.basePartNumber) {
      slug = `${slug}-${group.basePartNumber.toLowerCase()}`;
    }

    // Map UOM to priceUnit
    const priceUnitMap: Record<string, string> = {
      'PR': 'pr',
      'EA': 'ea',
      'PK': 'pk',
      'DZ': 'DZ',
    };
    const priceUnit = priceUnitMap[group.uom?.toUpperCase()] || 'ea';

    const productData: any = {
      name: group.productName,
      slug,
      description,
      shortDescription,
      status: defaultStatus,
      basePrice: new Decimal(basePrice),
      ...(group.websitePrice && group.websitePrice !== basePrice && { salePrice: new Decimal(group.websitePrice) }),
      ...(group.supplierCost && { costPrice: new Decimal(group.supplierCost) }),
      ...(group.gsaPrice && { gsaPrice: new Decimal(group.gsaPrice) }),
      ...(group.sin && { gsaSin: String(group.sin) }),
      priceUnit,
      qtyPerPack: group.quantityPerPack || 1,
      stockQuantity: hasVariants ? 0 : defaultStockQuantity,
      hasVariants,
      brandId,
      ...(categoryId && { categoryId }),
      ...(defaultSupplierId && { defaultSupplierId }),
      ...(defaultWarehouseId && { defaultWarehouseId }),
      // Physical dimensions (convert from inches if needed)
      ...(group.length && { length: new Decimal(group.length) }),
      ...(group.width && { width: new Decimal(group.width) }),
      ...(group.height && { height: new Decimal(group.height) }),
      ...(group.weight && { weight: new Decimal(group.weight) }),
      // Store original category info for PreRelease review
      originalCategory: 'Carhartt Footwear',
      // For single variant, set vendor part number
      ...(!hasVariants && firstRow.adaVendorPartNumber && {
        vendorPartNumber: firstRow.adaVendorPartNumber
      }),
    };

    if (dryRun) {
      console.log(`[DRY RUN] Would create/update product: ${group.basePartNumber}`);
      return;
    }

    let savedProduct;
    if (existingProduct && updateExisting) {
      savedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
      this.updatedProducts.push(group.basePartNumber);

      // Delete existing variants if has variants
      if (hasVariants) {
        await prisma.productVariant.deleteMany({
          where: { productId: savedProduct.id },
        });
      }
    } else if (!existingProduct) {
      savedProduct = await prisma.product.create({
        data: {
          sku: group.basePartNumber,
          ...productData,
        },
      });
      this.createdProducts.push(group.basePartNumber);
    } else {
      savedProduct = existingProduct;
    }

    // Create variants if multiple rows
    let totalStock = hasVariants ? 0 : defaultStockQuantity;
    if (hasVariants) {
      for (const row of group.rows) {
        const variantPrice = row.websiteSalePrice || row.commercialPrice || basePrice;
        const variantSize = row.size || 'Default';

        await prisma.productVariant.create({
          data: {
            productId: savedProduct.id,
            sku: row.adaVendorPartNumber || `${group.basePartNumber}-${variantSize}`,
            name: variantSize,
            basePrice: new Decimal(variantPrice),
            ...(row.gsaFederalPrice && { gsaPrice: new Decimal(row.gsaFederalPrice) }),
            ...(row.supCost && { costPrice: new Decimal(row.supCost) }),
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
      const imagePaths = this.getImagesForPartNumber(group.basePartNumber);
      if (imagePaths.length > 0) {
        await this.processProductImages(
          savedProduct.id,
          group.basePartNumber,
          imagePaths,
          existingProduct !== null
        );
      } else {
        this.warnings.push({
          row: firstRow.rowNumber,
          field: 'images',
          message: `No images found for ${group.basePartNumber}`,
        });
      }
    }

    // Create warehouse stock entry if warehouse is specified
    if (defaultWarehouseId && savedProduct) {
      await this.createWarehouseStock(savedProduct.id, defaultWarehouseId, totalStock);
    }
  }

  /**
   * Process and save product images
   */
  private async processProductImages(
    productId: string,
    partNumber: string,
    imagePaths: string[],
    isUpdate: boolean
  ): Promise<void> {
    // Read image files
    const imageFiles: Array<{ buffer: Buffer; filename: string }> = [];

    for (const imagePath of imagePaths) {
      try {
        const buffer = await fs.readFile(imagePath);
        const filename = path.basename(imagePath);
        imageFiles.push({ buffer, filename });
      } catch (error) {
        console.error(`Error reading image ${imagePath}:`, error);
      }
    }

    if (imageFiles.length === 0) {
      this.warnings.push({
        row: 0,
        field: 'images',
        message: `No readable images found for ${partNumber}`,
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
        brandSlug: 'carhartt',
        productSku: partNumber,
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

      // Update product images array (use medium for better quality)
      await prisma.product.update({
        where: { id: productId },
        data: {
          images: processedImages.map(img => img.mediumUrl || img.thumbUrl).filter(Boolean) as string[],
        },
      });
    } catch (error) {
      console.error(`Error processing images for ${partNumber}:`, error);
      this.warnings.push({
        row: 0,
        field: 'images',
        message: `Failed to process images for ${partNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
export const carharttImportService = new CarharttImportService();
