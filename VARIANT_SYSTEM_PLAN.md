# Product Variant System - Complete Implementation Plan

## Quick Start for New Chat
```
Read /home/user/siteJadid/VARIANT_SYSTEM_PLAN.md and start from Phase 1
Branch: claude/fix-import-01AXdT1dcQ6KANxxg3BWXy3F
Server: /root/ada/siteJadid (PM2)
```

---

## Project Goal
Implementing a professional, dynamic variant system similar to Grainger/Amazon:
- Products like shoes have SIZE variants
- Hi-Vis vests have SIZE + COLOR variants
- Electric motors have HP + VOLTAGE + PHASE variants
- Each variant can have DIFFERENT PRICES (base, B2B, GSA, cost)
- Smart bulk import that auto-groups SKUs into products with variants

---

## EXACT Current Schema (Copy from database)

### Category (line 318)
```prisma
model Category {
  id               String    @id @default(cuid())
  name             String
  slug             String    @unique
  description      String?
  image            String?
  parentId         String?
  displayOrder     Int       @default(0)
  isActive         Boolean   @default(true)
  metaTitle        String?
  metaDescription  String?
  metaKeywords     String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  categoryDiscounts CategoryDiscount[]

  @@index([slug])
  @@index([parentId])
}
```
**MISSING: variantAttributeIds, priceRules**

### Product (line 364)
```prisma
model Product {
  id                  String        @id @default(cuid())
  sku                 String        @unique
  name                String
  slug                String        @unique
  description         String?
  shortDescription    String?
  status              ProductStatus @default(DRAFT)

  basePrice           Decimal       @db.Decimal(12, 2)
  salePrice           Decimal?      @db.Decimal(12, 2)
  costPrice           Decimal?      @db.Decimal(12, 2)
  wholesalePrice      Decimal?      @db.Decimal(12, 2)
  minimumOrderQty     Int           @default(1)
  gsaPrice            Decimal?      @db.Decimal(12, 2)
  gsaSin              String?
  tierPricing         Json?

  stockQuantity       Int           @default(0)
  lowStockThreshold   Int           @default(10)
  trackInventory      Boolean       @default(true)

  metaTitle           String?
  metaDescription     String?
  metaKeywords        String?
  images              String[]
  videos              String[]
  weight              Decimal?      @db.Decimal(8, 2)
  length              Decimal?      @db.Decimal(8, 2)
  width               Decimal?      @db.Decimal(8, 2)
  height              Decimal?      @db.Decimal(8, 2)
  complianceCertifications Json?
  isFeatured          Boolean       @default(false)
  isNewArrival        Boolean       @default(false)
  isBestSeller        Boolean       @default(false)
  allowReviews        Boolean       @default(true)
  rating              Decimal?      @db.Decimal(3, 2)
  reviewCount         Int           @default(0)
  publishedAt         DateTime?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  categoryId          String?
  category            Category?     @relation(fields: [categoryId], references: [id])
  brandId             String?
  brand               Brand?        @relation(fields: [brandId], references: [id])
  defaultSupplierId   String?
  defaultSupplier     Supplier?     @relation("DefaultSupplier", fields: [defaultSupplierId], references: [id])
  defaultWarehouseId  String?
  defaultWarehouse    Warehouse?    @relation("DefaultWarehouse", fields: [defaultWarehouseId], references: [id])

  variants            ProductVariant[]
  reviews             Review[]
  cartItems           CartItem[]
  wishlistItems       WishlistItem[]
  orderItems          OrderItem[]
  inventory           InventoryLog[]
  discounts           ProductDiscount[]
  suppliers           ProductSupplier[]
  tieredPrices        TieredPrice[]
  warehouseStock      WarehouseStock[]
  // ... more relations
}
```

### ProductVariant (line 474) - NEEDS UPGRADE
```prisma
model ProductVariant {
  id          String   @id @default(cuid())
  productId   String
  sku         String   @unique
  name        String
  attributes  String   // JSON: {color: "red", size: "L"} -- NOT RELATIONAL!
  price       Decimal  @db.Decimal(12, 2) // ONLY ONE PRICE!
  stockQuantity Int    @default(0)
  images      String[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([sku])
}
```
**MISSING: wholesalePrice, gsaPrice, costPrice, salePrice, attributeValues relation, cart/order relations**

### CartItem (line 667)
```prisma
model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Int      @default(1)
  price     Decimal  @db.Decimal(12, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([cartId])
  @@index([productId])
}
```
**MISSING: variantId, variant relation**

