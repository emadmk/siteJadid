# Wishlist API Documentation

## Overview
The Wishlist API allows authenticated users to save products for later purchase. Users can add products to their wishlist, view saved items, and remove products they're no longer interested in.

**Base Path**: `/api/wishlist`

---

## Endpoints

### 1. Get Wishlist

**GET** `/api/wishlist`

Returns all products in the user's wishlist with full product details including pricing, stock, and images.

#### Authentication
- ✅ Required

#### Request
```http
GET /api/wishlist HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
[
  {
    "id": "wish_abc123",
    "userId": "user_xyz789",
    "productId": "prod_safety_vest",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "product": {
      "id": "prod_safety_vest",
      "sku": "SV-1234",
      "name": "High-Visibility Safety Vest",
      "slug": "high-visibility-safety-vest",
      "description": "ANSI Class 2 compliant safety vest with reflective strips",
      "basePrice": 29.99,
      "salePrice": 25.99,
      "wholesalePrice": 23.00,
      "gsaPrice": 21.50,
      "images": [
        "https://example.com/images/safety-vest-1.jpg",
        "https://example.com/images/safety-vest-2.jpg"
      ],
      "stockQuantity": 500,
      "rating": 4.7,
      "isActive": true,
      "category": {
        "id": "cat_safety",
        "name": "Safety Equipment",
        "slug": "safety-equipment"
      }
    }
  },
  {
    "id": "wish_def456",
    "userId": "user_xyz789",
    "productId": "prod_hard_hat",
    "createdAt": "2025-01-14T14:20:00.000Z",
    "product": {
      "id": "prod_hard_hat",
      "sku": "HH-5678",
      "name": "Safety Hard Hat",
      "slug": "safety-hard-hat",
      "description": "OSHA approved protective hard hat with adjustable suspension",
      "basePrice": 24.99,
      "salePrice": null,
      "wholesalePrice": 18.00,
      "gsaPrice": 16.50,
      "images": [
        "https://example.com/images/hard-hat-1.jpg"
      ],
      "stockQuantity": 300,
      "rating": 4.8,
      "isActive": true,
      "category": {
        "id": "cat_safety",
        "name": "Safety Equipment",
        "slug": "safety-equipment"
      }
    }
  }
]
```

#### Response Details
Items are ordered by `createdAt` descending (most recently added first).

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch wishlist"
}
```

---

### 2. Add to Wishlist

**POST** `/api/wishlist`

Adds a product to the user's wishlist. If the product is already in the wishlist, returns an error.

#### Authentication
- ✅ Required

#### Request Body
```json
{
  "productId": "prod_safety_vest"
}
```

#### Field Validation
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| productId | string | ✅ Yes | Must be a valid, existing product ID |

#### Response (201 Created)
```json
{
  "id": "wish_new789",
  "userId": "user_xyz789",
  "productId": "prod_safety_vest",
  "createdAt": "2025-01-16T15:30:00.000Z",
  "product": {
    "id": "prod_safety_vest",
    "sku": "SV-1234",
    "name": "High-Visibility Safety Vest",
    "slug": "high-visibility-safety-vest",
    "basePrice": 29.99,
    "salePrice": 25.99,
    "wholesalePrice": 23.00,
    "gsaPrice": 21.50,
    "images": [
      "https://example.com/images/safety-vest-1.jpg"
    ],
    "stockQuantity": 500
  }
}
```

#### Error Responses
```json
// 400 Bad Request - Missing product ID
{
  "error": "Product ID is required"
}

// 400 Bad Request - Already in wishlist
{
  "error": "Product already in wishlist"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 404 Not Found - Product doesn't exist
{
  "error": "Product not found"
}

// 500 Internal Server Error
{
  "error": "Failed to add to wishlist"
}
```

---

### 3. Remove from Wishlist

**DELETE** `/api/wishlist`

Removes a product from the user's wishlist. Uses query parameter to specify which product to remove.

#### Authentication
- ✅ Required

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productId | string | ✅ Yes | ID of the product to remove |

#### Request
```http
DELETE /api/wishlist?productId=prod_safety_vest HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "success": true
}
```

#### Error Responses
```json
// 400 Bad Request - Missing product ID
{
  "error": "Product ID is required"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to remove from wishlist"
}
```

---

## Wishlist Features

### Product Availability Tracking
When viewing the wishlist, users can see:
- **In Stock**: Product is available for immediate purchase
- **Low Stock**: Stock quantity is below threshold
- **Out of Stock**: Product is unavailable
- **Inactive**: Product has been discontinued or deactivated

### Price Changes
The wishlist shows current pricing, so users can track:
- Price drops (sale prices)
- Account-specific pricing (B2B/GSA discounts)
- Original price for comparison

### Quick Actions
From wishlist items, users can:
1. **Add to Cart**: Directly add wishlist items to shopping cart
2. **Remove**: Remove items they're no longer interested in
3. **View Details**: Navigate to full product page
4. **Share**: Share wishlist with others (future feature)

---

## Implementation Details

### File Location
- Main route: `src/app/api/wishlist/route.ts`

### Database Model
```prisma
model Wishlist {
  id        String         @id @default(cuid())
  userId    String         @unique
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     WishlistItem[]

  @@index([userId])
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  productId  String
  createdAt  DateTime @default(now())

  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([wishlistId, productId])
  @@index([wishlistId])
  @@index([productId])
}
```

### Security Features
- Users can only access their own wishlist
- Automatic cleanup on user deletion (Cascade)
- Unique constraint prevents duplicate products
- Product validation before adding

### Performance Optimizations
- Indexed by userId, wishlistId, and productId
- Unique constraint on (wishlistId, productId)
- Ordered by createdAt descending
- Includes product details in single query

---

## Usage Examples

### JavaScript/TypeScript (fetch)
```typescript
// Get wishlist
const wishlist = await fetch('/api/wishlist', {
  credentials: 'include'
});
const items = await wishlist.json();
console.log(`You have ${items.length} items in your wishlist`);

