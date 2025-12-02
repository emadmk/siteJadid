import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from './image-processor';
import { Decimal } from '@prisma/client/runtime/library';

// Default field mapping - can be customized
// Supports GSA format and standard formats
export const DEFAULT_FIELD_MAPPING: Record<string, string> = {
  // === SKU / Part Number ===
  'Vendor Part Number': 'sku',
  'vendor_part_number': 'sku',
  'SKU': 'sku',
  'sku': 'sku',
  'Part Number': 'sku',
  'part_number': 'sku',
  'manufacturer_part_number': 'sku',

  // === Product Name ===
  'Product Information': 'name',
  'Item_name': 'name',
  'item_name': 'name',
  'Product Name': 'name',
  'Name': 'name',
  'name': 'name',

  // === Description ===
  'Item_description': 'description',
  'item_description': 'description',
  'Item Description': 'description',
  'Description': 'description',
  'description': 'description',
  'Full Description': 'description',
  'full_description': 'description',
  'Product Description': 'description',
  'Long Description': 'description',

  // === Brand / Manufacturer ===
  'Manufacturer Information': 'brandName',
  'manufacturer_information': 'brandName',
  'manufacturer': 'brandName',
  'Brand': 'brandName',
  'brand': 'brandName',
  'Manufacturer': 'brandName',

  // === Pricing ===
  'Commercial Price / Manufacturer\'s Suggested Retail Price': 'basePrice',
  'commercial_price': 'basePrice',
  'commerci_al_price': 'basePrice',
  'Unit Price': 'basePrice',
  'unit_price': 'basePrice',
  'Price': 'basePrice',
  'price': 'basePrice',
  'Retail Price': 'basePrice',
  'mfc_price': 'basePrice',

  // Cost Price (Supplier Cost)
  'Sup Cost': 'costPrice',
  'sup_cost': 'costPrice',
  'Cost Price': 'costPrice',
  'cost_price': 'costPrice',
  'dealer_cost': 'costPrice',
  'dealer_co_st': 'costPrice',

  // GSA Price
  'Price Proposal': 'gsaPrice',
  'govt_price_with_fee': 'gsaPrice',
  'govt_price_with_fe': 'gsaPrice',
  'GSA Price': 'gsaPrice',
  'gsa_price': 'gsaPrice',
  'govt_price_no_fee': 'gsaPriceNoFee',
  'govt_pric_e_no_fe': 'gsaPriceNoFee',

  // Wholesale Price
  'Wholesale Price': 'wholesalePrice',
  'wholesale_price': 'wholesalePrice',

  // === GSA Specific ===
  'Special Item Number': 'gsaSin',
  'sin': 'gsaSin',
  'National Stock Number': 'nsn',
  'nsn': 'nsn',
  'Country of Origin': 'countryOfOrigin',
  'country_of_origin': 'countryOfOrigin',
  'country_of_origi': 'countryOfOrigin',

  // === UPC ===
  'UPC': 'upc',
  'upc': 'upc',
  'unspsc': 'unspsc',

  // === Category ===
  'Category': 'categoryName',
  'category': 'categoryName',
  'Product Information / Categorization': 'categoryName',
  'product_info_code': 'categoryName',
  'product_info_cod_e': 'categoryName',

  // === Stock / Quantity ===
  'Stock': 'stockQuantity',
  'stock': 'stockQuantity',
  'Quantity': 'stockQuantity',
  'quantity': 'stockQuantity',
  'Quantity Per Pack': 'quantityPerPack',
  'quantity_per_pack': 'quantityPerPack',
  'quantity_per_pa': 'quantityPerPack',

  // === Unit of Measure ===
  'Unit of Measure': 'unitOfMeasure',
  'uom': 'unitOfMeasure',
  'unit_uom': 'unitOfMeasure',
  'unit_uc': 'unitOfMeasure',

  // === Dimensions ===
  // === Physical Attributes ===
  'Weight': 'weight',
  'weight': 'weight',
  'weight_lbs': 'weight',
  'weight_lb_s': 'weight',
  'Weight (lbs)': 'weight',
  'Weight (lb)': 'weight',
  'Product Weight': 'weight',

  'Length': 'length',
  'length': 'length',
  'Length (in)': 'length',
  'Product Length': 'length',

  'Width': 'width',
  'width': 'width',
  'Width (in)': 'width',
  'Product Width': 'width',

  'Height': 'height',
  'height': 'height',
  'Height (in)': 'height',
  'Product Height': 'height',
  'physical_uom': 'dimensionUnit',
  'physical_uom_s': 'dimensionUnit',

  // === Delivery ===
  'Delivery Information': 'deliveryDays',
  'delivery_days': 'deliveryDays',
  'delivery_day': 'deliveryDays',
  'lead_time': 'leadTime',
  'lead_tim': 'leadTime',

  // === Photos (your format: default_photo, photo, photo_2, photo_3, photo_4) ===
  'Photo File References': 'imagePattern',
  'Photo File Reference': 'imagePattern',
  'photo_file_reference': 'imagePattern',
  'default_photo': 'imagePattern',
  'default_p_hoto': 'imagePattern',
  'photo': 'photo1',
  'photo_2': 'photo2',
  'photo_3': 'photo3',
  'photo_4': 'photo4',

  // === Warranty ===
  'Warranty Duration': 'warrantyDuration',
  'product_warranty_period': 'warrantyDuration',
  'product_warranty_peri': 'warrantyDuration',
  'warranty_unit_of_time': 'warrantyUnit',
  'warranty_unit_of_tim': 'warrantyUnit',

  // === Other GSA fields ===
  'hazmat': 'hazmat',
  'url_508': 'accessibilityUrl',
  'mfc_name': 'mfcName',
  'mfc_nam_e': 'mfcName',
  'Most Favored Customer': 'mfcName',
  'mfc_markup_percentage': 'mfcMarkup',
  'mfc_markup_perc': 'mfcMarkup',
  'govt_markup_percentage': 'govtMarkup',
  'govt_mar_kup_perc': 'govtMarkup',
  'Dealer Markup': 'dealerMarkup',
  'dealer_markup': 'dealerMarkup',
  'recycled_content_percent': 'recycledContent',
  'recycled_content_perce': 'recycledContent',
  'Greenest ep Cost': 'greenestCost',
  'greenest_ep_cost': 'greenestCost',
  'item_type': 'itemType',
  'Base Product or Accessory': 'itemType',
};

