import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * 3M Special Product Import Service
 *
 * Excel Field Mapping (Row 1 = headers):
 * - manufacturer_part_number → Product SKU
 * - vendor_part_number → ADA vendor part number (3M-XXXXXXX)
 * - item_name → product name
 * - item_description → description
 * - commercial_price → basePrice (MSRP)
 * - Sup Cost → costPrice
 * - govt_price_with_fee → gsaPrice (calculated: supCost/GM * 1.0075)
 * - sin → GSA Special Item Number
 * - uom → Unit of measure
 * - quantity_per_pack → Qty per pack
 *
 * Special rules:
 * - No images (will be uploaded manually)
 * - All products → PRERELEASE status
 * - TAA Approved = true
 * - No category assignment (will be done manually)
 * - Each row = one product (no variant detection)
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
  upcStyle: string;
  itemType: string;
  manufacturer: string;
  manufacturerPartNumber: string;
  vendorPartNumber: string;
  sin: string;
  itemName: string;
  itemDescription: string;
  uom: string;
  quantityPerPack: number;
  quantityUnitUom: string;
  commercialPrice: number;
  supCost: number;
  govtPriceWithFee: number;
  countryOfOrigin: string;
  deliveryDays: number;
  leadTimeCode: string;
  upc: string;
  unspsc: string;
  warrantyPeriod: number;
  warrantyUnit: string;
  length: number | null;
  width: number | null;
  height: number | null;
  physicalUom: string;
  weightLbs: number | null;
  rowNumber: number;
}

