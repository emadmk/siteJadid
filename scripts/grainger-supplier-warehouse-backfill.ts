/**
 * Grainger Supplier + Warehouse Backfill
 *
 * Reads the Grainger SKU column from the original import spreadsheet and
 * sets defaultSupplierId / defaultWarehouseId on every matching DB product.
 * Nothing else is touched — status (PRERELEASE / ACTIVE / etc.), prices,
 * names, descriptions, images, stock, variants are all left exactly as is.
 *
 * Safety guarantees:
 *   • Excel is the source of truth — we don't guess based on metaKeywords.
 *   • Match key is product.sku (the Grainger SKU set at import time).
 *   • Only writes two nullable FK-style fields; both are likely NULL today.
 *   • Dry-run by default. --apply required to write.
 *   • Both --supplier-id and --warehouse-id are mandatory; the script
 *     verifies they exist in DB before writing anything.
 *   • Batch writes of 500 with a short pause to keep DB pool free for the
 *     live site.
 *   • Idempotent — running twice produces no extra changes on the second
 *     run because rows already correct are skipped.
 *
 * Usage:
 *   # Dry run (preview only, never writes)
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' \
 *     scripts/grainger-supplier-warehouse-backfill.ts \
 *     --file="Grainger_Sample.xlsx" \
 *     --supplier-id=<SUPPLIER_ID> \
 *     --warehouse-id=<WAREHOUSE_ID>
 *
 *   # Apply for real
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' \
 *     scripts/grainger-supplier-warehouse-backfill.ts \
 *     --file="Grainger_Sample.xlsx" \
 *     --supplier-id=<SUPPLIER_ID> \
 *     --warehouse-id=<WAREHOUSE_ID> \
 *     --apply
 */

import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { existsSync } from 'fs';

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const f = process.argv.find((a) => a.startsWith(prefix));
  return f ? f.slice(prefix.length) : undefined;
}

const APPLY = process.argv.includes('--apply');
const FILE = arg('file') || 'Grainger_Sample.xlsx';
const SUPPLIER_ID = arg('supplier-id') || '';
const WAREHOUSE_ID = arg('warehouse-id') || '';
const BATCH_SIZE = parseInt(arg('batch') || '500', 10) || 500;
const PAUSE_MS = parseInt(arg('pause') || '150', 10) || 150;

function cleanSku(s: any): string {
  if (s === null || s === undefined) return '';
  // Strip Unicode BOM and trim
  return String(s).replace(/^﻿/, '').replace(/﻿/g, '').trim();
}

async function readGraingerSkusFromExcel(filePath: string): Promise<string[]> {
  const skus: string[] = [];
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
    sharedStrings: 'cache',
    styles: 'ignore',
    hyperlinks: 'ignore',
    worksheets: 'emit',
    entries: 'emit',
  });

  for await (const worksheet of reader) {
    let rowIdx = 0;
    let skuColIndex = -1;
    for await (const row of worksheet) {
      rowIdx++;
      if (rowIdx === 1) {
        // Find Grainger SKU column by header name
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const h = String(cell.value ?? '').trim().toLowerCase();
          if (h === 'grainger skus' || h === 'grainger sku') {
            skuColIndex = colNumber;
          }
        });
        if (skuColIndex < 0) {
          // Fall back to column A
          skuColIndex = 1;
        }
        continue;
      }
      const cell = row.getCell(skuColIndex);
      const sku = cleanSku(cell.value);
      if (sku) skus.push(sku);
    }
    break; // only first worksheet
  }
  return skus;
}

