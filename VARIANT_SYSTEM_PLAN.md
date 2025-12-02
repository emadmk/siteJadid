# Product Variant System - Implementation Plan

## Project Overview
Implementing a professional, dynamic variant system similar to Grainger/Amazon for B2B e-commerce.

### Key Features:
- **Dynamic Variant Attributes**: Each category defines which attributes create variants (Size, Color, HP, Voltage, etc.)
- **Variant-Specific Pricing**: Each variant can have different basePrice, wholesalePrice, gsaPrice, costPrice
- **Smart Bulk Import**: Auto-detect SKU patterns and group into products with variants
- **Full Admin UI**: Variant management in product editor
- **Full Storefront UI**: Variant selector with dynamic pricing

---

## Current System State

### Existing Schema (relevant parts):
```prisma
model Product {
  id                String   @id @default(cuid())
  sku               String   @unique
  name              String
  slug              String   @unique
  basePrice         Decimal
  salePrice         Decimal?
  wholesalePrice    Decimal?
  gsaPrice          Decimal?
  costPrice         Decimal?
  stockQuantity     Int      @default(0)
  brandId           String?
  categoryId        String?
  // ... other fields
  variants          ProductVariant[]
  attributeValues   ProductAttributeValue[]
}

model ProductVariant {
  id            String   @id @default(cuid())
  productId     String
  sku           String   @unique
  name          String
  attributes    String   // JSON - currently unused properly
  price         Decimal  // Only ONE price - needs B2B/GSA
  stockQuantity Int      @default(0)
  images        String[]
  isActive      Boolean  @default(true)
  product       Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
}

model ProductAttribute {
  id           String        @id @default(cuid())
  name         String
  code         String        @unique
  type         AttributeType // TEXT, NUMBER, SELECT, etc.
  options      String[]      // For SELECT type
  isFilterable Boolean       @default(true)
  isRequired   Boolean       @default(false)
  isVariant    Boolean       @default(false) // EXISTS but unused
  // ...
}

model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  // ... NO variant config currently
}

model CartItem {
  productId String  // NO variantId
  // ...
}

model OrderItem {
  productId String  // NO variantId
  // ...
}
```

### Current Issues:
1. ProductVariant has only ONE price field (no B2B/GSA support)
2. Category doesn't define which attributes are variant-creating
3. CartItem/OrderItem don't track which variant was purchased
4. No variant-level inventory in warehouses
5. Bulk import creates separate products instead of variants

---

## Phase 1: Schema Updates

### 1.1 Update Category Model
```prisma
model Category {
  // ... existing fields ...

  // NEW: Which attributes create variants for this category
  variantAttributeIds  String[]  @default([])

  // NEW: Price modification rules
  // Example: [{"attribute": "size", "condition": ">=13", "modifier": "+10"}]
  priceRules           Json?
}
```

### 1.2 Update ProductVariant Model
```prisma
model ProductVariant {
  id              String    @id @default(cuid())
  productId       String
  sku             String    @unique
  name            String

  // ENHANCED: Multiple price types
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

  // NEW: Structured attribute values
  attributeValues VariantAttributeValue[]

  // NEW: Warehouse stock tracking
  warehouseStock  VariantWarehouseStock[]

  // NEW: Cart and order tracking
  cartItems       CartItem[]
  orderItems      OrderItem[]
}
```

### 1.3 Create VariantAttributeValue Model
```prisma
model VariantAttributeValue {
  id          String           @id @default(cuid())
  variantId   String
  attributeId String
  value       String

  variant     ProductVariant   @relation(fields: [variantId], references: [id], onDelete: Cascade)
  attribute   ProductAttribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)

  @@unique([variantId, attributeId])
  @@index([variantId])
  @@index([attributeId])
}
```

### 1.4 Update CartItem Model
```prisma
model CartItem {
  // ... existing fields ...

  // NEW: Optional variant reference
  variantId       String?
  variant         ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
}
```

### 1.5 Update OrderItem Model
```prisma
model OrderItem {
  // ... existing fields ...

  // NEW: Variant tracking
  variantId       String?
  variantSku      String?
  variantName     String?

  variant         ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
}
```

### 1.6 Create VariantWarehouseStock Model
```prisma
model VariantWarehouseStock {
  id          String          @id @default(cuid())
  variantId   String
  warehouseId String
  available   Int             @default(0)
  reserved    Int             @default(0)

  variant     ProductVariant  @relation(fields: [variantId], references: [id], onDelete: Cascade)
  warehouse   Warehouse       @relation(fields: [warehouseId], references: [id], onDelete: Cascade)

  @@unique([variantId, warehouseId])
}
```

---

## Phase 2: Admin - Category Variant Config

### Files to Create/Modify:

#### 2.1 `/src/app/admin/categories/[id]/page.tsx`
Add variant configuration section:
- Multi-select for choosing which attributes are variant-creating
- Price rules builder UI

#### 2.2 `/src/app/api/admin/categories/[id]/route.ts`
Update to handle:
- `variantAttributeIds` array
- `priceRules` JSON

