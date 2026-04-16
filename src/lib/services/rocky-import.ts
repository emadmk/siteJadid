import * as XLSX from 'xlsx';
import path from 'path';
import fsPromises from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from './image-processor';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Rocky Brands / Georgia Boots Import Service
 *
 * Excel columns used (from GS Import - Rocky/Georgia Boots files):
 * - Product Code          → variant SKU (GB-G050-14M, RB-FQ0000102-3ME)
 * - Supplier Part Number  → base SKU, used for image folder lookup (G050, FQ0000102)
 * - Internal Part Number  → same as Product Code
 * - Product Short Description → product name
 * - Brand                 → "Rocky" or "GeorgiaBoots" (normalized to "Rocky"/"Georgia Boot")
 * - Product Category      → "FOOTPRO" etc
 * - Cost Price, Personal Buyer Price, Gov Buyer Price, MSRP
 * - TAA Approved, COO, UPC, GSA Number, Season
 * - Length/Width/Height/Weight
 * - Additional Sales/Purchase Long Description, Additional Product Notes
 *
 * Images:
 * - Located at: /var/www/static-uploads/rocky/{SupplierPartNumber}/
 * - Pattern: {PartNumber}_main.jpg, _front.jpg, _back.jpg, _profile.jpg,
 *            _birdseye.jpg, _instep_profile.jpg, _outsole.jpg
 * - Served by nginx at /uploads/rocky/{PartNumber}/...
 *
 * Variants:
 * - Rows with same Supplier Part Number are grouped as size variants of one product
 * - Size is extracted from the Product Code (last segment after last '-')
 */

export interface RockyImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface RockyImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface RockyImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedNoImage: number;
  errors: RockyImportError[];
  warnings: RockyImportWarning[];
  createdProducts: string[];
  updatedProducts: string[];
  createdVariants: number;
}

export interface RockyImportOptions {
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

interface ParsedRockyRow {
  productCode: string;            // GB-G050-14M (variant SKU)
  supplierPartNumber: string;     // G050 (base SKU)
  internalPartNumber: string;     // GB-G050-14M
  productName: string;
  productType: string;
  productCategory: string;        // FOOTPRO
  brandRaw: string;               // "Rocky", "GeorgiaBoots"
  brandNormalized: string;        // "Rocky", "Georgia Boot"
  manufacturer: string;
  purchaseUom: string;
  salesUom: string;
  stockUom: string;
  costPrice: number;
  lastCost: number;
  avgCost: number;
  standardCost: number;
  personalBuyerPrice: number;
  govBuyerPrice: number;
  msrp: number;
  fixedSalesPrice: number;
  purchaseWeight: number | null;
  salesWeight: number | null;
  minimumOrderQty: number;
  additionalProductNotes: string;
  additionalSalesLongDesc: string;
  additionalPurchaseLongDesc: string;
  upsellNotes: string;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  gsaNumber: string;
  upc: string;
  coo: string;
  taaApproved: boolean;
  season: string;
  gsaShortDescription: string;
  dropShip: string;
  mainSupplier: string;
  putAwayWarehouseBin: string;
  // Extracted
  size: string;
  rowNumber: number;
}

interface VariantGroup {
  supplierPartNumber: string;     // G050
  productName: string;
  brandNormalized: string;        // "Rocky" or "Georgia Boot"
  description: string;
  salesLongDescription: string;
  purchaseLongDescription: string;
  productCategory: string;
  manufacturer: string;
  uom: string;
  costPrice: number;
  personalBuyerPrice: number;
  govBuyerPrice: number;
  msrp: number;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  coo: string;
  taaApproved: boolean;
  upc: string;
  gsaNumber: string;
  season: string;
  minimumOrderQty: number;
  rows: ParsedRockyRow[];
}

export class RockyImportService {
  private errors: RockyImportError[] = [];
  private warnings: RockyImportWarning[] = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];
  private createdVariants = 0;
  private skippedNoImage = 0;
  private imageFolders = new Set<string>();

  /**
   * Parse Rocky/Georgia Boots Excel file
   */
  async parseExcel(fileBuffer: Buffer): Promise<ParsedRockyRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rowsRaw = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