async function main() {
  console.log(`${APPLY ? '[APPLY]' : '[DRY RUN]'} Grainger supplier+warehouse backfill`);
  console.log(`  file:         ${FILE}`);
  console.log(`  supplier-id:  ${SUPPLIER_ID || '(MISSING)'}`);
  console.log(`  warehouse-id: ${WAREHOUSE_ID || '(MISSING)'}`);

  if (!SUPPLIER_ID || !WAREHOUSE_ID) {
    console.error('\nBoth --supplier-id and --warehouse-id are required.');
    console.error('Look them up first with:');
    console.error('  SELECT id, name FROM "Supplier"  WHERE name ILIKE \'%grainger%\';');
    console.error('  SELECT id, name FROM "Warehouse" WHERE name ILIKE \'%grainger%\' OR "isPrimary"=true;');
    process.exit(1);
  }
  if (!existsSync(FILE)) {
    console.error(`\nExcel file not found: ${FILE}`);
    process.exit(1);
  }

  // Verify supplier & warehouse exist
  const [supplier, warehouse] = await Promise.all([
    prisma.supplier.findUnique({ where: { id: SUPPLIER_ID }, select: { id: true, name: true } }),
    prisma.warehouse.findUnique({ where: { id: WAREHOUSE_ID }, select: { id: true, name: true } }),
  ]);
  if (!supplier) {
    console.error(`\nSupplier ${SUPPLIER_ID} not found in DB. Aborting.`);
    process.exit(1);
  }
  if (!warehouse) {
    console.error(`\nWarehouse ${WAREHOUSE_ID} not found in DB. Aborting.`);
    process.exit(1);
  }
  console.log(`  supplier:     ${supplier.name}`);
  console.log(`  warehouse:    ${warehouse.name}\n`);

  // 1) Read SKUs from Excel
  console.log(`Reading Grainger SKUs from ${FILE}...`);
  const startRead = Date.now();
  const allExcelSkus = await readGraingerSkusFromExcel(FILE);
  const uniqueExcelSkus = Array.from(new Set(allExcelSkus));
  console.log(`  excel rows with SKU:     ${allExcelSkus.length}`);
  console.log(`  unique Grainger SKUs:    ${uniqueExcelSkus.length}`);
  console.log(`  read time:               ${((Date.now() - startRead) / 1000).toFixed(1)}s\n`);
  if (uniqueExcelSkus.length === 0) {
    console.error('No SKUs read from Excel. Aborting.');
    await prisma.$disconnect();
    return;
  }

  // 2) Match against DB (chunked findMany to handle 162K)
  console.log(`Matching against DB products...`);
  const startMatch = Date.now();
  const matched: Array<{
    id: string;
    sku: string;
    status: string;
    defaultSupplierId: string | null;
    defaultWarehouseId: string | null;
  }> = [];
  const FIND_CHUNK = 1000;
  for (let i = 0; i < uniqueExcelSkus.length; i += FIND_CHUNK) {
    const chunk = uniqueExcelSkus.slice(i, i + FIND_CHUNK);
    const rows = await prisma.product.findMany({
      where: { sku: { in: chunk } },
      select: { id: true, sku: true, status: true, defaultSupplierId: true, defaultWarehouseId: true },
    });
    matched.push(...rows);
    if ((i / FIND_CHUNK) % 10 === 0 && i > 0) {
      console.log(`  scanned ${i}/${uniqueExcelSkus.length} (matched so far: ${matched.length})`);
    }
  }
  console.log(`  matched DB products:     ${matched.length}`);
  console.log(`  unmatched Excel SKUs:    ${uniqueExcelSkus.length - matched.length}`);
  console.log(`  match time:              ${((Date.now() - startMatch) / 1000).toFixed(1)}s\n`);

  // 3) Categorize matched rows
  let alreadyCorrect = 0;
  let needsSupplier = 0;
  let needsWarehouse = 0;
  let needsBoth = 0;
  const byStatus: Record<string, number> = {};
  const toUpdate: typeof matched = [];
  for (const m of matched) {
    byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    const supplierOk = m.defaultSupplierId === SUPPLIER_ID;
    const warehouseOk = m.defaultWarehouseId === WAREHOUSE_ID;
    if (supplierOk && warehouseOk) { alreadyCorrect++; continue; }
    if (!supplierOk && !warehouseOk) needsBoth++;
    else if (!supplierOk) needsSupplier++;
    else needsWarehouse++;
    toUpdate.push(m);
  }

  console.log(`=== Plan ===`);
  console.log(`  products by status (matched):`);
  for (const [s, n] of Object.entries(byStatus)) {
    console.log(`    ${s.padEnd(14)} ${n}`);
  }
  console.log(`  already correct:         ${alreadyCorrect}`);
  console.log(`  needs supplier+warehouse: ${needsBoth}`);
  console.log(`  needs supplier only:     ${needsSupplier}`);
  console.log(`  needs warehouse only:    ${needsWarehouse}`);
  console.log(`  -----------------------`);
  console.log(`  TOTAL to update:         ${toUpdate.length}`);

  if (toUpdate.length > 0) {
    console.log(`\nSample (first 5):`);
    for (const s of toUpdate.slice(0, 5)) {
      console.log(`  sku=${s.sku} status=${s.status} supplier:${s.defaultSupplierId || '(null)'} → ${SUPPLIER_ID} | warehouse:${s.defaultWarehouseId || '(null)'} → ${WAREHOUSE_ID}`);
    }
  }

  if (!APPLY) {
    console.log(`\n[DRY RUN] No writes performed. Re-run with --apply to commit.`);
    await prisma.$disconnect();
    return;
  }

  if (toUpdate.length === 0) {
    console.log('\nNothing to update.');
    await prisma.$disconnect();
    return;
  }

  // 4) Apply in batches with pause between to keep DB pool free
  console.log(`\nApplying in batches of ${BATCH_SIZE} with ${PAUSE_MS}ms pause between batches...`);
  let applied = 0;
  let failed = 0;
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const batch = toUpdate.slice(i, i + BATCH_SIZE);
    const ids = batch.map((b) => b.id);
    try {
      await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: {
          defaultSupplierId: SUPPLIER_ID,
          defaultWarehouseId: WAREHOUSE_ID,
        },
      });
      applied += batch.length;
    } catch (e: any) {
      failed += batch.length;
      console.error(`  FAIL batch ${i}-${i + batch.length}: ${e.message}`);
    }
    if ((i + BATCH_SIZE) % (BATCH_SIZE * 5) === 0) {
      console.log(`  ${Math.min(i + BATCH_SIZE, toUpdate.length)}/${toUpdate.length} (${applied} ok, ${failed} fail)`);
    }
    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }

  console.log(`\n=== DONE ===`);
  console.log(`  applied: ${applied}`);
  console.log(`  failed:  ${failed}`);
  console.log(`\nNext step (recommended): re-index Elasticsearch so storefront facets reflect supplier:`);
  console.log(`  node scripts/es-index-products.js`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal:', e);
  await prisma.$disconnect();
  process.exit(1);
});
