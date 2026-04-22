import * as XLSX from 'xlsx';
import path from 'path';
import fsPromises from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from './image-processor';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Milwaukee Import Service
 *
 * Excel columns (53 total):
 * - Product Code             → vendorPartNumber (MW-0818-20)
 * - Supplier Part Number     → sku (0818-20)
 * - Product Short Description → name
 * - Product Category         → POWER_TOOLS, HARDWARE, HAND_TOOLS, etc.
 * - Brand / Manufacturer     → Milwaukee
 * - Product Last Cost in Stock UOM → costPrice
 * - Level 1 Price            → basePrice
 * - Level 3 Price            → govPrice / gsaPrice
 * - GSA Number, SIN Number, UPC, COO, TAA Status
 * - Each Length/Width/Height/Weight
 *
 * Images:
 * - Located at: /var/www/static-uploads/milwaukee/{PartNumber}/
 * - Pattern: {PartNumber}_main.webp
 * - Processed with imageProcessor → WebP 4 sizes
 *
 * No variants: each row = one product (9535 unique)
 */

export interface MilwaukeeImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedNoImage: number;
  errors: Array<{ row: number; field: string; value: string; message: string }>;
  warnings: Array<{ row: number; field: string; message: string }>;
  createdProducts: string[];
  updatedProducts: string[];
}

export interface MilwaukeeImportOptions {
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

interface ParsedRow {
  productCode: string;
  supplierPartNumber: string;
  productName: string;
  productCategory: string;
  brand: string;
  manufacturer: string;
  uom: string;
  costPrice: number;
  level1Price: number;
  level3Price: number;
  msrp: number;
  gsaNumber: string;
  sinNumber: string;
  gsaShortDescription: string;
  upc: string;
  coo: string;
  taaApproved: boolean;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  moq: number;
  description: string;
  salesLongDescription: string;
  season: string;
  rowNumber: number;
}

export class MilwaukeeImportService {
  private errors: Array<{ row: number; field: string; value: string; message: string }> = [];
  private warnings: Array<{ row: number; field: string; message: string }> = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];
  private skippedNoImage = 0;

  async parseExcel(fileBuffer: Buffer): Promise<ParsedRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rowsRaw = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

    const rows: ParsedRow[] = [];

    rowsRaw.forEach((row: any, idx: number) => {
      const s = (k: string): string => String(row[k] ?? '').trim();
      const n = (k: string): number => {
        const v = row[k];
        if (v === undefined || v === null || v === '') return 0;
        const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/[,$]/g, ''));
        return isNaN(num) ? 0 : num;
      };
      const nNull = (k: string): number | null => { const v = n(k); return v === 0 ? null : v; };

      const spn = s('Supplier Part Number');
      const pc = s('Product Code');
      if (!spn && !pc) return;

      const taaCol = s('TAA Status').toLowerCase();
      const coo = s('COO');
      const taaApproved = taaCol.includes('approved') || taaCol === 'yes' ||
        ['us', 'usa', 'united states', 'puerto rico'].includes(coo.toLowerCase());

      // Weight column may have newline
      let weight: number | null = null;
      for (const k of Object.keys(row)) {
        if (k.toLowerCase().includes('each') && k.toLowerCase().includes('weight')) {
          const v = row[k];
          if (v !== undefined && v !== null && v !== '') {
            const wn = typeof v === 'number' ? v : parseFloat(String(v));
            if (!isNaN(wn) && wn > 0) { weight = wn; break; }
          }
        }
      }

