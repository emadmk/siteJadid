import { db } from '@/lib/db';

/**
 * Shipping & Handling Engine
 *
 * Combines two independent concepts to produce the single number the
 * customer sees as "Shipping + Handling Fee":
 *
 *   1. Per-group shipping
 *      • Cart items are grouped by supplier (defaultSupplierId), falling
 *        back to warehouse (defaultWarehouseId).
 *      • Each group is matched against the highest-priority active
 *        ShippingRule whose scope includes that supplier or warehouse.
 *      • Groups without a scoped rule fall through to the "default" rule
 *        (one whose supplierIds AND warehouseIds are both empty).
 *      • Each rule's mode determines the group's shipping cost:
 *           FREE     → 0
 *           FIXED    → flatAmount
 *           PERCENT  → percentValue % of group subtotal
 *           SHIPPO   → carrier rate (passed in) + optional markup
 *
 *   2. Cart-level handling tier
 *      • Single tier match by cart subtotal: the first active tier whose
 *        [minSubtotal, maxSubtotal) range contains the subtotal wins.
 *      • Skipped if no tier matches, or if order is government/B2B and
 *        the "Skip handling for government/B2B" toggle is on.
 *
 * Shipping totals + handling are summed and shown on a single
 * "Shipping + Handling Fee" line. Internally each component is preserved
 * so admins can audit how the total was built.
 */

export type ShippingRuleMode = 'FREE' | 'FIXED' | 'PERCENT' | 'SHIPPO';

export interface CartLine {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;            // already discounted unit price
  supplierId?: string | null;
  warehouseId?: string | null;
}

export interface ShippoRateInput {
  cost: number;                 // raw carrier rate, before markup
  carrier?: string;
  service?: string;
}

export interface ShippingComputeOptions {
  isGovernmentOrder?: boolean;  // true for B2B / government buyer
  shippoRate?: ShippoRateInput; // selected Shippo rate (used for SHIPPO-mode groups)
  override?: {                  // for testing / preview
    rules?: any[];
    tiers?: any[];
    skipGovernmentHandling?: boolean;
  };
}

export interface GroupShippingResult {
  key: string;                  // "supplier:<id>" or "warehouse:<id>" or "default"
  supplierId: string | null;
  warehouseId: string | null;
  subtotal: number;
  ruleId: string | null;
  ruleName: string;
  mode: ShippingRuleMode;
  shippingAmount: number;       // post-markup
  itemCount: number;
}