export class ThreeMImportService {
  private errors: ThreeMImportError[] = [];
  private warnings: ThreeMImportWarning[] = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];

  /**
   * Parse 3M Excel file from buffer
   */
  async parseExcel(fileBuffer: Buffer): Promise<Parsed3MRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    // Find header row (row with column names like manufacturer_part_number)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      if (data[i] && Array.isArray(data[i]) &&
          (data[i].includes('manufacturer_part_number') ||
           data[i].includes('vendor_part_number'))) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = data[headerRowIdx] as string[];
    const rows: Parsed3MRow[] = [];

    // Map column indices
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      if (h) colMap[h.toString().toLowerCase().trim()] = i;
    });

    console.log('3M Column mapping:', Object.keys(colMap));

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
      const vpn = getValue('vendor_part_number');
      if (!mpn && !vpn) continue; // Skip empty rows

      // For govt_price_with_fee: try to read calculated value, fallback to formula calc
      let govtPriceWithFee = getNumber('govt_price_with_fee');
      if (!govtPriceWithFee || govtPriceWithFee === 0) {
        // Calculate from sup cost: supCost / 0.7 * 1.0075 (default GM)
        const supCost = getNumber('sup cost');
        if (supCost > 0) {
          govtPriceWithFee = (supCost / 0.7) * 1.0075;
        }
      }

      rows.push({
        upcStyle: getValue('upc - style'),
        itemType: getValue('item_type'),
        manufacturer: getValue('manufacturer'),
        manufacturerPartNumber: mpn,
        vendorPartNumber: vpn,
        sin: getValue('sin'),
        itemName: getValue('item_name'),
        itemDescription: getValue('item_description'),
        uom: getValue('uom'),
        quantityPerPack: getNumber('quantity_per_pack') || 1,
        quantityUnitUom: getValue('quantity_unit_uom'),
        commercialPrice: getNumber('commercial_price'),
        supCost: getNumber('sup cost'),
        govtPriceWithFee,
        countryOfOrigin: getValue('country_of_origin'),
        deliveryDays: getNumber('delivery_days'),
        leadTimeCode: getValue('lead_time_code'),
        upc: getValue('upc'),
        unspsc: getValue('unspsc'),
        warrantyPeriod: getNumber('warranty_period'),
        warrantyUnit: getValue('warranty_unit_of_time'),
        length: getNumber('length') || null,
        width: getNumber('width') || null,
        height: getNumber('height') || null,
        physicalUom: getValue('physical_uom'),
        weightLbs: getNumber('weight_lbs') || null,
        rowNumber: i + 1,
      });
    }

    return rows;
  }

  /**
   * Build description HTML
   */
  private buildDescription(row: Parsed3MRow): string {
    const parts: string[] = [];

    if (row.itemDescription) {
      const cleanDesc = row.itemDescription
        .replace(/\r\n/g, '<br>')
        .replace(/\n/g, '<br>');
      parts.push(`<p>${cleanDesc}</p>`);
    }

    const specs: string[] = [];
    if (row.countryOfOrigin) specs.push(`<li><strong>Country of Origin:</strong> ${row.countryOfOrigin}</li>`);
    if (row.warrantyPeriod) specs.push(`<li><strong>Warranty:</strong> ${row.warrantyPeriod} ${row.warrantyUnit || 'days'}</li>`);
    if (row.uom) specs.push(`<li><strong>Unit:</strong> ${row.uom}</li>`);
    if (row.quantityPerPack > 1) specs.push(`<li><strong>Qty per Pack:</strong> ${row.quantityPerPack}</li>`);
    if (row.manufacturer) specs.push(`<li><strong>Manufacturer:</strong> ${row.manufacturer}</li>`);

    if (specs.length > 0) {
      parts.push(`<ul class="specs-list">${specs.join('')}</ul>`);
    }

    return parts.join('');
  }

  /**
   * Generate short description
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
    const brandName = '3M';
    const productName = row.itemName || row.manufacturerPartNumber;

    const metaTitle = `${brandName} ${productName}`.substring(0, 60);

    const descText = (row.itemDescription || productName)
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const metaDescription = `Shop ${brandName} ${productName}. ${descText}`.substring(0, 160);

    const keywords = [
      brandName,
      'industrial',
      'safety',
      row.manufacturerPartNumber,
    ];

    const nameWords = productName.toLowerCase().split(/\s+/);
    const relevantWords = nameWords.filter(w =>
      w.length > 3 &&
      !['with', 'and', 'the', 'for'].includes(w)
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

    // Reset counters
    this.errors = [];
    this.warnings = [];
    this.createdProducts = [];
    this.updatedProducts = [];

    // Get or create brand
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
        console.error(`Error processing row ${row.rowNumber} (${row.manufacturerPartNumber}):`, error);
        this.errors.push({
          row: row.rowNumber,
          field: 'general',
          value: row.manufacturerPartNumber,
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
    };
  }

  /**
   * Process a single row (each row = one product, no variants)
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

    const sku = row.vendorPartNumber || `3M-${row.manufacturerPartNumber}`;

    // Check if product exists
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

    // Build product data
    const description = this.buildDescription(row);
    const shortDescription = this.generateShortDescription(
      row.itemName + '. ' + row.itemDescription
    );
    const basePrice = row.commercialPrice || 0;

    // Generate unique slug
    let slug = this.generateSlug(row.itemName, row.manufacturerPartNumber);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug && existingSlug.sku !== sku) {
      slug = `${slug}-${row.manufacturerPartNumber.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    }

    // Generate SEO fields
    const seoFields = this.generateSeoFields(row);

    // Map UOM to priceUnit
    const priceUnitMap: Record<string, string> = {
      'PR': 'pr',
      'EA': 'ea',
      'PK': 'pk',
      'DZ': 'DZ',
      'ROLL': 'ea',
      'CASE': 'ea',
      'PACK': 'pk',
      'EACH': 'ea',
    };
    const priceUnit = priceUnitMap[row.uom?.toUpperCase()] || 'ea';

    const productData: any = {
      name: row.itemName,
      slug,
      description,
      shortDescription,
      status: 'PRERELEASE',
      basePrice: new Decimal(basePrice),
      ...(row.supCost && { costPrice: new Decimal(row.supCost) }),
      ...(row.govtPriceWithFee && { gsaPrice: new Decimal(Math.round(row.govtPriceWithFee * 100) / 100) }),
      ...(row.sin && { gsaSin: String(row.sin) }),
      priceUnit,
      qtyPerPack: row.quantityPerPack || 1,
      stockQuantity: defaultStockQuantity,
      hasVariants: false,
      brandId,
      // TAA Approved = true
      taaApproved: true,
      // No category - will be assigned manually
      ...(defaultSupplierId && { defaultSupplierId }),
      ...(defaultWarehouseId && { defaultWarehouseId }),
      // Physical dimensions
      ...(row.length && { length: new Decimal(row.length) }),
      ...(row.width && { width: new Decimal(row.width) }),
      ...(row.height && { height: new Decimal(row.height) }),
      ...(row.weightLbs && { weight: new Decimal(row.weightLbs) }),
      // Store original info
      originalCategory: '3M Special Products',
      // SEO fields
      metaTitle: seoFields.metaTitle,
      metaDescription: seoFields.metaDescription,
      metaKeywords: seoFields.metaKeywords,
      // Vendor part number
      vendorPartNumber: sku,
    };

    if (dryRun) {
      console.log(`[DRY RUN] Would create/update product: ${sku} - ${row.itemName}`);
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

    // Create warehouse stock entry if warehouse is specified
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
