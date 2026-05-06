/**
 * PortWest Price + TAA Update Script
 *
 * For products already in DB (PortWest brand): updates ONLY the four fields
 * below from the new spreadsheet. Does NOT touch images, names, descriptions,
 * categories, slugs, statuses, or anything else.
 *
 *   Excel Col N  (Product Cost in Purchase UOM) → costPrice
 *   Excel Col AJ (Level 1 Price)                → basePrice          (Personal Buyer)
 *   Excel Col AL (Level 3 Price)                → governmentPrice + gsaPrice
 *   Excel Col BF (TAA Approved)                 → taaApproved
 *
 * Each Excel row maps to one ProductVariant (matched by Product Code → variant.sku,
 * with leading BOM stripped). taaApproved lives on the parent Product, so we
 * aggregate per product: if ANY variant of a product is TAA Approved in the
 * sheet, the product is set to taaApproved=true; only set to false if ALL its
 * variants are explicitly non-approved.
 *
 * Usage:
 *   node scripts/portwest-update-prices.js                      # dry run (default)
 *   node scripts/portwest-update-prices.js --apply              # write changes
 *   node scripts/portwest-update-prices.js --apply --file=path  # custom file
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const DRY_RUN = !process.argv.includes('--apply');

const fileArg = process.argv.find((a) => a.startsWith('--file='));
const EXCEL_FILE = fileArg ? fileArg.slice('--file='.length) : 'GS Import - PortWest (Apr-26)-V2.xlsx';

const SHEET_NAME = 'GS Upload';

// 1-indexed Excel columns we care about
const COL = {
  PRODUCT_CODE: 1,   // A
  COST: 14,          // N
  LEVEL1: 36,        // AJ - Personal Buyer Price
  LEVEL3: 38,        // AL - Government Buyer Price
  TAA: 58,           // BF
};

function cleanSku(s) {
  if (s === null || s === undefined) return '';
  // Strip BOM and trim
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
  // Returns true / false / null (unknown)
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim().toLowerCase();
  if (!s) return null;
  if (s.includes('not')) return false;
  if (s.includes('approved') || s === 'yes' || s === 'y' || s === 'true') return true;
  if (s === 'no' || s === 'n' || s === 'false') return false;
  return null;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Reading ${EXCEL_FILE}...`);

  const wb = XLSX.readFile(EXCEL_FILE);
  if (!wb.SheetNames.includes(SHEET_NAME)) {
    console.error(`Sheet "${SHEET_NAME}" not found. Available: ${wb.SheetNames.join(', ')}`);
    process.exit(1);
  }

  // Read sheet as array-of-arrays so we can use 1-based column indices regardless
  // of header naming variations across Excel files.
  const ws = wb.Sheets[SHEET_NAME];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });

  if (aoa.length < 2) {
    console.error('Sheet has no data rows');
    process.exit(1);
  }

  // Sanity-check headers
  const headers = aoa[0];
  console.log(`Headers (key columns):`);
  console.log(`  A:  ${headers[COL.PRODUCT_CODE - 1]}`);
  console.log(`  N:  ${headers[COL.COST - 1]}`);
  console.log(`  AJ: ${headers[COL.LEVEL1 - 1]}`);
  console.log(`  AL: ${headers[COL.LEVEL3 - 1]}`);
  console.log(`  BF: ${headers[COL.TAA - 1]}`);
  console.log(`Data rows: ${aoa.length - 1}\n`);

  // Parse rows → priceMap[variantSku] = { cost, base, gov, taa }
  const priceMap = new Map();
  let parsed = 0;
  let skippedNoSku = 0;

  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row) continue;
    const sku = cleanSku(row[COL.PRODUCT_CODE - 1]);
    if (!sku) { skippedNoSku++; continue; }
    priceMap.set(sku, {
      cost: parseNum(row[COL.COST - 1]),
      base: parseNum(row[COL.LEVEL1 - 1]),
      gov: parseNum(row[COL.LEVEL3 - 1]),
      taa: parseTaa(row[COL.TAA - 1]),
    });
    parsed++;
  }

  console.log(`Parsed ${parsed} variant rows from Excel (${skippedNoSku} skipped without sku)\n`);

  // Find existing PortWest variants in DB
  const variants = await prisma.productVariant.findMany({
    where: {
      product: { brand: { slug: 'portwest' } },
    },
    select: {
      id: true,
      sku: true,
      productId: true,
      basePrice: true,
      costPrice: true,
      governmentPrice: true,
      gsaPrice: true,
      product: { select: { id: true, sku: true, taaApproved: true } },
    },
  });

  console.log(`PortWest variants in DB: ${variants.length}`);

  // Aggregate per product: any-taa-approved tracker
  // taaAgg[productId] = { hasApproved: bool, hasNonApproved: bool, current: bool }
  const taaAgg = new Map();
  let priceUpdates = 0;
  let priceAlreadyCorrect = 0;
  let variantNotInExcel = 0;
  const variantOps = []; // { variantSku, currentPrices, newPrices, change: bool }

  for (const v of variants) {
    const newPrices = priceMap.get(v.sku);
    if (!newPrices) { variantNotInExcel++; continue; }

    // Track TAA at product level
    if (!taaAgg.has(v.productId)) {
      taaAgg.set(v.productId, {
        hasApproved: false,
        hasNonApproved: false,
        productSku: v.product.sku,
        current: v.product.taaApproved,
      });
    }
    const agg = taaAgg.get(v.productId);
    if (newPrices.taa === true) agg.hasApproved = true;
    if (newPrices.taa === false) agg.hasNonApproved = true;

    // Compute price diff
    const cur = {
      cost: v.costPrice ? Number(v.costPrice) : null,
      base: v.basePrice ? Number(v.basePrice) : null,
      gov: v.governmentPrice ? Number(v.governmentPrice) : (v.gsaPrice ? Number(v.gsaPrice) : null),
    };

    const data = {};
    if (newPrices.cost !== null && (cur.cost === null || round2(cur.cost) !== round2(newPrices.cost))) {
      data.costPrice = round2(newPrices.cost);
    }
    if (newPrices.base !== null && newPrices.base > 0 && (cur.base === null || round2(cur.base) !== round2(newPrices.base))) {
      data.basePrice = round2(newPrices.base);
    }
    if (newPrices.gov !== null && newPrices.gov > 0 && (cur.gov === null || round2(cur.gov) !== round2(newPrices.gov))) {
      data.governmentPrice = round2(newPrices.gov);
      data.gsaPrice = round2(newPrices.gov);
    }

    if (Object.keys(data).length === 0) {
      priceAlreadyCorrect++;
      continue;
    }

    variantOps.push({ variantId: v.id, sku: v.sku, before: cur, data });
  }

  console.log(`\n=== Variant price update plan ===`);
  console.log(`  changes pending:   ${variantOps.length}`);
  console.log(`  already correct:   ${priceAlreadyCorrect}`);
  console.log(`  not in Excel:      ${variantNotInExcel}`);

  // Show first few sample diffs
  if (variantOps.length > 0) {
    console.log(`\nSample changes (first 5):`);
    for (const op of variantOps.slice(0, 5)) {
      const parts = [];
      if (op.data.basePrice !== undefined) parts.push(`base ${op.before.base ?? '-'} → ${op.data.basePrice}`);
      if (op.data.costPrice !== undefined) parts.push(`cost ${op.before.cost ?? '-'} → ${op.data.costPrice}`);
      if (op.data.governmentPrice !== undefined) parts.push(`gov ${op.before.gov ?? '-'} → ${op.data.governmentPrice}`);
      console.log(`  ${op.sku}: ${parts.join(', ')}`);
    }
  }

  // Compute TAA changes
  const taaOps = [];
  for (const [productId, agg] of taaAgg.entries()) {
    let target;
    if (agg.hasApproved) target = true;
    else if (agg.hasNonApproved) target = false;
    else continue; // unknown for all variants → leave untouched
    if (agg.current === target) continue;
    taaOps.push({ productId, sku: agg.productSku, from: agg.current, to: target });
  }

  console.log(`\n=== TAA update plan ===`);
  console.log(`  product taa changes pending: ${taaOps.length}`);
  if (taaOps.length > 0) {
    console.log(`  Sample (first 5):`);
    for (const op of taaOps.slice(0, 5)) {
      console.log(`  product ${op.sku}: taaApproved ${op.from} → ${op.to}`);
    }
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] No changes written. Re-run with --apply to commit.`);
    await prisma.$disconnect();
    return;
  }

  // Apply variant price updates
  console.log(`\nApplying variant price updates...`);
  let applied = 0;
  let failed = 0;
  const batchSize = 50;
  for (let i = 0; i < variantOps.length; i++) {
    const op = variantOps[i];
    try {
      await prisma.productVariant.update({ where: { id: op.variantId }, data: op.data });
      applied++;
    } catch (e) {
      failed++;
      console.error(`  FAIL ${op.sku}: ${e.message}`);
    }
    if ((i + 1) % batchSize === 0) {
      console.log(`  ${i + 1}/${variantOps.length} (${applied} ok, ${failed} fail)`);
      // brief pause to keep DB pool free for live traffic
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  console.log(`Variant price updates: ${applied} applied, ${failed} failed`);

  // Apply TAA updates
  console.log(`\nApplying TAA updates...`);
  let taaApplied = 0;
  let taaFailed = 0;
  for (const op of taaOps) {
    try {
      await prisma.product.update({ where: { id: op.productId }, data: { taaApproved: op.to } });
      taaApplied++;
    } catch (e) {
      taaFailed++;
      console.error(`  FAIL product ${op.sku}: ${e.message}`);
    }
  }
  console.log(`TAA updates: ${taaApplied} applied, ${taaFailed} failed`);

  // Mirror first-variant prices onto Product.basePrice/costPrice/governmentPrice/gsaPrice
  // so the storefront product card (which reads from product, not first variant) shows the
  // updated price too.
  console.log(`\nMirroring updated prices onto parent products...`);
  let mirrored = 0;
  const productIds = Array.from(new Set(variantOps.map((op) => {
    const v = variants.find((x) => x.id === op.variantId);
    return v ? v.productId : null;
  }).filter(Boolean)));

  for (const pid of productIds) {
    // Pick the cheapest non-null basePrice variant (or first) to mirror.
    const productVariants = await prisma.productVariant.findMany({
      where: { productId: pid, isActive: true },
      select: { basePrice: true, costPrice: true, governmentPrice: true, gsaPrice: true },
      orderBy: { basePrice: 'asc' },
    });
    if (productVariants.length === 0) continue;
    const lead = productVariants[0];
    const data = {};
    if (lead.basePrice) data.basePrice = lead.basePrice;
    if (lead.costPrice) data.costPrice = lead.costPrice;
    if (lead.governmentPrice) {
      data.governmentPrice = lead.governmentPrice;
      data.gsaPrice = lead.governmentPrice;
    }
    if (Object.keys(data).length > 0) {
      try {
        await prisma.product.update({ where: { id: pid }, data });
        mirrored++;
      } catch (e) {
        console.error(`  FAIL mirror product ${pid}: ${e.message}`);
      }
    }
  }
  console.log(`Mirrored prices onto ${mirrored} products`);

  console.log(`\n=== DONE ===`);
  console.log(`  variants updated:  ${applied}`);
  console.log(`  taa updated:       ${taaApplied}`);
  console.log(`  products mirrored: ${mirrored}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal:', e);
  await prisma.$disconnect();
  process.exit(1);
});
