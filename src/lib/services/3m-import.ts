import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * 3M Product Import Service (Phase 1 - Mar 2026 Excel Format)
 *
 * Excel Column Mapping:
 * - 3M Stock # → internal reference
 * - Customer Part Number → SKU (3M-XXXXXXX format)
 * - SKU Marketplace Formal Name → product name
 * - SKU Marketplace Product Description → description
 * - Net Price New → costPrice (قیمت خرید)
 * - ADA Sale Price → unit sale price → basePrice = unit × minOrderQty
 * - ADA Gov Price → unit gov price → gsaPrice = unit × minOrderQty
 * - 3M Minimum Order Qty → minimumOrderQty + price multiplier
 * - Sales UOM → unit of measure (Each, Roll, Carton, etc.)
 * - Product Category Level 1 → parent category (inactive)
 * - Product Category Level 2 → child category (inactive)
 * - Country of Origin → taaApproved (false for China/Brazil, true otherwise)
 *
 * Rules:
 * - All products → PRERELEASE status
 * - Categories created as inactive (not shown on storefront)
 * - TAA = false only for China and Brazil origins
 * - Final price = unit price × minimum order qty
 * - No images (upload manually)
 */

export interface ThreeMImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ThreeMImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface ThreeMImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: ThreeMImportError[];
  warnings: ThreeMImportWarning[];
  createdProducts: string[];
  updatedProducts: string[];
  createdCategories: string[];
}

export interface ThreeMImportOptions {
  updateExisting?: boolean;
  dryRun?: boolean;
  defaultStockQuantity?: number;
  defaultSupplierId?: string;
  defaultWarehouseId?: string;
  defaultBrandId?: string;
}

interface Parsed3MRow {
  stockNumber: string;
  catalogNumber: string;
  customerPartNumber: string; // SKU like 3M-7000046881
  salesUom: string;           // Each, Roll, Carton, Case, Pack, etc.
  categoryLevel1: string;     // Parent category
  categoryLevel2: string;     // Child category
  productName: string;        // SKU Marketplace Formal Name
  productDescription: string; // SKU Marketplace Product Description
  itemStatusCode: string;     // 10-Active, 99-Active, etc.
  stockType: string;
  minOrderUnitCode: string;   // EA, RO, CT, CS, PK, etc.
  minOrderUnit: string;       // Each, Roll, Carton, etc.
  minOrderQty: number;        // 3M Minimum Order Qty
  listPrice: number;          // List Price New
  netPrice: number;           // Net Price New = cost price
  adaSalePrice: number;       // ADA Sale Price = unit retail price
  adaGovPrice: number;        // ADA Gov Price = unit gov price
  smallestSaleableUnit: string;
  smallestSaleableUpc: string;
  salesToSmallestConversion: string;
  consumerToSmallestConversion: string;
  // Physical dimensions (Smallest Saleable Unit)
  ssuLength: string;
  ssuHeight: string;
  ssuWidth: string;
  ssuWeight: string;
  // Sales Unit dimensions
  salesLength: string;
  salesHeight: string;
  salesWidth: string;
  salesWeight: string;
  // Consumer dimensions
  consumerUom: string;
  consumerUpc: string;
  consumerConversion: string;
  // Inner/Shipper
  innerUom: string;
  innerUpc: string;
  innerConversion: string;
  shipperUom: string;
  shipperUpc: string;
  shipperConversion: string;
  baseUom: string;
  // Shipper dimensions
  shipLength: string;
  shipHeight: string;
  shipWidth: string;
  shipWeight: string;
  leadTime: string;
  countryOfOrigin: string;
  harmonizingCode: string;
  comments: string;
  rowNumber: number;
}

// Countries that are NOT TAA approved
const NON_TAA_COUNTRIES = ['china', 'brazil'];

