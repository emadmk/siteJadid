import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { imageProcessor } from './image-processor';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * PiP (Protective Industrial Products) Import Service
 *
 * Excel Field Mapping:
 * - SKU → sku (for site)
 * - STYLE → style (for variant grouping - same style = variants)
 * - COLOR → color (variant attribute)
 * - SIZE → size (variant attribute)
 * - BRAND WITH MARKS + SHORT DESCRIPTION → product name
 * - DESCRIPTION, FEATURES, SPECS, APPLICATIONS → description
 * - SELECT CODE → parent category
 * - COMMODITY CODE → child category
 *
 * CSV Images Mapping:
 * - SKU → Image filename
 */

export interface PipImportError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface PipImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface PipImportResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedNoImage: number;
  errors: PipImportError[];
  warnings: PipImportWarning[];
  createdProducts: string[];
  updatedProducts: string[];
  createdVariants: number;
  createdCategories: string[];
  createdBrands: string[];
}

export interface PipImportOptions {
  updateExisting?: boolean;
  importImages?: boolean;
  imageBasePath?: string;
  csvPath?: string; // Path to CSV file with image mappings
  dryRun?: boolean;
  defaultStockQuantity?: number;
  defaultStatus?: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  defaultSupplierId?: string;
  defaultWarehouseId?: string;
}

interface ParsedPipRow {
  styleId: string;
  skuId: string;
  iref: string;
  sku: string;
  style: string;
  color: string;
  size: string;
  selectCode: string;
  commodityCode: string;
  brand: string;
  brandWithMarks: string;
  shortDescription: string;
  description: string;
  features: string;
  specs: string;
  applications: string;
  specsheetLink: string;
  imagesLink: string;
  status: string;
  countryOfOrigin: string;
  // Physical dimensions
  lowestLength: number | null;
  lowestWidth: number | null;
  lowestHeight: number | null;
  lowestWeight: number | null;
  // Pricing
  costPrice: number | null;       // PRICE PER UM - قیمت خرید
  websitePrice: number | null;    // Website 22% - قیمت سایت
  minSellQty: number | null;      // MIN SELL QTY - حداقل سفارش
  stockType: string;              // STATUS
  rowNumber: number;
  // Additional fields for description
  linerMaterial: string;
  coatingMaterial: string;
  upc: string;
  caseQty: string;
  um: string;
}

interface ImageMapping {
  sku: string;
  images: string[];
}

interface VariantGroup {
  style: string;
  styleId: string;
  productName: string;
  brand: string;
  brandWithMarks: string;
  selectCode: string;
  commodityCode: string;
  description: string;
  features: string;
  specs: string;
  applications: string;
  specsheetLink: string;
  // Physical dimensions (from first row)
  lowestLength: number | null;
  lowestWidth: number | null;
  lowestHeight: number | null;
  lowestWeight: number | null;
  // Pricing (from first row)
  costPrice: number | null;
  websitePrice: number | null;
  minSellQty: number | null;
  stockType: string;
  // Additional details
  linerMaterial: string;
  coatingMaterial: string;
  countryOfOrigin: string;
  caseQty: string;
  um: string;
  rows: ParsedPipRow[];
}

export class PipImportService {
  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private errors: PipImportError[] = [];
  private warnings: PipImportWarning[] = [];
  private createdProducts: string[] = [];
  private updatedProducts: string[] = [];
  private createdVariants = 0;
  private createdCategories: string[] = [];
  private createdBrands: string[] = [];
  private skippedNoImage = 0;
  private categoryCache = new Map<string, string>();
  private brandCache = new Map<string, string>();
  private imageIndex = new Map<string, string>(); // normalized name -> actual filename
  private csvImageMap = new Map<string, string[]>(); // STYLE -> [image filenames]

