# Shopping Lists Page

## Overview

The Shopping Lists page (`/shopping-lists`) allows customers to create and manage multiple organized lists of products for different purposes (e.g., "Monthly Supplies", "Emergency Equipment", "Seasonal Orders"). Each list tracks items, quantities, and total value.

**File Location:** `/home/user/siteJadid/src/app/shopping-lists/page.tsx`

**Route:** `/shopping-lists`

---

## Features List

1. **Multiple Lists** - Create and manage unlimited shopping lists
2. **List Overview Cards** - Display each list with key metrics:
   - Product count
   - Total quantity
   - Estimated total value
3. **Default List Badge** - Mark one list as default
4. **Item Management** - Add, edit, remove items from lists
5. **Product Details** - Display product name, SKU, image, price, notes
6. **Quantity Tracking** - Track quantity needed for each item
7. **Priority Sorting** - Items sorted by priority within each list
8. **Bulk Actions** - Add entire list to cart at once
9. **Individual Actions** - Add single items to cart or remove from list
10. **Account-Type Pricing** - Shows B2B/GSA pricing when applicable
11. **Empty State** - Helpful CTA when no lists exist

---

## Database Query

```typescript
async function getShoppingLists(userId: string) {
  const lists = await db.shoppingList.findMany({
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
            },
          },
        },
        orderBy: {
          priority: 'desc',
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: {
      isDefault: 'desc',
    },
  });

  return lists;
}
```

---

## UI Components

### List Card with Stats
```typescript
<div className="bg-white rounded-lg border overflow-hidden">
  {/* List Header */}
  <div className="p-6 border-b bg-gray-50">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold">{list.name}</h3>
          {list.isDefault && (
            <span className="px-2 py-0.5 bg-safety-green-100 text-safety-green-800 text-xs font-medium rounded">
              Default
            </span>
          )}
        </div>
        {list.description && (
          <p className="text-sm text-gray-600">{list.description}</p>
        )}
      </div>
      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>

    {/* Statistics */}
    <div className="flex items-center gap-6 mt-4">
      <div>
        <div className="text-2xl font-bold">{list._count.items}</div>
        <div className="text-xs text-gray-600">Products</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{totalItems}</div>
        <div className="text-xs text-gray-600">Total Qty</div>
      </div>
      <div>
        <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
        <div className="text-xs text-gray-600">Est. Total</div>
      </div>
    </div>
  </div>

  {/* Items List */}
  <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
    {list.items.length === 0 ? (
      <div className="p-8 text-center text-gray-500">No items in this list</div>
    ) : (
      list.items.map((item) => {
        const images = item.product.images as string[];
        let price = Number(item.product.salePrice || item.product.basePrice);

        // Apply account-type pricing
        if (user?.accountType === 'B2B' && item.product.wholesalePrice) {
          price = Number(item.product.wholesalePrice);
        } else if (user?.accountType === 'GSA' && item.product.gsaPrice) {
          price = Number(item.product.gsaPrice);
        }

        return (
          <div key={item.id} className="p-4 hover:bg-gray-50">
            <div className="flex gap-4">
              {/* Product Image */}
              <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                  {images[0] ? (
                    <img src={images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="w-full h-full p-3 text-gray-300" />
                  )}
                </div>
              </Link>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`}>
                  <h4 className="font-semibold hover:text-safety-green-700 line-clamp-2 mb-1">
                    {item.product.name}
                  </h4>
                </Link>
                <div className="text-sm text-gray-600 mb-2">SKU: {item.product.sku}</div>
                {item.notes && (
                  <div className="text-sm text-gray-700 mb-2">Note: {item.notes}</div>
                )}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                  <div className="text-sm font-medium">${price.toFixed(2)} each</div>
                  <div className="text-sm font-bold">${(price * item.quantity).toFixed(2)}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Add to Cart
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  Remove
                </Button>
              </div>
            </div>
          </div>
        );
      })
    )}
  </div>

  {/* Footer with Bulk Action */}
  {list.items.length > 0 && (
    <div className="p-4 border-t bg-gray-50">
      <Button className="w-full bg-safety-green-600 hover:bg-safety-green-700 gap-2">
        <ShoppingCart className="w-4 h-4" />
        Add All to Cart (${totalValue.toFixed(2)})
      </Button>
    </div>
  )}
</div>
```

### Page Header
```typescript
<div className="bg-white border-b">
  <div className="container mx-auto px-4 py-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Shopping Lists</h1>
        <p className="text-gray-600">Organize your products into custom lists</p>
      </div>
      <Button className="gap-2 bg-primary hover:bg-primary/90">
        <Plus className="w-4 h-4" />
        Create List
      </Button>
    </div>
  </div>
</div>
```

### Empty State
```typescript
{lists.length === 0 && (
  <div className="bg-white rounded-lg border p-12 text-center">
    <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <h2 className="text-2xl font-bold text-black mb-2">No Shopping Lists Yet</h2>
    <p className="text-gray-600 mb-6">Create your first list to organize products</p>
    <Button className="gap-2 bg-primary hover:bg-primary/90">
      <Plus className="w-4 h-4" />
      Create Your First List
    </Button>
  </div>
)}
```

---

## Database Schema

```prisma
model ShoppingList {
  id          String              @id @default(cuid())
  userId      String
  name        String
  description String?
  isDefault   Boolean             @default(false)
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt

  user        User                @relation(fields: [userId], references: [id])
  items       ShoppingListItem[]
}

model ShoppingListItem {
  id        String       @id @default(cuid())
  listId    String
  productId String
  quantity  Int          @default(1)
  notes     String?
  priority  Int          @default(0)
  createdAt DateTime     @default(now())

  list      ShoppingList @relation(fields: [listId], references: [id])
  product   Product      @relation(fields: [productId], references: [id])
}
```

---

## Key Features

- **Multiple Lists**: Organize products by purpose or project
- **Default List**: Mark most-used list as default
- **Notes Support**: Add notes to individual list items
- **Priority Sorting**: Items sorted by priority within list
- **Total Calculations**: Real-time total value calculation
- **Account-Type Pricing**: Shows appropriate pricing for B2B/GSA
- **Bulk Actions**: Add entire list to cart with one click
- **Individual Control**: Add or remove items individually
- **Visual Organization**: Clear card-based layout
- **Responsive Grid**: 1-2 column responsive layout

---

## Use Cases

1. **Recurring Orders**: Monthly or seasonal supplies
2. **Project-Based**: Equipment for specific projects
3. **Department Budgets**: Separate lists per department
4. **Emergency Supplies**: Pre-planned emergency equipment
5. **Comparison Shopping**: Save items while deciding
6. **Shared Lists**: Coordinate orders across team members

---

## Future Enhancements

1. **Share Lists** - Share lists with team members or external users
2. **List Templates** - Save lists as templates for reuse
3. **Auto-Reorder** - Set lists to auto-reorder on schedule
4. **Budget Tracking** - Set budget limits per list
5. **Expiration Dates** - Track when items need replacement
6. **Print Lists** - Printer-friendly list format
7. **Import/Export** - Import lists from CSV or export to Excel
