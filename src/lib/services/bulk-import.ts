import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from './image-processor';
import { Decimal } from '@prisma/client/runtime/library';

// Default field mapping - can be customized
export const DEFAULT_FIELD_MAPPING: Record<string, string> = {
  // Excel Column -> Database Field
  'Vendor Part Number': 'sku',
  'vendor_part_number': 'sku',
  'SKU': 'sku',
  'sku': 'sku',
  'Part Number': 'sku',
  'part_number': 'sku',

  'Item_name': 'name',
  'item_name': 'name',
  'Product Name': 'name',
  'Name': 'name',
  'name': 'name',

  'Item_description': 'description',
  'item_description': 'description',
  'Description': 'description',
  'description': 'description',

  'Manufacturer Information': 'brandName',
  'manufacturer_information': 'brandName',
  'Brand': 'brandName',
  'brand': 'brandName',
  'Manufacturer': 'brandName',

  'Unit Price': 'basePrice',
  'unit_price': 'basePrice',
  'Price': 'basePrice',
  'price': 'basePrice',
  'Retail Price': 'basePrice',

  'GSA Price': 'gsaPrice',
  'gsa_price': 'gsaPrice',

  'Wholesale Price': 'wholesalePrice',
  'wholesale_price': 'wholesalePrice',

  'UPC': 'upc',
  'upc': 'upc',

  'Category': 'categoryName',
  'category': 'categoryName',

  'Stock': 'stockQuantity',
  'stock': 'stockQuantity',
  'Quantity': 'stockQuantity',
  'quantity': 'stockQuantity',

  'Weight': 'weight',
  'weight': 'weight',

  'Photo File Reference': 'imagePattern',
  'photo_file_reference': 'imagePattern',
  'Image': 'imagePattern',
  'image': 'imagePattern',
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
}

interface ParsedProduct {
  sku: string;
  name: string;
  description?: string;
  brandName?: string;
  categoryName?: string;
  basePrice: number;
  gsaPrice?: number;
  wholesalePrice?: number;
  stockQuantity?: number;
  weight?: number;
  upc?: string;
  imagePattern?: string;
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

    // Process each data row
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

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

      products.push({
        sku,
        name: name || sku,
        description: String(mappedData.description || '').trim() || undefined,
        brandName: String(mappedData.brandName || '').trim() || undefined,
        categoryName: String(mappedData.categoryName || '').trim() || undefined,
        basePrice: isNaN(basePrice) ? 0 : basePrice,
        gsaPrice: mappedData.gsaPrice ? parseFloat(String(mappedData.gsaPrice)) : undefined,
        wholesalePrice: mappedData.wholesalePrice
          ? parseFloat(String(mappedData.wholesalePrice))
          : undefined,
        stockQuantity: mappedData.stockQuantity
          ? parseInt(String(mappedData.stockQuantity))
          : undefined,
        weight: mappedData.weight ? parseFloat(String(mappedData.weight)) : undefined,
        upc: String(mappedData.upc || '').trim() || undefined,
        imagePattern: String(mappedData.imagePattern || '').trim() || undefined,
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
   * Find images for a product based on part number pattern
   */
  private async findProductImages(
    partNumber: string,
    imageBasePath: string
  ): Promise<Array<{ buffer: Buffer; filename: string }>> {
    const images: Array<{ buffer: Buffer; filename: string }> = [];
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    // Pattern 1: partNumber.ext (main image)
    // Pattern 2: partNumber_2.ext, partNumber_3.ext, etc.
    // Pattern 3: partNumber-1.ext, partNumber-2.ext, etc.

    for (let i = 0; i <= 10; i++) {
      for (const ext of extensions) {
        let filename: string;
        if (i === 0) {
          filename = `${partNumber}${ext}`;
        } else if (i === 1) {
          // Try both formats for second image
          filename = `${partNumber}_2${ext}`;
        } else {
          filename = `${partNumber}_${i + 1}${ext}`;
        }

        const filePath = path.join(imageBasePath, filename);
        if (existsSync(filePath)) {
          try {
            const buffer = await fs.readFile(filePath);
            images.push({ buffer, filename });
            break; // Found this index, move to next
          } catch (error) {
            console.error(`Error reading image ${filePath}:`, error);
          }
        }

        // Also try dash format
        if (i > 0) {
          const dashFilename = `${partNumber}-${i}${ext}`;
          const dashFilePath = path.join(imageBasePath, dashFilename);
          if (existsSync(dashFilePath)) {
            try {
              const buffer = await fs.readFile(dashFilePath);
              images.push({ buffer, filename: dashFilename });
              break;
            } catch (error) {
              console.error(`Error reading image ${dashFilePath}:`, error);
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

        // Find or create brand and category
        const brandId = product.brandName
          ? await this.findOrCreateBrand(product.brandName)
          : null;
        const categoryId = product.categoryName
          ? await this.findOrCreateCategory(product.categoryName)
          : null;

        // Get brand slug for image storage path
        let brandSlug: string | undefined;
        if (brandId) {
          const brand = await prisma.brand.findUnique({ where: { id: brandId } });
          brandSlug = brand?.slug;
        }

        // Prepare product data
        const productData = {
          name: product.name,
          slug: product.sku.toLowerCase().replace(/[^\w]+/g, '-'),
          description: product.description,
          basePrice: new Decimal(product.basePrice),
          gsaPrice: product.gsaPrice ? new Decimal(product.gsaPrice) : undefined,
          wholesalePrice: product.wholesalePrice
            ? new Decimal(product.wholesalePrice)
            : undefined,
          stockQuantity: product.stockQuantity,
          weight: product.weight ? new Decimal(product.weight) : undefined,
          ...(brandId && { brand: { connect: { id: brandId } } }),
          ...(categoryId && { category: { connect: { id: categoryId } } }),
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
   * Generate sample Excel template
   */
  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    // Add headers
    worksheet.columns = [
      { header: 'Vendor Part Number', key: 'sku', width: 20 },
      { header: 'Item_name', key: 'name', width: 40 },
      { header: 'Item_description', key: 'description', width: 60 },
      { header: 'Manufacturer Information', key: 'brand', width: 25 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Unit Price', key: 'price', width: 15 },
      { header: 'GSA Price', key: 'gsaPrice', width: 15 },
      { header: 'Wholesale Price', key: 'wholesalePrice', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Weight', key: 'weight', width: 10 },
      { header: 'UPC', key: 'upc', width: 15 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add sample data
    worksheet.addRow({
      sku: '1006980',
      name: 'Sample Safety Helmet',
      description: 'Professional safety helmet with adjustable straps',
      brand: '3M',
      category: 'Head Protection',
      price: 45.99,
      gsaPrice: 42.50,
      wholesalePrice: 38.00,
      stock: 100,
      weight: 0.5,
      upc: '012345678901',
    });

    // Add data validation notes
    worksheet.getCell('A1').note = 'Required: Unique product identifier (Part Number)';
    worksheet.getCell('B1').note = 'Required: Product name';
    worksheet.getCell('F1').note = 'Required: Base price in USD';

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