      rows.push({
        productCode: pc,
        supplierPartNumber: spn || pc,
        productName: s('Product Short Description'),
        productCategory: s('Product Category'),
        brand: s('Brand') || 'Milwaukee',
        manufacturer: s('Manufacturer') || 'Milwaukee',
        uom: s('Sales UOM') || s('Stock UOM') || 'Each',
        costPrice: n('Product Last Cost in Stock UOM') || n('Product Cost in Purchase UOM'),
        level1Price: n('Level 1 Price'),
        level3Price: n('Level 3 Price'),
        msrp: n('MSRP'),
        gsaNumber: s('GSA Number (EXTMEMO1)'),
        sinNumber: s('SIN Number'),
        gsaShortDescription: s('GSA Short Description'),
        upc: s('UPC'),
        coo,
        taaApproved,
        length: nNull('Each Length'),
        width: nNull('Each Width'),
        height: nNull('Each Height'),
        weight,
        moq: Math.max(1, Math.floor(n('Minimum Quantity') || n('Multiple Quantity') || 1)),
        description: s('Additional Product Notes and Specification'),
        salesLongDescription: s('Additional Sales Long Description'),
        season: s('Season'),
        rowNumber: idx + 2,
      });
    });

    return rows;
  }

  private buildDescription(row: ParsedRow): string {
    const parts: string[] = [];
    if (row.salesLongDescription) {
      parts.push(`<p>${row.salesLongDescription.replace(/\n/g, '<br>')}</p>`);
    }
    if (row.description && row.description !== row.salesLongDescription) {
      parts.push(`<p>${row.description.replace(/\n/g, '<br>')}</p>`);
    }
    const specs: string[] = [];
    if (row.coo) specs.push(`<li><strong>Country of Origin:</strong> ${row.coo}</li>`);
    if (row.upc) specs.push(`<li><strong>UPC:</strong> ${row.upc}</li>`);
    if (row.gsaNumber) specs.push(`<li><strong>GSA Contract:</strong> ${row.gsaNumber}</li>`);
    if (row.sinNumber) specs.push(`<li><strong>SIN:</strong> ${row.sinNumber}</li>`);
    if (row.taaApproved) specs.push(`<li><strong>TAA Compliant:</strong> Yes</li>`);
    if (row.season) specs.push(`<li><strong>Season:</strong> ${row.season}</li>`);
    if (specs.length > 0) parts.push(`<ul class="specs-list">${specs.join('')}</ul>`);
    return parts.join('');
  }

  private generateSlug(name: string, sku: string): string {
    return (name || sku)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 90) + '-' + sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  private getImageFiles(sku: string, basePath: string): string[] {
    const folder = path.join(basePath, sku);
    if (!existsSync(folder)) return [];
    try {
      return readdirSync(folder)
        .filter(f => /\.(webp|jpg|jpeg|png)$/i.test(f))
        .sort()
        .map(f => path.join(folder, f));
    } catch { return []; }
  }

  private async getOrCreateBrand(): Promise<string> {
    let brand = await prisma.brand.findFirst({
      where: { OR: [{ slug: 'milwaukee' }, { name: { contains: 'Milwaukee', mode: 'insensitive' } }] },
    });
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: 'Milwaukee', slug: 'milwaukee', description: 'Milwaukee Tool - Power tools, hand tools, and accessories', isActive: true },
      });
      console.log('Created Milwaukee brand');
    }
    return brand.id;
  }

  private async findCategory(catCode: string): Promise<string | null> {
    if (!catCode) return null;
    const map: Record<string, string[]> = {
      'POWER_TOOLS': ['power tools'],
      'HARDWARE': ['hardware', 'fasteners'],
      'Tools': ['tools', 'hand tools'],
      'HAND_TOOLS': ['hand tools'],
      'CLOTHING': ['clothing', 'apparel', 'workwear'],
      'HEAD-PRO': ['head protection', 'hard hat'],
      'PPE': ['ppe', 'personal protective', 'safety'],
      'ABRASIVES': ['abrasives'],
      'HANDPRO': ['hand protection', 'gloves'],
      'EYEPRO': ['eye protection', 'safety glasses'],
    };
    const terms = map[catCode] || [catCode.toLowerCase().replace(/_/g, ' ')];
    for (const term of terms) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ slug: term.replace(/\s+/g, '-') }, { name: { contains: term, mode: 'insensitive' } }] },
      });
      if (cat) return cat.id;
    }
    return null;
  }

  async importProducts(rows: ParsedRow[], options: MilwaukeeImportOptions = {}): Promise<MilwaukeeImportResult> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = '/var/www/static-uploads/milwaukee',
      dryRun = false,
      defaultStockQuantity = 0,
      defaultStatus = 'PRERELEASE',
      defaultSupplierId, defaultWarehouseId, defaultBrandId, defaultCategoryId,
    } = options;

    this.errors = [];
    this.warnings = [];
    this.createdProducts = [];
    this.updatedProducts = [];
    this.skippedNoImage = 0;

    const brandId = defaultBrandId || await this.getOrCreateBrand();

    // Pre-scan image folders
    let imageFolderCount = 0;
    if (importImages && existsSync(imageBasePath)) {
      try {
        imageFolderCount = readdirSync(imageBasePath).length;
        console.log(`Found ${imageFolderCount} image folders at ${imageBasePath}`);
      } catch {}
    }

    console.log(`Processing ${rows.length} products`);
    let processedRows = 0;

    for (const row of rows) {
      try {
        const sku = row.supplierPartNumber;
        const existing = await prisma.product.findFirst({
          where: { OR: [{ sku }, { vendorPartNumber: row.productCode }] },
        });

        if (existing && !updateExisting) {
          processedRows++;
          continue;
        }

        const categoryId = defaultCategoryId || await this.findCategory(row.productCategory);
        const description = this.buildDescription(row);
        const shortDesc = (row.productName + '. ' + (row.salesLongDescription || row.description))
          .replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 200);
        const basePrice = row.level1Price || row.costPrice || 0;

        let slug = this.generateSlug(row.productName, sku);
        const slugExists = await prisma.product.findUnique({ where: { slug } });
        if (slugExists && slugExists.sku !== sku) slug = `${slug}-${Date.now().toString(36)}`;

        const metaTitle = `Milwaukee ${row.productName}`.substring(0, 60);
        const metaDesc = `Shop Milwaukee ${row.productName}. ${shortDesc}`.substring(0, 160);

        const productData: any = {
          name: row.productName || sku,
          slug,
          description,
          shortDescription: shortDesc,
          status: defaultStatus,
          basePrice: new Decimal(basePrice),
          ...(row.costPrice && { costPrice: new Decimal(row.costPrice) }),
          ...(row.level3Price && { gsaPrice: new Decimal(row.level3Price), governmentPrice: new Decimal(row.level3Price) }),
          ...(row.gsaNumber && { gsaSin: row.gsaNumber }),
          priceUnit: 'ea',
          qtyPerPack: 1,
          minimumOrderQty: row.moq,
          stockQuantity: defaultStockQuantity,
          hasVariants: false,
          taaApproved: row.taaApproved,
          brandId,
          ...(categoryId && { categoryId }),
          ...(defaultSupplierId && { defaultSupplierId }),
          ...(defaultWarehouseId && { defaultWarehouseId }),
          ...(row.length && { length: new Decimal(row.length) }),
          ...(row.width && { width: new Decimal(row.width) }),
          ...(row.height && { height: new Decimal(row.height) }),
          ...(row.weight && { weight: new Decimal(row.weight) }),
          originalCategory: `Milwaukee ${row.productCategory || 'Tools'}`,
          metaTitle, metaDescription: metaDesc,
          metaKeywords: ['Milwaukee', 'power tools', row.productCategory, sku].filter(Boolean).join(', '),
          ...(row.productCode && { vendorPartNumber: row.productCode }),
        };

        if (dryRun) {
          processedRows++;
          continue;
        }

        let savedProduct;
        if (existing && updateExisting) {
          savedProduct = await prisma.product.update({ where: { id: existing.id }, data: productData });
          this.updatedProducts.push(sku);
          await prisma.productImage.deleteMany({ where: { productId: savedProduct.id } });
        } else if (!existing) {
          savedProduct = await prisma.product.create({ data: { sku, ...productData } });
          this.createdProducts.push(sku);
        } else {
          savedProduct = existing;
        }

        // Process images
        if (importImages && savedProduct) {
          const imageFiles = this.getImageFiles(sku, imageBasePath);
          if (imageFiles.length > 0) {
            await this.processImages(savedProduct.id, sku, imageFiles);
          } else {
            this.skippedNoImage++;
          }
        }

        // Warehouse stock
        if (defaultWarehouseId && savedProduct) {
          const whKey = { warehouseId_productId: { warehouseId: defaultWarehouseId, productId: savedProduct.id } };
          const whExists = await prisma.warehouseStock.findUnique({ where: whKey });
          if (whExists) {
            await prisma.warehouseStock.update({ where: whKey, data: { quantity: defaultStockQuantity, available: defaultStockQuantity } });
          } else {
            await prisma.warehouseStock.create({ data: { warehouseId: defaultWarehouseId, productId: savedProduct.id, quantity: defaultStockQuantity, available: defaultStockQuantity, reserved: 0, reorderPoint: 10, reorderQuantity: 50 } });
          }
        }

        processedRows++;
        if (processedRows % 100 === 0) {
          console.log(`Progress: ${processedRows}/${rows.length} (${this.createdProducts.length} created, ${this.updatedProducts.length} updated, ${this.skippedNoImage} no-image)`);
        }
      } catch (error) {
        this.errors.push({ row: row.rowNumber, field: 'general', value: row.supplierPartNumber, message: error instanceof Error ? error.message : 'Unknown' });
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
    };
  }

  private async processImages(productId: string, partNumber: string, imagePaths: string[]): Promise<void> {
    const imageFiles: Array<{ buffer: Buffer; filename: string }> = [];
    for (const p of imagePaths) {
      try {
        const buf = await fsPromises.readFile(p);
        imageFiles.push({ buffer: buf, filename: path.basename(p) });
      } catch {}
    }
    if (imageFiles.length === 0) return;

    try {
      const processed = await imageProcessor.processImages(imageFiles, {
        brandSlug: 'milwaukee',
        productSku: partNumber,
        convertToWebp: true,
      });

      for (let i = 0; i < processed.length; i++) {
        const img = processed[i];
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

      await prisma.product.update({
        where: { id: productId },
        data: { images: processed.map(p => p.mediumUrl || p.thumbUrl).filter(Boolean) as string[] },
      });
    } catch (err) {
      this.warnings.push({ row: 0, field: 'images', message: `Image processing failed for ${partNumber}: ${err instanceof Error ? err.message : 'Unknown'}` });
    }
  }
}

export const milwaukeeImportService = new MilwaukeeImportService();