#### 2.3 `/src/components/admin/CategoryVariantConfig.tsx`
New component:
```tsx
interface Props {
  categoryId: string;
  attributes: ProductAttribute[];
  selectedAttributeIds: string[];
  priceRules: PriceRule[];
  onChange: (config: VariantConfig) => void;
}
```

---

## Phase 3: Admin - Product Variant Management

### Files to Create/Modify:

#### 3.1 `/src/app/admin/products/[id]/variants/page.tsx`
Variant management tab with:
- List of all variants
- Quick edit pricing table
- Bulk actions

#### 3.2 `/src/components/admin/VariantEditor.tsx`
Modal for creating/editing variants:
- Attribute value selectors (based on category config)
- All price fields (base, sale, wholesale, GSA, cost)
- Stock quantity
- Image upload

#### 3.3 `/src/app/api/admin/products/[id]/variants/route.ts`
CRUD endpoints:
- GET: List variants with attribute values
- POST: Create variant
- PATCH: Update variant
- DELETE: Delete variant

#### 3.4 `/src/components/admin/VariantPricingTable.tsx`
Bulk pricing editor:
```
| SKU | Size | Base | Sale | B2B | GSA | Cost | Stock |
|-----|------|------|------|-----|-----|------|-------|
| ... | 7    | $159 | -    | $140| $130| $100 | 15    |
| ... | 8    | $159 | -    | $140| $130| $100 | 22    |
```

---

## Phase 4: Smart Bulk Import

### 4.1 SKU Pattern Detection Algorithm
```typescript
// File: /src/lib/services/variant-detector.ts

interface VariantGroup {
  basePartNumber: string;
  baseName: string;
  variants: ParsedVariant[];
}

function detectVariantGroups(rows: ExcelRow[]): VariantGroup[] {
  // 1. Extract potential base part numbers
  // Pattern examples:
  //   - 1006980-7 → base: 1006980, variant: 7
  //   - HV-VEST-S-OR → base: HV-VEST, variants: S, OR
  //   - MTR-1-115-1 → base: MTR, variants: 1, 115, 1

  // 2. Group by base part number
  // 3. Identify which columns are variant attributes
  // 4. Return structured groups
}

function detectCategoryFromColumns(headers: string[]): string | null {
  // If has Size + Color → probably Apparel
  // If has HP + Voltage → probably Motors
  // etc.
}
```

### 4.2 Update Bulk Import Service
```typescript
// File: /src/lib/services/bulk-import.ts

interface ImportOptions {
  // ... existing options ...

  // NEW:
  enableVariantDetection: boolean;
  categoryId?: string;          // Override auto-detection
  variantAttributeColumns?: string[]; // Override auto-detection
}

async function processExcelWithVariants(
  file: File,
  options: ImportOptions
): Promise<ImportResult> {
  // 1. Read Excel
  // 2. Detect or use provided category
  // 3. Get variant attributes for category
  // 4. Group rows by base SKU
  // 5. Create products with variants
}
```

### 4.3 Import Preview Component
```typescript
// File: /src/components/admin/ImportPreview.tsx

interface ImportPreviewProps {
  file: File;
  detectedProducts: {
    baseSku: string;
    name: string;
    variantCount: number;
    variants: {
      sku: string;
      attributes: Record<string, string>;
      price: number;
    }[];
  }[];
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

## Phase 5: Storefront - Product Display

### 5.1 VariantSelector Component
```typescript
// File: /src/components/product/VariantSelector.tsx

interface VariantSelectorProps {
  product: Product;
  variants: ProductVariant[];
  variantAttributes: {
    attribute: ProductAttribute;
    values: string[];
  }[];
  selectedVariant: ProductVariant | null;
  onSelect: (variant: ProductVariant) => void;
}

// UI Examples:
// Size: [7] [7.5] [8] [8.5] [9] ... (button group)
// Color: [⚫] [⚪] [🔴] (color swatches)
// HP: dropdown for many options
```

### 5.2 Update ProductDetail Page
```typescript
// File: /src/app/products/[slug]/page.tsx

// Changes:
// 1. Fetch variants with product
// 2. Show price range if variants have different prices
// 3. Include VariantSelector component
// 4. Update displayed price/stock based on selection
// 5. Swap images when variant selected
```

### 5.3 Dynamic Price Display
```typescript
// File: /src/components/product/VariantPrice.tsx

interface VariantPriceProps {
  product: Product;
  selectedVariant: ProductVariant | null;
  userType: 'retail' | 'b2b' | 'gsa';
}

// Shows:
// - Price range when no variant selected: "$159 - $169"
// - Specific price when variant selected: "$169"
// - B2B/GSA pricing for logged-in users
```

### 5.4 Add to Cart with Variant
```typescript
// Update: /src/lib/actions/cart.ts

interface AddToCartInput {
  productId: string;
  variantId?: string;  // NEW
  quantity: number;
}

// Validation:
// - If product has variants, variantId is REQUIRED
// - Check variant stock, not just product stock
```

---

## Phase 6: Cart & Checkout

### 6.1 Cart Display Updates
```typescript
// File: /src/components/cart/CartItem.tsx

