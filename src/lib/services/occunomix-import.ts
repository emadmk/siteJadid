import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from './image-processor';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * OccuNomix Import Service
 *
 * Field Mapping:
 * - STYLE → baseStyleCode (for variant grouping)
 * - Sku → sku
 * - Item Description → name
 * - SubCategory → categoryName
 * - ADA site Price → basePrice
 * - LEV2 → costPrice
 * - UPC → upc
 * - Images → images (semicolon-separated)
 * - Dimensions (Length, Width, Height, Net Weight)
 */

export interface OccuNomixImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface OccuNomixImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface OccuNomixImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: OccuNomixImportError[];
  warnings: OccuNomixImportWarning[];
  createdProducts: string[];
  updatedProducts: string[];
  createdVariants: number;
  createdCategories: string[];
}

export interface OccuNomixImportOptions {
  updateExisting?: boolean;
  importImages?: boolean;
  imageBasePath?: string;
  dryRun?: boolean;
  defaultWarehouseId?: string;
  defaultSupplierId?: string;
  defaultStockQuantity?: number;
  defaultStatus?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
}

interface ParsedOccuNomixRow {
  style: string;
  sku: string;
  name: string;
  description: string;
  major: string;
  minor: string;
  subCategory: string;
  basePrice: number;
  costPrice: number;
  upc: string;
  countryOfOrigin: string;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  qtyInPack: number;
  images: string[];
  rowNumber: number;
}

interface VariantGroup {
  style: string;
  baseName: string;
  baseDescription: string;
  subCategory: string;
  rows: ParsedOccuNomixRow[];
}