  /**
   * Parse CSV file for image mapping (STYLE -> Image filenames)
   */
  async parseImageCsv(csvPath: string): Promise<void> {
    this.csvImageMap.clear();

    try {
      const content = await fs.readFile(csvPath, 'utf-8');
      const lines = content.split('\n');

      // Find header row (contains "STYLE" and "Image")
      let headerIdx = -1;
      let styleCol = -1;
      let imageCol = -1;

      for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const cols = this.parseCsvLine(lines[i]);
        const styleIdx = cols.findIndex(c => c.toUpperCase() === 'STYLE');
        const imageIdx = cols.findIndex(c => c.toUpperCase() === 'IMAGE');

        if (styleIdx !== -1 && imageIdx !== -1) {
          headerIdx = i;
          styleCol = styleIdx;
          imageCol = imageIdx;
          break;
        }
      }

      if (headerIdx === -1) {
        console.log('Could not find STYLE and Image columns in CSV');
        return;
      }

      // Parse data rows
      for (let i = headerIdx + 1; i < lines.length; i++) {
        const cols = this.parseCsvLine(lines[i]);
        if (cols.length <= Math.max(styleCol, imageCol)) continue;

        const style = cols[styleCol]?.trim();
        const image = cols[imageCol]?.trim();

        if (style && image) {
          if (!this.csvImageMap.has(style)) {
            this.csvImageMap.set(style, []);
          }
          const images = this.csvImageMap.get(style)!;
          if (!images.includes(image)) {
            images.push(image);
          }
        }
      }

      console.log(`Loaded ${this.csvImageMap.size} STYLE->Image mappings from CSV`);

      // Log sample entries
      const samples = Array.from(this.csvImageMap.entries()).slice(0, 5);
      console.log('Sample CSV mappings:', samples);

    } catch (error) {
      console.error('Error parsing CSV:', error);
    }
  }

  /**
   * Parse a CSV line handling quotes
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Get images for a STYLE from CSV mapping
   */
  getImagesFromCsv(style: string): string[] {
    return this.csvImageMap.get(style) || [];
  }

  /**
   * Parse PiP Excel file from buffer
   */
  async parseExcel(fileBuffer: Buffer): Promise<ParsedPipRow[]> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    // Find header row (row with column names)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      if (data[i] && Array.isArray(data[i]) && data[i].includes('SKU')) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = data[headerRowIdx] as string[];
    const rows: ParsedPipRow[] = [];

    // Map column indices
    const colMap: Record<string, number> = {};
    headers.forEach((h, i) => {
      if (h) colMap[h.toString().toUpperCase().trim()] = i;
    });

    console.log('Column mapping:', colMap);

    // Process data rows
    for (let i = headerRowIdx + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !Array.isArray(row)) continue;

      const getValue = (colName: string): string => {
        const idx = colMap[colName.toUpperCase()];
        return idx !== undefined && row[idx] !== undefined ? String(row[idx]).trim() : '';
      };

      const getNumericValue = (colName: string): number | null => {
        const idx = colMap[colName.toUpperCase()];
        if (idx === undefined || row[idx] === undefined) return null;
        const val = row[idx];
        // Handle string with $ sign or other formatting
        if (typeof val === 'string') {
          const cleaned = val.replace(/[$,\s]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? null : num;
        }
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      const sku = getValue('SKU');
      const style = getValue('STYLE');

      if (!sku && !style) continue; // Skip empty rows

      rows.push({
        styleId: getValue('STYLE ID'),
        skuId: getValue('SKU ID'),
        iref: getValue('IREF'),
        sku: sku || style,
        style: style || sku,
        color: getValue('COLOR'),
        size: getValue('SIZE'),
        selectCode: getValue('SELECT CODE'),
        commodityCode: getValue('COMMODITY CODE'),
        brand: getValue('BRAND'),
        brandWithMarks: getValue('BRAND WITH MARKS'),
        shortDescription: getValue('SHORT DESCRIPTION'),
        description: getValue('DESCRIPTION'),
        features: getValue('FEATURES'),
        specs: getValue('SPECS'),
        applications: getValue('APPLICATIONS'),
        specsheetLink: getValue('SPECSHEET LINK'),
        imagesLink: getValue('IMAGES LINK'),
        status: getValue('STATUS'),
        countryOfOrigin: getValue('COO'),
        // Physical dimensions
        lowestLength: getNumericValue('LOWEST_LENGTH'),
        lowestWidth: getNumericValue('LOWEST_WIDTH'),
        lowestHeight: getNumericValue('LOWEST_HEIGHT'),
        lowestWeight: getNumericValue('LOWEST_WEIGHT'),
        // Pricing - try both column name formats
        costPrice: getNumericValue('PRICE PER UM') || getNumericValue('PRICE PER UM.1'),      // قیمت خرید
        websitePrice: getNumericValue('WEBSITE 22%'),       // قیمت سایت
        minSellQty: getNumericValue('MIN SELL QTY'),
        stockType: getValue('STATUS') || getValue('STOCK TYPE'),
        rowNumber: i + 1,
        // Additional fields
        linerMaterial: getValue('LINER_MATERIAL') || getValue('liner_material'),
        coatingMaterial: getValue('COATING_MATERIAL') || getValue('coating_material'),
        upc: getValue('UPC'),
        caseQty: getValue('CASE QTY') || getValue('CASE_QTY'),
        um: getValue('UM'),
      });
    }

    return rows;
  }

  /**
   * Group rows by STYLE for variant detection
   */
  private groupByStyle(rows: ParsedPipRow[]): VariantGroup[] {
    const groups = new Map<string, ParsedPipRow[]>();

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

      // Product name = BRAND WITH MARKS + SHORT DESCRIPTION
      const productName = [firstRow.brandWithMarks, firstRow.shortDescription]
        .filter(Boolean)
        .join(' ')
        .trim() || style;

      variantGroups.push({
        style,
        styleId: firstRow.styleId,
        productName,
        brand: firstRow.brand,
        brandWithMarks: firstRow.brandWithMarks,
        selectCode: firstRow.selectCode,
        commodityCode: firstRow.commodityCode,
        description: firstRow.description,
        features: firstRow.features,
        specs: firstRow.specs,
        applications: firstRow.applications,
        specsheetLink: firstRow.specsheetLink,
        // Physical dimensions from first row
        lowestLength: firstRow.lowestLength,
        lowestWidth: firstRow.lowestWidth,
        lowestHeight: firstRow.lowestHeight,
        lowestWeight: firstRow.lowestWeight,
        // Pricing from first row
        costPrice: firstRow.costPrice,
        websitePrice: firstRow.websitePrice,
        minSellQty: firstRow.minSellQty,
        stockType: firstRow.stockType,
        // Additional details
        linerMaterial: firstRow.linerMaterial,
        coatingMaterial: firstRow.coatingMaterial,
        countryOfOrigin: firstRow.countryOfOrigin,
        caseQty: firstRow.caseQty,
        um: firstRow.um,
        rows: groupRows,
      });
    }

    return variantGroups;
  }

  /**
   * Build image index from folder - maps various name patterns to actual filenames
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

        // Store multiple lookup keys for each image:
        // 1. Exact filename (without extension)
        this.imageIndex.set(baseName.toLowerCase(), file);

        // 2. If filename has dash, also index the part before dash (STYLE part)
        // e.g., "1070-CAMO" -> also index "1070"
        if (baseName.includes('-')) {
          const stylePart = baseName.split('-')[0];
          if (!this.imageIndex.has(stylePart.toLowerCase())) {
            this.imageIndex.set(stylePart.toLowerCase(), file);
          }
        }

        // 3. If filename has underscore, also index the part before underscore
        if (baseName.includes('_')) {
          const stylePart = baseName.split('_')[0];
          if (!this.imageIndex.has(stylePart.toLowerCase())) {
            this.imageIndex.set(stylePart.toLowerCase(), file);
          }
        }

        // 4. If filename has space, also index the part before space
        if (baseName.includes(' ')) {
          const stylePart = baseName.split(' ')[0];
          if (!this.imageIndex.has(stylePart.toLowerCase())) {
            this.imageIndex.set(stylePart.toLowerCase(), file);
          }
        }
      }

      console.log(`Built image index with ${this.imageIndex.size} entries from ${files.length} files`);

      // Log some sample entries for debugging
      const sampleEntries = Array.from(this.imageIndex.entries()).slice(0, 10);
      console.log('Sample image index entries:', sampleEntries);

    } catch (error) {
      console.error('Error building image index:', error);
    }
  }

  /**
   * Find image for a product using the index
   */
  private findImageInIndex(sku: string, style: string, color: string): string | null {
    const searchTerms = [
      sku,
      style,
      `${style}-${color}`,
      `${style}_${color}`,
      `${style}${color}`,
      sku.replace('/', '-'),
      style.replace('/', '-'),
    ].filter(Boolean);

    for (const term of searchTerms) {
      if (!term) continue;
      const normalized = term.toLowerCase().trim();
      if (this.imageIndex.has(normalized)) {
        return this.imageIndex.get(normalized)!;
      }
    }

    return null;
  }

  /**
   * Check if any variant in the group has images
   */
  private async groupHasImages(group: VariantGroup, imageBasePath: string): Promise<boolean> {
    // First check CSV mapping (most reliable)
    const csvImages = this.getImagesFromCsv(group.style);
    if (csvImages.length > 0) {
      // Verify at least one image file exists
      for (const img of csvImages) {
        const filePath = path.join(imageBasePath, img);
        if (existsSync(filePath)) {
          return true;
        }
      }
    }

    // Then try the image index
    for (const row of group.rows) {
      const found = this.findImageInIndex(row.sku, row.style, row.color);
      if (found) return true;
    }

    // Fallback: direct file check
    for (const row of group.rows) {
      const possibleNames = [row.sku, row.style, row.sku.replace('/', '-'), row.style.replace('/', '-')];
      for (const name of possibleNames) {
        if (!name) continue;
        const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP'];
        for (const ext of extensions) {
          const filePath = path.join(imageBasePath, name + ext);
          if (existsSync(filePath)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Get images for a group - uses CSV mapping first, then index, then direct check
   */
  private getGroupImageNames(group: VariantGroup, imageBasePath: string): string[] {
    const images: string[] = [];

    // First try CSV mapping (most reliable)
    const csvImages = this.getImagesFromCsv(group.style);
    for (const img of csvImages) {
      const filePath = path.join(imageBasePath, img);
      if (existsSync(filePath) && !images.includes(img)) {
        images.push(img);
      }
    }

    if (images.length > 0) {
      return images;
    }

    // Then try the index
    for (const row of group.rows) {
      const foundImage = this.findImageInIndex(row.sku, row.style, row.color);
      if (foundImage && !images.includes(foundImage)) {
        images.push(foundImage);
      }
    }

    if (images.length > 0) {
      return images;
    }

    // Fallback: direct file check
    for (const row of group.rows) {
      const possibleNames = [row.sku, row.style, row.sku.replace('/', '-'), row.style.replace('/', '-')];
      for (const name of possibleNames) {
        if (!name) continue;
        const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP'];
        for (const ext of extensions) {
          const filePath = path.join(imageBasePath, name + ext);
          if (existsSync(filePath)) {
            const fileName = name + ext;
            if (!images.includes(fileName)) {
              images.push(fileName);
            }
          }
        }
      }
      if (images.length > 0) break;
    }

    return images;
  }

  /**
   * Find or create brand
   */
  private async findOrCreateBrand(brandName: string): Promise<string | null> {
    if (!brandName) return null;

    const cleanBrand = brandName.replace(/[®™©]/g, '').trim();
    const brandKey = cleanBrand.toLowerCase();

    // Check cache
    if (this.brandCache.has(brandKey)) {
      return this.brandCache.get(brandKey)!;
    }

    const slug = cleanBrand
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');

    // Try to find existing
    let brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { name: { equals: cleanBrand, mode: 'insensitive' } },
          { slug },
        ],
      },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name: cleanBrand,
          slug,
          description: `${brandName} - Protective Industrial Products`,
          isActive: true,
        },
      });
      this.createdBrands.push(cleanBrand);
      console.log(`Created brand: ${cleanBrand}`);
    }

    this.brandCache.set(brandKey, brand.id);
    return brand.id;
  }

  /**
   * Find or create the root parent category "NEW PRODUCTS RECEIVED INACTIVE"
   */
  private async getOrCreateRootCategory(): Promise<string> {
    const rootName = 'NEW PRODUCTS RECEIVED INACTIVE';
    const rootSlug = 'new-products-received-inactive';

    // Check cache
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
          isActive: false, // Inactive until reviewed
          description: 'New imported products pending review and categorization',
        },
      });

      this.categoryCache.set('ROOT', root.id);

      if (!this.createdCategories.includes(rootName)) {
        this.createdCategories.push(rootName);
        console.log(`Created root category: ${rootName}`);
      }

      return root.id;
    } catch (error) {
      const existing = await prisma.category.findFirst({
        where: { slug: rootSlug },
      });
      if (existing) {
        this.categoryCache.set('ROOT', existing.id);
        return existing.id;
      }
      throw error;
    }
  }

  /**
   * Find or create category (hierarchical under ROOT)
   * Structure: ROOT > SELECT CODE > COMMODITY CODE
   */
  private async findOrCreateCategory(
    parentName: string,
    childName: string
  ): Promise<string | null> {
    if (!parentName && !childName) return null;

    const categoryName = childName || parentName;
    const cacheKey = `${parentName}::${childName}`.toLowerCase();

    // Check cache
    if (this.categoryCache.has(cacheKey)) {
      return this.categoryCache.get(cacheKey)!;
    }

    // Get or create root category first
    const rootId = await this.getOrCreateRootCategory();

    // Create SELECT CODE category under ROOT
    let selectCodeId: string | null = null;
    if (parentName) {
      const selectCodeSlug = `new-${parentName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')}`;

      try {
        const selectCode = await prisma.category.upsert({
          where: { slug: selectCodeSlug },
          update: {},
          create: {
            name: parentName,
            slug: selectCodeSlug,
            isActive: false,
            description: `${parentName} products - pending review`,
            parentId: rootId,
          },
        });
        selectCodeId = selectCode.id;

        if (!this.createdCategories.includes(parentName)) {
          this.createdCategories.push(parentName);
          console.log(`Created SELECT CODE category: ${parentName} under ROOT`);
        }
      } catch (error) {
        const existing = await prisma.category.findFirst({
          where: { slug: selectCodeSlug },
        });
        if (existing) {
          selectCodeId = existing.id;
        } else {
          throw error;
        }
      }
    }

    // If no COMMODITY CODE, return SELECT CODE category
    if (!childName || childName === parentName) {
      if (selectCodeId) {
        this.categoryCache.set(cacheKey, selectCodeId);
      }
      return selectCodeId;
    }

    // Create COMMODITY CODE category under SELECT CODE
    const commoditySlug = `new-${childName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')}`;

    try {
      const commodity = await prisma.category.upsert({
        where: { slug: commoditySlug },
        update: {},
        create: {
          name: childName,
          slug: commoditySlug,
          isActive: false,
          description: `${childName} products - pending review`,
          parentId: selectCodeId || rootId,
        },
      });

      this.categoryCache.set(cacheKey, commodity.id);

      if (!this.createdCategories.includes(childName)) {
        this.createdCategories.push(childName);
        console.log(`Created COMMODITY CODE category: ${childName} under ${parentName}`);
      }

      return commodity.id;
    } catch (error) {
      const existing = await prisma.category.findFirst({
        where: { slug: commoditySlug },
      });
      if (existing) {
        this.categoryCache.set(cacheKey, existing.id);
        return existing.id;
      }
      throw error;
    }
  }

  /**
   * Build product description from all available fields
   */
  private buildDescription(group: VariantGroup): string {
    const parts: string[] = [];

    // Short description
    if (group.description) {
      parts.push(`<p>${group.description}</p>`);
    }

    // Features
    if (group.features) {
      parts.push(`<h3>Features</h3>`);
      const features = group.features.split('|').filter(Boolean);
      if (features.length > 1) {
        parts.push(`<ul>${features.map(f => `<li>${f.trim()}</li>`).join('')}</ul>`);
      } else {
        parts.push(`<p>${group.features}</p>`);
      }
    }

    // Specifications
    if (group.specs) {
      parts.push(`<h3>Specifications</h3>`);
      const specs = group.specs.split('|').filter(Boolean);
      if (specs.length > 1) {
        parts.push(`<ul>${specs.map(s => `<li>${s.trim()}</li>`).join('')}</ul>`);
      } else {
        parts.push(`<p>${group.specs}</p>`);
      }
    }

    // Product Details Table
    const details: string[] = [];
    if (group.linerMaterial) {
      const cleanLiner = group.linerMaterial.replace(/--/g, ', ').replace(/^, |, $/g, '');
      if (cleanLiner) details.push(`<tr><td><strong>Liner Material:</strong></td><td>${cleanLiner}</td></tr>`);
    }
    if (group.coatingMaterial) {
      const cleanCoating = group.coatingMaterial.replace(/--/g, ', ').replace(/^, |, $/g, '');
      if (cleanCoating) details.push(`<tr><td><strong>Coating Material:</strong></td><td>${cleanCoating}</td></tr>`);
    }
    if (group.countryOfOrigin) {
      details.push(`<tr><td><strong>Country of Origin:</strong></td><td>${group.countryOfOrigin}</td></tr>`);
    }
    if (group.um) {
      details.push(`<tr><td><strong>Unit of Measure:</strong></td><td>${group.um}</td></tr>`);
    }
    if (group.caseQty) {
      details.push(`<tr><td><strong>Case Quantity:</strong></td><td>${group.caseQty}</td></tr>`);
    }
    if (group.lowestLength || group.lowestWidth || group.lowestHeight) {
      const dims = [group.lowestLength, group.lowestWidth, group.lowestHeight]
        .filter(Boolean)
        .map(d => d?.toFixed(2))
        .join(' x ');
      if (dims) details.push(`<tr><td><strong>Dimensions (LxWxH):</strong></td><td>${dims} cm</td></tr>`);
    }
    if (group.lowestWeight) {
      details.push(`<tr><td><strong>Weight:</strong></td><td>${group.lowestWeight.toFixed(2)} kg</td></tr>`);
    }

    if (details.length > 0) {
      parts.push(`<h3>Product Details</h3>`);
      parts.push(`<table class="product-details-table">${details.join('')}</table>`);
    }

    // Available Sizes/Colors
    if (group.rows.length > 1) {
      const colors = [...new Set(group.rows.map(r => r.color).filter(Boolean))];
      const sizes = [...new Set(group.rows.map(r => r.size).filter(Boolean))];

      if (colors.length > 0 || sizes.length > 0) {
        parts.push(`<h3>Available Options</h3>`);
        if (colors.length > 0) {
          parts.push(`<p><strong>Colors:</strong> ${colors.map(c => this.escapeHtml(c)).join(', ')}</p>`);
        }
        if (sizes.length > 0) {
          parts.push(`<p><strong>Sizes:</strong> ${sizes.map(s => this.escapeHtml(s)).join(', ')}</p>`);
        }
      }
    }

    // Applications
    if (group.applications) {
      parts.push(`<h3>Applications</h3>`);
      // Applications format: --App1--App2--App3--
      const apps = group.applications
        .split('--')
        .filter(Boolean)
        .map(a => a.trim())
        .filter(Boolean);
      if (apps.length > 0) {
        parts.push(`<ul>${apps.map(a => `<li>${this.escapeHtml(a)}</li>`).join('')}</ul>`);
      }
    }

    // Spec sheet link
    if (group.specsheetLink && /^https?:\/\//i.test(group.specsheetLink)) {
      parts.push(`<p><a href="${this.escapeHtml(group.specsheetLink)}" target="_blank" class="btn">View Specification Sheet</a></p>`);
    }

    return parts.join('\n') || `<p>${group.productName}</p>`;
  }

  /**
   * Generate SEO fields
   */
  private generateSEO(name: string, category: string, brand: string): {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  } {
    return {
      metaTitle: `${name} | ${brand}`.substring(0, 70),
      metaDescription: `Shop ${name} by ${brand}. Professional safety equipment. Quality ${category.toLowerCase()} products.`.substring(0, 160),
      metaKeywords: [name, brand, category, 'safety', 'PPE', 'industrial'].filter(Boolean).join(', '),
    };
  }

  /**
   * Import products from parsed data
   */
  async importProducts(
    rows: ParsedPipRow[],
    options: PipImportOptions = {}
  ): Promise<PipImportResult> {
    const {
      updateExisting = true,
      importImages = true,
      imageBasePath = path.join(process.cwd(), 'import-images'),
      csvPath,
      dryRun = false,
      defaultStockQuantity = 100,
      defaultStatus = 'ACTIVE',
      defaultSupplierId,
      defaultWarehouseId,
    } = options;

    this.errors = [];
    this.warnings = [];
    this.createdProducts = [];
    this.updatedProducts = [];
    this.createdVariants = 0;
    this.createdCategories = [];
    this.createdBrands = [];
    this.skippedNoImage = 0;
    this.categoryCache.clear();
    this.brandCache.clear();
    this.csvImageMap.clear();

    // Load CSV image mapping if provided
    const csvPaths = [
      csvPath,
    ].filter(Boolean) as string[];

    for (const csv of csvPaths) {
      if (existsSync(csv)) {
        console.log(`Loading image mappings from CSV: ${csv}`);
        await this.parseImageCsv(csv);
        break;
      }
    }

    // Group rows by STYLE
    const groups = this.groupByStyle(rows);
    console.log(`Found ${groups.length} product groups from ${rows.length} rows`);

    // Log first few products to see their structure
    console.log('Sample product data:');
    for (let i = 0; i < Math.min(5, groups.length); i++) {
      const g = groups[i];
      const r = g.rows[0];
      console.log(`  Product ${i + 1}: STYLE="${r.style}", SKU="${r.sku}", Price=$${r.websitePrice || 0}`);
    }

    // Build image index only if importImages is enabled
    if (importImages) {
      console.log('Building image index...');
      await this.buildImageIndex(imageBasePath);
    }

    let processedCount = 0;

    for (const group of groups) {
      try {
        await this.importProductGroup(group, {
          updateExisting,
          importImages,
          imageBasePath,
          dryRun,
          defaultStockQuantity,
          defaultStatus,
          defaultSupplierId,
          defaultWarehouseId,
        });

        processedCount += group.rows.length;

        // Log progress every 100 products
        if (this.createdProducts.length + this.updatedProducts.length > 0 &&
            (this.createdProducts.length + this.updatedProducts.length) % 100 === 0) {
          console.log(`Progress: ${this.createdProducts.length} created, ${this.updatedProducts.length} updated`);
        }
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
      createdCategories: this.createdCategories,
      createdBrands: this.createdBrands,
    };
  }

  /**
   * Import a product group (with or without variants)
   */
  private async importProductGroup(
    group: VariantGroup,
    options: PipImportOptions
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
    } = options;

    // Find or create brand
    const brandId = await this.findOrCreateBrand(group.brand);

    // Find or create category
    const categoryId = await this.findOrCreateCategory(
      group.selectCode,
      group.commodityCode
    );

    // Check if product exists
    let existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: group.style },
          { slug: group.style.toLowerCase().replace(/[^\w]+/g, '-') },
        ],
      },
    });

    // Build description
    const description = this.buildDescription(group);

    // Generate SEO
    const seo = this.generateSEO(
      group.productName,
      group.commodityCode || group.selectCode || 'Safety',
      group.brandWithMarks || group.brand || 'PIP'
    );

    const hasVariants = group.rows.length > 1;

    // Price mapping:
    // - websitePrice (Website 22%) -> basePrice (قیمت فروش سایت)
    // - costPrice (PRICE PER UM.1) -> costPrice (قیمت خرید - only internal)
    const basePrice = group.websitePrice ? new Decimal(group.websitePrice) : new Decimal(0.01);
    const costPrice = group.costPrice ? new Decimal(group.costPrice) : null;
    const minimumOrderQty = group.minSellQty || 1;

    // Determine status based on STOCK TYPE
    let productStatus = defaultStatus;
    if (group.stockType) {
      const stockTypeLower = group.stockType.toLowerCase();
      if (stockTypeLower.includes('discontinued') || stockTypeLower.includes('non-stock')) {
        productStatus = 'INACTIVE';
      } else if (stockTypeLower.includes('stock') || stockTypeLower.includes('active')) {
        productStatus = 'ACTIVE';
      }
    }

    const productData = {
      name: group.productName,
      slug: group.style.toLowerCase().replace(/[^\w]+/g, '-'),
      description,
      shortDescription: group.productName,
      basePrice,                                    // قیمت سایت (Website 22%)
      ...(costPrice && { costPrice }),              // قیمت خرید (PRICE PER UM.1) - internal only
      minimumOrderQty,                              // حداقل سفارش
      stockQuantity: hasVariants ? 0 : defaultStockQuantity,
      status: productStatus,
      hasVariants,
      // Physical dimensions
      ...(group.lowestLength && { length: new Decimal(group.lowestLength) }),
      ...(group.lowestWidth && { width: new Decimal(group.lowestWidth) }),
      ...(group.lowestHeight && { height: new Decimal(group.lowestHeight) }),
      ...(group.lowestWeight && { weight: new Decimal(group.lowestWeight) }),
      metaTitle: seo.metaTitle,
      metaDescription: seo.metaDescription,
      metaKeywords: seo.metaKeywords,
      ...(brandId && { brand: { connect: { id: brandId } } }),
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
      if (hasVariants) {
        this.createdVariants += group.rows.length;
      }
      return;
    }

    let savedProduct;
    const isUpdate = existingProduct && updateExisting;

    if (isUpdate) {
      savedProduct = await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
      this.updatedProducts.push(group.style);
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

    // Handle variants - upsert by SKU to preserve existing data
    let totalStock = hasVariants ? 0 : defaultStockQuantity;
    if (hasVariants) {
      for (const row of group.rows) {
        const variantName = [row.color, row.size].filter(Boolean).join(' / ') || 'Default';

        // Use variant-specific prices if available
        const variantBasePrice = row.websitePrice ? new Decimal(row.websitePrice) : basePrice;
        const variantCostPrice = row.costPrice ? new Decimal(row.costPrice) : null;

        // Upsert variant - update if exists by SKU, create if not
        await prisma.productVariant.upsert({
          where: { sku: row.sku },
          update: {
            name: variantName,
            basePrice: variantBasePrice,                           // قیمت سایت
            ...(variantCostPrice && { costPrice: variantCostPrice }), // قیمت خرید
            isActive: true,
          },
          create: {
            productId: savedProduct.id,
            sku: row.sku,
            name: variantName,
            basePrice: variantBasePrice,
            ...(variantCostPrice && { costPrice: variantCostPrice }),
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

    // Import images only for NEW products without images (skip for updates to preserve existing)
    if (importImages && savedProduct) {
      // Check if product already has images
      const existingImages = await prisma.productImage.count({
        where: { productId: savedProduct.id },
      });

      // Only process images for new products or products without images
      if (existingImages === 0) {
        const images = this.getGroupImageNames(group, imageBasePath);
        if (images.length > 0) {
          await this.processProductImages(
            savedProduct.id,
            group.style,
            images,
            imageBasePath,
            false
          );
        }
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
      } else {
        // Try without extension or with different extensions
        const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const baseName = imageName.replace(/\.[^/.]+$/, '');

        for (const ext of extensions) {
          const tryPath = path.join(imageBasePath, baseName + ext);
          if (existsSync(tryPath)) {
            try {
              const buffer = await fs.readFile(tryPath);
              images.push({ buffer, filename: baseName + ext });
              break;
            } catch (error) {
              console.error(`Error reading image ${tryPath}:`, error);
            }
          }
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
        brandSlug: 'pip',
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
export const pipImportService = new PipImportService();