export interface ShippingComputation {
  groups: GroupShippingResult[];
  shippingTotal: number;        // sum of all group shipping amounts
  handlingFee: number;          // single cart-level handling fee
  handlingTierId: string | null;
  handlingTierLabel: string | null;
  combinedTotal: number;        // shippingTotal + handlingFee — what the customer sees
  cartSubtotal: number;
  splitMessage: string;         // shown to customer when there are multiple groups
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const SPLIT_MESSAGE =
  'Your order may ship in multiple packages and arrive on different dates to ensure the fastest delivery.';

function num(v: any): number {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function isDefaultRule(rule: { supplierIds: string[]; warehouseIds: string[] }): boolean {
  return rule.supplierIds.length === 0 && rule.warehouseIds.length === 0;
}

function ruleMatchesGroup(
  rule: { supplierIds: string[]; warehouseIds: string[] },
  supplierId: string | null,
  warehouseId: string | null,
): boolean {
  if (isDefaultRule(rule)) return true;
  if (supplierId && rule.supplierIds.includes(supplierId)) return true;
  if (warehouseId && rule.warehouseIds.includes(warehouseId)) return true;
  return false;
}

function pickRule(
  rules: any[],
  supplierId: string | null,
  warehouseId: string | null,
): any | null {
  // Prefer scoped rules over the default. Within a tier, higher priority wins,
  // ties broken by createdAt descending (most recently added first).
  const scoped = rules.filter((r) => !isDefaultRule(r) && ruleMatchesGroup(r, supplierId, warehouseId));
  if (scoped.length > 0) {
    return scoped.sort(
      (a, b) =>
        b.priority - a.priority ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }
  const def = rules.find(isDefaultRule);
  return def || null;
}

function applyShippoMarkup(
  rate: number,
  markupType: string | null | undefined,
  markupValue: any,
): number {
  const v = num(markupValue);
  if (!v || !markupType) return rate;
  if (markupType === 'percent') return rate * (1 + v / 100);
  if (markupType === 'fixed') return rate + v;
  return rate;
}

function computeGroupShipping(
  rule: any | null,
  groupSubtotal: number,
  shippoRate: ShippoRateInput | undefined,
): { mode: ShippingRuleMode; amount: number; ruleId: string | null; ruleName: string } {
  if (!rule) {
    // No rule at all — fall back to raw shippo rate if provided, else 0.
    return {
      mode: 'SHIPPO',
      amount: shippoRate ? round2(shippoRate.cost) : 0,
      ruleId: null,
      ruleName: '(no rule)',
    };
  }

  const mode = rule.mode as ShippingRuleMode;
  let amount = 0;

  switch (mode) {
    case 'FREE':
      amount = 0;
      break;
    case 'FIXED':
      amount = num(rule.flatAmount);
      break;
    case 'PERCENT':
      amount = (groupSubtotal * num(rule.percentValue)) / 100;
      break;
    case 'SHIPPO':
      if (shippoRate) {
        amount = applyShippoMarkup(shippoRate.cost, rule.shippoMarkupType, rule.shippoMarkupValue);
      } else {
        // No carrier rate supplied — fall back to 0 (the cart preview path
        // hits this; the order creation path always supplies a rate).
        amount = 0;
      }
      break;
  }

  return { mode, amount: round2(amount), ruleId: rule.id, ruleName: rule.name };
}

function pickHandlingTier(tiers: any[], cartSubtotal: number): any | null {
  // Tiers ordered by minSubtotal ascending; return the first whose range
  // contains the subtotal.
  const sorted = [...tiers].sort((a, b) => num(a.minSubtotal) - num(b.minSubtotal));
  for (const t of sorted) {
    const min = num(t.minSubtotal);
    const max = t.maxSubtotal === null || t.maxSubtotal === undefined ? Infinity : num(t.maxSubtotal);
    if (cartSubtotal >= min && cartSubtotal < max) return t;
  }
  return null;
}

function computeHandling(tier: any | null, cartSubtotal: number): number {
  if (!tier) return 0;
  const v = num(tier.value);
  if (tier.type === 'percent') return round2((cartSubtotal * v) / 100);
  return round2(v);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let _settingCache: { val: boolean; ts: number } | null = null;
async function getSkipGovernmentHandling(): Promise<boolean> {
  // Cache for 60s — toggled rarely.
  if (_settingCache && Date.now() - _settingCache.ts < 60_000) return _settingCache.val;
  try {
    const s = await db.setting.findUnique({ where: { key: 'shipping.handlingSkipGovernment' } });
    const val = s?.value === 'true';
    _settingCache = { val, ts: Date.now() };
    return val;
  } catch {
    return false;
  }
}

export async function loadActiveRules(): Promise<any[]> {
  return db.shippingRule.findMany({
    where: { isActive: true },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function loadActiveTiers(): Promise<any[]> {
  return db.handlingTier.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { minSubtotal: 'asc' }],
  });
}

/**
 * Compute shipping + handling for a cart. Pure function once data is loaded —
 * does not write anything.
 */
export async function computeShippingAndHandling(
  lines: CartLine[],
  options: ShippingComputeOptions = {},
): Promise<ShippingComputation> {
  const rules = options.override?.rules ?? (await loadActiveRules());
  const tiers = options.override?.tiers ?? (await loadActiveTiers());
  const skipGovernment =
    options.override?.skipGovernmentHandling ?? (await getSkipGovernmentHandling());

  // Group by supplier first, then by warehouse for items without a supplier
  const groupMap = new Map<string, GroupShippingResult>();
  let cartSubtotal = 0;

  for (const line of lines) {
    const lineTotal = num(line.unitPrice) * num(line.quantity);
    cartSubtotal += lineTotal;

    const supplierId = line.supplierId || null;
    const warehouseId = line.warehouseId || null;

    let key: string;
    if (supplierId) key = `supplier:${supplierId}`;
    else if (warehouseId) key = `warehouse:${warehouseId}`;
    else key = 'default';

    const existing = groupMap.get(key);
    if (existing) {
      existing.subtotal += lineTotal;
      existing.itemCount += line.quantity;
      continue;
    }

    groupMap.set(key, {
      key,
      supplierId,
      warehouseId,
      subtotal: lineTotal,
      ruleId: null,
      ruleName: '',
      mode: 'SHIPPO',
      shippingAmount: 0,
      itemCount: line.quantity,
    });
  }

  cartSubtotal = round2(cartSubtotal);

  // Compute each group's shipping
  const groups: GroupShippingResult[] = [];
  let shippingTotal = 0;
  for (const g of groupMap.values()) {
    const rule = pickRule(rules, g.supplierId, g.warehouseId);
    const result = computeGroupShipping(rule, round2(g.subtotal), options.shippoRate);
    g.subtotal = round2(g.subtotal);
    g.ruleId = result.ruleId;
    g.ruleName = result.ruleName;
    g.mode = result.mode;
    g.shippingAmount = result.amount;
    groups.push(g);
  }

  // Dedupe SHIPPO charges across groups: the customer-selected Shippo rate
  // covers the whole shipment (carriers don't bill per supplier), so only the
  // first SHIPPO group "spends" the rate. Other SHIPPO groups ride along at
  // 0. FREE / FIXED / PERCENT groups stay independent because each represents
  // a deliberate per-supplier policy.
  let shippoUsed = false;
  for (const g of groups) {
    if (g.mode !== 'SHIPPO') continue;
    if (shippoUsed) {
      g.shippingAmount = 0;
    } else {
      shippoUsed = true;
    }
  }

  shippingTotal = round2(groups.reduce((s, g) => s + g.shippingAmount, 0));

  // Handling fee
  const skipHandling = options.isGovernmentOrder && skipGovernment;
  const tier = skipHandling ? null : pickHandlingTier(tiers, cartSubtotal);
  const handlingFee = tier ? computeHandling(tier, cartSubtotal) : 0;
  const tierLabel = tier
    ? `${tier.type === 'percent' ? `${num(tier.value)}%` : `$${num(tier.value)}`} on ${num(
        tier.minSubtotal,
      )}–${tier.maxSubtotal === null || tier.maxSubtotal === undefined ? '∞' : num(tier.maxSubtotal)}`
    : null;

  return {
    groups,
    shippingTotal,
    handlingFee,
    handlingTierId: tier?.id || null,
    handlingTierLabel: tierLabel,
    combinedTotal: round2(shippingTotal + handlingFee),
    cartSubtotal,
    splitMessage: groups.length > 1 ? SPLIT_MESSAGE : '',
  };
}

/**
 * Convenience helper: takes a cart record (with included items + product data)
 * and turns it into the CartLine[] shape the engine expects.
 */
export function cartToLines(cart: {
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
    price: any;
    product?: {
      defaultSupplierId?: string | null;
      defaultWarehouseId?: string | null;
    };
  }>;
}): CartLine[] {
  return cart.items.map((it) => ({
    productId: it.productId,
    variantId: it.variantId || null,
    quantity: num(it.quantity),
    unitPrice: num(it.price),
    supplierId: it.product?.defaultSupplierId || null,
    warehouseId: it.product?.defaultWarehouseId || null,
  }));
}
