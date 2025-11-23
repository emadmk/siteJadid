# Product Comparison Page

## Overview

The Product Comparison page (`/compare`) allows customers to compare up to 4 products side-by-side across multiple attributes including pricing, specifications, features, certifications, and availability.

**File Location:** `/home/user/siteJadid/src/app/compare/page.tsx`

**Route:** `/compare`

**URL Parameters:** `?ids=product1,product2,product3,product4`

---

## Features List

1. **Side-by-Side Comparison** - Compare up to 4 products simultaneously
2. **Comparison Table** - Scrollable table with sticky feature column
3. **Product Images** - Large product images at top of each column
4. **Add to Cart** - Quick add to cart from comparison view
5. **Remove Products** - Remove individual products from comparison
6. **Add More** - Add additional products (up to 4 total)
7. **Feature Rows** - Compare across multiple attributes:
   - Price
   - Availability (in stock / out of stock)
   - Category
   - Weight
   - Dimensions
   - Certifications
   - Description
8. **Empty State** - Helpful message when no products selected

---

## UI Components

### Comparison Table
```typescript
<div className="bg-white rounded-lg border overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="p-4 text-left bg-gray-50 w-48 sticky left-0">Feature</th>
          {/* Product columns */}
          {products.map((product) => (
            <th key={product.id} className="p-4 min-w-[280px]">
              <div className="text-center">
                <div className="w-full h-48 bg-gray-100 rounded mb-4">
                  <img src={product.images[0]} alt={product.name} />
                </div>
                <div className="font-bold text-black mb-2">{product.name}</div>
                <div className="text-2xl font-bold text-black mb-4">
                  ${product.price.toFixed(2)}
                </div>
                <div className="space-y-2">
                  <Button className="w-full bg-primary hover:bg-primary/90 gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <X className="w-4 h-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {/* Price Row */}
        <tr className="border-b hover:bg-gray-50">
          <td className="p-4 font-medium bg-gray-50 sticky left-0">Price</td>
          {products.map((product) => (
            <td key={product.id} className="p-4 text-center">
              ${product.price.toFixed(2)}
            </td>
          ))}
        </tr>

        {/* Availability Row */}
        <tr className="border-b hover:bg-gray-50">
          <td className="p-4 font-medium bg-gray-50 sticky left-0">Availability</td>
          {products.map((product) => (
            <td key={product.id} className="p-4 text-center">
              {product.stockQuantity > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-safety-green-100 text-safety-green-800 text-sm rounded">
                  <CheckCircle className="w-3 h-3" />
                  In Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-sm rounded">
                  <XCircle className="w-3 h-3" />
                  Out of Stock
                </span>
              )}
            </td>
          ))}
        </tr>

        {/* Other comparison rows... */}
      </tbody>
    </table>
  </div>
</div>
```

### Empty State
```typescript
{productIds.length === 0 && (
  <div className="min-h-screen bg-gray-50">
    <div className="container mx-auto px-4 py-16">
      <div className="bg-white rounded-lg border p-12 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-4">Product Comparison</h1>
        <p className="text-gray-600 mb-8">
          Add products to your comparison to see features side-by-side.
          You can compare up to 4 products at once.
        </p>
        <Link href="/products">
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Browse Products
          </Button>
        </Link>
      </div>
    </div>
  </div>
)}
```

### Header Controls
```typescript
<div className="bg-white border-b">
  <div className="container mx-auto px-4 py-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Compare Products</h1>
        <p className="text-gray-600">Comparing {productIds.length} products</p>
      </div>
      <div className="flex gap-3">
        {productIds.length < 4 && (
          <Link href="/products">
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
        )}
        <Button variant="outline">Clear All</Button>
      </div>
    </div>
  </div>
</div>
```

---

## Comparison Attributes

### Standard Attributes
- **Price** - Current price (account-type adjusted)
- **Availability** - In stock / Out of stock with color indicators
- **Category** - Product category
- **Weight** - Shipping weight
- **Dimensions** - Product dimensions
- **Certifications** - Safety certifications (ANSI, OSHA, etc.)
- **Description** - Product description
- **SKU** - Product SKU
- **Brand** - Manufacturer/brand

### Visual Indicators
- ✓ **Green badges** for in-stock items
- ✗ **Red badges** for out-of-stock items
- **Blue badges** for certifications
- **Price highlighting** for best value

---

## URL Structure

```
/compare?ids=prod1,prod2,prod3,prod4
```

### Examples
```
/compare?ids=abc123
/compare?ids=abc123,def456
/compare?ids=abc123,def456,ghi789,jkl012
```

---

## Key Features

- **Sticky Feature Column**: Feature names stay visible while scrolling horizontally
- **Responsive Layout**: Horizontal scroll on mobile for 4-column layout
- **Dynamic Columns**: 1-4 columns based on number of products
- **Quick Actions**: Add to cart and remove directly from comparison
- **Visual Hierarchy**: Clear separation of header, features, and actions
- **Empty State**: Helpful guidance when no products selected
- **Limit Enforcement**: Maximum 4 products enforced

---

## Future Enhancements

1. **Save Comparisons** - Save comparison sets for later
2. **Share Comparisons** - Share comparison link with others
3. **Print View** - Printer-friendly comparison layout
4. **Export** - Download comparison as PDF
5. **Custom Attributes** - Choose which attributes to compare
6. **Highlight Differences** - Visually highlight where products differ
7. **Best Value Indicator** - Highlight best value option