export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  createdProducts: string[];
  updatedProducts: string[];
}

export interface ImportOptions {
  updateExisting?: boolean;
  skipErrors?: boolean;
  importImages?: boolean;
  imageBasePath?: string;
  imagePattern?: string; // e.g., "{partNumber}_{index}" or "{sku}-{index}"
  fieldMapping?: Record<string, string>;
  dryRun?: boolean;
  // Default assignments for all imported products
  defaultBrandId?: string;
  defaultCategoryId?: string;
  defaultWarehouseId?: string;
  defaultSupplierId?: string;
  // Stock and Status defaults
  defaultStockQuantity?: number;
  defaultStatus?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
}

interface ParsedProduct {
  sku: string;
  name: string;
  description?: string;
  shortDescription?: string;
  brandName?: string;
  categoryName?: string;
  basePrice: number;
  costPrice?: number;
  gsaPrice?: number;
  wholesalePrice?: number;
  stockQuantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  upc?: string;
  imagePattern?: string;
  // GSA specific fields
  gsaSin?: string;
  nsn?: string;
  countryOfOrigin?: string;
  quantityPerPack?: number;
  unitOfMeasure?: string;
  // Photo fields from your Excel
  photo1?: string;
  photo2?: string;
  photo3?: string;
  photo4?: string;
  // Extra metadata (stored as JSON)
  metadata?: Record<string, unknown>;
  rowNumber: number;
  rawData: Record<string, unknown>;
}

/**
 * Professional Bulk Import Service
 * - Parses Excel files
 * - Maps columns to database fields
 * - Handles image import by Part Number
 * - Provides detailed error reporting
 */
