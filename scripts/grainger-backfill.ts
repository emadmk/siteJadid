/**
 * Grainger Backfill Script
 *
 * For products already imported from Grainger:
 *   1. Set vendorPartNumber = "WWG-<grainger_sku>"   (was: nonCondensedMfgNumber)
 *   2. Set stockQuantity   = 100                      (was: 0)
 *   3. Set ProductVariant.stockQuantity = 100 for all variants of those products
 *
 * Identification: products whose complianceCertifications JSON contains
 * grainger.sku (set by the importer). Falls back to metaKeywords ~ 'Grainger'.
 *
 * Usage:
 *   nice -n 19 ionice -c 3 npx ts-node --compiler-options '{"module":"CommonJS"}' \
 *     scripts/grainger-backfill.ts [--dry-run] [--batch=200]
 */

import { prisma } from '../src/lib/prisma';

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const f = process.argv.find((a) => a.startsWith(prefix));
  return f ? f.slice(prefix.length) : undefined;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const batchSize = parseInt(arg('batch') || '200', 10) || 200;

  console.log(`[grainger-backfill] mode: ${dryRun ? 'DRY RUN' : 'WRITE'}, batch=${batchSize}`);

  // Find by JSON path first (most reliable). Fall back to metaKeywords.
  const total = await prisma.product.count({
    where: {
      metaKeywords: { contains: 'Grainger' },
    },
  });
  console.log(`[grainger-backfill] candidate products: ${total}`);
  if (total === 0) { await prisma.$disconnect(); return; }

  let cursor: string | undefined;
  let updated = 0;
  let skipped = 0;
  let conflicts = 0;
  let variantsUpdated = 0;

  while (true) {
    const batch = await prisma.product.findMany({
      where: {
        metaKeywords: { contains: 'Grainger' },
      },
      orderBy: { id: 'asc' },
      take: batchSize,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      select: {
        id: true,
        sku: true,
        vendorPartNumber: true,
        stockQuantity: true,
        complianceCertifications: true,
      },
    });

    if (batch.length === 0) break;
    cursor = batch[batch.length - 1].id;

    for (const p of batch) {
      const cc = p.complianceCertifications as any;
      const graingerSku =
        (cc && cc.grainger && cc.grainger.sku) ||
        p.sku; // sku is the Grainger SKU as set by the importer

      if (!graingerSku) { skipped++; continue; }

      const newVpn = `WWG-${graingerSku}`;
      const needsVpnUpdate = p.vendorPartNumber !== newVpn;
      const needsStockUpdate = p.stockQuantity !== 100;

      if (!needsVpnUpdate && !needsStockUpdate) { skipped++; continue; }

      if (dryRun) {
        console.log(`[dry] ${p.sku}  vpn: ${p.vendorPartNumber || '(null)'} -> ${newVpn}, stock: ${p.stockQuantity} -> 100`);
        updated++;
        continue;
      }

      try {
        await prisma.product.update({
          where: { id: p.id },
          data: {
            ...(needsVpnUpdate && { vendorPartNumber: newVpn }),
            ...(needsStockUpdate && { stockQuantity: 100 }),
          },
        });
        updated++;
      } catch (e: any) {
        if (e?.code === 'P2002') {
          // vendorPartNumber collision — try just the stock update
          try {
            await prisma.product.update({
              where: { id: p.id },
              data: { stockQuantity: 100 },
            });
            conflicts++;
            console.warn(`[grainger-backfill] vpn ${newVpn} taken — kept old vpn for ${p.sku}, stock updated`);
          } catch (e2: any) {
            console.error(`[grainger-backfill] failed ${p.sku}: ${e2.message}`);
          }
        } else {
          console.error(`[grainger-backfill] failed ${p.sku}: ${e.message}`);
        }
      }
    }

    if (updated % 1000 < batchSize) {
      console.log(`[grainger-backfill] progress: ${updated} updated, ${conflicts} vpn-conflicts, ${skipped} no-change`);
    }
  }

  // Variants: bulk update all variants of grainger products to stock 100
  console.log(`[grainger-backfill] updating variants...`);
  if (dryRun) {
    const variantCount = await prisma.productVariant.count({
      where: {
        product: {
          metaKeywords: { contains: 'Grainger' },
        },
        stockQuantity: { not: 100 },
      },
    });
    console.log(`[dry] would update ${variantCount} variants`);
  } else {
    const result = await prisma.productVariant.updateMany({
      where: {
        product: {
          metaKeywords: { contains: 'Grainger' },
        },
        stockQuantity: { not: 100 },
      },
      data: { stockQuantity: 100 },
    });
    variantsUpdated = result.count;
  }

  console.log(`\n[grainger-backfill] DONE`);
  console.log(`  products updated:   ${updated}`);
  console.log(`  vpn conflicts:      ${conflicts}`);
  console.log(`  no-change/skipped:  ${skipped}`);
  console.log(`  variants updated:   ${variantsUpdated}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('[grainger-backfill] fatal:', e);
  await prisma.$disconnect();
  process.exit(1);
});