### OrderItem (line 824)
```prisma
model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String
  sku         String
  name        String
  quantity    Int
  price       Decimal @db.Decimal(12, 2)
  discount    Decimal @default(0) @db.Decimal(12, 2)
  tax         Decimal @default(0) @db.Decimal(12, 2)
  total       Decimal @db.Decimal(12, 2)
  supplierId    String?
  warehouseId   String?
  stockSource   StockSource  @default(OUR_WAREHOUSE)

  order         Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product       Product        @relation(fields: [productId], references: [id])
  supplier      Supplier?      @relation("OrderItemSupplier", fields: [supplierId], references: [id])
  warehouse     Warehouse?     @relation("OrderItemWarehouse", fields: [warehouseId], references: [id])
  shipmentItems ShipmentItem[]

  @@index([orderId])
  @@index([productId])
}
```
**MISSING: variantId, variantSku, variantName**

### WarehouseStock (line 1517)
```prisma
model WarehouseStock {
  id              String   @id @default(cuid())
  warehouseId     String
  productId       String
  quantity        Int      @default(0)
  reserved        Int      @default(0)
  available       Int      @default(0)
  reorderPoint    Int      @default(10)
  reorderQuantity Int      @default(50)
  aisle           String?
  rack            String?
  shelf           String?
  bin             String?
  lastRestocked   DateTime?
  lastCounted     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  warehouse       Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([warehouseId, productId])
}
```
**MISSING: variantId for variant-level inventory**

### ProductAttribute (line 1882)
```prisma
model ProductAttribute {
  id           String        @id @default(cuid())
  name         String
  code         String        @unique
  type         AttributeType // TEXT, NUMBER, SELECT, MULTISELECT, BOOLEAN, DATE, COLOR
  options      String[]
  displayOrder Int          @default(0)
  isFilterable Boolean      @default(true)
  isRequired   Boolean      @default(false)
  isVariant    Boolean      @default(false) // EXISTS but not connected to variants!
  unit         String?
  minValue     Decimal?      @db.Decimal(12, 2)
  maxValue     Decimal?      @db.Decimal(12, 2)
  isActive     Boolean      @default(true)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  values       ProductAttributeValue[]
}
```

### ProductAttributeValue (line 1913)
```prisma
model ProductAttributeValue {
  id          String           @id @default(cuid())
  productId   String
  attributeId String
  value       String
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  product     Product          @relation(fields: [productId], references: [id], onDelete: Cascade)
  attribute   ProductAttribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)

  @@unique([productId, attributeId])
}
```
**NOTE: Only connects to Product, not ProductVariant**

---

## Phase 1: Schema Changes

### 1.1 Add to Category model
```prisma
model Category {
  // ... existing fields ...

  // NEW FIELDS - Add after metaKeywords
  variantAttributeIds  String[]  @default([])  // IDs of attributes that create variants
  priceRules           Json?     // [{attribute: "size", condition: ">=13", modifier: "+10"}]

  // ... rest stays same
}
```

### 1.2 Upgrade ProductVariant model
```prisma
model ProductVariant {
  id              String    @id @default(cuid())
  productId       String
  sku             String    @unique
  name            String

  // UPGRADED: Multiple price types (same as Product)
  basePrice       Decimal   @db.Decimal(12, 2)
  salePrice       Decimal?  @db.Decimal(12, 2)
  wholesalePrice  Decimal?  @db.Decimal(12, 2)
  gsaPrice        Decimal?  @db.Decimal(12, 2)
  costPrice       Decimal?  @db.Decimal(12, 2)

  stockQuantity   Int       @default(0)
  images          String[]
  isActive        Boolean   @default(true)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  // NEW: Relations
  attributeValues VariantAttributeValue[]
  cartItems       CartItem[]
  orderItems      OrderItem[]
  warehouseStock  VariantWarehouseStock[]

  @@index([productId])
  @@index([sku])
}
```

### 1.3 Create NEW VariantAttributeValue model
```prisma
model VariantAttributeValue {
  id          String           @id @default(cuid())
  variantId   String
  attributeId String
  value       String           // e.g., "13" for size, "Orange" for color

  variant     ProductVariant   @relation(fields: [variantId], references: [id], onDelete: Cascade)
  attribute   ProductAttribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)

  @@unique([variantId, attributeId])
  @@index([variantId])
  @@index([attributeId])
}
```

