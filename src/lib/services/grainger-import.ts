import ExcelJS from 'exceljs';
import path from 'path';
import { existsSync, symlinkSync, mkdirSync } from 'fs';
import { prisma } from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Grainger Import Service
 *
 * Source Excel: ~162K rows, 45 columns. Streaming via exceljs to keep memory low.
 * Image source: /var/www/static-uploads/grainger-hq/${SKU}_HQ.jpg (~159K, 19GB)
 *
 * Strategy:
 * - All products created as PRERELEASE (manual release later)
 * - 3-level category hierarchy (Main > Sub > Sub Sub) created with isActive=false
 * - Brand auto-created from Mfg Name
 * - basePrice = Catalog Price; governmentPrice = costPrice = Gov Price
 * - Images linked directly to HQ JPG (no sharp processing). next/image handles
 *   runtime optimization. originalUrl/large/medium/thumb all point to the HQ file.
 * - Symlink public/uploads/grainger-hq -> /var/www/static-uploads/grainger-hq
 *   so /uploads/grainger-hq/<sku>_HQ.jpg is served via existing /api/uploads route.
 */

export const GRAINGER_HQ_PATH = '/var/www/static-uploads/grainger-hq';
export const GRAINGER_PUBLIC_PREFIX = '/uploads/grainger-hq';

export interface GraingerRow {
  sku: string;
  shortDescription: string;
  longDescription: string;
  govPrice: number;
  catalogPrice: number;
  uoi: string;
  itemsPerUoi: number;
  moq: number;
  mfgName: string;
  condensedMfgNumber: string;
  nonCondensedMfgNumber: string;
  leadTime: number | null;
  imageRefUrl: string;
  productUrl: string;
  shipPackWeight: number | null;
  msdsInd: string;
  msdsUrl: string;
  hazmatFlag: string;
  primaryImage: string;
  countryOfOrigin: string;
  countryOfOriginName: string;
  upc: string;
  mainCategory: string;
  subCategory: string;
  subSubCategory: string;
  unspsc4: string;
  unspscClassName: string;
  unspscCommodityName: string;
  unspscFamilyName: string;
  unspscSegmentName: string;
  taaApproved: boolean;
  prop65OrgLabel: string;
  prop65WhtLabel: string;
  prop65CancerChem: string;
  prop65ReproChem: string;
  prop65WarnMsg: string;
  rowNumber: number;
}

export interface GraingerImportProgress {
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedNoImage: number;
}

export interface GraingerImportOptions {
  imageBasePath?: string;
  publicImagePrefix?: string;
  defaultStatus?: 'DRAFT' | 'PRERELEASE' | 'ACTIVE';
  batchSize?: number;
  pauseMsBetweenBatches?: number;
  onProgress?: (progress: GraingerImportProgress) => Promise<void> | void;
  startRow?: number; // for resume
}

const HEADER_MAP: Record<string, keyof GraingerRow | 'skip'> = {
  'Grainger Skus': 'sku',
  'Short Description': 'shortDescription',
  'Long Description': 'longDescription',
  'Price (Gov Price & Cost Price': 'govPrice',
  'Catalog Price (Personal Buyer Price)': 'catalogPrice',
  'Unit of Issue': 'uoi',
  'Items Per UOI': 'itemsPerUoi',
  'Min Order Qty': 'moq',
  'Mfg Name': 'mfgName',
  'Condensed Mfg Number': 'condensedMfgNumber',
  'Non Condensed Mfg Number': 'nonCondensedMfgNumber',
  'Lead Time': 'leadTime',
  'Image Ref': 'imageRefUrl',
  'URL Link': 'productUrl',
  'ship_pack_weight': 'shipPackWeight',
  'msds_ind': 'msdsInd',
  'msds_url_link': 'msdsUrl',
  'hazmat_y_n_flag': 'hazmatFlag',
  'primary_image': 'primaryImage',
  'country_of_origin': 'countryOfOrigin',
  'country_of_origin_name': 'countryOfOriginName',
  'UPC Numbers': 'upc',
  'Main Category': 'mainCategory',
  'Sub Category': 'subCategory',
  'Sub Sub Category': 'subSubCategory',
  'UNSPSC4': 'unspsc4',
  'unspsc_class_name': 'unspscClassName',
  'unspsc_commodity_name': 'unspscCommodityName',
  'unspsc_family_name': 'unspscFamilyName',
  'unspsc_segment_name': 'unspscSegmentName',
  'TAA Compliant': 'taaApproved',
  'california_prop_65_org_label': 'prop65OrgLabel',
  'california_prop_65_wht_label': 'prop65WhtLabel',
  'CA_PROP65_CANCER_CAUSE_CHEM': 'prop65CancerChem',
  'CA_PROP65_REPRO_HARMCAUSE_CHEM': 'prop65ReproChem',
  'CA_PROP65_WARN_MSG_SCENARIO': 'prop65WarnMsg',
};

function parseNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  const s = String(v).replace(/[,$\s]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function rowToGrainger(values: Record<string, unknown>, rowNumber: number): GraingerRow | null {
  const sku = parseStr(values.sku);
  if (!sku) return null;

  const taaRaw = parseStr(values.taaApproved).toUpperCase();
  const taaApproved = taaRaw === 'Y' || taaRaw === 'YES' || taaRaw === 'TRUE';

  return {
    sku,
    shortDescription: parseStr(values.shortDescription),
    longDescription: parseStr(values.longDescription),
    govPrice: parseNum(values.govPrice),
    catalogPrice: parseNum(values.catalogPrice),
    uoi: parseStr(values.uoi) || 'EA',
    itemsPerUoi: Math.max(1, Math.floor(parseNum(values.itemsPerUoi)) || 1),
    moq: Math.max(1, Math.floor(parseNum(values.moq)) || 1),
    mfgName: parseStr(values.mfgName),
    condensedMfgNumber: parseStr(values.condensedMfgNumber),
    nonCondensedMfgNumber: parseStr(values.nonCondensedMfgNumber),
    leadTime: parseNum(values.leadTime) || null,
    imageRefUrl: parseStr(values.imageRefUrl),
    productUrl: parseStr(values.productUrl),
    shipPackWeight: parseNum(values.shipPackWeight) || null,
    msdsInd: parseStr(values.msdsInd),
    msdsUrl: parseStr(values.msdsUrl),
    hazmatFlag: parseStr(values.hazmatFlag),
    primaryImage: parseStr(values.primaryImage),
    countryOfOrigin: parseStr(values.countryOfOrigin),
    countryOfOriginName: parseStr(values.countryOfOriginName).replace(/\s+/g, ' ').trim(),
    upc: parseStr(values.upc),
    mainCategory: parseStr(values.mainCategory),
    subCategory: parseStr(values.subCategory),
    subSubCategory: parseStr(values.subSubCategory),
    unspsc4: parseStr(values.unspsc4),
    unspscClassName: parseStr(values.unspscClassName),
    unspscCommodityName: parseStr(values.unspscCommodityName),
    unspscFamilyName: parseStr(values.unspscFamilyName),
    unspscSegmentName: parseStr(values.unspscSegmentName),
    taaApproved,
    prop65OrgLabel: parseStr(values.prop65OrgLabel),
    prop65WhtLabel: parseStr(values.prop65WhtLabel),
    prop65CancerChem: parseStr(values.prop65CancerChem),
    prop65ReproChem: parseStr(values.prop65ReproChem),
    prop65WarnMsg: parseStr(values.prop65WarnMsg),
    rowNumber,
  };
}

export async function* streamGraingerRows(filePath: string): AsyncGenerator<GraingerRow> {
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    sharedStrings: 'cache',
    styles: 'ignore',
    hyperlinks: 'ignore',
    worksheets: 'emit',
    entries: 'emit',
  });

  for await (const worksheet of reader) {
    let headers: string[] = [];
    let rowIdx = 0;
    for await (const row of worksheet) {
      rowIdx++;
      const cellValues: unknown[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cellValues[colNumber - 1] = cell.value;
      });
      if (rowIdx === 1) {
        headers = cellValues.map((v) => parseStr(v));
        continue;
      }
      const mapped: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        const target = HEADER_MAP[h];
        if (target && target !== 'skip') {
          let v = cellValues[i];
          // Normalize hyperlink/formula objects from exceljs
          if (v && typeof v === 'object') {
            const obj = v as Record<string, unknown>;
            if ('text' in obj) v = obj.text;
            else if ('result' in obj) v = obj.result;
            else if ('hyperlink' in obj) v = obj.hyperlink;
          }
          mapped[target] = v;
        }
      });
      const parsed = rowToGrainger(mapped, rowIdx);
      if (parsed) yield parsed;
    }
    break; // only first worksheet
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 90);
}

