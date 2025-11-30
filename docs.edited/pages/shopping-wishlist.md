# Wishlist Page

## Overview

The Wishlist Page (`/wishlist`) allows customers to save products they're interested in for later purchase. It displays saved items with pricing (adjusted for account type), stock status, and quick add-to-cart functionality.

**File Location:** `/home/user/siteJadid/src/app/wishlist/page.tsx`

**Route:** `/wishlist`

---

## Features List

1. **Wishlist Display** - Grid view of saved products (1/2/3/4 columns responsive)
2. **Dynamic Pricing** - Shows B2B wholesale or GSA pricing when applicable
3. **Stock Indicators** - Visual "Out of Stock" overlay on unavailable items
4. **Sale Badges** - "SALE" indicator for discounted items
5. **Product Information** - Name, SKU, category, ratings, price
6. **Quick Actions** - Add to cart, remove from wishlist
7. **Bulk Add** - "Add All to Cart" button for all in-stock items
8. **Empty State** - "Browse Products" CTA when wishlist is empty
9. **Auto-Create** - Automatically creates wishlist on first visit

---

## Database Query

```typescript
async function getWishlist(userId: string) {
  let wishlist = await db.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              slug: true,
              basePrice: true,
              salePrice: true,
              wholesalePrice: true,
              gsaPrice: true,
              images: true,
              stockQuantity: true,
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              reviews: {
                select: {
                  rating: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  // Auto-create wishlist if doesn't exist
  if (!wishlist) {
    wishlist = await db.wishlist.create({
      data: { userId },
      include: { items: { include: { product: { /* ... */ } } } },
    });
  }

  return wishlist;
}
```

---

## UI Components

### Wishlist Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {wishlist.items.map((item) => {
    const images = item.product.images as string[];
    let price = Number(item.product.salePrice || item.product.basePrice);

    // Apply account-type pricing
    if (user?.accountType === 'B2B' && item.product.wholesalePrice) {
      price = Number(item.product.wholesalePrice);
    } else if (user?.accountType === 'GSA' && item.product.gsaPrice) {
      price = Number(item.product.gsaPrice);
    }

    const hasDiscount = item.product.salePrice &&
      Number(item.product.salePrice) < Number(item.product.basePrice);

    return (
      <div key={item.id} className="bg-white rounded-lg border overflow-hidden group">
        <div className="relative">
          <Link href={`/products/${item.product.slug}`}>
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <img
                src={images[0]}
                alt={item.product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          </Link>

          {/* Remove Button */}
          <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50">
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>

          {/* Sale Badge */}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              SALE
            </div>
          )}

          {/* Out of Stock Overlay */}
          {item.product.stockQuantity === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-white text-black px-4 py-2 rounded font-semibold">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          {item.product.category && (
            <div className="text-xs text-safety-green-600 font-medium mb-1">
              {item.product.category.name}
            </div>
          )}
          <Link href={`/products/${item.product.slug}`}>
            <h3 className="font-semibold hover:text-safety-green-700 line-clamp-2 mb-2">
              {item.product.name}
            </h3>
          </Link>

          <div className="text-sm text-gray-600 mb-2">SKU: {item.product.sku}</div>

          <div className="flex items-center gap-2 mb-3">
            <div className="text-xl font-bold">${price.toFixed(2)}</div>
            {hasDiscount && (
              <div className="text-sm text-gray-500 line-through">
                ${Number(item.product.basePrice).toFixed(2)}
              </div>
            )}
          </div>

          {item.product.stockQuantity > 0 ? (
            <Button className="w-full bg-primary hover:bg-primary/90 gap-2">
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              Out of Stock
            </Button>
          )}

          <div className="text-xs text-gray-600 mt-2">
            Added {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  })}
</div>
```

### Header with Bulk Action
```typescript
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold">My Wishlist</h1>
    <p className="text-gray-600">
      {wishlist.items.length} {wishlist.items.length === 1 ? 'item' : 'items'} saved
    </p>
  </div>
  {wishlist.items.length > 0 && (
    <Button className="gap-2 bg-primary hover:bg-primary/90">
      <ShoppingCart className="w-4 h-4" />
      Add All to Cart
    </Button>
  )}
</div>
```

---

## Key Features

- **Account-Type Pricing**: Automatically applies B2B/GSA pricing
- **Visual Stock Status**: Clear indicators for out-of-stock items
- **Sale Indicators**: Highlights discounted products
- **Image Hover Effect**: Subtle scale effect on hover
- **Remove Functionality**: Easy removal with trash icon
- **Date Added**: Shows when item was added to wishlist
- **Empty State**: Encourages browsing when empty
- **Auto-Creation**: Creates wishlist automatically if it doesn't exist

---

## Database Schema

```prisma
model Wishlist {
  id        String         @id @default(cuid())
  userId    String         @unique
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  user      User           @relation(fields: [userId], references: [id])
  items     WishlistItem[]
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  productId  String
  createdAt  DateTime @default(now())

  wishlist   Wishlist @relation(fields: [wishlistId], references: [id])
  product    Product  @relation(fields: [productId], references: [id])
}
```

---

## Future Enhancements

1. **Share Wishlist** - Share wishlist with others via link
2. **Multiple Wishlists** - Create and organize multiple wishlists
3. **Price Drop Alerts** - Notify when items go on sale
4. **Stock Alerts** - Notify when out-of-stock items are back
5. **Wishlist Privacy** - Public/private wishlist settings