### 1.4 Update CartItem
```prisma
model CartItem {
  // ... existing fields ...

  // NEW
  variantId   String?
  variant     ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  // ... rest stays same
}
```

### 1.5 Update OrderItem
```prisma
model OrderItem {
  // ... existing fields ...

  // NEW - add after productId
  variantId     String?
  variantSku    String?
  variantName   String?  // e.g., "Size: 13, Color: Black"

  variant       ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  // ... rest stays same
}
```

### 1.6 Create NEW VariantWarehouseStock model
```prisma
model VariantWarehouseStock {
  id          String          @id @default(cuid())
  variantId   String
  warehouseId String

  quantity    Int             @default(0)
  reserved    Int             @default(0)
  available   Int             @default(0)

  aisle       String?
  rack        String?
  shelf       String?
  bin         String?

  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  variant     ProductVariant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  warehouse   Warehouse       @relation(fields: [warehouseId], references: [id], onDelete: Cascade)

  @@unique([variantId, warehouseId])
  @@index([variantId])
  @@index([warehouseId])
}
```

### 1.7 Update ProductAttribute (add relation)
```prisma
model ProductAttribute {
  // ... existing fields ...

  values              ProductAttributeValue[]
  variantValues       VariantAttributeValue[]  // NEW
}
```

### 1.8 Update Warehouse (add relation)
```prisma
model Warehouse {
  // ... existing fields ...

  variantStock  VariantWarehouseStock[]  // NEW
}
```

### Migration Commands
```bash
# BACKUP FIRST!
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Create migration
cd /home/user/siteJadid
npx prisma migrate dev --name add_variant_system

# If on production server
npx prisma migrate deploy
```

---

## Phase 2: Admin Category Variant Config

### 2.1 File: `/src/app/api/admin/categories/[id]/route.ts`

Update PATCH to handle:
```typescript
// Add to update body
variantAttributeIds: string[];
priceRules: {
  attribute: string;
  condition: string;  // ">=", "<=", "==", "in"
  value: string;
  modifier: string;   // "+10", "-5", "*1.1"
}[];
```

### 2.2 File: `/src/components/admin/CategoryVariantConfig.tsx` (NEW)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { ProductAttribute } from '@prisma/client';

interface PriceRule {
  attribute: string;
  condition: '>=' | '<=' | '==' | 'in';
  value: string;
  modifier: string;
}

interface Props {
  categoryId: string;
  selectedAttributeIds: string[];
  priceRules: PriceRule[];
  onSave: (config: { variantAttributeIds: string[]; priceRules: PriceRule[] }) => void;
}