export function ensureSymlink(): void {
  const linkPath = path.join(process.cwd(), 'public', 'uploads', 'grainger-hq');
  if (existsSync(linkPath)) return;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  try {
    symlinkSync(GRAINGER_HQ_PATH, linkPath, 'dir');
    console.log(`[grainger] symlinked ${linkPath} -> ${GRAINGER_HQ_PATH}`);
  } catch (e: any) {
    if (e.code !== 'EEXIST') {
      console.warn(`[grainger] symlink failed: ${e.message} (continuing — nginx may serve directly)`);
    }
  }
}

const brandCache = new Map<string, string>();
const categoryCache = new Map<string, string>();

async function getOrCreateBrand(name: string): Promise<string | null> {
  if (!name) return null;
  const key = name.toLowerCase();
  const cached = brandCache.get(key);
  if (cached) return cached;
  const slug = slugify(name);
  const found = await prisma.brand.findFirst({ where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] } });
  if (found) { brandCache.set(key, found.id); return found.id; }
  try {
    const created = await prisma.brand.create({
      data: { name, slug, isActive: false, description: `Imported from Grainger catalog` },
    });
    brandCache.set(key, created.id);
    return created.id;
  } catch {
    const retry = await prisma.brand.findFirst({ where: { OR: [{ slug }, { name }] } });
    if (retry) { brandCache.set(key, retry.id); return retry.id; }
    return null;
  }
}

