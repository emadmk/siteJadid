import * as XLSX from 'xlsx';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from './image-processor';
import { Decimal } from '@prisma/client/runtime/library';
import https from 'https';
import http from 'http';
import { URL as NodeURL } from 'url';

/**
 * PortWest Import Service
 *
 * Excel columns (57 total):
 * - Product Code         → variant SKU (PW-2886CGR42)
 * - Supplier Part Number → variant base (2886CGR42) - may have BOM \uFEFF
 * - Internal Part Number → same as Product Code
 * - Product Short Description → full name with size/color
 * - Brand                → "PortWest"
 * - Product Category     → CLOTHING, PPE, HANDPRO, FOOTPRO, HEAD-PRO, EYEPRO...
 * - Cost Price, Personal Buyer Price, Gov Price, MSRP
 * - UPC, EAN13, GSA Number, SIN Number, COO, TAA Approved
 * - Length, Width, Height, Weight(Kg)
 * - MOQ, Minimum Quantity, Unit_Of_Sale
 * - Image_Path → direct URL (https://d11ak7fd9ypfb7.cloudfront.net/styles1100px/{style}.jpg)
 *
 * Grouping:
 * - Image filename (without extension) = style+color code (e.g., 2886CGR)
 * - Base style = leading digits/alphanumeric prefix (e.g., 2886)
 * - Rows grouped by BASE STYLE become one Product with variants
 * - Each variant has: color + size + fit (Regular/Tall/Short)
 *
 * Images:
 * - Downloaded directly from CDN URLs during import
 * - Converted to WebP via imageProcessor (4 sizes)
 * - Same base style may have multiple colors → multiple images per product
 */

export interface PortWestImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface PortWestImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface PortWestImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedNoImage: number;
  imagesDownloaded: number;
  imagesFailed: number;
  errors: PortWestImportError[];
  warnings: PortWestImportWarning[];
  createdProducts: string[];
  updatedProducts: string[];
  createdVariants: number;
}

export interface PortWestImportOptions {
  updateExisting?: boolean;
  importImages?: boolean;
  dryRun?: boolean;
  defaultStockQuantity?: number;
  defaultStatus?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'PRERELEASE';
  defaultSupplierId?: string;
  defaultWarehouseId?: string;
  defaultBrandId?: string;
  defaultCategoryId?: string;
}

interface ParsedPortWestRow {
  productCode: string;            // PW-2886CGR42
  supplierPartNumber: string;     // 2886CGR42 (cleaned)
  internalPartNumber: string;
  productName: string;            // Full description
  productCategory: string;        // CLOTHING, PPE, etc.
  brand: string;
  manufacturer: string;
  uom: string;
  costPrice: number;
  personalBuyerPrice: number;
  govPrice: number;
  msrp: number;
  upc: string;
  ean13: string;
  gsaNumber: string;
  sinNumber: string;
  gsaShortDescription: string;
  coo: string;
  taaApproved: boolean;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  moq: number;
  additionalProductNotes: string;
  additionalSalesLongDesc: string;
  additionalPurchaseLongDesc: string;
  imageUrl: string;
  // Extracted
  imgBase: string;                // styleColor (2886CGR)
  baseStyle: string;              // 2886
  size: string;                   // 42, L, XL
  color: string;                  // Charcoal Gray
  fit: string;                    // Regular, Tall, Short
  rowNumber: number;
}

interface VariantGroup {
  baseStyle: string;
  productName: string;            // Cleaned (no size)
  description: string;
  productCategory: string;
  coo: string;
  taaApproved: boolean;
  gsaNumber: string;
  sinNumber: string;
  gsaShortDescription: string;
  uom: string;
  moq: number;
  // Use first variant's dimensions as product-level
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  // Aggregated pricing (from first variant)
  costPrice: number;
  personalBuyerPrice: number;
  govPrice: number;
  msrp: number;
  // All unique image URLs for this base style (one per imgBase)
  imgBaseToUrl: Map<string, string>;
  rows: ParsedPortWestRow[];
}