// Show variant info:
// - Variant attributes (Size: 13, Color: Black)
// - Variant-specific price
// - Variant SKU
```

### 6.2 Order Creation Updates
```typescript
// File: /src/lib/services/order.ts

// When creating order:
// 1. Copy variant info to OrderItem
// 2. Decrement variant stock, not just product stock
// 3. Track variantSku for fulfillment
```

### 6.3 Order History Updates
```typescript
// File: /src/app/account/orders/[id]/page.tsx

// Show:
// - Product name
// - Variant details (Size: 13)
// - Variant SKU
```

---

## File Structure Summary

```
src/
├── app/
│   ├── admin/
│   │   ├── categories/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Add variant config
│   │   └── products/
│   │       ├── [id]/
│   │       │   └── variants/
│   │       │       └── page.tsx      # NEW: Variant management
│   │       └── import/
│   │           └── page.tsx          # Update with variant detection
│   ├── api/
│   │   └── admin/
│   │       ├── categories/
│   │       │   └── [id]/
│   │       │       └── route.ts      # Update for variant config
│   │       └── products/
│   │           └── [id]/
│   │               └── variants/
│   │                   └── route.ts  # NEW: Variant CRUD API
│   └── products/
│       └── [slug]/
│           └── page.tsx              # Update with variant selector
├── components/
│   ├── admin/
│   │   ├── CategoryVariantConfig.tsx # NEW
│   │   ├── VariantEditor.tsx         # NEW
│   │   ├── VariantPricingTable.tsx   # NEW
│   │   └── ImportPreview.tsx         # NEW
│   ├── product/
│   │   ├── VariantSelector.tsx       # NEW
│   │   ├── VariantPrice.tsx          # NEW
│   │   └── ProductDetail.tsx         # Update
│   └── cart/
│       └── CartItem.tsx              # Update
├── lib/
│   └── services/
│       ├── bulk-import.ts            # Update
│       └── variant-detector.ts       # NEW
└── prisma/
    └── schema.prisma                 # Update
```

---

## Migration Strategy

### Step 1: Schema Migration
```bash
# Backup first!
pg_dump database_name > backup_before_variants.sql

# Create migration
npx prisma migrate dev --name add_variant_system

# This will:
# - Add columns to Category
# - Add columns to ProductVariant
# - Create VariantAttributeValue table
# - Add variantId to CartItem
# - Add variant fields to OrderItem
# - Create VariantWarehouseStock table
```

### Step 2: Data Migration (if needed)
```sql
-- If you have existing ProductVariants with only 'price' field,
-- copy to basePrice:
UPDATE "ProductVariant"
SET "basePrice" = "price"
WHERE "basePrice" IS NULL;
```

---

## Testing Checklist

### Phase 1 Tests:
- [ ] Schema migrates without data loss
- [ ] Existing products still work
- [ ] New fields are accessible

### Phase 2 Tests:
- [ ] Can configure variant attributes per category
- [ ] Can add/edit price rules
- [ ] Config persists correctly

### Phase 3 Tests:
- [ ] Can create variants for product
- [ ] Can set different prices per variant
- [ ] Can upload variant-specific images
- [ ] Can manage variant stock

### Phase 4 Tests:
- [ ] SKU pattern detection works
- [ ] Grouping creates correct product structure
- [ ] All prices imported correctly
- [ ] Preview shows accurate info

### Phase 5 Tests:
- [ ] Variant selector displays correctly
- [ ] Price updates on selection
- [ ] Images swap on selection
- [ ] Stock shows correctly per variant

### Phase 6 Tests:
- [ ] Cart shows variant info
- [ ] Order captures variant details
- [ ] Stock decrements correctly
- [ ] Order history displays variants

---

## Current Progress

- [x] Project planning
- [ ] Phase 1: Schema Updates
- [ ] Phase 2: Admin Category Config
- [ ] Phase 3: Admin Variant Management
- [ ] Phase 4: Smart Bulk Import
- [ ] Phase 5: Storefront Display
- [ ] Phase 6: Cart & Checkout
- [ ] Phase 7: Testing & Deployment

---

## Notes

### Branch: `claude/fix-import-01AXdT1dcQ6KANxxg3BWXy3F`

### Important Files Already Modified (in previous sessions):
- `/src/app/admin/products/import/page.tsx` - Added Brand/Category/Warehouse/Supplier selectors
- `/src/lib/services/bulk-import.ts` - Fixed field mappings, image paths
- `/src/app/admin/products/delete/page.tsx` - NEW delete page
- `/src/components/admin/AdminSidebar.tsx` - Added Delete Products link

### Server Info:
- Path: `/root/ada/siteJadid`
- Process Manager: PM2
- Database: PostgreSQL with Prisma

---

## How to Continue

If starting a new chat, provide this file and say:
"Read VARIANT_SYSTEM_PLAN.md and continue from Phase 1"

The assistant should:
1. Read this file
2. Read current schema.prisma
3. Start implementing from Phase 1.1
