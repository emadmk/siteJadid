# 9. Product Management & Import

## Product Data Model

```typescript
Product {
  sku: string           // Unique, e.g., "3M-7100405758" or "CHT-FT8500-M-8M"
  vendorPartNumber      // Manufacturer's part number
  name: string          // Display name
  slug: string          // URL-friendly (auto-generated)
  description: string   // Full HTML description
  shortDescription      // Summary text
  
  // Pricing
  basePrice: Decimal     // Standard retail price
  salePrice?: Decimal    // Sale price (overrides base)
  wholesalePrice?: Decimal  // B2B price
  gsaPrice?: Decimal     // Government price
  costPrice?: Decimal    // Purchase cost (internal)
  priceUnit: string      // "ea", "case", "roll", "carton", "pack"
  
  // Inventory
  stockQuantity: number  // Available stock
  minimumOrderQty: number // Minimum order quantity
  
  // Status
  status: DRAFT | PRERELEASE | ACTIVE | INACTIVE | OUT_OF_STOCK | DISCONTINUED
  
  // Relations
  categoryId → Category
  brandId → Brand
  defaultSupplierId → Supplier
  defaultWarehouseId → Warehouse
  variants[] → ProductVariant
  images[] → string[] (URLs)
  
  // Flags
  isFeatured, isBestSeller, isNewArrival, taaApproved
}
```

## Product Lifecycle

```
Excel Import → PRERELEASE (hidden from store)
     ↓
Admin Reviews → Assigns category, checks price, uploads images
     ↓
Release → ACTIVE (visible on store)
     ↓
Optional: INACTIVE / DISCONTINUED / OUT_OF_STOCK
```

## Import System

### Brand-Specific Importers

| Importer | File | Brands |
|----------|------|--------|
| 3M | `src/lib/services/3m-import.ts` | 3M, Standard Abrasives |
| Carhartt | `src/lib/services/carhartt-import.ts` | Carhartt |
| OccuNomix | `src/lib/services/occunomix-import.ts` | OccuNomix |
| PIP | `src/lib/services/pip-import.ts` | PIP, ATG, Assurance, etc. |
| Wolverine | `src/lib/services/wolverine-import.ts` | Bates, Keen, Wolverine |
| Generic | `src/lib/services/bulk-import.ts` | Any (Excel mapping) |

### Import Flow

```
Upload Excel → Parse rows → Validate data → Create/Update products
                                           → Auto-detect variants
                                           → Set TAA status
                                           → Assign brand
                                           → Status = PRERELEASE
```

### 3M Import Details (`3m-import.ts`)

**Excel columns used**:
- 3M Stock # → SKU prefix: `3M-{stockNumber}`
- ADA Sale Price → `basePrice` (per unit)
- ADA Gov Price → `gsaPrice` (per unit)
- Net Price New → `costPrice`
- 3M Minimum Order Qty → `minimumOrderQty`
- Sales UOM → `priceUnit`
- Product Category Level 1/2 → `originalCategory`
- TAA Compliant → `taaApproved`

### Bulk Release (PreRelease Page)

Admin can select multiple products and release them:
1. Select products (checkbox, persists across pages)
2. Assign category (required) + brand (optional)
3. Click "Release Selected"
4. API: POST `/api/admin/products/bulk-release`
5. Sets status = ACTIVE, creates ProductCategory relation

## Image Management

### Image Processing (`src/lib/services/image-processor.ts`)

```
Upload → Sharp processing → 4 sizes:
  ├── original (90% quality)
  ├── large (1200px width, 85%)
  ├── medium (600px width, 80%)
  └── thumb (200x200, 75%)
All converted to WebP format.
```

**Storage**: `public/uploads/products/{brand}/{sku}/`

### Image Import Scripts

| Script | Purpose |
|--------|---------|
| `scripts/import-3m-images.ts` | Batch 1: SKU_result.jpg → product |
| `scripts/import-3m-images-batch2.ts` | Batch 2: SKU.jpg, SKU-2.jpg (multi-image) |

### Grainger Images

| Script | Purpose |
|--------|---------|
| `scripts/grainger-download.js` | Download standard quality images |
| `scripts/grainger-download-hq.js` | Download HQ images (no resize) |
| `scripts/grainger-dashboard.js` | Web dashboard for monitoring (port 9876) |

**Storage**: `/root/grainger-images/` (moved from public/ to avoid Next.js crash)

## Variants

```typescript
ProductVariant {
  sku: string      // e.g., "CHT-FT8500-M-8M"
  name: string     // e.g., "Size: 8M"
  color?: string
  size?: string
  type?: string
  material?: string
  price?: Decimal
  stockQuantity: number
}
```

Auto-detected from product names during import via `variant-detector.ts`.

## Pricing

### Price Tiers by Account Type

| Account Type | Price Field | Tax |
|-------------|-------------|-----|
| PERSONAL / B2C | `basePrice` | Per-type rate from TaxSettings |
| VOLUME_BUYER / B2B | `wholesalePrice` (or basePrice) | Per-type rate |
| GOVERNMENT / GSA | `gsaPrice` (or basePrice) | Per-type rate |

### Discount System (`src/lib/discounts.ts`)

```
Calculate discount:
1. Check account type → get price field
2. Check category discounts
3. Check product-specific discounts
4. Check tiered pricing (volume)
5. Apply coupon (if any)
6. Return final price
```

---

*Next: [10 - Orders & Payments](./10-orders.md)*