export class BulkImportService {
  private errors: ImportError[] = [];
  private warnings: ImportWarning[] = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];

  /**
   * Parse Excel file and extract product data
   */
  async parseExcel(
    fileBuffer: Buffer | ArrayBuffer,
    fieldMapping: Record<string, string> = DEFAULT_FIELD_MAPPING
  ): Promise<ParsedProduct[]> {
    const workbook = new ExcelJS.Workbook();
    // ExcelJS expects ArrayBuffer, convert if needed
    const arrayBuffer = fileBuffer instanceof ArrayBuffer
      ? fileBuffer
      : fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer;
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    const products: ParsedProduct[] = [];
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];

    // Extract headers
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString().trim() || '';
    });

    // Process each data row (skip first 2 header rows)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // Skip header rows (row 1: main headers, row 2: field names)

      const rawData: Record<string, unknown> = {};
      const mappedData: Record<string, unknown> = {};

      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber];
        const value = cell.value;

        rawData[header] = value;

        // Map to database field
        const dbField = fieldMapping[header];
        if (dbField) {
          mappedData[dbField] = value;
        }
      });

      // Validate required fields
      const sku = String(mappedData.sku || '').trim();
      const name = String(mappedData.name || '').trim();
      const basePrice = parseFloat(String(mappedData.basePrice || '0'));

      if (!sku) {
        this.errors.push({
          row: rowNumber,
          field: 'sku',
          value: '',
          message: 'SKU/Part Number is required',
        });
        return;
      }

      if (!name) {
        this.warnings.push({
          row: rowNumber,
          field: 'name',
          message: 'Product name is empty, will use SKU as name',
        });
      }

      // Collect extra GSA metadata
      const metadata: Record<string, unknown> = {};
      const gsaFields = ['gsaPriceNoFee', 'nsn', 'countryOfOrigin', 'deliveryDays', 'leadTime',
        'hazmat', 'accessibilityUrl', 'mfcName', 'mfcMarkup', 'govtMarkup', 'dealerMarkup',
        'recycledContent', 'greenestCost', 'itemType', 'warrantyDuration', 'warrantyUnit',
        'dimensionUnit', 'unspsc'];
      for (const field of gsaFields) {
        if (mappedData[field]) {
          metadata[field] = mappedData[field];
        }
      }

      // Generate short description from full description (first 150 chars)
      const fullDescription = String(mappedData.description || '').trim();
      const shortDesc = fullDescription.length > 150
        ? fullDescription.substring(0, 150).trim() + '...'
        : fullDescription;

      // Parse cost price
      const costPrice = mappedData.costPrice ? parseFloat(String(mappedData.costPrice)) : undefined;

      products.push({
        sku,
        name: name || sku,
        description: fullDescription || undefined,
        shortDescription: shortDesc || undefined,
        brandName: String(mappedData.brandName || '').trim() || undefined,
        categoryName: String(mappedData.categoryName || '').trim() || undefined,
        basePrice: isNaN(basePrice) ? 0 : basePrice,
        costPrice: costPrice && !isNaN(costPrice) ? costPrice : undefined,
        gsaPrice: mappedData.gsaPrice ? parseFloat(String(mappedData.gsaPrice)) : undefined,
        wholesalePrice: mappedData.wholesalePrice
          ? parseFloat(String(mappedData.wholesalePrice))
          : undefined,
        stockQuantity: mappedData.stockQuantity
          ? parseInt(String(mappedData.stockQuantity))
          : undefined,
        weight: mappedData.weight ? parseFloat(String(mappedData.weight)) : undefined,
        length: mappedData.length ? parseFloat(String(mappedData.length)) : undefined,
        width: mappedData.width ? parseFloat(String(mappedData.width)) : undefined,
        height: mappedData.height ? parseFloat(String(mappedData.height)) : undefined,
        upc: String(mappedData.upc || '').trim() || undefined,
        // GSA fields
        gsaSin: String(mappedData.gsaSin || '').trim() || undefined,
        quantityPerPack: mappedData.quantityPerPack ? parseInt(String(mappedData.quantityPerPack)) : undefined,
        unitOfMeasure: String(mappedData.unitOfMeasure || '').trim() || undefined,
        // Photo fields (your Excel format)
        imagePattern: String(mappedData.imagePattern || '').trim() || undefined,
        photo1: String(mappedData.photo1 || '').trim() || undefined,
        photo2: String(mappedData.photo2 || '').trim() || undefined,
        photo3: String(mappedData.photo3 || '').trim() || undefined,
        photo4: String(mappedData.photo4 || '').trim() || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        rowNumber,
        rawData,
      });
    });

    return products;
  }

  /**
   * Find or create brand
   */
  private async findOrCreateBrand(brandName: string): Promise<string | null> {
    if (!brandName) return null;

    const slug = brandName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');

    let brand = await prisma.brand.findFirst({
      where: {
        OR: [{ name: { equals: brandName, mode: 'insensitive' } }, { slug }],
      },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: brandName,
          slug,
          isActive: true,
        },
      });
    }

    return brand.id;
  }

  /**
   * Find or create category
   */
  private async findOrCreateCategory(categoryName: string): Promise<string | null> {
    if (!categoryName) return null;

    const slug = categoryName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');

    let category = await prisma.category.findFirst({
      where: {
        OR: [{ name: { equals: categoryName, mode: 'insensitive' } }, { slug }],
      },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          slug,
          isActive: true,
        },
      });
    }

    return category.id;
  }

  /**
   * Extract base part number from SKU for image matching
   * Examples: K-1006980-7 → 1006980, 1006980-8.5 → 1006980
   */
  private extractBasePartNumber(sku: string): string {
    // Try to extract the main numeric part (usually 7 digits)
    const matches = sku.match(/(\d{6,8})/);
    if (matches) {
      return matches[1];
    }
    // If no match, return original SKU cleaned up
    return sku.replace(/[^\w]/g, '');
  }

  /**
   * Find images for a product based on part number pattern
   */
  private async findProductImages(
    partNumber: string,
    imageBasePath: string
  ): Promise<Array<{ buffer: Buffer; filename: string }>> {
    const images: Array<{ buffer: Buffer; filename: string }> = [];
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    // Extract base part number for image matching
    const basePartNumber = this.extractBasePartNumber(partNumber);
    console.log(`Looking for images: SKU=${partNumber}, BasePartNumber=${basePartNumber}`);

    // Try both the original SKU and the extracted base part number
    const patternsToTry = [partNumber, basePartNumber];
    if (partNumber !== basePartNumber) {
      console.log(`Will try both: ${partNumber} and ${basePartNumber}`);
    }

    for (const pattern of patternsToTry) {
      if (images.length > 0) break; // Already found images

      // Pattern 1: partNumber.ext (main image)
      // Pattern 2: partNumber_2.ext, partNumber_3.ext, etc.
      // Pattern 3: partNumber-1.ext, partNumber-2.ext, etc.

      for (let i = 0; i <= 10; i++) {
        for (const ext of extensions) {
          let filename: string;
          if (i === 0) {
            filename = `${pattern}${ext}`;
          } else if (i === 1) {
            // Try both formats for second image
            filename = `${pattern}_2${ext}`;
          } else {
            filename = `${pattern}_${i + 1}${ext}`;
          }

          const filePath = path.join(imageBasePath, filename);
          if (existsSync(filePath)) {
            try {
              const buffer = await fs.readFile(filePath);
              images.push({ buffer, filename });
              console.log(`Found image: ${filename}`);
              break; // Found this index, move to next
            } catch (error) {
              console.error(`Error reading image ${filePath}:`, error);
            }
          }

          // Also try dash format
          if (i > 0) {
            const dashFilename = `${pattern}-${i}${ext}`;
            const dashFilePath = path.join(imageBasePath, dashFilename);
            if (existsSync(dashFilePath)) {
              try {
                const buffer = await fs.readFile(dashFilePath);
                images.push({ buffer, filename: dashFilename });
                console.log(`Found image: ${dashFilename}`);
                break;
              } catch (error) {
                console.error(`Error reading image ${dashFilePath}:`, error);
              }
            }
          }
        }
      }
    }

    return images;
  }

  /**
   * Import products from parsed data
   */
  async importProducts(
    products: ParsedProduct[],
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const {
      updateExisting = true,
      skipErrors = true,
      importImages = true,
      imageBasePath = path.join(process.cwd(), 'import-images'),
      dryRun = false,
      defaultBrandId,
      defaultCategoryId,
      defaultWarehouseId,
      defaultSupplierId,
      defaultStockQuantity = 0,
      defaultStatus = 'ACTIVE',
    } = options;

    this.errors = [];
    this.warnings = [];
    this.createdProducts = [];
    this.updatedProducts = [];

    let processedCount = 0;

    for (const product of products) {
      try {
        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
          where: { sku: product.sku },
        });

        if (existingProduct && !updateExisting) {
          this.warnings.push({
            row: product.rowNumber,
            field: 'sku',
            message: `Product ${product.sku} already exists, skipping`,
          });
          continue;
        }

        // Use default brand/category if provided, otherwise find or create from product data
        const brandId = defaultBrandId
          ? defaultBrandId
          : (product.brandName ? await this.findOrCreateBrand(product.brandName) : null);
        const categoryId = defaultCategoryId
          ? defaultCategoryId
          : (product.categoryName ? await this.findOrCreateCategory(product.categoryName) : null);

        // Store supplier ID for later use
        const supplierId = defaultSupplierId || null;

        // Get brand slug for image storage path
        let brandSlug: string | undefined;
        if (brandId) {
          const brand = await prisma.brand.findUnique({ where: { id: brandId } });
          brandSlug = brand?.slug;
        }

        // Auto-generate meta fields
        const metaTitle = `${product.name} | ${product.brandName || 'Quality Product'}`;
        const metaDescription = product.shortDescription || product.description?.substring(0, 160) || `Shop ${product.name} - High quality product at competitive prices.`;
        const metaKeywords = [product.name, product.brandName, product.sku, product.categoryName]
          .filter(Boolean)
          .join(', ');

        // Prepare product data
        const productData = {
          name: product.name,
          slug: product.sku.toLowerCase().replace(/[^\w]+/g, '-'),
          description: product.description,
          shortDescription: product.shortDescription,
          basePrice: new Decimal(product.basePrice),
          costPrice: product.costPrice ? new Decimal(product.costPrice) : undefined,
          gsaPrice: product.gsaPrice ? new Decimal(product.gsaPrice) : undefined,
          wholesalePrice: product.wholesalePrice
            ? new Decimal(product.wholesalePrice)
            : undefined,
          // Use product stock or default stock quantity
          stockQuantity: product.stockQuantity ?? defaultStockQuantity,
          // Set product status
          status: defaultStatus,
          minimumOrderQty: product.quantityPerPack || 1,
          // Dimensions
          weight: product.weight ? new Decimal(product.weight) : undefined,
          length: product.length ? new Decimal(product.length) : undefined,
          width: product.width ? new Decimal(product.width) : undefined,
          height: product.height ? new Decimal(product.height) : undefined,
          // SEO Meta Fields (auto-generated)
          metaTitle,
          metaDescription,
          metaKeywords,
          // GSA fields
          gsaSin: product.gsaSin,
          // Store extra metadata as JSON (convert to plain JSON for Prisma)
          ...(product.metadata && { complianceCertifications: JSON.parse(JSON.stringify(product.metadata)) }),
          ...(brandId && { brand: { connect: { id: brandId } } }),
          ...(categoryId && { category: { connect: { id: categoryId } } }),
          ...(supplierId && { defaultSupplier: { connect: { id: supplierId } } }),
          ...(defaultWarehouseId && { defaultWarehouse: { connect: { id: defaultWarehouseId } } }),
        };

        if (dryRun) {
          processedCount++;
          if (existingProduct) {
            this.updatedProducts.push(product.sku);
          } else {
            this.createdProducts.push(product.sku);
          }
          continue;
        }

        let savedProduct;
        if (existingProduct) {
          // Update existing product
          savedProduct = await prisma.product.update({
            where: { sku: product.sku },
            data: productData,
          });
          this.updatedProducts.push(product.sku);
        } else {
          // Create new product
          savedProduct = await prisma.product.create({
            data: {
              sku: product.sku,
              ...productData,
            },
          });
          this.createdProducts.push(product.sku);
        }

        // Import images if enabled
        if (importImages && savedProduct) {
          const imageFiles = await this.findProductImages(product.sku, imageBasePath);

          if (imageFiles.length > 0) {
            // Delete existing images if updating
            if (existingProduct) {
              await prisma.productImage.deleteMany({
                where: { productId: savedProduct.id },
              });
            }

            // Process and save new images
            const processedImages = await imageProcessor.processImages(imageFiles, {
              brandSlug,
              productSku: product.sku,
              convertToWebp: true,
            });

            // Save to database
            for (let i = 0; i < processedImages.length; i++) {
              const img = processedImages[i];
              await prisma.productImage.create({
                data: {
                  productId: savedProduct.id,
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

            // Also update the legacy images array on product
            await prisma.product.update({
              where: { id: savedProduct.id },
              data: {
                images: processedImages.map((img) => img.thumbUrl).filter(Boolean) as string[],
              },
            });
          } else {
            this.warnings.push({
              row: product.rowNumber,
              field: 'images',
              message: `No images found for ${product.sku} in ${imageBasePath}`,
            });
          }
        }

        // Create/Update warehouse stock if warehouse is selected
        if (defaultWarehouseId && savedProduct) {
          const stockQty = product.stockQuantity ?? defaultStockQuantity;

          const existingStock = await prisma.warehouseStock.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId: defaultWarehouseId,
                productId: savedProduct.id,
              },
            },
          });

          if (existingStock) {
            // Update existing stock
            await prisma.warehouseStock.update({
              where: {
                warehouseId_productId: {
                  warehouseId: defaultWarehouseId,
                  productId: savedProduct.id,
                },
              },
              data: {
                quantity: stockQty,
                available: stockQty,
              },
            });
          } else {
            // Create new stock entry
            await prisma.warehouseStock.create({
              data: {
                warehouseId: defaultWarehouseId,
                productId: savedProduct.id,
                quantity: stockQty,
                available: stockQty,
                reserved: 0,
                reorderPoint: 10,
                reorderQuantity: 50,
              },
            });
          }
        }

        processedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.errors.push({
          row: product.rowNumber,
          field: 'general',
          value: product.sku,
          message: errorMessage,
        });

        if (!skipErrors) {
          throw error;
        }
      }
    }

    return {
      success: this.errors.length === 0,
      totalRows: products.length,
      processedRows: processedCount,
      successCount: this.createdProducts.length + this.updatedProducts.length,
      errorCount: this.errors.length,
      errors: this.errors,
      warnings: this.warnings,
      createdProducts: this.createdProducts,
      updatedProducts: this.updatedProducts,
    };
  }

  /**
   * Generate GSA Excel template (matches your exact format A-AY)
   */
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // Define all columns A-AY (51 columns)
    const columns = [
      // A-N (Basic Info)
      { key: 'item_type', width: 15 },
      { key: 'manufacturer', width: 25 },
      { key: 'manufacturer_part_number', width: 20 },
      { key: 'vendor_part_number', width: 20 },
      { key: 'sin', width: 15 },
      { key: 'item_name', width: 40 },
      { key: 'item_description', width: 60 },
      { key: 'recycled_content_percent', width: 12 },
      { key: 'uom', width: 10 },
      { key: 'quantity_per_pack', width: 12 },
      { key: 'unit_uom', width: 10 },
      { key: 'commercial_price', width: 15 },
      { key: 'mfc_name', width: 20 },
      { key: 'mfc_price', width: 12 },
      // O-R (Action & Costs)
      { key: 'Action', width: 10 },
      { key: 'greenest_ep_cost', width: 12 },
      { key: 'sup_cost', width: 12 },
      { key: 'gm', width: 10 },
      // S-T (Price Proposal)
      { key: 'govt_price_no_fee', width: 15 },
      { key: 'govt_price_with_fee', width: 15 },
      // U (Country)
      { key: 'country_of_origin', width: 15 },
      // V-AB (Delivery)
      { key: 'delivery_days', width: 12 },
      { key: 'e_code', width: 10 },
      { key: 'lead_time', width: 10 },
      { key: 'fob_us', width: 10 },
      { key: 'fob_ak', width: 10 },
      { key: 'fob_hi', width: 10 },
      { key: 'fob_pr', width: 10 },
      // AC-AE (Codes)
      { key: 'nsn', width: 18 },
      { key: 'upc', width: 15 },
      { key: 'unspsc', width: 12 },
      // AF-AI (TPR)
      { key: 'sale_price', width: 12 },
      { key: 'e_with_fee', width: 12 },
      { key: 'start_date', width: 12 },
      { key: 'stop_date', width: 12 },
      // AJ-AN (Photos)
      { key: 'default_photo', width: 20 },
      { key: 'photo', width: 20 },
      { key: 'photo_2', width: 20 },
      { key: 'photo_3', width: 20 },
      { key: 'photo_4', width: 20 },
      // AO-AP (Warranty)
      { key: 'product_warranty_period', width: 15 },
      { key: 'warranty_unit_of_time', width: 15 },
      // AQ-AU (Dimensions)
      { key: 'length', width: 10 },
      { key: 'width', width: 10 },
      { key: 'height', width: 10 },
      { key: 'physical_uom', width: 12 },
      { key: 'weight_lbs', width: 10 },
      // AV-AY (Categorization & Markup)
      { key: 'product_info_code', width: 15 },
      { key: 'url_508', width: 20 },
      { key: 'hazmat', width: 10 },
      { key: 'dealer_cost', width: 12 },
      { key: 'mfc_markup_percentage', width: 15 },
      { key: 'govt_markup_percentage', width: 15 },
    ];

    worksheet.columns = columns;

    // Row 1: Main Headers (with merged cells style)
    const mainHeaders = [
      'Base Product or Accessory', // A
      'Manufacturer Information', // B
      '', // C (part of B)
      'Vendor Part Number', // D
      'Special Item Number', // E
      'Product Information', // F
      '', // G (part of F)
      'Unit of Measure', // H
      '', // I
      'Quantity Per Pack', // J
      '', // K
      'Commercial Price / Manufacturer\'s Suggested Retail Price', // L
      'Most Favored Customer', // M
      '', // N
      'Action', // O
      'Greenest ep Cost', // P
      'Sup Cost', // Q
      'GM', // R
      'Price Proposal', // S
      '', // T
      'Country of Origin', // U
      'Delivery Information', // V
      '', '', '', '', '', '', // W-AB
      'National Stock Number', // AC
      'UPC', // AD
      'United Nations Standard Products and Services Code', // AE
      'Temporary Price Reduction (TPR)', // AF
      '', '', '', // AG-AI
      'Photo File References', // AJ
      '', '', '', '', // AK-AN
      'Warranty Duration', // AO
      '', // AP
      'Product Dimensions', // AQ
      '', '', '', '', // AR-AU
      'Product Information / Categorization', // AV
      '', '', // AW-AX
      'Dealer Markup', // AY
      '', '', // AZ-BA (extra)
    ];

    // Row 2: Field Names (technical names)
    const fieldNames = [
      'item_type', 'manufacturer', 'manufacturer_part_number', 'vendor_part_number',
      'sin', 'item_name', 'item_description', 'recycled_content_percent',
      'uom', 'quantity_per_pack', 'unit_uom', 'commercial_price',
      'mfc_name', 'mfc_price', 'Action', 'greenest_ep_cost',
      'sup_cost', 'gm', 'govt_price_no_fee', 'govt_price_with_fee',
      'country_of_origin', 'delivery_days', 'e_code', 'lead_time',
      'fob_us', 'fob_ak', 'fob_hi', 'fob_pr',
      'nsn', 'upc', 'unspsc', 'sale_price',
      'e_with_fee', 'start_date', 'stop_date', 'default_photo',
      'photo', 'photo_2', 'photo_3', 'photo_4',
      'product_warranty_period', 'warranty_unit_of_time',
      'length', 'width', 'height', 'physical_uom', 'weight_lbs',
      'product_info_code', 'url_508', 'hazmat', 'dealer_cost',
      'mfc_markup_percentage', 'govt_markup_percentage',
    ];

    // Insert Row 1 (Main Headers)
    const row1 = worksheet.insertRow(1, mainHeaders);
    row1.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2E7D87' }, // Teal color like your screenshot
    };
    row1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    row1.height = 60;

    // Insert Row 2 (Field Names)
    const row2 = worksheet.insertRow(2, fieldNames);
    row2.font = { bold: true };
    row2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A9BA8' }, // Lighter teal
    };
    row2.alignment = { horizontal: 'center', vertical: 'middle' };
    row2.height = 25;

    // Add sample data row
    const sampleData = {
      item_type: 'Base',
      manufacturer: '3M',
      manufacturer_part_number: '1006980',
      vendor_part_number: '1006980',
      sin: '339113',
      item_name: 'Safety Helmet - Hard Hat Class E',
      item_description: 'Professional safety helmet with 4-point ratchet suspension, ANSI/ISEA Z89.1 Type I Class E certified',
      recycled_content_percent: '0',
      uom: 'EA',
      quantity_per_pack: '1',
      unit_uom: 'EA',
      commercial_price: '45.99',
      mfc_name: 'GSA Advantage',
      mfc_price: '42.50',
      Action: '',
      greenest_ep_cost: '',
      sup_cost: '28.00',
      gm: '35%',
      govt_price_no_fee: '41.50',
      govt_price_with_fee: '42.50',
      country_of_origin: 'US',
      delivery_days: '5',
      e_code: 'A',
      lead_time: '3',
      fob_us: 'Y',
      fob_ak: 'Y',
      fob_hi: 'Y',
      fob_pr: 'Y',
      nsn: '',
      upc: '012345678901',
      unspsc: '46181504',
      sale_price: '',
      e_with_fee: '',
      start_date: '',
      stop_date: '',
      default_photo: '1006980.jpg',
      photo: '1006980.jpg',
      photo_2: '1006980_2.jpg',
      photo_3: '1006980_3.jpg',
      photo_4: '',
      product_warranty_period: '12',
      warranty_unit_of_time: 'MO',
      length: '10',
      width: '8',
      height: '6',
      physical_uom: 'IN',
      weight_lbs: '0.75',
      product_info_code: '',
      url_508: '',
      hazmat: 'N',
      dealer_cost: '32.00',
      mfc_markup_percentage: '25',
      govt_markup_percentage: '20',
    };

    worksheet.addRow(Object.values(sampleData));

    // Highlight required columns (yellow like your screenshot)
    const requiredCols = ['D', 'F', 'L']; // vendor_part_number, item_name, commercial_price
    for (const col of requiredCols) {
      const cell1 = worksheet.getCell(`${col}1`);
      const cell2 = worksheet.getCell(`${col}2`);
      cell1.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' }, // Yellow
      };
      cell1.font = { bold: true };
      cell2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
      };
    }

    // Add borders to all cells
    const borderStyle = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };

    for (let row = 1; row <= 3; row++) {
      for (let col = 1; col <= columns.length; col++) {
        worksheet.getCell(row, col).border = borderStyle;
      }
    }

    // Freeze first 2 rows
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 2 }];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Get available field mappings from database
   */
  async getFieldConfigs() {
    return prisma.importFieldConfig.findMany({
      where: { isActive: true },
    });
  }

  /**
   * Save custom field mapping
   */
  async saveFieldConfig(
    name: string,
    fieldMappings: Record<string, string>,
    options: {
      description?: string;
      requiredFields?: string[];
      imagePattern?: string;
      isDefault?: boolean;
    } = {}
  ) {
    return prisma.importFieldConfig.upsert({
      where: { name },
      create: {
        name,
        description: options.description,
        fieldMappings,
        requiredFields: options.requiredFields || ['sku', 'name', 'basePrice'],
        imagePattern: options.imagePattern,
        isDefault: options.isDefault || false,
        isActive: true,
      },
      update: {
        description: options.description,
        fieldMappings,
        requiredFields: options.requiredFields,
        imagePattern: options.imagePattern,
        isDefault: options.isDefault,
      },
    });
  }
}

// Singleton instance
export const bulkImportService = new BulkImportService();