export function CategoryVariantConfig({ categoryId, selectedAttributeIds, priceRules: initialRules, onSave }: Props) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selected, setSelected] = useState<string[]>(selectedAttributeIds);
  const [rules, setRules] = useState<PriceRule[]>(initialRules);

  useEffect(() => {
    fetch('/api/admin/product-attributes')
      .then(res => res.json())
      .then(data => setAttributes(data.filter((a: any) => a.isVariant)));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Variant Attributes</h3>
        <p className="text-sm text-gray-500">Select which attributes create product variants for this category</p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {attributes.map(attr => (
            <label key={attr.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(attr.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelected([...selected, attr.id]);
                  } else {
                    setSelected(selected.filter(id => id !== attr.id));
                  }
                }}
              />
              <span>{attr.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">Price Rules</h3>
        <p className="text-sm text-gray-500">Optional: Add price modifiers based on attribute values</p>
        {/* Price rules UI */}
      </div>

      <button
        onClick={() => onSave({ variantAttributeIds: selected, priceRules: rules })}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Save Configuration
      </button>
    </div>
  );
}
```

### 2.3 Update Category Edit Page

Add tab/section for variant config in `/src/app/admin/categories/[id]/page.tsx`

---

## Phase 3: Admin Product Variant Management

### 3.1 File: `/src/app/api/admin/products/[id]/variants/route.ts` (NEW)

```typescript
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET - List variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const variants = await prisma.productVariant.findMany({
    where: { productId: params.id },
    include: {
      attributeValues: {
        include: { attribute: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json(variants);
}

// POST - Create new variant
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const variant = await prisma.productVariant.create({
    data: {
      productId: params.id,
      sku: body.sku,
      name: body.name,
      basePrice: body.basePrice,
      salePrice: body.salePrice,
      wholesalePrice: body.wholesalePrice,
      gsaPrice: body.gsaPrice,
      costPrice: body.costPrice,
      stockQuantity: body.stockQuantity || 0,
      images: body.images || [],
      attributeValues: {
        create: body.attributeValues.map((av: any) => ({
          attributeId: av.attributeId,
          value: av.value
        }))
      }
    },
    include: {
      attributeValues: {
        include: { attribute: true }
      }
    }
  });

  return NextResponse.json(variant);
}
```

### 3.2 File: `/src/components/admin/VariantEditor.tsx` (NEW)

```tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VariantAttribute {
  attributeId: string;
  attributeName: string;
  attributeCode: string;
  options: string[];
}

interface Props {
  productId: string;
  variantAttributes: VariantAttribute[];
  variant?: any; // Existing variant for editing
  onSave: (data: any) => void;
  onClose: () => void;
}

export function VariantEditor({ productId, variantAttributes, variant, onSave, onClose }: Props) {
  const [formData, setFormData] = useState({
    sku: variant?.sku || '',
    name: variant?.name || '',
    basePrice: variant?.basePrice || '',
    salePrice: variant?.salePrice || '',
    wholesalePrice: variant?.wholesalePrice || '',
    gsaPrice: variant?.gsaPrice || '',
    costPrice: variant?.costPrice || '',
    stockQuantity: variant?.stockQuantity || 0,
    attributeValues: variantAttributes.map(attr => ({
      attributeId: attr.attributeId,
      value: variant?.attributeValues?.find((av: any) => av.attributeId === attr.attributeId)?.value || ''
    }))
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{variant ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* SKU */}
          <div>
            <Label>SKU</Label>
            <Input
              value={formData.sku}
              onChange={(e) => setFormData({...formData, sku: e.target.value})}
            />
          </div>

          {/* Attribute Selectors */}
          {variantAttributes.map((attr, idx) => (
            <div key={attr.attributeId}>
              <Label>{attr.attributeName}</Label>
              <select
                className="w-full border rounded p-2"
                value={formData.attributeValues[idx]?.value || ''}
                onChange={(e) => {
                  const newValues = [...formData.attributeValues];
                  newValues[idx] = { attributeId: attr.attributeId, value: e.target.value };
                  setFormData({...formData, attributeValues: newValues});
                }}
              >
                <option value="">Select {attr.attributeName}</option>
                {attr.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}

          {/* Prices */}
          <div>
            <Label>Base Price</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
            />
          </div>
          <div>
            <Label>Sale Price</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.salePrice}
              onChange={(e) => setFormData({...formData, salePrice: e.target.value})}
            />
          </div>
          <div>
            <Label>Wholesale (B2B) Price</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.wholesalePrice}
              onChange={(e) => setFormData({...formData, wholesalePrice: e.target.value})}
            />
          </div>
          <div>
            <Label>GSA Price</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.gsaPrice}
              onChange={(e) => setFormData({...formData, gsaPrice: e.target.value})}
            />
          </div>
          <div>
            <Label>Cost Price</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.costPrice}
              onChange={(e) => setFormData({...formData, costPrice: e.target.value})}
            />
          </div>
          <div>
            <Label>Stock Quantity</Label>
            <Input
              type="number"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({...formData, stockQuantity: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Save Variant
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3.3 File: `/src/components/admin/VariantPricingTable.tsx` (NEW)

Quick-edit pricing table for all variants:
```tsx
'use client';

interface Variant {
  id: string;
  sku: string;
  attributeValues: { attribute: { name: string }; value: string }[];
  basePrice: number;
  salePrice?: number;
  wholesalePrice?: number;
  gsaPrice?: number;
  costPrice?: number;
  stockQuantity: number;
}

interface Props {
  variants: Variant[];
  onUpdate: (variantId: string, data: Partial<Variant>) => void;
}

export function VariantPricingTable({ variants, onUpdate }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">SKU</th>
            <th className="px-4 py-2 text-left">Attributes</th>
            <th className="px-4 py-2 text-right">Base</th>
            <th className="px-4 py-2 text-right">Sale</th>
            <th className="px-4 py-2 text-right">B2B</th>
            <th className="px-4 py-2 text-right">GSA</th>
            <th className="px-4 py-2 text-right">Cost</th>
            <th className="px-4 py-2 text-right">Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {variants.map(variant => (
            <tr key={variant.id}>
              <td className="px-4 py-2 font-mono text-sm">{variant.sku}</td>
              <td className="px-4 py-2">
                {variant.attributeValues.map(av => (
                  <span key={av.attribute.name} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1 text-sm">
                    {av.attribute.name}: {av.value}
                  </span>
                ))}
              </td>
              <td className="px-4 py-2">
                <input
                  type="number"
                  className="w-20 text-right border rounded p-1"
                  defaultValue={variant.basePrice}
                  onBlur={(e) => onUpdate(variant.id, { basePrice: parseFloat(e.target.value) })}
                />
              </td>
              {/* Similar for other price fields */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Phase 4: Smart Bulk Import

### 4.1 File: `/src/lib/services/variant-detector.ts` (NEW)

```typescript
interface ExcelRow {
  sku: string;
  name: string;
  [key: string]: any;
}

interface VariantGroup {
  basePartNumber: string;
  baseName: string;
  baseRow: ExcelRow;
  variants: ExcelRow[];
  variantAttributes: string[]; // Column names that differ between variants
}

// Extract base part number from SKU
// Examples:
//   1006980-7 → 1006980
//   HV-VEST-S-OR → HV-VEST
//   MTR-1-115-1 → MTR
export function extractBasePartNumber(sku: string): string {
  // Pattern 1: Numbers followed by dash and size (1006980-7)
  const numericPattern = /^(\d+)-[\d.]+$/;
  const numericMatch = sku.match(numericPattern);
  if (numericMatch) return numericMatch[1];

  // Pattern 2: Split by dash, take first 1-2 parts
  const parts = sku.split('-');
  if (parts.length >= 3) {
    // For HV-VEST-S-OR, take HV-VEST
    // For MTR-1-115-1, take MTR
    if (parts[0].length <= 3) {
      return parts.slice(0, 2).join('-');
    }
    return parts[0];
  }

  return sku;
}

// Group rows by base SKU pattern
export function groupByBasePartNumber(rows: ExcelRow[]): VariantGroup[] {
  const groups = new Map<string, ExcelRow[]>();

  for (const row of rows) {
    const base = extractBasePartNumber(row.sku);
    if (!groups.has(base)) {
      groups.set(base, []);
    }
    groups.get(base)!.push(row);
  }

  // Convert to VariantGroup array
  const result: VariantGroup[] = [];

  for (const [base, variants] of groups) {
    if (variants.length === 1) {
      // Single product, no variants
      continue; // Or handle as product without variants
    }

    // Find which columns differ between variants
    const variantAttributes = findDifferingColumns(variants);

    result.push({
      basePartNumber: base,
      baseName: variants[0].name.replace(/\s*-?\s*size\s*\d+.*$/i, '').trim(),
      baseRow: variants[0],
      variants,
      variantAttributes
    });
  }

  return result;
}

// Find columns that have different values across variants
function findDifferingColumns(rows: ExcelRow[]): string[] {
  const columns = Object.keys(rows[0]).filter(k => k !== 'sku');
  const differing: string[] = [];

  for (const col of columns) {
    const values = new Set(rows.map(r => String(r[col] || '')));
    if (values.size > 1) {
      differing.push(col);
    }
  }

  return differing;
}

// Detect category from column headers
export function detectCategoryFromHeaders(headers: string[]): string | null {
  const lowerHeaders = headers.map(h => h.toLowerCase());

  if (lowerHeaders.some(h => h.includes('hp') || h.includes('horsepower') || h.includes('voltage'))) {
    return 'electric-motors';
  }
  if (lowerHeaders.some(h => h.includes('size')) && lowerHeaders.some(h => h.includes('color'))) {
    return 'apparel';
  }
  if (lowerHeaders.some(h => h.includes('size'))) {
    return 'footwear';
  }

  return null;
}
```

### 4.2 Update: `/src/lib/services/bulk-import.ts`

Add variant detection and grouping logic:

```typescript
import { groupByBasePartNumber, detectCategoryFromHeaders } from './variant-detector';

interface ImportOptions {
  // ... existing options ...

  enableVariantDetection?: boolean;
  overrideCategoryId?: string;
}

export async function processExcelWithVariants(
  buffer: Buffer,
  options: ImportOptions
): Promise<ImportResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(1);

  // Read headers and rows
  const headers = getHeaders(worksheet);
  const rows = getRows(worksheet, headers);

  if (options.enableVariantDetection) {
    // Detect or get category
    const categorySlug = detectCategoryFromHeaders(headers) || 'general';
    const category = await prisma.category.findUnique({
      where: { slug: options.overrideCategoryId || categorySlug }
    });

    // Group by base SKU
    const groups = groupByBasePartNumber(rows);

    // Create products with variants
    for (const group of groups) {
      await createProductWithVariants(group, category, options);
    }
  } else {
    // Original import logic (separate products)
    // ... existing code ...
  }
}

async function createProductWithVariants(
  group: VariantGroup,
  category: Category | null,
  options: ImportOptions
) {
  // Create base product
  const product = await prisma.product.create({
    data: {
      sku: group.basePartNumber,
      name: group.baseName,
      slug: slugify(group.baseName),
      basePrice: group.variants[0].price || 0,
      categoryId: category?.id,
      // ... other fields from first variant
    }
  });

  // Create variants
  for (const row of group.variants) {
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: row.sku,
        name: group.variantAttributes.map(attr => `${attr}: ${row[attr]}`).join(', '),
        basePrice: row.price || row.basePrice,
        wholesalePrice: row.wholesalePrice || row.b2bPrice,
        gsaPrice: row.gsaPrice,
        costPrice: row.costPrice || row.cost,
        stockQuantity: row.stockQuantity || row.stock || 0,
        attributeValues: {
          create: await Promise.all(
            group.variantAttributes.map(async attrName => {
              const attr = await findOrCreateAttribute(attrName);
              return {
                attributeId: attr.id,
                value: String(row[attrName] || '')
              };
            })
          )
        }
      }
    });
  }
}
```

### 4.3 Update: `/src/app/admin/products/import/page.tsx`

Add variant detection toggle and preview:

```tsx
// Add to state
const [enableVariantDetection, setEnableVariantDetection] = useState(true);
const [detectedGroups, setDetectedGroups] = useState<VariantGroup[]>([]);
const [showPreview, setShowPreview] = useState(false);

// Add preview step before import
const handlePreview = async () => {
  const formData = new FormData();
  formData.append('file', selectedFile);
  formData.append('preview', 'true');

  const response = await fetch('/api/admin/products/import/preview', {
    method: 'POST',
    body: formData
  });

  const data = await response.json();
  setDetectedGroups(data.groups);
  setShowPreview(true);
};

// Add to UI
<div className="flex items-center gap-2 mb-4">
  <input
    type="checkbox"
    id="variantDetection"
    checked={enableVariantDetection}
    onChange={(e) => setEnableVariantDetection(e.target.checked)}
  />
  <label htmlFor="variantDetection">
    Enable Smart Variant Detection (group similar SKUs into products with variants)
  </label>
</div>

{showPreview && (
  <div className="border rounded p-4 mb-4">
    <h3 className="font-bold mb-2">Import Preview</h3>
    <p className="text-sm text-gray-600 mb-4">
      Detected {detectedGroups.length} products with variants
    </p>
    {detectedGroups.map(group => (
      <div key={group.basePartNumber} className="mb-2 p-2 bg-gray-50 rounded">
        <div className="font-medium">{group.baseName}</div>
        <div className="text-sm text-gray-500">
          SKU: {group.basePartNumber} | {group.variants.length} variants
        </div>
        <div className="text-xs text-gray-400">
          Variant by: {group.variantAttributes.join(', ')}
        </div>
      </div>
    ))}
  </div>
)}
```

---

## Phase 5: Storefront Product Display

### 5.1 File: `/src/components/product/VariantSelector.tsx` (NEW)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AttributeValue {
  attribute: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  value: string;
}

interface Variant {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  salePrice?: number;
  wholesalePrice?: number;
  gsaPrice?: number;
  stockQuantity: number;
  images: string[];
  attributeValues: AttributeValue[];
}

interface Props {
  variants: Variant[];
  selectedVariant: Variant | null;
  onSelect: (variant: Variant) => void;
}

export function VariantSelector({ variants, selectedVariant, onSelect }: Props) {
  // Get unique attribute values
  const attributeMap = new Map<string, { name: string; values: string[] }>();

  for (const variant of variants) {
    for (const av of variant.attributeValues) {
      if (!attributeMap.has(av.attribute.id)) {
        attributeMap.set(av.attribute.id, { name: av.attribute.name, values: [] });
      }
      const attr = attributeMap.get(av.attribute.id)!;
      if (!attr.values.includes(av.value)) {
        attr.values.push(av.value);
      }
    }
  }

  // Current selections
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Find matching variant based on selections
  useEffect(() => {
    if (Object.keys(selections).length === attributeMap.size) {
      const match = variants.find(v =>
        v.attributeValues.every(av => selections[av.attribute.id] === av.value)
      );
      if (match) onSelect(match);
    }
  }, [selections]);

  // Check if a value is available (has matching variants)
  const isValueAvailable = (attrId: string, value: string): boolean => {
    const otherSelections = { ...selections };
    delete otherSelections[attrId];

    return variants.some(v => {
      const hasValue = v.attributeValues.some(av =>
        av.attribute.id === attrId && av.value === value
      );
      const matchesOthers = Object.entries(otherSelections).every(([id, val]) =>
        v.attributeValues.some(av => av.attribute.id === id && av.value === val)
      );
      return hasValue && matchesOthers && v.stockQuantity > 0;
    });
  };

  return (
    <div className="space-y-4">
      {Array.from(attributeMap).map(([attrId, { name, values }]) => (
        <div key={attrId}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {name}: <span className="font-semibold">{selections[attrId] || 'Select'}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {values.map(value => {
              const isSelected = selections[attrId] === value;
              const isAvailable = isValueAvailable(attrId, value);

              return (
                <button
                  key={value}
                  onClick={() => setSelections({ ...selections, [attrId]: value })}
                  disabled={!isAvailable}
                  className={cn(
                    'px-4 py-2 border rounded-lg transition-all',
                    isSelected && 'border-green-600 bg-green-50 text-green-700',
                    !isSelected && isAvailable && 'border-gray-300 hover:border-gray-400',
                    !isAvailable && 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 5.2 File: `/src/components/product/VariantPrice.tsx` (NEW)

```tsx
'use client';

import { formatPrice } from '@/lib/utils';

interface Variant {
  basePrice: number;
  salePrice?: number;
  wholesalePrice?: number;
  gsaPrice?: number;
}

interface Props {
  variants: Variant[];
  selectedVariant: Variant | null;
  userType: 'retail' | 'b2b' | 'gsa';
}

export function VariantPrice({ variants, selectedVariant, userType }: Props) {
  // Get price based on user type
  const getPrice = (variant: Variant) => {
    if (userType === 'gsa' && variant.gsaPrice) return variant.gsaPrice;
    if (userType === 'b2b' && variant.wholesalePrice) return variant.wholesalePrice;
    return variant.salePrice || variant.basePrice;
  };

  if (selectedVariant) {
    const price = getPrice(selectedVariant);
    const originalPrice = selectedVariant.basePrice;
    const hasDiscount = price < originalPrice;

    return (
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-green-600">
          {formatPrice(price)}
        </span>
        {hasDiscount && (
          <span className="text-lg text-gray-400 line-through">
            {formatPrice(originalPrice)}
          </span>
        )}
      </div>
    );
  }

  // Show price range when no variant selected
  const prices = variants.map(v => getPrice(v));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return (
      <span className="text-2xl font-bold text-green-600">
        {formatPrice(minPrice)}
      </span>
    );
  }

  return (
    <span className="text-2xl font-bold text-green-600">
      {formatPrice(minPrice)} - {formatPrice(maxPrice)}
    </span>
  );
}
```

### 5.3 Update: `/src/app/products/[slug]/page.tsx`

```tsx
// Fetch product with variants
const product = await prisma.product.findUnique({
  where: { slug },
  include: {
    variants: {
      where: { isActive: true },
      include: {
        attributeValues: {
          include: { attribute: true }
        }
      }
    },
    // ... other includes
  }
});

// In component
const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

// Render
{product.variants.length > 0 ? (
  <>
    <VariantPrice
      variants={product.variants}
      selectedVariant={selectedVariant}
      userType={userType}
    />
    <VariantSelector
      variants={product.variants}
      selectedVariant={selectedVariant}
      onSelect={setSelectedVariant}
    />
    {selectedVariant && (
      <div className="text-sm text-gray-600">
        SKU: {selectedVariant.sku} |
        Stock: {selectedVariant.stockQuantity > 0 ? `${selectedVariant.stockQuantity} available` : 'Out of stock'}
      </div>
    )}
  </>
) : (
  <div className="text-2xl font-bold">{formatPrice(product.basePrice)}</div>
)}
```

### 5.4 Update Add to Cart

```tsx
// In add to cart handler
const handleAddToCart = async () => {
  if (product.variants.length > 0 && !selectedVariant) {
    toast.error('Please select options');
    return;
  }

  await addToCart({
    productId: product.id,
    variantId: selectedVariant?.id,
    quantity: 1,
    price: selectedVariant ? selectedVariant.basePrice : product.basePrice
  });
};
```

---

## Phase 6: Cart & Checkout

### 6.1 Update Cart Display

```tsx
// In CartItem component
{item.variant && (
  <div className="text-sm text-gray-500">
    {item.variant.attributeValues.map(av => (
      <span key={av.attribute.id} className="mr-2">
        {av.attribute.name}: {av.value}
      </span>
    ))}
  </div>
)}
<div className="text-xs text-gray-400">SKU: {item.variant?.sku || item.product.sku}</div>
```

### 6.2 Update Order Creation

```typescript
// In order service
const orderItems = await Promise.all(
  cartItems.map(async (item) => ({
    productId: item.productId,
    variantId: item.variantId,
    variantSku: item.variant?.sku,
    variantName: item.variant?.attributeValues
      .map(av => `${av.attribute.name}: ${av.value}`)
      .join(', '),
    sku: item.variant?.sku || item.product.sku,
    name: item.product.name,
    quantity: item.quantity,
    price: item.variant?.basePrice || item.product.basePrice,
    // ...
  }))
);
```

---

## Files Summary

### NEW Files to Create:
```
src/
├── components/
│   ├── admin/
│   │   ├── CategoryVariantConfig.tsx
│   │   ├── VariantEditor.tsx
│   │   ├── VariantPricingTable.tsx
│   │   └── ImportPreview.tsx
│   └── product/
│       ├── VariantSelector.tsx
│       └── VariantPrice.tsx
├── app/
│   └── api/
│       └── admin/
│           └── products/
│               └── [id]/
│                   └── variants/
│                       └── route.ts
└── lib/
    └── services/
        └── variant-detector.ts
```

### Files to MODIFY:
```
prisma/schema.prisma           # Add new fields and models
src/app/admin/categories/[id]/page.tsx  # Add variant config section
src/app/admin/products/[id]/page.tsx    # Add variants tab
src/app/admin/products/import/page.tsx  # Add variant detection toggle
src/lib/services/bulk-import.ts         # Add variant grouping logic
src/app/products/[slug]/page.tsx        # Add variant selector
src/components/cart/CartItem.tsx        # Show variant info
src/lib/services/order.ts               # Save variant to order
```

---

## Server Commands

```bash
# On server
cd /root/ada/siteJadid

# Pull changes
git pull origin claude/fix-import-01AXdT1dcQ6KANxxg3BWXy3F

# Install dependencies (if needed)
npm install

# Run migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Build
npm run build

# Restart PM2
pm2 restart all
```

---

## Testing Checklist

- [ ] Schema migrates without errors
- [ ] Existing products still work
- [ ] Can configure category variant attributes
- [ ] Can create product variants in admin
- [ ] Can set different prices per variant
- [ ] Bulk import detects and groups variants
- [ ] Storefront shows variant selector
- [ ] Price changes when variant selected
- [ ] Add to cart works with variants
- [ ] Order history shows variant details

---

## Progress Tracking

- [ ] **Phase 1**: Schema Updates
  - [ ] 1.1 Category: variantAttributeIds, priceRules
  - [ ] 1.2 ProductVariant: multiple prices
  - [ ] 1.3 VariantAttributeValue model
  - [ ] 1.4 CartItem: variantId
  - [ ] 1.5 OrderItem: variant fields
  - [ ] 1.6 VariantWarehouseStock model
  - [ ] 1.7 Run migration

- [ ] **Phase 2**: Admin Category Config
  - [ ] 2.1 CategoryVariantConfig component
  - [ ] 2.2 Category API update
  - [ ] 2.3 Category edit page update

- [ ] **Phase 3**: Admin Product Variants
  - [ ] 3.1 Variants API
  - [ ] 3.2 VariantEditor component
  - [ ] 3.3 VariantPricingTable component
  - [ ] 3.4 Product edit page update

- [ ] **Phase 4**: Smart Bulk Import
  - [ ] 4.1 variant-detector.ts
  - [ ] 4.2 bulk-import.ts update
  - [ ] 4.3 Import preview UI

- [ ] **Phase 5**: Storefront Display
  - [ ] 5.1 VariantSelector component
  - [ ] 5.2 VariantPrice component
  - [ ] 5.3 Product page update
  - [ ] 5.4 Add to cart update

- [ ] **Phase 6**: Cart & Checkout
  - [ ] 6.1 CartItem display update
  - [ ] 6.2 Order creation update
  - [ ] 6.3 Order history update

- [ ] **Phase 7**: Testing
  - [ ] Full system test
  - [ ] Deploy to production