export class ThreeMImportService {
  private errors: ThreeMImportError[] = [];
  private warnings: ThreeMImportWarning[] = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];
  private createdCategories: string[] = [];
  private categoryCache = new Map<string, string>();

  /**
   * Parse 3M Excel file (Mar 2026 format)
   */
  async parseExcel(fileBuffer: Buffer): Promise<Parsed3MRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    // First row is always headers in this format
    const headers = data[0] as string[];
    const rows: Parsed3MRow[] = [];

    // Map column indices by header name
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      if (h) colMap[h.toString().trim()] = i;
    });

    console.log('3M Column mapping:', Object.keys(colMap));

    // Process data rows (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !Array.isArray(row)) continue;

      const getValue = (colName: string): string => {
        const idx = colMap[colName];
        return idx !== undefined && row[idx] !== undefined ? String(row[idx]).trim() : '';
      };

      const getNumber = (colName: string): number => {
        const val = getValue(colName);
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      };

      const stockNum = getValue('3M Stock #');
      const customerPart = getValue('Customer Part Number');
      if (!stockNum && !customerPart) continue; // Skip empty rows

      rows.push({
        stockNumber: stockNum,
        catalogNumber: getValue('3M Catalog Number'),
        customerPartNumber: customerPart,
        salesUom: getValue('Sales UOM'),
        categoryLevel1: getValue('Product Category Level 1'),
        categoryLevel2: getValue('Product Category Level 2'),
        productName: getValue('SKU Marketplace Formal Name'),
        productDescription: getValue('SKU Marketplace Product Description'),
        itemStatusCode: getValue('Item Status Code'),
        stockType: getValue('Stock Type'),
        minOrderUnitCode: getValue('3M Minimum Order Unit Code'),
        minOrderUnit: getValue('3M Minimum Order Unit'),
        minOrderQty: getNumber('3M Minimum Order Qty') || 1,
        listPrice: getNumber('List Price New'),
        netPrice: getNumber('Net Price New'),
        adaSalePrice: getNumber('ADA Sale Price'),
        adaGovPrice: getNumber('ADA Gov Price'),
        smallestSaleableUnit: getValue('Smallest Saleable Unit'),
        smallestSaleableUpc: getValue('Smallest Saleable Unit UPC'),
        salesToSmallestConversion: getValue('Sales Unit of Measure to Smallest Saleable Unit of Measure Conversion'),
        consumerToSmallestConversion: getValue('Consumer Unit of Measure to Smallest Saleable Unit of Measure Conversion'),
        ssuLength: getValue('Smallest Saleable Unit Length (Imperial)'),
        ssuHeight: getValue('Smallest Saleable Unit Height (Imperial)'),
        ssuWidth: getValue('Smallest Saleable Unit Width (Imperial)'),
        ssuWeight: getValue('Smallest Saleable Unit Weight (Imperial)'),
        salesLength: getValue('Sales Unit Length (Imperial)'),
        salesHeight: getValue('Sales Unit Height (Imperial)'),
        salesWidth: getValue('Sales Unit Width (Imperial)'),
        salesWeight: getValue('Sales Unit Weight (Imperial)'),
        consumerUom: getValue('Consumer UOM'),
        consumerUpc: getValue('Consumer UPC'),
        consumerConversion: getValue('Consumer Conversion'),
        innerUom: getValue('Inner UOM'),
        innerUpc: getValue('Inner UPC'),
        innerConversion: getValue('Inner Conversion'),
        shipperUom: getValue('Shipper UOM'),
        shipperUpc: getValue('Shipper UPC'),
        shipperConversion: getValue('Shipper Conversion'),
        baseUom: getValue('Base Unit of Measure'),
        shipLength: getValue('Ship Container Length (Imperial)'),
        shipHeight: getValue('Ship Container Height (Imperial)'),
        shipWidth: getValue('Ship Container Width (Imperial)'),
        shipWeight: getValue('Ship Container Weight (Imperial)'),
        leadTime: getValue('Lead Times'),
        countryOfOrigin: getValue('Country of Origin'),
        harmonizingCode: getValue('Harmonizing code'),
        comments: getValue('Comments'),
        rowNumber: i + 1,
      });
    }

    return rows;
  }

  /**
   * Build product description HTML with all specs from Excel
   */
  private buildDescription(row: Parsed3MRow): string {
    const parts: string[] = [];

    // Main description
    if (row.productDescription) {
      const cleanDesc = row.productDescription
        .replace(/\r\n/g, '<br>')
        .replace(/\n/g, '<br>');
      parts.push(`<p>${cleanDesc}</p>`);
    }

    // Product specs
    const specs: string[] = [];

    if (row.countryOfOrigin) {
      specs.push(`<li><strong>Country of Origin:</strong> ${row.countryOfOrigin}</li>`);
    }
    if (row.salesUom) {
      specs.push(`<li><strong>Sold By:</strong> ${row.salesUom}</li>`);
    }
    if (row.minOrderQty > 1) {
      specs.push(`<li><strong>Minimum Order:</strong> ${row.minOrderQty} ${row.minOrderUnit || row.salesUom || 'units'}</li>`);
    }
    if (row.smallestSaleableUnit) {
      specs.push(`<li><strong>Smallest Saleable Unit:</strong> ${row.smallestSaleableUnit}</li>`);
    }
    if (row.salesToSmallestConversion) {
      specs.push(`<li><strong>Packaging:</strong> ${row.salesToSmallestConversion}</li>`);
    }
    if (row.harmonizingCode) {
      specs.push(`<li><strong>HS Code:</strong> ${row.harmonizingCode}</li>`);
    }
    if (row.leadTime) {
      specs.push(`<li><strong>Lead Time:</strong> ${row.leadTime} days</li>`);
    }
    if (row.stockNumber) {
      specs.push(`<li><strong>3M Stock #:</strong> ${row.stockNumber}</li>`);
    }
    if (row.catalogNumber) {
      specs.push(`<li><strong>3M Catalog #:</strong> ${row.catalogNumber}</li>`);
    }

    // Physical dimensions
    const dimensions: string[] = [];
    if (row.ssuLength) dimensions.push(`L: ${row.ssuLength}`);
    if (row.ssuWidth) dimensions.push(`W: ${row.ssuWidth}`);
    if (row.ssuHeight) dimensions.push(`H: ${row.ssuHeight}`);
    if (dimensions.length > 0) {
      specs.push(`<li><strong>Dimensions:</strong> ${dimensions.join(' × ')}</li>`);
    }
    if (row.ssuWeight) {
      specs.push(`<li><strong>Weight:</strong> ${row.ssuWeight}</li>`);
    }

    // UPC info
    if (row.smallestSaleableUpc) {
      specs.push(`<li><strong>UPC:</strong> ${row.smallestSaleableUpc}</li>`);
    }

    if (row.comments) {
      specs.push(`<li><strong>Notes:</strong> ${row.comments}</li>`);
    }

    if (specs.length > 0) {
      parts.push(`<ul class="specs-list">${specs.join('')}</ul>`);
    }

    return parts.join('');
  }

  /**
   * Generate short description (plain text, max 200 chars)
   */
  private generateShortDescription(text: string, maxLength: number = 200): string {
    const clean = text
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength).trim() + '...';
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string, partNumber: string): string {
    const base = name || partNumber;
    return base
      .toLowerCase()
      .replace(/[™®©]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  /**
   * Generate SEO fields
   */
  private generateSeoFields(row: Parsed3MRow): {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } {
    const productName = row.productName || row.customerPartNumber;
    const metaTitle = `3M ${productName}`.substring(0, 60);

    const descText = (row.productDescription || productName)
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const metaDescription = `Shop 3M ${productName}. ${descText}`.substring(0, 160);

    const keywords = ['3M', 'industrial', 'safety', row.customerPartNumber];
    if (row.categoryLevel1) keywords.push(row.categoryLevel1);
    if (row.categoryLevel2) keywords.push(row.categoryLevel2);

    const nameWords = productName.toLowerCase().split(/\s+/);
    const relevantWords = nameWords.filter(w =>
      w.length > 3 && !['with', 'and', 'the', 'for'].includes(w)
    );
    keywords.push(...relevantWords.slice(0, 5));

    const metaKeywords = [...new Set(keywords)].join(', ');
    return { metaTitle, metaDescription, metaKeywords };
  }

  /**
   * Get or create 3M brand
   */
  private async getOrCreateBrand(): Promise<string> {
    let brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { slug: '3m' },
          { name: { equals: '3M', mode: 'insensitive' } }
        ]
      },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: '3M',
          slug: '3m',
          description: '3M - Industrial and Safety Products',
          isActive: true,
        },
      });
      console.log('Created 3M brand');
    }

    return brand.id;
  }

  /**
   * Get or create root category for 3M prerelease products
   */
  private async getOrCreateRootCategory(): Promise<string> {
    const rootName = '3M Products (Prerelease)';
    const rootSlug = '3m-products-prerelease';

    if (this.categoryCache.has('ROOT')) {
      return this.categoryCache.get('ROOT')!;
    }

    try {
      const root = await prisma.category.upsert({
        where: { slug: rootSlug },
        update: {},
        create: {
          name: rootName,
          slug: rootSlug,
          isActive: false,
          description: '3M imported products pending review',
        },
      });

      this.categoryCache.set('ROOT', root.id);
      if (!this.createdCategories.includes(rootName)) {
        this.createdCategories.push(rootName);
        console.log(`Created root category: ${rootName}`);
      }
      return root.id;
    } catch {
      const existing = await prisma.category.findFirst({
        where: { slug: rootSlug },
      });
      if (existing) {
        this.categoryCache.set('ROOT', existing.id);
        return existing.id;
      }
      throw new Error(`Failed to create root category: ${rootName}`);
    }
  }

  /**
   * Find or create category hierarchy:
   * ROOT (3M Products Prerelease) > Level 1 (e.g. Abrasives) > Level 2 (e.g. Abrasive Discs)
   * All categories are inactive (not shown on storefront)
   */
  private async findOrCreateCategory(
    level1: string,
    level2: string
  ): Promise<string | null> {
    if (!level1 && !level2) return null;

    const cacheKey = `${level1}::${level2}`.toLowerCase();
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey)!;
    }

    const rootId = await this.getOrCreateRootCategory();

    // Create Level 1 category under ROOT
    let level1Id: string | null = null;
    if (level1) {
      const level1Slug = `3m-${level1.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

      try {
        const cat1 = await prisma.category.upsert({
          where: { slug: level1Slug },
          update: {},
          create: {
            name: level1,
            slug: level1Slug,
            isActive: false,
            description: `3M ${level1} products`,
            parentId: rootId,
          },
        });
        level1Id = cat1.id;

        if (!this.createdCategories.includes(level1)) {
          this.createdCategories.push(level1);
          console.log(`Created L1 category: ${level1}`);
        }
      } catch {
        const existing = await prisma.category.findFirst({
          where: { slug: level1Slug },
        });
        if (existing) {
          level1Id = existing.id;
        }
      }
    }

    // If no Level 2, return Level 1
    if (!level2 || level2 === level1) {
      if (level1Id) {
        this.categoryCache.set(cacheKey, level1Id);
      }
      return level1Id;
    }

    // Create Level 2 category under Level 1
    const level2Slug = `3m-${level2.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;

    try {
      const cat2 = await prisma.category.upsert({
        where: { slug: level2Slug },
        update: {},
        create: {
          name: level2,
          slug: level2Slug,
          isActive: false,
          description: `3M ${level2} products`,
          parentId: level1Id || rootId,
        },
      });

      this.categoryCache.set(cacheKey, cat2.id);
      if (!this.createdCategories.includes(level2)) {
        this.createdCategories.push(level2);
        console.log(`Created L2 category: ${level2} under ${level1}`);
      }
      return cat2.id;
    } catch {
      const existing = await prisma.category.findFirst({
        where: { slug: level2Slug },
      });
      if (existing) {
        this.categoryCache.set(cacheKey, existing.id);
        return existing.id;
      }
      return level1Id;
    }
  }

  /**
   * Parse imperial dimension string like "6.5 (Inch)" → number
   */
  private parseImperialValue(val: string): number | null {
    if (!val) return null;
    const match = val.match(/([\d.]+)/);
    if (match) {
      const num = parseFloat(match[1]);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  /**
   * Determine TAA approval based on country of origin
   * China and Brazil → NOT TAA approved
   * All others → TAA approved
   */
  private isTaaApproved(countryOfOrigin: string): boolean {
    if (!countryOfOrigin) return true;
    return !NON_TAA_COUNTRIES.includes(countryOfOrigin.toLowerCase().trim());
  }

  /**
   * Map Sales UOM to priceUnit
   */
  private mapPriceUnit(salesUom: string): string {
    const map: Record<string, string> = {
      'each': 'ea',
      'roll': 'ea',
      'carton': 'ea',
      'case': 'ea',
      'pack': 'pk',
      'sheet': 'ea',
      'bag': 'ea',
      'assortment': 'ea',
      'drum': 'ea',
      'kit': 'ea',
      'pair': 'pr',
    };
    return map[salesUom?.toLowerCase()] || 'ea';
  }

  /**
   * Import products from parsed data
   */
  async importProducts(
    rows: Parsed3MRow[],
    options: ThreeMImportOptions = {}
  ): Promise<ThreeMImportResult> {
    const {
      updateExisting = true,
      dryRun = false,
      defaultStockQuantity = 0,
      defaultSupplierId,
      defaultWarehouseId,
      defaultBrandId,
    } = options;

    // Reset
    this.errors = [];
    this.warnings = [];
    this.createdProducts = [];
    this.updatedProducts = [];
    this.createdCategories = [];
    this.categoryCache = new Map();

    const brandId = defaultBrandId || await this.getOrCreateBrand();

    console.log(`Processing ${rows.length} 3M products`);

    let processedRows = 0;

    for (const row of rows) {
      try {
        await this.processRow(row, {
          updateExisting,
          dryRun,
          defaultStockQuantity,
          brandId,
          defaultSupplierId,
          defaultWarehouseId,
        });
        processedRows++;
      } catch (error) {
        console.error(`Error processing row ${row.rowNumber} (${row.customerPartNumber}):`, error);
        this.errors.push({
          row: row.rowNumber,
          field: 'general',
          value: row.customerPartNumber,
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
      errors: this.errors,
      warnings: this.warnings,
      createdProducts: this.createdProducts,
      updatedProducts: this.updatedProducts,
      createdCategories: this.createdCategories,
    };
  }

  /**
   * Process a single row
   */
  private async processRow(
    row: Parsed3MRow,
    options: {
      updateExisting: boolean;
      dryRun: boolean;
      defaultStockQuantity: number;
      brandId: string;
      defaultSupplierId?: string;
      defaultWarehouseId?: string;
    }
  ): Promise<void> {
    const {
      updateExisting,
      dryRun,
      defaultStockQuantity,
      brandId,
      defaultSupplierId,
      defaultWarehouseId,
    } = options;

    // SKU = Customer Part Number (e.g. 3M-7000046881)
    const sku = row.customerPartNumber || `3M-${row.stockNumber}`;

    // Check existing
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku },
          { vendorPartNumber: sku },
        ],
      },
    });

    if (existingProduct && !updateExisting) {
      this.warnings.push({
        row: row.rowNumber,
        field: 'sku',
        message: `Product ${sku} already exists, skipping`,
      });
      return;
    }

    // Build description
    const description = this.buildDescription(row);
    const shortDescription = this.generateShortDescription(
      row.productName + '. ' + row.productDescription
    );

    // Price calculation:
    // basePrice = ADA Sale Price × minOrderQty (final site price)
    // gsaPrice = ADA Gov Price × minOrderQty (final gov price)
    // costPrice = Net Price New × minOrderQty (total cost)
    const minQty = row.minOrderQty || 1;
    const basePrice = (row.adaSalePrice || 0) * minQty;
    const costPrice = (row.netPrice || 0) * minQty;
    const govPrice = (row.adaGovPrice || 0) * minQty;

    // Generate unique slug
    let slug = this.generateSlug(row.productName, row.customerPartNumber);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug && existingSlug.sku !== sku) {
      slug = `${slug}-${(row.customerPartNumber || row.stockNumber).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    }

    // SEO
    const seoFields = this.generateSeoFields(row);

    // Price unit
    const priceUnit = this.mapPriceUnit(row.salesUom);

    // TAA
    const taaApproved = this.isTaaApproved(row.countryOfOrigin);

    // Category
    const categoryId = await this.findOrCreateCategory(
      row.categoryLevel1,
      row.categoryLevel2
    );

    // Parse physical dimensions
    const length = this.parseImperialValue(row.ssuLength);
    const width = this.parseImperialValue(row.ssuWidth);
    const height = this.parseImperialValue(row.ssuHeight);
    const weight = this.parseImperialValue(row.ssuWeight);

    const productData: any = {
      name: row.productName,
      slug,
      description,
      shortDescription,
      status: 'PRERELEASE',
      basePrice: new Decimal(Math.round(basePrice * 100) / 100),
      ...(costPrice > 0 && { costPrice: new Decimal(Math.round(costPrice * 100) / 100) }),
      ...(govPrice > 0 && { gsaPrice: new Decimal(Math.round(govPrice * 100) / 100) }),
      priceUnit,
      qtyPerPack: 1,
      minimumOrderQty: minQty,
      stockQuantity: defaultStockQuantity,
      hasVariants: false,
      brandId,
      taaApproved,
      ...(categoryId && { categoryId }),
      ...(defaultSupplierId && { defaultSupplierId }),
      ...(defaultWarehouseId && { defaultWarehouseId }),
      // Physical dimensions
      ...(length && { length: new Decimal(length) }),
      ...(width && { width: new Decimal(width) }),
      ...(height && { height: new Decimal(height) }),
      ...(weight && { weight: new Decimal(weight) }),
      // Original category info
      originalCategory: [row.categoryLevel1, row.categoryLevel2].filter(Boolean).join(' > '),
      // SEO
      metaTitle: seoFields.metaTitle,
      metaDescription: seoFields.metaDescription,
      metaKeywords: seoFields.metaKeywords,
      // Vendor part number
      vendorPartNumber: sku,
    };

    if (dryRun) {
      console.log(`[DRY RUN] Would create/update: ${sku} - ${row.productName} (TAA: ${taaApproved}, Price: $${basePrice}, Gov: $${govPrice}, MinQty: ${minQty})`);
      return;
    }

    let savedProduct;
    if (existingProduct && updateExisting) {
      savedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
      this.updatedProducts.push(sku);
    } else if (!existingProduct) {
      savedProduct = await prisma.product.create({
        data: {
          sku,
          ...productData,
        },
      });
      this.createdProducts.push(sku);
    } else {
      savedProduct = existingProduct;
    }

    // Create warehouse stock
    if (defaultWarehouseId && savedProduct) {
      await this.createWarehouseStock(savedProduct.id, defaultWarehouseId, defaultStockQuantity);
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
export const threeMImportService = new ThreeMImportService();