export class OccuNomixImportService {
  private errors: OccuNomixImportError[] = [];
  private warnings: OccuNomixImportWarning[] = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];
  private createdVariants = 0;
  private createdCategories: string[] = [];
  private categoryCache = new Map<string, string>();

  /**
   * Parse OccuNomix Excel file
   */
  async parseExcel(fileBuffer: Buffer | ArrayBuffer): Promise<ParsedOccuNomixRow[]> {
    const workbook = new ExcelJS.Workbook();

    // Always create a fresh Buffer to satisfy ExcelJS types
    const buffer = Buffer.isBuffer(fileBuffer)
      ? Buffer.from(fileBuffer)
      : Buffer.from(fileBuffer);

    await workbook.xlsx.load(buffer as Buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No worksheet found in Excel file');
    }

    const rows: ParsedOccuNomixRow[] = [];

    // Get headers from row 1
    const headerRow = worksheet.getRow(1);
    const headers: Record<number, string> = {};
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = cell.value?.toString().trim() || '';
    });

    // Find column indices
    const colIndex = {
      style: this.findColumnIndex(headers, ['STYLE', 'Style']),
      sku: this.findColumnIndex(headers, ['Sku', 'SKU']),
      name: this.findColumnIndex(headers, ['Item Description', 'Item_Description', 'Description']),
      major: this.findColumnIndex(headers, ['Major']),
      minor: this.findColumnIndex(headers, ['Minor']),
      subCategory: this.findColumnIndex(headers, ['SubCategory', 'Sub Category', 'Category']),
      basePrice: this.findColumnIndex(headers, ['ADA site Price', 'ADA Price', 'Site Price']),
      costPrice: this.findColumnIndex(headers, ['LEV2', 'Lev2', 'Cost']),
      upc: this.findColumnIndex(headers, ['UPC']),
      countryOfOrigin: this.findColumnIndex(headers, ['COUNTRY OF ORIGIN', 'Country']),
      length: this.findColumnIndex(headers, ['Length']),
      width: this.findColumnIndex(headers, ['Width']),
      height: this.findColumnIndex(headers, ['Height']),
      weight: this.findColumnIndex(headers, ['Net Weight (lb)', 'Net Weight', 'Weight']),
      qtyInPack: this.findColumnIndex(headers, ['Qty in Pk', 'Qty in Pack', 'Pack Qty']),
      images: this.findColumnIndex(headers, ['Images', 'Image', 'Photos']),
    };

    console.log('Column indices found:', colIndex);

    // Process each data row
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 1) return; // Skip header row

      const getValue = (colIdx: number | null): string => {
        if (!colIdx) return '';
        const cell = row.getCell(colIdx);
        return cell.value?.toString().trim() || '';
      };

      const getNumber = (colIdx: number | null): number => {
        if (!colIdx) return 0;
        const cell = row.getCell(colIdx);
        const val = cell.value;
        if (typeof val === 'number') return val;
        return parseFloat(String(val || '0')) || 0;
      };

      const style = getValue(colIndex.style);
      const sku = getValue(colIndex.sku);
      const name = getValue(colIndex.name);

      if (!sku && !style) return; // Skip empty rows

      // Parse images (semicolon-separated)
      const imagesStr = getValue(colIndex.images);
      const images = imagesStr
        ? imagesStr.split(';').map(img => img.trim()).filter(Boolean)
        : [];

      rows.push({
        style: style || sku,
        sku: sku || style,
        name,
        description: name, // Use name as base description
        major: getValue(colIndex.major),
        minor: getValue(colIndex.minor),
        subCategory: getValue(colIndex.subCategory),
        basePrice: getNumber(colIndex.basePrice),
        costPrice: getNumber(colIndex.costPrice),
        upc: getValue(colIndex.upc),
        countryOfOrigin: getValue(colIndex.countryOfOrigin),
        length: colIndex.length ? getNumber(colIndex.length) || null : null,
        width: colIndex.width ? getNumber(colIndex.width) || null : null,
        height: colIndex.height ? getNumber(colIndex.height) || null : null,
        weight: colIndex.weight ? getNumber(colIndex.weight) || null : null,
        qtyInPack: getNumber(colIndex.qtyInPack) || 1,
        images,
        rowNumber,
      });
    });

    return rows;
  }

  /**
   * Find column index by possible header names
   */
  private findColumnIndex(headers: Record<number, string>, possibleNames: string[]): number | null {
    for (const [colStr, header] of Object.entries(headers)) {
      const col = parseInt(colStr);
      const headerLower = header.toLowerCase();
      for (const name of possibleNames) {
        if (headerLower === name.toLowerCase() || headerLower.includes(name.toLowerCase())) {
          return col;
        }
      }
    }
    return null;
  }

  /**
   * Group rows by STYLE for variant detection
   */
  private groupByStyle(rows: ParsedOccuNomixRow[]): VariantGroup[] {
    const groups = new Map<string, ParsedOccuNomixRow[]>();

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

      // Clean base name (remove size/color from end)
      let baseName = firstRow.name;
      baseName = baseName.replace(/,\s*(X-Small|Small|Medium|Large|X-Large|2X-Large|3X-Large|XXS|XS|S|M|L|XL|XXL|XXXL)\s*$/i, '');
      baseName = baseName.replace(/,\s*(Black|White|Navy|Beige|Orange|Yellow|Red|Blue|Green|Gray|Grey|Hi-Viz|Hi-Vis|HiViz|Camo)\s*$/i, '');
      baseName = baseName.trim();

      variantGroups.push({
        style,
        baseName,
        baseDescription: firstRow.description,
        subCategory: firstRow.subCategory,
        rows: groupRows,
      });
    }

    return variantGroups;
  }

  /**
   * Find or create category by name
   */
  private async findOrCreateCategory(categoryName: string): Promise<string | null> {
    if (!categoryName) return null;

    // Check cache first
    if (this.categoryCache.has(categoryName.toLowerCase())) {
      return this.categoryCache.get(categoryName.toLowerCase())!;
    }

    const slug = categoryName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');

    // Try to find existing category
    let category = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: categoryName, mode: 'insensitive' } },
          { slug },
        ],
      },
    });

    if (!category) {
      // Create new category
      category = await prisma.category.create({
        data: {
          name: categoryName,
          slug,
          isActive: true,
          description: `${categoryName} products from OccuNomix`,
          metaTitle: `${categoryName} | Safety Products`,
          metaDescription: `Shop ${categoryName} safety products. Quality workplace safety equipment.`,
        },
      });
      this.createdCategories.push(categoryName);
      console.log(`Created category: ${categoryName}`);
    }

    this.categoryCache.set(categoryName.toLowerCase(), category.id);
    return category.id;
  }

  /**
   * Extract variant attributes from SKU
   */
  private extractVariantAttributes(sku: string, style: string, name: string): { size?: string; color?: string; variantName: string } {
    let size: string | undefined;
    let color: string | undefined;
    const parts: string[] = [];

    // Remove style from SKU to get suffix
    let suffix = sku.replace(style, '').replace(/^[-_]/, '');

    // Check for size patterns in suffix
    const sizePatterns = [
      /^(\d+)?(2XS|3XS|XS|S|M|L|XL|2XL|3XL|4XL|5XL|XXS|XXL|XXXL)$/i,
      /^(\d+)[-_]?(2XS|3XS|XS|S|M|L|XL|2XL|3XL|4XL|5XL)$/i,
    ];

    for (const pattern of sizePatterns) {
      const match = suffix.match(pattern);
      if (match) {
        size = match[2] || match[1];
        break;
      }
    }

    // Check name for size
    if (!size) {
      const nameSizeMatch = name.match(/,\s*(X-Small|Small|Medium|Large|X-Large|2X-Large|3X-Large|XXS|XS|S|M|L|XL|XXL|XXXL)\s*$/i);
      if (nameSizeMatch) {
        size = nameSizeMatch[1];
      }
    }

    // Check for color in suffix or name
    const colorPatterns = ['BK', 'WH', 'NV', 'OR', 'YL', 'RD', 'BL', 'GR', 'CAMO', 'HVO', 'RB'];
    for (const cp of colorPatterns) {
      if (suffix.toUpperCase().includes(cp)) {
        color = this.expandColorCode(cp);
        break;
      }
    }

    // Check name for color
    if (!color) {
      const nameColorMatch = name.match(/,\s*(Black|White|Navy|Beige|Orange|Yellow|Red|Blue|Green|Gray|Grey|Hi-Viz|Hi-Vis|Camo)\s*$/i);
      if (nameColorMatch) {
        color = nameColorMatch[1];
      }
    }

    // Build variant name
    if (size) parts.push(`Size: ${size}`);
    if (color) parts.push(`Color: ${color}`);

    return {
      size,
      color,
      variantName: parts.length > 0 ? parts.join(', ') : suffix || 'Default',
    };
  }

  /**
   * Expand color code to full name
   */
  private expandColorCode(code: string): string {
    const colorMap: Record<string, string> = {
      'BK': 'Black',
      'WH': 'White',
      'NV': 'Navy',
      'OR': 'Orange',
      'YL': 'Yellow',
      'RD': 'Red',
      'BL': 'Blue',
      'GR': 'Green',
      'CAMO': 'Camo',
      'HVO': 'Hi-Viz Orange',
      'RB': 'Royal Blue',
    };
    return colorMap[code.toUpperCase()] || code;
  }

  /**
   * Generate SEO fields for a product
   */
  private generateSEO(name: string, category: string, brand: string = 'OccuNomix'): {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } {
    return {
      metaTitle: `${name} | ${brand} ${category}`.substring(0, 70),
      metaDescription: `Shop ${name} by ${brand}. High-quality ${category.toLowerCase()} for workplace safety. Free shipping on qualifying orders.`.substring(0, 160),
      metaKeywords: [name, brand, category, 'safety', 'workplace', 'PPE'].filter(Boolean).join(', '),
    };
  }

  /**
   * Find images for a product
   */
  private async findProductImages(
    imageNames: string[],
    imageBasePath: string
  ): Promise<Array<{ buffer: Buffer; filename: string }>> {
    const images: Array<{ buffer: Buffer; filename: string }> = [];

    for (const imageName of imageNames) {
      // Try different extensions
      const extensions = ['', '.jpg', '.jpeg', '.png', '.webp'];

      for (const ext of extensions) {
        let filename = imageName;
        if (!filename.includes('.') && ext) {
          filename = imageName + ext;
        }

        const filePath = path.join(imageBasePath, filename);
        if (existsSync(filePath)) {
          try {
            const buffer = await fs.readFile(filePath);
            images.push({ buffer, filename });
            console.log(`Found image: ${filename}`);
            break;
          } catch (error) {
            console.error(`Error reading image ${filePath}:`, error);
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
    rows: ParsedOccuNomixRow[],
    options: OccuNomixImportOptions = {}
  ): Promise<OccuNomixImportResult> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = path.join(process.cwd(), 'import-images'),
      dryRun = false,
      defaultWarehouseId,
      defaultSupplierId,
      defaultStockQuantity = 100,
      defaultStatus = 'ACTIVE',
    } = options;

    this.errors = [];
    this.warnings = [];
    this.createdProducts = [];
    this.updatedProducts = [];
    this.createdVariants = 0;
    this.createdCategories = [];
    this.categoryCache.clear();

    // Get or create OccuNomix brand
    let brand = await prisma.brand.findFirst({
      where: { slug: 'occunomix' },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: 'OccuNomix',
          slug: 'occunomix',
          description: 'OccuNomix International LLC - Safety Products',
          isActive: true,
        },
      });
      console.log('Created OccuNomix brand');
    }

    // Group rows by STYLE
    const groups = this.groupByStyle(rows);
    console.log(`Found ${groups.length} product groups from ${rows.length} rows`);

    let processedCount = 0;

    for (const group of groups) {
      try {
        if (group.rows.length === 1) {
          // Single product (no variants)
          await this.importSingleProduct(group.rows[0], brand.id, {
            updateExisting,
            importImages,
            imageBasePath,
            dryRun,
            defaultWarehouseId,
            defaultSupplierId,
            defaultStockQuantity,
            defaultStatus,
          });
        } else {
          // Product with variants
          await this.importProductWithVariants(group, brand.id, {
            updateExisting,
            importImages,
            imageBasePath,
            dryRun,
            defaultWarehouseId,
            defaultSupplierId,
            defaultStockQuantity,
            defaultStatus,
          });
        }
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
      errors: this.errors,
      warnings: this.warnings,
      createdProducts: this.createdProducts,
      updatedProducts: this.updatedProducts,
      createdVariants: this.createdVariants,
      createdCategories: this.createdCategories,
    };
  }

  /**
   * Import a single product (no variants)
   */
  private async importSingleProduct(
    row: ParsedOccuNomixRow,
    brandId: string,
    options: OccuNomixImportOptions
  ): Promise<void> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = '',
      dryRun = false,
      defaultWarehouseId,
      defaultSupplierId,
      defaultStockQuantity = 100,
      defaultStatus = 'ACTIVE',
    } = options;

    // Find or create category
    const categoryId = await this.findOrCreateCategory(row.subCategory);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: row.sku },
    });

    if (existingProduct && !updateExisting) {
      this.warnings.push({
        row: row.rowNumber,
        field: 'sku',
        message: `Product ${row.sku} already exists, skipping`,
      });
      return;
    }

    // Generate SEO
    const seo = this.generateSEO(row.name, row.subCategory, 'OccuNomix');

    // Build description
    const description = this.buildProductDescription(row);

    const productData = {
      name: row.name,
      slug: row.sku.toLowerCase().replace(/[^\w]+/g, '-'),
      description,
      shortDescription: row.name,
      basePrice: new Decimal(row.basePrice || 0),
      costPrice: row.costPrice ? new Decimal(row.costPrice) : undefined,
      stockQuantity: defaultStockQuantity,
      status: defaultStatus,
      hasVariants: false,
      minimumOrderQty: row.qtyInPack || 1,
      weight: row.weight ? new Decimal(row.weight) : undefined,
      length: row.length ? new Decimal(row.length) : undefined,
      width: row.width ? new Decimal(row.width) : undefined,
      height: row.height ? new Decimal(row.height) : undefined,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      metaKeywords: seo.metaKeywords,
      countryOfOrigin: row.countryOfOrigin || undefined,
      brand: { connect: { id: brandId } },
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      ...(defaultSupplierId && { defaultSupplier: { connect: { id: defaultSupplierId } } }),
      ...(defaultWarehouseId && { defaultWarehouse: { connect: { id: defaultWarehouseId } } }),
    };

    if (dryRun) {
      if (existingProduct) {
        this.updatedProducts.push(row.sku);
      } else {
        this.createdProducts.push(row.sku);
      }
      return;
    }

    let savedProduct;
    if (existingProduct) {
      savedProduct = await prisma.product.update({
        where: { sku: row.sku },
        data: productData,
      });
      this.updatedProducts.push(row.sku);
    } else {
      savedProduct = await prisma.product.create({
        data: {
          sku: row.sku,
          ...productData,
        },
      });
      this.createdProducts.push(row.sku);
    }

    // Import images
    if (importImages && savedProduct && row.images.length > 0) {
      await this.processProductImages(savedProduct.id, row.sku, row.images, imageBasePath, existingProduct !== null);
    }

    // Create warehouse stock
    if (defaultWarehouseId && savedProduct) {
      await this.createWarehouseStock(savedProduct.id, defaultWarehouseId, defaultStockQuantity);
    }
  }

  /**
   * Import a product with variants
   */
  private async importProductWithVariants(
    group: VariantGroup,
    brandId: string,
    options: OccuNomixImportOptions
  ): Promise<void> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = '',
      dryRun = false,
      defaultWarehouseId,
      defaultSupplierId,
      defaultStockQuantity = 100,
      defaultStatus = 'ACTIVE',
    } = options;

    const firstRow = group.rows[0];

    // Find or create category
    const categoryId = await this.findOrCreateCategory(group.subCategory);

    // Check if main product exists
    let existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: group.style },
          { slug: group.style.toLowerCase().replace(/[^\w]+/g, '-') },
        ],
      },
    });

    // Calculate base price (lowest variant price)
    const prices = group.rows.map(r => r.basePrice).filter(p => p > 0);
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;

    // Generate SEO
    const seo = this.generateSEO(group.baseName, group.subCategory, 'OccuNomix');

    // Build description
    const description = this.buildProductDescription(firstRow);

    const productData = {
      name: group.baseName,
      slug: group.style.toLowerCase().replace(/[^\w]+/g, '-'),
      description,
      shortDescription: group.baseName,
      basePrice: new Decimal(lowestPrice),
      costPrice: firstRow.costPrice ? new Decimal(firstRow.costPrice) : undefined,
      stockQuantity: 0, // Stock tracked per variant
      status: defaultStatus,
      hasVariants: true,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      metaKeywords: seo.metaKeywords,
      countryOfOrigin: firstRow.countryOfOrigin || undefined,
      brand: { connect: { id: brandId } },
      ...(categoryId && { category: { connect: { id: categoryId } } }),
      ...(defaultSupplierId && { defaultSupplier: { connect: { id: defaultSupplierId } } }),
      ...(defaultWarehouseId && { defaultWarehouse: { connect: { id: defaultWarehouseId } } }),
    };

    if (dryRun) {
      if (existingProduct) {
        this.updatedProducts.push(group.style);
      } else {
        this.createdProducts.push(group.style);
      }
      this.createdVariants += group.rows.length;
      return;
    }

    let savedProduct;
    if (existingProduct && updateExisting) {
      savedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
      this.updatedProducts.push(group.style);

      // Delete existing variants
      await prisma.productVariant.deleteMany({
        where: { productId: savedProduct.id },
      });
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

    // Create variants
    let totalStock = 0;
    for (const row of group.rows) {
      const variantAttrs = this.extractVariantAttributes(row.sku, group.style, row.name);

      await prisma.productVariant.create({
        data: {
          productId: savedProduct.id,
          sku: row.sku,
          name: variantAttrs.variantName,
          basePrice: new Decimal(row.basePrice || lowestPrice),
          costPrice: row.costPrice ? new Decimal(row.costPrice) : undefined,
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

    // Import images (use first row's images)
    if (importImages && savedProduct && firstRow.images.length > 0) {
      await this.processProductImages(savedProduct.id, group.style, firstRow.images, imageBasePath, existingProduct !== null);
    }
  }

  /**
   * Build product description
   */
  private buildProductDescription(row: ParsedOccuNomixRow): string {
    const parts: string[] = [];

    parts.push(`<p>${row.name}</p>`);

    if (row.major || row.minor || row.subCategory) {
      parts.push(`<h3>Category</h3>`);
      parts.push(`<p>${[row.major, row.minor, row.subCategory].filter(Boolean).join(' > ')}</p>`);
    }

    if (row.countryOfOrigin) {
      parts.push(`<h3>Origin</h3>`);
      parts.push(`<p>Country of Origin: ${row.countryOfOrigin}</p>`);
    }

    if (row.weight || row.length || row.width || row.height) {
      parts.push(`<h3>Specifications</h3>`);
      parts.push(`<ul>`);
      if (row.weight) parts.push(`<li>Weight: ${row.weight} lb</li>`);
      if (row.length) parts.push(`<li>Length: ${row.length}"</li>`);
      if (row.width) parts.push(`<li>Width: ${row.width}"</li>`);
      if (row.height) parts.push(`<li>Height: ${row.height}"</li>`);
      parts.push(`</ul>`);
    }

    if (row.qtyInPack > 1) {
      parts.push(`<p><strong>Quantity per Pack:</strong> ${row.qtyInPack}</p>`);
    }

    return parts.join('\n');
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
        brandSlug: 'occunomix',
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
export const occuNomixImportService = new OccuNomixImportService();