// Add to wishlist
const added = await fetch('/api/wishlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    productId: 'prod_safety_vest'
  })
});

if (added.ok) {
  console.log('Added to wishlist!');
} else {
  const error = await added.json();
  console.error(error.error);
}

// Remove from wishlist
await fetch('/api/wishlist?productId=prod_safety_vest', {
  method: 'DELETE',
  credentials: 'include'
});
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

function useWishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    const res = await fetch('/api/wishlist', { credentials: 'include' });
    const data = await res.json();
    setWishlist(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const addToWishlist = async (productId) => {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const newItem = await res.json();
      setWishlist([newItem, ...wishlist]);
      return newItem;
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      throw error;
    }
  };

  const removeFromWishlist = async (productId) => {
    await fetch(`/api/wishlist?productId=${productId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    setWishlist(wishlist.filter(item => item.productId !== productId));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.productId === productId);
  };

  return {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refresh: fetchWishlist
  };
}

// Wishlist Page Component
function WishlistPage() {
  const { wishlist, loading, removeFromWishlist } = useWishlist();

  if (loading) return <div>Loading wishlist...</div>;
  if (wishlist.length === 0) {
    return (
      <div>
        <h2>Your Wishlist is Empty</h2>
        <p>Save items you love to buy them later!</p>
        <a href="/products">Browse Products</a>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <h1>My Wishlist ({wishlist.length} items)</h1>

      <div className="wishlist-grid">
        {wishlist.map(item => (
          <div key={item.id} className="wishlist-item">
            <img
              src={item.product.images[0]}
              alt={item.product.name}
            />
            <h3>{item.product.name}</h3>
            <p>SKU: {item.product.sku}</p>

            <div className="price">
              {item.product.salePrice ? (
                <>
                  <span className="sale-price">
                    ${item.product.salePrice.toFixed(2)}
                  </span>
                  <span className="original-price">
                    ${item.product.basePrice.toFixed(2)}
                  </span>
                </>
              ) : (
                <span>${item.product.basePrice.toFixed(2)}</span>
              )}
            </div>

            <div className="stock-status">
              {item.product.stockQuantity > 0 ? (
                <span className="in-stock">In Stock ({item.product.stockQuantity})</span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
            </div>

            <div className="actions">
              <button
                onClick={() => addToCart(item.productId)}
                disabled={item.product.stockQuantity === 0}
              >
                Add to Cart
              </button>
              <button onClick={() => removeFromWishlist(item.productId)}>
                Remove
              </button>
            </div>

            <p className="added-date">
              Added {new Date(item.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Wishlist Button Component
```typescript
function WishlistButton({ productId }) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [loading, setLoading] = useState(false);

  const inWishlist = isInWishlist(productId);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      {loading ? '...' : inWishlist ? '❤️' : '🤍'}
      {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
    </button>
  );
}
```

### Price Alert Component
```typescript
function PriceDropAlert({ wishlistItem }) {
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');

  const handleSetAlert = async () => {
    // Future feature: Set price drop alert
    const alert = {
      productId: wishlistItem.productId,
      targetPrice: parseFloat(targetPrice),
      userEmail: user.email
    };

    await fetch('/api/price-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(alert)
    });

    setAlertEnabled(true);
  };

  return (
    <div className="price-alert">
      <label>
        Notify me when price drops below:
        <input
          type="number"
          step="0.01"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="$0.00"
        />
      </label>
      <button onClick={handleSetAlert} disabled={alertEnabled}>
        {alertEnabled ? 'Alert Set ✓' : 'Set Alert'}
      </button>
    </div>
  );
}
```

---

## Best Practices

### User Experience
1. **Show wishlist count**: Display number of items in header/navigation
2. **Quick add/remove**: One-click toggle on product cards
3. **Price tracking**: Highlight price drops on wishlist items
4. **Stock alerts**: Notify when out-of-stock items are available
5. **Move to cart**: Easy bulk or individual add-to-cart from wishlist

### Performance
1. **Cache wishlist**: Store in local state/Redux to minimize API calls
2. **Optimistic updates**: Update UI immediately, sync with server
3. **Lazy load images**: Improve page load time for large wishlists
4. **Pagination**: For users with 50+ wishlist items

### Features to Consider
1. **Wishlist sharing**: Generate shareable links (wedding/gift registries)
2. **Multiple wishlists**: Allow users to organize items into lists
3. **Price drop notifications**: Email alerts when prices decrease
4. **Stock notifications**: Alert when out-of-stock items are available
5. **Wishlist analytics**: Track most-wishlisted products

---

## Related Documentation
- [Cart API](./cart.md) - Moving wishlist items to cart
- [Products API](../admin-api/products.md) - Product catalog
- [Wishlist Page](../pages/customer-wishlist.md) - Wishlist management UI
- [Product Page](../pages/customer-product-detail.md) - Add to wishlist button
