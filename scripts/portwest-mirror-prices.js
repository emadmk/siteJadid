/**
 * PortWest Mirror Variant Prices → Product
 *
 * For every PortWest product, copy the lowest-priced active variant's
 * basePrice / costPrice / governmentPrice / gsaPrice onto the parent
 * Product. The product-level price is what the storefront card and the
 * admin product page display, so it must match the variants.
 *
 * Does NOT touch variants, names, descriptions, images, status, or any
 * other field. Idempotent.
 *
 * Usage:
 *   node scripts/portwest-mirror-prices.js              # dry run
 *   node scripts/portwest-mirror-prices.js --apply
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes('--apply');

function round2(n) {
  if (n === null || n === undefined) return null;
  return Math.round(Number(n) * 100) / 100;
}

function eq(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return round2(a) === round2(b);
}

async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Mirroring PortWest variant prices onto parent products...\n`);

  const products = await prisma.product.findMany({
    where: { brand: { slug: 'portwest' } },
    select: {
      id: true,
      sku: true,
      basePrice: true,
      costPrice: true,
      governmentPrice: true,
      gsaPrice: true,
    },
  });
  console.log(`PortWest products: ${products.length}`);

  let pending = 0;
  let alreadyCorrect = 0;
  let noVariants = 0;
  const ops = [];
  const samples = [];

  for (const p of products) {
    const variants = await prisma.productVariant.findMany({
      where: { productId: p.id, isActive: true },
      select: { basePrice: true, costPrice: true, governmentPrice: true, gsaPrice: true },
      orderBy: { basePrice: 'asc' },
    });
    if (variants.length === 0) { noVariants++; continue; }
    const lead = variants[0];

    const target = {
      basePrice: lead.basePrice ? round2(lead.basePrice) : null,
      costPrice: lead.costPrice ? round2(lead.costPrice) : null,
      governmentPrice: lead.governmentPrice ? round2(lead.governmentPrice) : (lead.gsaPrice ? round2(lead.gsaPrice) : null),
    };

    const data = {};
    if (target.basePrice !== null && !eq(p.basePrice, target.basePrice)) {
      data.basePrice = target.basePrice;
    }
    if (target.costPrice !== null && !eq(p.costPrice, target.costPrice)) {
      data.costPrice = target.costPrice;
    }
    if (target.governmentPrice !== null && (!eq(p.governmentPrice, target.governmentPrice) || !eq(p.gsaPrice, target.governmentPrice))) {
      data.governmentPrice = target.governmentPrice;
      data.gsaPrice = target.governmentPrice;
    }

    if (Object.keys(data).length === 0) {
      alreadyCorrect++;
      continue;
    }

    pending++;
    ops.push({ id: p.id, sku: p.sku, before: p, after: data });
    if (samples.length < 8) samples.push({ sku: p.sku, before: p, after: data });
  }

  console.log(`\n=== Plan ===`);
  console.log(`  changes pending:   ${pending}`);
  console.log(`  already correct:   ${alreadyCorrect}`);
  console.log(`  no variants:       ${noVariants}`);

  if (samples.length > 0) {
    console.log(`\nSample changes:`);
    for (const s of samples) {
      const parts = [];
      if (s.after.basePrice !== undefined) parts.push(`base ${s.before.basePrice ?? '-'} → ${s.after.basePrice}`);
      if (s.after.costPrice !== undefined) parts.push(`cost ${s.before.costPrice ?? '-'} → ${s.after.costPrice}`);
      if (s.after.governmentPrice !== undefined) parts.push(`gov ${s.before.governmentPrice ?? '-'} → ${s.after.governmentPrice}`);
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
  console.log(`\nRemember to reindex Elasticsearch:`);
  console.log(`  node scripts/es-index-products.js`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal:', e);
  await prisma.$disconnect();
  process.exit(1);
});