export class PortWestImportService {
  private errors: PortWestImportError[] = [];
  private warnings: PortWestImportWarning[] = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];
  private createdVariants = 0;
  private skippedNoImage = 0;
  private imagesDownloaded = 0;
  private imagesFailed = 0;

  /**
   * Clean BOM and normalize string
   */
  private clean(s: string): string {
    if (!s) return '';
    return String(s).replace(/\uFEFF/g, '').trim();
  }

  /**
   * Parse PortWest Excel file
   */
  async parseExcel(fileBuffer: Buffer): Promise<ParsedPortWestRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rowsRaw = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

    const rows: ParsedPortWestRow[] = [];

    rowsRaw.forEach((row: any, idx: number) => {
      const getStr = (k: string): string => {
        const v = row[k];
        if (v === undefined || v === null) return '';
        return this.clean(String(v));
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

      const imageUrl = getStr('Image_Path');
      const productName = getStr('Product Short Description');

      // Extract image base (styleColor) from URL
      const imgBase = imageUrl
        ? path.basename(imageUrl).replace(/\.[^.]+$/, '').replace(/\uFEFF/g, '')
        : '';

      // Extract BASE STYLE (leading digits or letters+digits, without color code)
      // 2886CGR → 2886, A010WHR → A010, IDHS225RBT → IDHS225
      const baseStyleMatch = imgBase.match(/^([A-Z]*\d+)/i);
      const baseStyle = baseStyleMatch ? baseStyleMatch[1] : imgBase;

      // Parse size/fit/color from description
      // Format: "Portwest {style} {name}, {size} {fit}, {color}"
      let size = '';
      let color = '';
      let fit = '';
      const parts = productName.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        const sizeFit = parts[parts.length - 2];
        const sf = sizeFit.split(/\s+/);
        if (sf.length >= 2) {
          size = sf[0];
          fit = sf.slice(1).join(' ');
        } else {
          size = sizeFit;
        }
        color = parts[parts.length - 1];
      }

      // TAA: Yes/No column plus COO check
      const taaCol = getStr('TAA Approved').toLowerCase();
      const coo = getStr('COO');
      const taaApproved =
        taaCol === 'yes' ||
        taaCol === 'y' ||
        taaCol === 'true' ||
        ['usa', 'united states', 'puerto rico', 'pr', 'us'].includes(coo.toLowerCase());

      // Weight column has newline: "Weight\n(Kg)"
      let weight: number | null = null;
      for (const k of Object.keys(row)) {
        if (k.toLowerCase().includes('weight') && !k.toLowerCase().includes('purchase') && !k.toLowerCase().includes('sales')) {
          const v = row[k];
          if (v !== undefined && v !== null && v !== '') {
            const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,$]/g, ''));
            if (!isNaN(n) && n > 0) {
              weight = n;
              break;
            }
          }
        }
      }

      rows.push({
        productCode,
        supplierPartNumber: supplierPartNumber || productCode,
        internalPartNumber: getStr('Internal Part Number') || productCode,
        productName,
        productCategory: getStr('Product Category'),
        brand: getStr('Brand') || 'PortWest',
        manufacturer: getStr('Manufacturer') || 'PortWest',
        uom: getStr('Sales UOM') || getStr('Stock UOM') || 'EACH',
        costPrice: getNum('Cost Price'),
        personalBuyerPrice: getNum('Personal Buyer Price'),
        govPrice: getNum('Gov Price'),
        msrp: getNum('MSRP'),
        upc: getStr('UPC'),
        ean13: getStr('EAN13'),
        gsaNumber: getStr('GSA Number (EXTMEMO1)'),
        sinNumber: getStr('SIN Number'),
        gsaShortDescription: getStr('GSA Short Description'),
        coo,
        taaApproved,
        length: getNumOrNull('Length'),
        width: getNumOrNull('Width'),
        height: getNumOrNull('Height'),
        weight,
        moq: Math.max(1, Math.floor(getNum('MOQ') || getNum('Minimum Quantity') || 1)),
        additionalProductNotes: getStr('Additional Product Notes and Specification'),
        additionalSalesLongDesc: getStr('Additional Sales Long Description'),
        additionalPurchaseLongDesc: getStr('Additional Purchase Long Description'),
        imageUrl,
        imgBase,
        baseStyle,
        size,
        color,
        fit,
        rowNumber: idx + 2,
      });
    });

    return rows;
  }

  /**
   * Group rows by BASE STYLE (all colors + sizes of same style)
   */
  private groupByBaseStyle(rows: ParsedPortWestRow[]): VariantGroup[] {
    const groups = new Map<string, ParsedPortWestRow[]>();
    for (const row of rows) {
      const key = row.baseStyle || row.supplierPartNumber;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    const out: VariantGroup[] = [];
    for (const [baseStyle, groupRows] of groups) {
      const first = groupRows[0];

      // Collect all unique image URLs (one per imgBase = one per color)
      const imgMap = new Map<string, string>();
      for (const r of groupRows) {
        if (r.imgBase && r.imageUrl && !imgMap.has(r.imgBase)) {
          imgMap.set(r.imgBase, r.imageUrl);
        }
      }

      // Clean product name: remove size/fit from description
      // "Portwest 2886 Industrial Work Pants, 42 Regular, Charcoal Gray" →
      // "Portwest 2886 Industrial Work Pants, Charcoal Gray"
      let cleanName = first.productName;
      const parts = cleanName.split(',').map(p => p.trim());
      if (parts.length >= 3) {
        // Remove the size-fit part (second-to-last)
        parts.splice(parts.length - 2, 1);
        cleanName = parts.join(', ');
      }

      out.push({
        baseStyle,
        productName: cleanName,
        description: first.additionalSalesLongDesc || first.additionalProductNotes,
        productCategory: first.productCategory,
        coo: first.coo,
        taaApproved: first.taaApproved,
        gsaNumber: first.gsaNumber,
        sinNumber: first.sinNumber,
        gsaShortDescription: first.gsaShortDescription,
        uom: first.uom,
        moq: first.moq,
        length: first.length,
        width: first.width,
        height: first.height,
        weight: first.weight,
        costPrice: first.costPrice,
        personalBuyerPrice: first.personalBuyerPrice,
        govPrice: first.govPrice,
        msrp: first.msrp,
        imgBaseToUrl: imgMap,
        rows: groupRows,
      });
    }

    return out;
  }

  /**
   * Download an image from URL into a Buffer
   */
  private downloadImage(url: string, timeoutMs = 30000): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new NodeURL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const req = protocol.get(
        url,
        {
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ADASuppliesImporter/1.0)',
            Accept: 'image/*,*/*',
          },
        },
        (res) => {
          // Follow redirects
          if ([301, 302, 303, 307].includes(res.statusCode || 0) && res.headers.location) {
            const redirectUrl = res.headers.location.startsWith('http')
              ? res.headers.location
              : `${parsedUrl.protocol}//${parsedUrl.host}${res.headers.location}`;
            this.downloadImage(redirectUrl, timeoutMs).then(resolve).catch(reject);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
            return;
          }

          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const buf = Buffer.concat(chunks);
            if (buf.length < 500) {
              reject(new Error(`Image too small (${buf.length} bytes)`));
              return;
            }
            resolve(buf);
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Download timeout'));
      });
      req.on('error', reject);
    });
  }

  /**
   * Build HTML description
   */
  private buildDescription(group: VariantGroup): string {
    const parts: string[] = [];
    const cleanText = (t: string) =>
      t.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');

    if (group.description) {
      parts.push(`<p>${cleanText(group.description)}</p>`);
    }

    const specs: string[] = [];
    if (group.coo) specs.push(`<li><strong>Country of Origin:</strong> ${group.coo}</li>`);
    if (group.gsaNumber) specs.push(`<li><strong>GSA Contract:</strong> ${group.gsaNumber}</li>`);
    if (group.sinNumber) specs.push(`<li><strong>SIN:</strong> ${group.sinNumber}</li>`);
    if (group.taaApproved) specs.push(`<li><strong>TAA Compliant:</strong> Yes</li>`);
    if (group.productCategory) specs.push(`<li><strong>Category:</strong> ${group.productCategory}</li>`);

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

  private generateSlug(name: string, baseStyle: string): string {
    const base = (name || baseStyle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 90);
    return `${base}-${baseStyle.toLowerCase()}`.substring(0, 100);
  }

  private generateSeoFields(group: VariantGroup): {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } {
    const brandName = 'PortWest';
    const productName = group.productName || group.baseStyle;
    const metaTitle = `${brandName} ${productName}`.substring(0, 60);
    const descText = (group.description || productName)
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const metaDescription = `Shop ${brandName} ${productName}. ${descText}`.substring(0, 160);
    const keywords = [
      brandName,
      'workwear',
      'safety equipment',
      'PPE',
      group.baseStyle,
      group.productCategory,
    ].filter(Boolean);
    return {
      metaTitle,
      metaDescription,
      metaKeywords: [...new Set(keywords)].join(', '),
    };
  }

  /**
   * Get or create PortWest brand
   */
  private async getOrCreateBrand(): Promise<string> {
    let brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { slug: 'portwest' },
          { name: { equals: 'PortWest', mode: 'insensitive' } },
          { name: { equals: 'Portwest', mode: 'insensitive' } },
        ],
      },
    });
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: 'PortWest',
          slug: 'portwest',
          description: 'PortWest - Industrial safety equipment, workwear, and PPE',
          isActive: true,
        },
      });
      console.log('Created PortWest brand');
    }
    return brand.id;
  }

  /**
   * Match Excel category to existing site category by name
   */
  private async findCategoryByName(catCode: string): Promise<string | null> {
    if (!catCode) return null;

    // Map Excel category codes to site category search terms
    const categoryMap: Record<string, string[]> = {
      'CLOTHING': ['clothing', 'apparel', 'workwear'],
      'PPE': ['ppe', 'personal protective', 'safety'],
      'HANDPRO': ['hand protection', 'gloves'],
      'FOOTPRO': ['footwear', 'foot protection', 'boots', 'shoes'],
      'HEAD-PRO': ['head protection', 'hard hat', 'helmet'],
      'EYEPRO': ['eye protection', 'safety glasses', 'goggles'],
      'FACEPRO': ['face protection', 'face shield', 'mask'],
      'HEARPRO': ['hearing protection', 'ear'],
      'STORAGE': ['storage'],
      'HARDWARE': ['hardware', 'tools'],
      'ERGONOMICS': ['ergonomic', 'back support'],
    };

    const searchTerms = categoryMap[catCode.toUpperCase()] || [catCode];

    for (const term of searchTerms) {
      const cat = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: term.toLowerCase().replace(/\s+/g, '-') },
            { name: { contains: term, mode: 'insensitive' } },
          ],
        },
      });
      if (cat) return cat.id;
    }
    return null;
  }

  /**
   * Import products
   */
  async importProducts(
    rows: ParsedPortWestRow[],
    options: PortWestImportOptions = {}
  ): Promise<PortWestImportResult> {
    const {
      updateExisting = true,
      importImages = true,
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
    this.imagesDownloaded = 0;
    this.imagesFailed = 0;

    const brandId = defaultBrandId || (await this.getOrCreateBrand());

    // Group by base style
    const groups = this.groupByBaseStyle(rows);
    console.log(
      `Processing ${groups.length} product groups from ${rows.length} rows`
    );

    let processedRows = 0;

    for (const group of groups) {
      try {
        await this.processGroup(group, {
          updateExisting,
          importImages,
          dryRun,
          defaultStockQuantity,
          defaultStatus,
          brandId,
          defaultSupplierId,
          defaultWarehouseId,
          defaultCategoryId,
        });
        processedRows += group.rows.length;
      } catch (error) {
        console.error(`Error processing ${group.baseStyle}:`, error);
        this.errors.push({
          row: group.rows[0].rowNumber,
          field: 'general',
          value: group.baseStyle,
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
      imagesDownloaded: this.imagesDownloaded,
      imagesFailed: this.imagesFailed,
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
    opts: {
      updateExisting: boolean;
      importImages: boolean;
      dryRun: boolean;
      defaultStockQuantity: number;
      defaultStatus: string;
      brandId: string;
      defaultSupplierId?: string;
      defaultWarehouseId?: string;
      defaultCategoryId?: string;
    }
  ): Promise<void> {
    const hasVariants = group.rows.length > 1;
    const firstRow = group.rows[0];
    const baseSku = group.baseStyle;

    // Check if product exists
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [{ sku: baseSku }, { vendorPartNumber: firstRow.productCode }],
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

    // Find category
    const categoryId =
      opts.defaultCategoryId || (await this.findCategoryByName(group.productCategory));

    // Build content
    const description = this.buildDescription(group);
    const shortDescription = this.generateShortDescription(
      group.productName + '. ' + group.description
    );
    const basePrice = group.personalBuyerPrice || group.costPrice || 0;

    // Unique slug
    let slug = this.generateSlug(group.productName, baseSku);
    const slugExists = await prisma.product.findUnique({ where: { slug } });
    if (slugExists && slugExists.sku !== baseSku) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const seo = this.generateSeoFields(group);

    // UOM
    const priceUnit = 'ea';

    if (opts.dryRun) {
      console.log(
        `[DRY RUN] Would upsert: ${baseSku} (${group.rows.length} variants, ${group.imgBaseToUrl.size} unique images)`
      );
      return;
    }

    const productData: any = {
      name: group.productName || baseSku,
      slug,
      description,
      shortDescription,
      status: opts.defaultStatus,
      basePrice: new Decimal(basePrice),
      ...(group.costPrice && { costPrice: new Decimal(group.costPrice) }),
      ...(group.govPrice && {
        gsaPrice: new Decimal(group.govPrice),
        governmentPrice: new Decimal(group.govPrice),
      }),
      ...(group.gsaNumber && { gsaSin: group.gsaNumber }),
      priceUnit,
      qtyPerPack: 1,
      minimumOrderQty: group.moq || 1,
      stockQuantity: hasVariants ? 0 : opts.defaultStockQuantity,
      hasVariants,
      taaApproved: group.taaApproved,
      brandId: opts.brandId,
      ...(categoryId && { categoryId }),
      ...(opts.defaultSupplierId && { defaultSupplierId: opts.defaultSupplierId }),
      ...(opts.defaultWarehouseId && { defaultWarehouseId: opts.defaultWarehouseId }),
      ...(group.length && { length: new Decimal(group.length) }),
      ...(group.width && { width: new Decimal(group.width) }),
      ...(group.height && { height: new Decimal(group.height) }),
      ...(group.weight && { weight: new Decimal(group.weight) }),
      originalCategory: group.productCategory
        ? `PortWest ${group.productCategory}`
        : 'PortWest',
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      metaKeywords: seo.metaKeywords,
      ...(firstRow.productCode && { vendorPartNumber: firstRow.productCode }),
    };

    // Upsert product
    let savedProduct;
    if (existingProduct && opts.updateExisting) {
      savedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
      this.updatedProducts.push(baseSku);

      if (hasVariants) {
        await prisma.productVariant.deleteMany({
          where: { productId: savedProduct.id },
        });
      }
      await prisma.productImage.deleteMany({
        where: { productId: savedProduct.id },
      });
    } else if (!existingProduct) {
      savedProduct = await prisma.product.create({
        data: { sku: baseSku, ...productData },
      });
      this.createdProducts.push(baseSku);
    } else {
      savedProduct = existingProduct;
    }

    // Download and process images (one per color = imgBase)
    const imgBaseToProcessed = new Map<
      string,
      { medium: string; large: string }
    >();

    if (opts.importImages && group.imgBaseToUrl.size > 0) {
      const imageFiles: Array<{
        buffer: Buffer;
        filename: string;
        imgBase: string;
      }> = [];

      for (const [imgBase, url] of group.imgBaseToUrl) {
        try {
          const buffer = await this.downloadImage(url);
          imageFiles.push({ buffer, filename: `${imgBase}.jpg`, imgBase });
          this.imagesDownloaded++;
        } catch (err) {
          this.imagesFailed++;
          this.warnings.push({
            row: firstRow.rowNumber,
            field: 'image_download',
            message: `Failed to download ${url}: ${err instanceof Error ? err.message : 'Unknown'}`,
          });
        }
      }

      if (imageFiles.length > 0) {
        try {
          const processed = await imageProcessor.processImages(
            imageFiles.map((f) => ({ buffer: f.buffer, filename: f.filename })),
            {
              brandSlug: 'portwest',
              productSku: baseSku,
              convertToWebp: true,
            }
          );

          for (let i = 0; i < processed.length; i++) {
            const img = processed[i];
            const fileRef = imageFiles[i];
            imgBaseToProcessed.set(fileRef.imgBase, {
              medium: img.mediumUrl || img.thumbUrl,
              large: img.largeUrl || img.mediumUrl || img.thumbUrl,
            });

            await prisma.productImage.create({
              data: {
                productId: savedProduct.id,
                originalUrl: img.originalUrl,
                largeUrl: img.largeUrl,
                mediumUrl: img.mediumUrl,
                thumbUrl: img.thumbUrl,
                originalName: fileRef.filename,
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

          // Update product.images array
          await prisma.product.update({
            where: { id: savedProduct.id },
            data: {
              images: processed.map((p) => p.mediumUrl || p.thumbUrl).filter(Boolean) as string[],
            },
          });
        } catch (err) {
          this.warnings.push({
            row: firstRow.rowNumber,
            field: 'image_process',
            message: `Failed to process images for ${baseSku}: ${err instanceof Error ? err.message : 'Unknown'}`,
          });
        }
      } else {
        this.skippedNoImage++;
      }
    }

    // Build colorImages map: color name → image index
    if (imgBaseToProcessed.size > 0) {
      const imgBaseOrder = Array.from(group.imgBaseToUrl.keys());
      const colorImages: Record<string, number[]> = {};
      const seenColors = new Set<string>();
      for (const r of group.rows) {
        const colorKey = r.color || r.imgBase;
        if (!colorKey || seenColors.has(colorKey)) continue;
        const idx = imgBaseOrder.indexOf(r.imgBase);
        if (idx >= 0) {
          colorImages[colorKey] = [idx];
          seenColors.add(colorKey);
        }
      }
      if (Object.keys(colorImages).length > 0) {
        await prisma.product.update({
          where: { id: savedProduct.id },
          data: { colorImages },
        });
      }
    }

    // Create variants
    let totalStock = hasVariants ? 0 : opts.defaultStockQuantity;
    if (hasVariants) {
      for (const row of group.rows) {
        const variantPrice =
          row.personalBuyerPrice || group.personalBuyerPrice || basePrice;
        const variantSku = row.productCode || `${baseSku}-${row.size}-${row.color}`;
        const variantName =
          [row.color, row.size, row.fit].filter(Boolean).join(' ') || 'Default';

        // Get image for this variant's color
        const variantImages: string[] = [];
        const imgInfo = imgBaseToProcessed.get(row.imgBase);
        if (imgInfo) variantImages.push(imgInfo.medium);

        try {
          await prisma.productVariant.create({
            data: {
              productId: savedProduct.id,
              sku: variantSku,
              name: variantName,
              ...(row.size && { size: row.size }),
              ...(row.color && { color: row.color }),
              basePrice: new Decimal(variantPrice),
              ...(row.govPrice && {
                gsaPrice: new Decimal(row.govPrice),
                governmentPrice: new Decimal(row.govPrice),
              }),
              ...(row.costPrice && { costPrice: new Decimal(row.costPrice) }),
              stockQuantity: opts.defaultStockQuantity,
              isActive: true,
              images: variantImages,
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

    // Warehouse stock
    if (opts.defaultWarehouseId && savedProduct) {
      await this.createWarehouseStock(
        savedProduct.id,
        opts.defaultWarehouseId,
        totalStock
      );
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

export const portwestImportService = new PortWestImportService();