    const rows: ParsedRockyRow[] = [];

    rowsRaw.forEach((row: any, idx: number) => {
      const getStr = (k: string): string => {
        const v = row[k];
        if (v === undefined || v === null) return '';
        return String(v).trim();
      };
      const getNum = (k: string): number => {
        const v = row[k];
        if (v === undefined || v === null || v === '') return 0;
        const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,$]/g, ''));
        return isNaN(n) ? 0 : n;
      };
      const getNumOrNull = (k: string): number | null => {
        const n = getNum(k);
        return n === 0 ? null : n;
      };

      const productCode = getStr('Product Code');
      const supplierPartNumber = getStr('Supplier Part Number');
      if (!productCode && !supplierPartNumber) return;

      const brandRaw = getStr('Brand');
      const brandNormalized = this.normalizeBrand(brandRaw);

      // Extract size from Product Code (e.g., GB-G050-14M → "14M", RB-FQ0000102-3ME → "3ME")
      const codeParts = productCode.split('-');
      const size = codeParts.length >= 3 ? codeParts[codeParts.length - 1] : '';

      // TAA: Yes/No column, plus check COO
      const taaCol = getStr('TAA Approved').toLowerCase();
      const coo = getStr('COO');
      const taaApproved = taaCol === 'yes' || taaCol === 'y' || taaCol === 'true' ||
        ['usa', 'united states', 'puerto rico', 'pr', 'us'].includes(coo.toLowerCase());

      rows.push({
        productCode,
        supplierPartNumber: supplierPartNumber || productCode,
        internalPartNumber: getStr('Internal Part Number') || productCode,
        productName: getStr('Product Short Description'),
        productType: getStr('Product Type'),
        productCategory: getStr('Product Category'),
        brandRaw,
        brandNormalized,
        manufacturer: getStr('Manufacturer'),
        purchaseUom: getStr('Purchase UOM'),
        salesUom: getStr('Sales UOM'),
        stockUom: getStr('Stock UOM'),
        costPrice: getNum('Cost Price'),
        lastCost: getNum('Product Last Cost in Stock UOM'),
        avgCost: getNum('Product Average Cost in Stock UOM'),
        standardCost: getNum('Standard Cost in Stock UOM'),
        personalBuyerPrice: getNum('Personal Buyer Price'),
        govBuyerPrice: getNum('Gov Buyer Price'),
        msrp: getNum('MSRP'),
        fixedSalesPrice: getNum('Fixed Sales Price in Sales UOM (not mandatory)'),
        purchaseWeight: getNumOrNull('Purchase Weight'),
        salesWeight: getNumOrNull('Sales Weight'),
        minimumOrderQty: Math.max(1, Math.floor(getNum('Minimum Quantity') || 1)),
        additionalProductNotes: getStr('Additional Product Notes and Specification'),
        additionalSalesLongDesc: getStr('Additional Sales Long Description'),
        additionalPurchaseLongDesc: getStr('Additional Purchase Long Description'),
        upsellNotes: getStr('Upsell Notes & Comments'),
        length: getNumOrNull('Length ') || getNumOrNull('Length'),
        width: getNumOrNull('Width'),
        height: getNumOrNull('Height'),
        weight: getNumOrNull('Weight') || getNumOrNull('Sales Weight') || getNumOrNull('Purchase Weight'),
        gsaNumber: getStr('GSA Number (EXTMEMO1)'),
        upc: getStr('UPC'),
        coo,
        taaApproved,
        season: getStr('Season'),
        gsaShortDescription: getStr('GSA Short Description'),
        dropShip: getStr('Drop Ship'),
        mainSupplier: getStr('Main  Supplier') || getStr('Main Supplier'),
        putAwayWarehouseBin: getStr('Put Away Warehouse Bin'),
        size,
        rowNumber: idx + 2, // +2 for header row and 1-indexed
      });
    });

    return rows;
  }

  /**
   * Normalize brand name
   */
  private normalizeBrand(raw: string): string {
    const r = raw.toLowerCase().replace(/\s+/g, '');
    if (r.includes('georgia')) return 'Georgia Boot';
    if (r.includes('durango')) return 'Durango';
    if (r.includes('xtratuf')) return 'XtraTuf';
    if (r.includes('muck')) return 'Muck';
    if (r.includes('rocky')) return 'Rocky';
    if (r.includes('ranger')) return 'Ranger';
    if (r.includes('michelin')) return 'Michelin';
    if (r.includes('4eursole') || r.includes('eursole')) return '4EurSole';
    return raw || 'Rocky';
  }

  /**
   * Group rows by Supplier Part Number
   */
  private groupBySupplierPartNumber(rows: ParsedRockyRow[]): VariantGroup[] {
    const groups = new Map<string, ParsedRockyRow[]>();
    for (const row of rows) {
      const key = `${row.brandNormalized}|${row.supplierPartNumber}`.toUpperCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    const out: VariantGroup[] = [];
    for (const [, groupRows] of groups) {
      const first = groupRows[0];
      out.push({
        supplierPartNumber: first.supplierPartNumber,
        productName: first.productName,
        brandNormalized: first.brandNormalized,
        description: first.additionalProductNotes,
        salesLongDescription: first.additionalSalesLongDesc,
        purchaseLongDescription: first.additionalPurchaseLongDesc,
        productCategory: first.productCategory,
        manufacturer: first.manufacturer,
        uom: first.salesUom || first.stockUom || first.purchaseUom,
        costPrice: first.costPrice,
        personalBuyerPrice: first.personalBuyerPrice,
        govBuyerPrice: first.govBuyerPrice,
        msrp: first.msrp,
        length: first.length,
        width: first.width,
        height: first.height,
        weight: first.weight,
        coo: first.coo,
        taaApproved: first.taaApproved,
        upc: first.upc,
        gsaNumber: first.gsaNumber,
        season: first.season,
        minimumOrderQty: first.minimumOrderQty,
        rows: groupRows,
      });
    }
    return out;
  }

  /**
   * Get sorted image file paths for a Supplier Part Number.
   * Returns full filesystem paths for reading with imageProcessor.
   */
  private getImageFiles(
    supplierPartNumber: string,
    imageBasePath: string
  ): string[] {
    const angleOrder = ['main', 'front', 'profile', 'birdseye', 'instep_profile', 'outsole', 'back'];

    const folderPath = path.join(imageBasePath, supplierPartNumber);
    if (!existsSync(folderPath)) return [];

    let files: string[] = [];
    try {
      files = readdirSync(folderPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    } catch {
      return [];
    }
    if (files.length === 0) return [];

    const byAngle = new Map<string, string>();
    for (const f of files) {
      const base = f.replace(/\.[^.]+$/, '');
      const angleMatch = base.match(/_([a-z0-9_]+)$/i);
      const angle = angleMatch ? angleMatch[1].toLowerCase() : 'main';
      byAngle.set(angle, f);
    }

    const sortedFiles: string[] = [];
    for (const angle of angleOrder) {
      if (byAngle.has(angle)) sortedFiles.push(byAngle.get(angle)!);
    }
    for (const [angle, fn] of byAngle) {
      if (!angleOrder.includes(angle)) sortedFiles.push(fn);
    }

    return sortedFiles.map(f => path.join(folderPath, f));
  }

  /**
   * Build HTML description
   */
  private buildDescription(group: VariantGroup): string {
    const parts: string[] = [];
    const cleanText = (t: string) => t.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');

    if (group.salesLongDescription) {
      parts.push(`<p>${cleanText(group.salesLongDescription)}</p>`);
    }
    if (group.description && group.description !== group.salesLongDescription) {
      parts.push(`<p>${cleanText(group.description)}</p>`);
    }

    const specs: string[] = [];
    if (group.coo) specs.push(`<li><strong>Country of Origin:</strong> ${group.coo}</li>`);
    if (group.upc) specs.push(`<li><strong>UPC:</strong> ${group.upc}</li>`);
    if (group.gsaNumber) specs.push(`<li><strong>GSA Contract:</strong> ${group.gsaNumber}</li>`);
    if (group.taaApproved) specs.push(`<li><strong>TAA Compliant:</strong> Yes</li>`);
    if (group.season) specs.push(`<li><strong>Season:</strong> ${group.season}</li>`);
    if (group.manufacturer) specs.push(`<li><strong>Manufacturer:</strong> ${group.manufacturer}</li>`);

    if (specs.length > 0) {
      parts.push(`<ul class="specs-list">${specs.join('')}</ul>`);
    }

    return parts.join('');
  }

  private generateShortDescription(text: string, maxLen = 200): string {
    const clean = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLen) return clean;
    return clean.substring(0, maxLen).trim() + '...';
  }

  private generateSlug(name: string, partNumber: string): string {
    const base = (name || partNumber)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 90);
    return `${base}-${partNumber.toLowerCase()}`.substring(0, 100);
  }

  private generateSeoFields(group: VariantGroup): {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } {
    const brandName = group.brandNormalized;
    const productName = group.productName || group.supplierPartNumber;
    const metaTitle = `${brandName} ${productName}`.substring(0, 60);
    const descText = (group.salesLongDescription || group.description || productName)
      .replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const metaDescription = `Shop ${brandName} ${productName}. ${descText}`.substring(0, 160);
    const keywords = [
      brandName,
      'footwear',
      'work boots',
      'safety footwear',
      group.supplierPartNumber,
    ];
    const nameWords = productName.toLowerCase().split(/\s+/)
      .filter(w => w.length > 3 && !['with', 'and', 'the', 'for'].includes(w));
    keywords.push(...nameWords.slice(0, 5));
    return {
      metaTitle,
      metaDescription,
      metaKeywords: [...new Set(keywords)].join(', '),
    };
  }

  /**
   * Get or create brand (Rocky, Georgia Boot, etc.)
   */
  private async getOrCreateBrand(brandName: string): Promise<string> {
    const slug = brandName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { slug },
          { name: { equals: brandName, mode: 'insensitive' } },
        ],
      },
    });
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: brandName,
          slug,
          description: `${brandName} - Premium footwear and work boots`,
          isActive: true,
        },
      });
      console.log(`Created brand: ${brandName}`);
    }
    return brand.id;
  }

  /**
   * Get Footwear category
   */
  private async getFootwearCategory(): Promise<string | null> {
    const cat = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: 'footwear' },
          { name: { contains: 'Footwear', mode: 'insensitive' } },
        ],
      },
    });
    return cat?.id || null;
  }

  /**
   * Import products
   */
  async importProducts(
    rows: ParsedRockyRow[],
    options: RockyImportOptions = {}
  ): Promise<RockyImportResult> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = '/var/www/static-uploads/rocky',
      dryRun = false,
      defaultStockQuantity = 0,
      defaultStatus = 'PRERELEASE',
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

    // Pre-scan image folders
    if (importImages && existsSync(imageBasePath)) {
      try {
        const folders = readdirSync(imageBasePath);
        folders.forEach(f => this.imageFolders.add(f.toUpperCase()));
        console.log(`Found ${this.imageFolders.size} image folders at ${imageBasePath}`);
      } catch (err) {
        console.warn(`Could not scan ${imageBasePath}:`, err);
      }
    }

    const categoryId = defaultCategoryId || await this.getFootwearCategory();

    // Group by supplier part number
    const groups = this.groupBySupplierPartNumber(rows);
    console.log(`Processing ${groups.length} product groups from ${rows.length} rows`);

    // Build brand cache (one call per unique brand)
    const brandCache = new Map<string, string>();
    for (const g of groups) {
      if (!brandCache.has(g.brandNormalized)) {
        if (defaultBrandId) {
          brandCache.set(g.brandNormalized, defaultBrandId);
        } else {
          brandCache.set(g.brandNormalized, await this.getOrCreateBrand(g.brandNormalized));
        }
      }
    }

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
          brandId: brandCache.get(group.brandNormalized)!,
          categoryId,
          defaultSupplierId,
          defaultWarehouseId,
        });
        processedRows += group.rows.length;
      } catch (error) {
        console.error(`Error processing ${group.supplierPartNumber}:`, error);
        this.errors.push({
          row: group.rows[0].rowNumber,
          field: 'general',
          value: group.supplierPartNumber,
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
   * Process a single variant group (one product)
   */
  private async processGroup(
    group: VariantGroup,
    opts: {
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
    const hasVariants = group.rows.length > 1;
    const firstRow = group.rows[0];

    // Unique SKU = Supplier Part Number (base)
    const baseSku = group.supplierPartNumber;

    // Check if product exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: baseSku },
          { vendorPartNumber: firstRow.internalPartNumber },
        ],
      },
    });

    if (existingProduct && !opts.updateExisting) {
      this.warnings.push({
        row: firstRow.rowNumber,
        field: 'sku',
        message: `Product ${baseSku} already exists, skipping`,
      });
      return;
    }

    // Build content
    const description = this.buildDescription(group);
    const shortDescription = this.generateShortDescription(
      group.productName + '. ' + (group.salesLongDescription || group.description)
    );
    const basePrice = group.personalBuyerPrice || group.msrp || group.costPrice || 0;
    const govPrice = group.govBuyerPrice || 0;

    // Unique slug
    let slug = this.generateSlug(group.productName, baseSku);
    const slugExists = await prisma.product.findUnique({ where: { slug } });
    if (slugExists && slugExists.sku !== baseSku) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const seo = this.generateSeoFields(group);

    // Map UOM
    const uomMap: Record<string, string> = { PAIR: 'pr', PR: 'pr', EA: 'ea', PK: 'pk', DZ: 'DZ' };
    const priceUnit = uomMap[(group.uom || '').toUpperCase()] || 'ea';

    // Images - get file paths (will be processed after product is created)
    const imageFiles = opts.importImages
      ? this.getImageFiles(baseSku, opts.imageBasePath)
      : [];

    if (opts.importImages && imageFiles.length === 0) {
      this.skippedNoImage++;
      this.warnings.push({
        row: firstRow.rowNumber,
        field: 'images',
        message: `No images found for ${baseSku}`,
      });
    }

    const originalCategory = group.brandNormalized === 'Georgia Boot'
      ? 'Georgia Boots Footwear'
      : `${group.brandNormalized} Footwear`;

    const productData: any = {
      name: group.productName || baseSku,
      slug,
      description,
      shortDescription,
      status: opts.defaultStatus,
      basePrice: new Decimal(basePrice),
      ...(group.costPrice && { costPrice: new Decimal(group.costPrice) }),
      ...(govPrice && {
        gsaPrice: new Decimal(govPrice),
        governmentPrice: new Decimal(govPrice),
      }),
      ...(group.gsaNumber && { gsaSin: group.gsaNumber }),
      priceUnit,
      qtyPerPack: 1,
      minimumOrderQty: group.minimumOrderQty || 1,
      stockQuantity: hasVariants ? 0 : opts.defaultStockQuantity,
      hasVariants,
      taaApproved: group.taaApproved,
      brandId: opts.brandId,
      ...(opts.categoryId && { categoryId: opts.categoryId }),
      ...(opts.defaultSupplierId && { defaultSupplierId: opts.defaultSupplierId }),
      ...(opts.defaultWarehouseId && { defaultWarehouseId: opts.defaultWarehouseId }),
      ...(group.length && { length: new Decimal(group.length) }),
      ...(group.width && { width: new Decimal(group.width) }),
      ...(group.height && { height: new Decimal(group.height) }),
      ...(group.weight && { weight: new Decimal(group.weight) }),
      originalCategory,
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      metaKeywords: seo.metaKeywords,
      ...(firstRow.internalPartNumber && { vendorPartNumber: firstRow.internalPartNumber }),
    };

    if (opts.dryRun) {
      console.log(`[DRY RUN] Would upsert: ${baseSku} (${group.rows.length} variants, ${imageFiles.length} images)`);
      return;
    }

    // Upsert product
    let savedProduct;
    if (existingProduct && opts.updateExisting) {
      savedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
      this.updatedProducts.push(baseSku);

      // Delete existing variants/images for fresh insert
      if (hasVariants) {
        await prisma.productVariant.deleteMany({ where: { productId: savedProduct.id } });
      }
      await prisma.productImage.deleteMany({ where: { productId: savedProduct.id } });
    } else if (!existingProduct) {
      savedProduct = await prisma.product.create({
        data: { sku: baseSku, ...productData },
      });
      this.createdProducts.push(baseSku);
    } else {
      savedProduct = existingProduct;
    }

    // Create variants
    let totalStock = hasVariants ? 0 : opts.defaultStockQuantity;
    if (hasVariants) {
      for (const row of group.rows) {
        const variantPrice = row.personalBuyerPrice || basePrice;
        const variantSize = row.size || 'Default';
        const variantSku = row.productCode || `${baseSku}-${variantSize}`;

        try {
          await prisma.productVariant.create({
            data: {
              productId: savedProduct.id,
              sku: variantSku,
              name: variantSize,
              size: variantSize,
              basePrice: new Decimal(variantPrice),
              ...(row.govBuyerPrice && {
                gsaPrice: new Decimal(row.govBuyerPrice),
                governmentPrice: new Decimal(row.govBuyerPrice),
              }),
              ...(row.costPrice && { costPrice: new Decimal(row.costPrice) }),
              stockQuantity: opts.defaultStockQuantity,
              isActive: true,
              images: [],
            },
          });
          this.createdVariants++;
          totalStock += opts.defaultStockQuantity;
        } catch (err: any) {
          this.warnings.push({
            row: row.rowNumber,
            field: 'variant',
            message: `Failed to create variant ${variantSku}: ${err.message}`,
          });
        }
      }

      await prisma.product.update({
        where: { id: savedProduct.id },
        data: { stockQuantity: totalStock },
      });
    }

    // Process and save images (convert to WebP, generate sizes)
    if (imageFiles.length > 0 && savedProduct) {
      await this.processProductImages(
        savedProduct.id,
        baseSku,
        group.brandNormalized,
        imageFiles,
        existingProduct !== null
      );
    }

    // Warehouse stock
    if (opts.defaultWarehouseId && savedProduct) {
      await this.createWarehouseStock(savedProduct.id, opts.defaultWarehouseId, totalStock);
    }
  }

  /**
   * Process product images: read from disk, convert to WebP, generate 4 sizes,
   * save to public/uploads/products/{brand}/{sku}/, create ProductImage records.
   */
  private async processProductImages(
    productId: string,
    partNumber: string,
    brandName: string,
    imagePaths: string[],
    isUpdate: boolean
  ): Promise<void> {
    const imageFiles: Array<{ buffer: Buffer; filename: string }> = [];

    for (const imgPath of imagePaths) {
      try {
        const buffer = await fsPromises.readFile(imgPath);
        const filename = path.basename(imgPath);
        imageFiles.push({ buffer, filename });
      } catch (error) {
        console.error(`Error reading image ${imgPath}:`, error);
      }
    }

    if (imageFiles.length === 0) {
      this.warnings.push({
        row: 0,
        field: 'images',
        message: `No readable images for ${partNumber}`,
      });
      return;
    }

    // Delete existing images if updating
    if (isUpdate) {
      await prisma.productImage.deleteMany({ where: { productId } });
    }

    try {
      const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const processedImages = await imageProcessor.processImages(imageFiles, {
        brandSlug,
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

      // Update product images array (medium URLs for display)
      await prisma.product.update({
        where: { id: productId },
        data: {
          images: processedImages
            .map(img => img.mediumUrl || img.thumbUrl)
            .filter(Boolean) as string[],
        },
      });
    } catch (error) {
      console.error(`Error processing images for ${partNumber}:`, error);
      this.warnings.push({
        row: 0,
        field: 'images',
        message: `Failed to process images for ${partNumber}: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  }

  private async createWarehouseStock(
    productId: string,
    warehouseId: string,
    quantity: number
  ): Promise<void> {
    const existing = await prisma.warehouseStock.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });

    if (existing) {
      await prisma.warehouseStock.update({
        where: { warehouseId_productId: { warehouseId, productId } },
        data: { quantity, available: quantity },
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

export const rockyImportService = new RockyImportService();
