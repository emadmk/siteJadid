/**
 * PortWest Direct Product Price Update
 *
 * Updates Product-level prices directly from the Excel file by matching
 * on Product Code (Col A). Catches the products that the variant-based
 * scripts missed (the ~113 with no active variants).
 *
 * For each Excel row, finds the parent Product via, in order:
 *   1. Product.vendorPartNumber == "PW-..."
 *   2. ProductVariant.sku == "PW-..." → that variant's productId
 *   3. Product.sku  == "PW-..." (rare fallback)
 *
 * Then sets on the Product:
 *   basePrice        = Level 1 (col AJ)
 *   costPrice        = Cost (col N)
 *   governmentPrice  = Level 3 (col AL)
 *   gsaPrice         = Level 3 (col AL)
 *   taaApproved      = aggregated (any approved row → true)
 *
 * Does not touch variants, names, descriptions, images, status, etc.
 *
 * Usage:
 *   node scripts/portwest-update-products-direct.js              # dry run
 *   node scripts/portwest-update-products-direct.js --apply
 *   node scripts/portwest-update-products-direct.js --file=path
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--apply');
const fileArg = process.argv.find((a) => a.startsWith('--file='));
const EXCEL_FILE = fileArg ? fileArg.slice('--file='.length) : 'GS Import - PortWest (Apr-26)-V2.xlsx';
const SHEET_NAME = 'GS Upload';

const COL = {
  PRODUCT_CODE: 1,   // A
  COST: 14,          // N
  LEVEL1: 36,        // AJ
  LEVEL3: 38,        // AL
  TAA: 58,           // BF
};

function cleanSku(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/^﻿/, '').replace(/﻿/g, '').trim();
}

function parseNum(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return isNaN(v) ? null : v;
  const cleaned = String(v).replace(/[$,\s]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseTaa(v) {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (!s) return null;
  if (s.includes('not')) return false;
  if (s.includes('approved') || s === 'yes' || s === 'y' || s === 'true') return true;
  if (s === 'no' || s === 'n' || s === 'false') return false;
  return null;
}

function round2(n) { return Math.round(Number(n) * 100) / 100; }

function eq(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return round2(a) === round2(b);
}

async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Reading ${EXCEL_FILE}...`);
  const wb = XLSX.readFile(EXCEL_FILE);
  if (!wb.SheetNames.includes(SHEET_NAME)) {
    console.error(`Sheet "${SHEET_NAME}" not found.`);
    process.exit(1);
  }
  const ws = wb.Sheets[SHEET_NAME];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });

  const headers = aoa[0];
  console.log(`Header A: ${headers[COL.PRODUCT_CODE - 1]}`);
  console.log(`Header N: ${headers[COL.COST - 1]}`);
  console.log(`Header AJ: ${headers[COL.LEVEL1 - 1]}`);
  console.log(`Header AL: ${headers[COL.LEVEL3 - 1]}`);
  console.log(`Header BF: ${headers[COL.TAA - 1]}\n`);

  const excelRows = [];
  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row) continue;
    const sku = cleanSku(row[COL.PRODUCT_CODE - 1]);
    if (!sku) continue;
    excelRows.push({
      sku,
      cost: parseNum(row[COL.COST - 1]),
      base: parseNum(row[COL.LEVEL1 - 1]),
      gov: parseNum(row[COL.LEVEL3 - 1]),
      taa: parseTaa(row[COL.TAA - 1]),
    });
  }
  console.log(`Excel rows: ${excelRows.length}`);

  // Resolve each Excel row to a productId
  // Build helper maps from DB once for speed
  const portwestProducts = await prisma.product.findMany({
    where: { brand: { slug: 'portwest' } },
    select: { id: true, sku: true, vendorPartNumber: true, basePrice: true, costPrice: true, governmentPrice: true, gsaPrice: true, taaApproved: true },
  });
  const portwestVariants = await prisma.productVariant.findMany({
    where: { product: { brand: { slug: 'portwest' } } },
    select: { sku: true, productId: true },
  });

  console.log(`PortWest products in DB: ${portwestProducts.length}`);
  console.log(`PortWest variants in DB: ${portwestVariants.length}\n`);

  const byVendorPN = new Map();
  const bySku = new Map();
  const productById = new Map();
  for (const p of portwestProducts) {
    productById.set(p.id, p);
    if (p.vendorPartNumber) byVendorPN.set(p.vendorPartNumber, p.id);
    if (p.sku) bySku.set(p.sku, p.id);
  }
  const variantSkuToProduct = new Map();
  for (const v of portwestVariants) variantSkuToProduct.set(v.sku, v.productId);

  // Aggregate per product
  // perProduct[productId] = { rows: [excelRow,...], priceFromCheapest: {base,cost,gov}, taaAny: bool, taaAll: 'approved'|'notapproved'|'mixed' }
  const perProduct = new Map();
  let unmatched = 0;
  const unmatchedSamples = [];

  for (const r of excelRows) {
    let productId = byVendorPN.get(r.sku) || variantSkuToProduct.get(r.sku) || bySku.get(r.sku);
    if (!productId) {
      unmatched++;
      if (unmatchedSamples.length < 10) unmatchedSamples.push(r.sku);
      continue;
    }
    if (!perProduct.has(productId)) {
      perProduct.set(productId, { rows: [], minBase: null, anyApproved: false, anyNotApproved: false });
    }
    const agg = perProduct.get(productId);
    agg.rows.push(r);
    if (r.base !== null && r.base > 0 && (agg.minBase === null || r.base < agg.minBase.base)) {
      agg.minBase = r;
    }
    if (r.taa === true) agg.anyApproved = true;
    if (r.taa === false) agg.anyNotApproved = true;
  }

  console.log(`Excel rows resolved to ${perProduct.size} unique products`);
  console.log(`Excel rows that could not be matched to any product: ${unmatched}`);
  if (unmatchedSamples.length > 0) {
    console.log(`  Sample unmatched: ${unmatchedSamples.slice(0, 5).join(', ')}`);
  }

  // Build update plan
  let pending = 0;
  let alreadyCorrect = 0;
  const ops = [];
  const samples = [];

  for (const [productId, agg] of perProduct.entries()) {
    const p = productById.get(productId);
    if (!p) continue;
    const lead = agg.minBase || agg.rows[0];

    const data = {};
    if (lead.base !== null && lead.base > 0 && !eq(p.basePrice, lead.base)) data.basePrice = round2(lead.base);
    if (lead.cost !== null && !eq(p.costPrice, lead.cost)) data.costPrice = round2(lead.cost);
    if (lead.gov !== null && lead.gov > 0) {
      if (!eq(p.governmentPrice, lead.gov)) data.governmentPrice = round2(lead.gov);
      if (!eq(p.gsaPrice, lead.gov)) data.gsaPrice = round2(lead.gov);
    }
    let targetTaa = null;
    if (agg.anyApproved) targetTaa = true;
    else if (agg.anyNotApproved) targetTaa = false;
    if (targetTaa !== null && p.taaApproved !== targetTaa) data.taaApproved = targetTaa;

    if (Object.keys(data).length === 0) {
      alreadyCorrect++;
      continue;
    }

    pending++;
    ops.push({ id: productId, sku: p.sku, before: p, after: data });
    if (samples.length < 8) samples.push({ sku: p.sku, before: p, after: data });
  }

  console.log(`\n=== Plan ===`);
  console.log(`  changes pending:   ${pending}`);
  console.log(`  already correct:   ${alreadyCorrect}`);

  if (samples.length > 0) {
    console.log(`\nSample changes:`);
    for (const s of samples) {
      const parts = [];
      if (s.after.basePrice !== undefined) parts.push(`base ${s.before.basePrice ?? '-'} → ${s.after.basePrice}`);
      if (s.after.costPrice !== undefined) parts.push(`cost ${s.before.costPrice ?? '-'} → ${s.after.costPrice}`);
      if (s.after.governmentPrice !== undefined) parts.push(`gov ${s.before.governmentPrice ?? '-'} → ${s.after.governmentPrice}`);
      if (s.after.taaApproved !== undefined) parts.push(`taa ${s.before.taaApproved} → ${s.after.taaApproved}`);
      console.log(`  ${s.sku}: ${parts.join(', ')}`);
    }
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] No changes written. Re-run with --apply.`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\nApplying...`);
  let applied = 0;
  let failed = 0;
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    try {
      await prisma.product.update({ where: { id: op.id }, data: op.after });
      applied++;
    } catch (e) {
      failed++;
      console.error(`  FAIL ${op.sku}: ${e.message}`);
    }
    if ((i + 1) % 100 === 0) {
      console.log(`  ${i + 1}/${ops.length} (${applied} ok, ${failed} fail)`);
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  console.log(`\n=== DONE ===`);
  console.log(`  applied: ${applied}, failed: ${failed}`);
  console.log(`\nReindex Elasticsearch:`);
  console.log(`  node scripts/es-index-products.js`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal:', e);
  await prisma.$disconnect();
  process.exit(1);
});