async function getOrCreateCategory(name: string, parentId: string | null, level: number): Promise<string | null> {
  if (!name) return null;
  const key = `${parentId || 'root'}|${name.toLowerCase()}`;
  const cached = categoryCache.get(key);
  if (cached) return cached;

  const baseSlug = slugify(name);
  let slug = parentId ? `${baseSlug}-l${level}` : baseSlug;

  // Try find by slug first (within same parent if any)
  const existing = await prisma.category.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, parentId: parentId ?? null },
  });
  if (existing) { categoryCache.set(key, existing.id); return existing.id; }

  try {
    const created = await prisma.category.create({
      data: { name, slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`, parentId, isActive: false },
    });
    categoryCache.set(key, created.id);
    return created.id;
  } catch (e: any) {
    const retry = await prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, parentId: parentId ?? null } });
    if (retry) { categoryCache.set(key, retry.id); return retry.id; }
    return null;
  }
}

async function ensureCategoryHierarchy(row: GraingerRow): Promise<{ leafId: string | null; chain: string }> {
  const main = row.mainCategory;
  const sub = row.subCategory;
  const subSub = row.subSubCategory;
  const chain = [main, sub, subSub].filter(Boolean).join(' > ');
  if (!main) return { leafId: null, chain };
  const mainId = await getOrCreateCategory(main, null, 1);
  if (!sub) return { leafId: mainId, chain };
  const subId = await getOrCreateCategory(sub, mainId, 2);
  if (!subSub) return { leafId: subId, chain };
  const subSubId = await getOrCreateCategory(subSub, subId, 3);
  return { leafId: subSubId, chain };
}

function buildDescription(row: GraingerRow): string {
  const parts: string[] = [];
  if (row.longDescription) {
    parts.push(`<p>${row.longDescription.replace(/\n/g, '<br>')}</p>`);
  } else if (row.shortDescription) {
    parts.push(`<p>${row.shortDescription}</p>`);
  }
  const specs: string[] = [];
  if (row.mfgName) specs.push(`<li><strong>Manufacturer:</strong> ${row.mfgName}</li>`);
  if (row.nonCondensedMfgNumber) specs.push(`<li><strong>Mfg Part Number:</strong> ${row.nonCondensedMfgNumber}</li>`);
  if (row.upc) specs.push(`<li><strong>UPC:</strong> ${row.upc}</li>`);
  if (row.countryOfOriginName) specs.push(`<li><strong>Country of Origin:</strong> ${row.countryOfOriginName}</li>`);
  if (row.taaApproved) specs.push(`<li><strong>TAA Compliant:</strong> Yes</li>`);
  if (row.uoi) specs.push(`<li><strong>Unit of Issue:</strong> ${row.uoi}</li>`);
  if (row.itemsPerUoi > 1) specs.push(`<li><strong>Items per UOI:</strong> ${row.itemsPerUoi}</li>`);
  if (row.leadTime) specs.push(`<li><strong>Lead Time:</strong> ${row.leadTime} days</li>`);
  if (row.hazmatFlag === 'Y') specs.push(`<li><strong>Hazardous Material:</strong> Yes</li>`);
  if (row.unspsc4) specs.push(`<li><strong>UNSPSC:</strong> ${row.unspsc4}</li>`);
  if (specs.length) parts.push(`<ul class="specs-list">${specs.join('')}</ul>`);
  if (row.msdsUrl) parts.push(`<p><a href="${row.msdsUrl}" target="_blank" rel="noopener">SDS / MSDS Document</a></p>`);
  if (row.prop65WarnMsg) {
    parts.push(`<div class="prop65-warning"><strong>⚠️ California Prop 65 Warning:</strong> ${row.prop65WarnMsg}</div>`);
  }
  return parts.join('');
}

function buildSlug(row: GraingerRow): string {
  const namePart = slugify(row.shortDescription || row.sku);
  return `${namePart}-${row.sku.toLowerCase()}`.substring(0, 120);
}

function imageUrlsForSku(sku: string, basePath: string, publicPrefix: string): { exists: boolean; url: string } {
  const filename = `${sku}_HQ.jpg`;
  const fullPath = path.join(basePath, filename);
  return { exists: existsSync(fullPath), url: `${publicPrefix}/${filename}` };
}

async function upsertProduct(row: GraingerRow, opts: Required<Pick<GraingerImportOptions, 'imageBasePath' | 'publicImagePrefix' | 'defaultStatus'>>): Promise<'created' | 'updated' | 'skipped' | 'noimage'> {
  const brandId = await getOrCreateBrand(row.mfgName);
  const { leafId: categoryId, chain: categoryChain } = await ensureCategoryHierarchy(row);

  const { exists: imageExists, url: imageUrl } = imageUrlsForSku(row.sku, opts.imageBasePath, opts.publicImagePrefix);

  const basePrice = row.catalogPrice || row.govPrice || 0;
  if (basePrice <= 0) return 'skipped';

  const description = buildDescription(row);
  const shortDesc = (row.shortDescription || '').replace(/\s+/g, ' ').substring(0, 200);
  const slug = buildSlug(row);

  const metaKeywords = [
    row.mfgName,
    row.subSubCategory,
    row.subCategory,
    row.mainCategory,
    row.sku,
    'Grainger',
  ].filter(Boolean).join(', ').substring(0, 250);

  const data: any = {
    name: row.shortDescription || `${row.mfgName} ${row.condensedMfgNumber || row.sku}`.trim() || row.sku,
    slug,
    description,
    shortDescription: shortDesc,
    status: opts.defaultStatus,
    basePrice: new Decimal(basePrice),
    ...(row.govPrice > 0 && {
      governmentPrice: new Decimal(row.govPrice),
      gsaPrice: new Decimal(row.govPrice),
      costPrice: new Decimal(row.govPrice),
    }),
    priceUnit: (row.uoi || 'EA').toLowerCase().substring(0, 8),
    qtyPerPack: row.itemsPerUoi,
    minimumOrderQty: row.moq,
    stockQuantity: 100,
    hasVariants: false,
    taaApproved: row.taaApproved,
    ...(brandId && { brandId }),
    ...(categoryId && { categoryId }),
    ...(row.shipPackWeight && { weight: new Decimal(row.shipPackWeight) }),
    originalCategory: categoryChain || null,
    metaTitle: (row.shortDescription || row.sku).substring(0, 60),
    metaDescription: shortDesc.substring(0, 160),
    metaKeywords,
    complianceCertifications: {
      taaApproved: row.taaApproved,
      countryOfOrigin: row.countryOfOrigin || null,
      countryOfOriginName: row.countryOfOriginName || null,
      hazmat: row.hazmatFlag === 'Y',
      msdsRequired: row.msdsInd === 'Y',
      msdsUrl: row.msdsUrl || null,
      upc: row.upc || null,
      unspsc: row.unspsc4 || null,
      unspscClass: row.unspscClassName || null,
      unspscFamily: row.unspscFamilyName || null,
      unspscSegment: row.unspscSegmentName || null,
      prop65: {
        orgLabel: row.prop65OrgLabel === 'Y',
        whtLabel: row.prop65WhtLabel === 'Y',
        cancerCausing: row.prop65CancerChem || null,
        reproHarm: row.prop65ReproChem || null,
        warningMessage: row.prop65WarnMsg || null,
      },
      grainger: {
        sku: row.sku,
        productUrl: row.productUrl || null,
        imageRef: row.imageRefUrl || null,
        leadTimeDays: row.leadTime,
      },
    } as any,
    images: imageExists ? [imageUrl] : [],
    vendorPartNumber: `WWG-${row.sku}`,
  };

  // sku is unique, vendorPartNumber is unique - need to find by either
  const existing = await prisma.product.findFirst({
    where: {
      OR: [
        { sku: row.sku },
        ...(row.nonCondensedMfgNumber ? [{ vendorPartNumber: row.nonCondensedMfgNumber }] : []),
      ],
    },
    select: { id: true },
  });

  let productId: string;
  let action: 'created' | 'updated';
  if (existing) {
    await prisma.product.update({ where: { id: existing.id }, data });
    productId = existing.id;
    action = 'updated';
    if (imageExists) {
      await prisma.productImage.deleteMany({ where: { productId } });
    }
  } else {
    let finalSlug = slug;
    const slugExists = await prisma.product.findUnique({ where: { slug } });
    if (slugExists) finalSlug = `${slug}-${Date.now().toString(36)}`;
    try {
      const created = await prisma.product.create({ data: { sku: row.sku, ...data, slug: finalSlug } });
      productId = created.id;
      action = 'created';
    } catch (e: any) {
      // Possible duplicate on sku or vendorPartNumber. Try update path.
      const retry = await prisma.product.findUnique({ where: { sku: row.sku } });
      if (retry) {
        await prisma.product.update({ where: { id: retry.id }, data });
        productId = retry.id;
        action = 'updated';
        if (imageExists) await prisma.productImage.deleteMany({ where: { productId } });
      } else if (e?.code === 'P2002' && data.vendorPartNumber) {
        // vendorPartNumber collision with a different product — drop it and retry create
        const { vendorPartNumber: _drop, ...withoutVpn } = data;
        const created = await prisma.product.create({ data: { sku: row.sku, ...withoutVpn, slug: finalSlug } });
        productId = created.id;
        action = 'created';
      } else {
        throw e;
      }
    }
  }

  if (imageExists) {
    await prisma.productImage.create({
      data: {
        productId,
        originalUrl: imageUrl,
        largeUrl: imageUrl,
        mediumUrl: imageUrl,
        thumbUrl: imageUrl,
        originalName: `${row.sku}_HQ.jpg`,
        mimeType: 'image/jpeg',
        position: 0,
        isPrimary: true,
        storagePath: 'grainger-hq',
      },
    });
    return action;
  }
  return 'noimage';
}

export async function runGraingerImport(
  filePath: string,
  jobId: string | null,
  options: GraingerImportOptions = {},
): Promise<GraingerImportProgress> {
  const opts = {
    imageBasePath: options.imageBasePath ?? GRAINGER_HQ_PATH,
    publicImagePrefix: options.publicImagePrefix ?? GRAINGER_PUBLIC_PREFIX,
    defaultStatus: options.defaultStatus ?? 'PRERELEASE',
    batchSize: options.batchSize ?? 50,
    pauseMsBetweenBatches: options.pauseMsBetweenBatches ?? 200,
    startRow: options.startRow ?? 0,
  };

  ensureSymlink();

  const progress: GraingerImportProgress = {
    totalRows: 0,
    processedRows: 0,
    successCount: 0,
    errorCount: 0,
    skippedNoImage: 0,
  };

  let batchCounter = 0;

  for await (const row of streamGraingerRows(filePath)) {
    progress.totalRows++;
    if (progress.totalRows <= opts.startRow) continue;

    try {
      const result = await upsertProduct(row, opts);
      if (result === 'created' || result === 'updated') progress.successCount++;
      else if (result === 'noimage') { progress.successCount++; progress.skippedNoImage++; }
    } catch (e: any) {
      progress.errorCount++;
      if (progress.errorCount <= 50) {
        console.error(`[grainger] row ${row.rowNumber} sku=${row.sku}: ${e.message}`);
      }
    }
    progress.processedRows++;
    batchCounter++;

    if (batchCounter >= opts.batchSize) {
      batchCounter = 0;
      if (options.onProgress) await options.onProgress(progress);
      if (jobId) {
        await prisma.bulkImportJob.update({
          where: { id: jobId },
          data: {
            processedRows: progress.processedRows,
            successCount: progress.successCount,
            errorCount: progress.errorCount,
            totalRows: progress.totalRows,
          },
        }).catch(() => {});
      }
      if (opts.pauseMsBetweenBatches > 0) {
        await new Promise((r) => setTimeout(r, opts.pauseMsBetweenBatches));
      }
    }
  }

  if (options.onProgress) await options.onProgress(progress);
  return progress;
}
