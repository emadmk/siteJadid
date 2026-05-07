/**
 * Shipping Config Migration
 *
 * One-time, idempotent. Safe to re-run.
 *
 *   1. Pulls the legacy global Shippo markup from the Setting table
 *      (`shipping.markupFixedAmount`, `shipping.markupPercentage`).
 *   2. If no ShippingRule exists yet, creates a single "Default Shippo Rule"
 *      (empty scope = matches everything) carrying that markup forward so
 *      orders get the same shipping cost as before. Otherwise leaves the
 *      existing rules alone.
 *   3. Does NOT delete the legacy Setting keys — admin can still see them
 *      (and the engine ignores them).
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-shipping-config.ts            # dry run
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/migrate-shipping-config.ts --apply
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');

async function getSettingNum(key: string): Promise<number> {
  const s = await prisma.setting.findUnique({ where: { key } });
  if (!s) return 0;
  const n = parseFloat(s.value);
  return isNaN(n) ? 0 : n;
}

async function main() {
  console.log(APPLY ? '[APPLY] Running migration...' : '[DRY RUN] Running migration plan...');

  const existingRules = await prisma.shippingRule.count();
  console.log(`Existing ShippingRule rows: ${existingRules}`);

  if (existingRules > 0) {
    console.log('Rules already exist — skipping default-rule creation.');
    await prisma.$disconnect();
    return;
  }

  const markupFixed = await getSettingNum('shipping.markupFixedAmount');
  const markupPercent = await getSettingNum('shipping.markupPercentage');
  console.log(`Legacy markup: fixed=$${markupFixed}, percent=${markupPercent}%`);

  let shippoMarkupType: 'fixed' | 'percent' | null = null;
  let shippoMarkupValue: number | null = null;
  if (markupPercent > 0) { shippoMarkupType = 'percent'; shippoMarkupValue = markupPercent; }
  else if (markupFixed > 0) { shippoMarkupType = 'fixed'; shippoMarkupValue = markupFixed; }

  const data: any = {
    name: 'Default Shippo Rule',
    description: 'Auto-created from legacy shipping settings. Edit or replace as needed.',
    priority: 0,
    isActive: true,
    supplierIds: [],
    warehouseIds: [],
    mode: 'SHIPPO',
    flatAmount: null,
    percentValue: null,
    shippoMarkupType,
    shippoMarkupValue,
  };

  console.log('Plan: create default rule:');
  console.log(JSON.stringify(data, null, 2));

  if (!APPLY) {
    console.log('\n[DRY RUN] No changes written. Re-run with --apply.');
    await prisma.$disconnect();
    return;
  }

  const created = await prisma.shippingRule.create({ data });
  console.log(`Created rule id=${created.id}`);
  console.log('\nDone.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal:', e);
  await prisma.$disconnect();
  process.exit(1);
});
