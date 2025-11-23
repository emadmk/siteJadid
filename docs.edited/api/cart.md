# Cart API Documentation

## Overview
The Cart API manages shopping cart functionality for authenticated users. Supports adding items, updating quantities, removing items, and retrieving cart contents with dynamic pricing based on account type (B2C, B2B, GSA).

**Base Path**: `/api/cart`

---

## Endpoints

### 1. Get Cart

**GET** `/api/cart`

Returns the user's shopping cart with all items, product details, and calculated totals. Automatically creates an empty cart if one doesn't exist.

#### Authentication
- ✅ Required

#### Request
```http
GET /api/cart HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "id": "cart_abc123",
  "userId": "user_xyz789",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-16T14:25:00.000Z",
  "items": [
    {
      "id": "item_1",
      "cartId": "cart_abc123",
      "productId": "prod_safety_vest",
      "quantity": 50,
      "price": 23.00,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-16T14:25:00.000Z",
      "product": {
        "id": "prod_safety_vest",
        "sku": "SV-1234",
        "name": "High-Visibility Safety Vest",
        "slug": "high-visibility-safety-vest",
        "description": "ANSI Class 2 compliant safety vest",
        "basePrice": 29.99,
        "salePrice": 25.99,
        "wholesalePrice": 23.00,
        "gsaPrice": 21.50,
        "images": [
          "https://example.com/images/safety-vest-1.jpg"
        ],
        "stockQuantity": 500,
        "status": "ACTIVE",
        "trackInventory": true,
        "category": {
          "id": "cat_safety",
          "name": "Safety Equipment",
          "slug": "safety-equipment"
        }
      }
    },
    {
      "id": "item_2",
      "cartId": "cart_abc123",
      "productId": "prod_hard_hat",
      "quantity": 25,
      "price": 18.00,
      "createdAt": "2025-01-16T09:15:00.000Z",
      "updatedAt": "2025-01-16T09:15:00.000Z",
      "product": {
        "id": "prod_hard_hat",
        "sku": "HH-5678",
        "name": "Safety Hard Hat",
        "slug": "safety-hard-hat",
        "description": "OSHA approved protective hard hat",
        "basePrice": 24.99,
        "salePrice": null,
        "wholesalePrice": 18.00,
        "gsaPrice": 16.50,
        "images": [
          "https://example.com/images/hard-hat-1.jpg"
        ],
        "stockQuantity": 300,
        "status": "ACTIVE",
        "trackInventory": true,
        "category": {
          "id": "cat_safety",
          "name": "Safety Equipment",
          "slug": "safety-equipment"
        }
      }
    }
  ],
  "subtotal": 1600.00,
  "itemCount": 75
}
```

#### Calculated Fields
- **subtotal**: Sum of (item.price × item.quantity) for all items
- **itemCount**: Total quantity of all items in cart

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

### 2. Add to Cart

**POST** `/api/cart`

Adds a product to the cart. If the product already exists in the cart, increases the quantity. Price is determined automatically based on user's account type.

#### Authentication
- ✅ Required

#### Request Body
```json
{
  "productId": "prod_safety_vest",
  "quantity": 10
}
```

#### Field Validation
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| productId | string | ✅ Yes | - | Valid product ID |
| quantity | number | ❌ No | 1 | Must be >= 1 |

#### Pricing Logic
The price is automatically determined based on the user's account type:

1. **GSA Account** (`accountType: 'GSA'`):
   - Uses `gsaPrice` if available
   - Falls back to `salePrice` or `basePrice`

2. **B2B Account** (`accountType: 'B2B'`):
   - Uses `wholesalePrice` if available
   - Falls back to `salePrice` or `basePrice`

3. **B2C Account** (`accountType: 'B2C'`):
   - Uses `salePrice` if available
   - Falls back to `basePrice`

#### Response (200 OK)
```json
{
  "id": "cart_abc123",
  "userId": "user_xyz789",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-16T14:30:00.000Z",
  "items": [
    {
      "id": "item_1",
      "cartId": "cart_abc123",
      "productId": "prod_safety_vest",
      "quantity": 60,
      "price": 23.00,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-16T14:30:00.000Z",
      "product": {
        "id": "prod_safety_vest",
        "sku": "SV-1234",
        "name": "High-Visibility Safety Vest",
        "slug": "high-visibility-safety-vest",
        "basePrice": 29.99,
        "wholesalePrice": 23.00,
        "images": [
          "https://example.com/images/safety-vest-1.jpg"
        ],
        "stockQuantity": 490,
        "category": {
          "id": "cat_safety",
          "name": "Safety Equipment",
          "slug": "safety-equipment"
        }
      }
    }
  ]
}
```

#### Add to Cart Flow
1. **Validate Product**: Ensure product exists and is active
2. **Check Stock**: If `trackInventory` is true, verify sufficient stock
3. **Determine Price**: Based on user's account type
4. **Get or Create Cart**: Ensure user has a cart
5. **Check Existing Item**: If product already in cart, update quantity
6. **Add/Update Item**: Create new item or update existing
7. **Return Updated Cart**: With all items and totals

#### Error Responses
```json
// 400 Bad Request - Missing product ID
{
  "error": "Product ID required"
}

// 400 Bad Request - Insufficient stock
{
  "error": "Insufficient stock"
}

// 400 Bad Request - Product not available
{
  "error": "Product is not available"
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
  "error": "Internal server error"
}
```

---

### 3. Update Cart Item Quantity

**PATCH** `/api/cart/[itemId]`

Updates the quantity of a specific cart item. Cannot reduce quantity below 1 (use DELETE to remove).

#### Authentication
- ✅ Required

#### Request Body
```json
{
  "quantity": 25
}
```

#### Field Validation
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| quantity | number | ✅ Yes | Must be >= 1 |

#### Request
```http
PATCH /api/cart/item_abc123 HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
Content-Type: application/json

{
  "quantity": 25
}
```

#### Response (200 OK)
```json
{
  "id": "cart_abc123",
  "userId": "user_xyz789",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-16T14:35:00.000Z",
  "items": [
    {
      "id": "item_abc123",
      "cartId": "cart_abc123",
      "productId": "prod_safety_vest",
      "quantity": 25,
      "price": 23.00,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-16T14:35:00.000Z",
      "product": {
        "id": "prod_safety_vest",
        "name": "High-Visibility Safety Vest",
        "sku": "SV-1234",
        "images": ["https://example.com/images/safety-vest-1.jpg"],
        "stockQuantity": 500,
        "category": {
          "name": "Safety Equipment"
        }
      }
    }
  ]
}
```

#### Stock Validation
The endpoint checks if the requested quantity is available:
- If `product.trackInventory` is true
- Compares `quantity` against `product.stockQuantity`
- Returns error if insufficient stock with available quantity

#### Error Responses
```json
// 400 Bad Request - Invalid quantity
{
  "error": "Invalid quantity"
}

// 400 Bad Request - Insufficient stock
{
  "error": "Insufficient stock",
  "availableStock": 15
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden - Not user's cart item
{
  "error": "Unauthorized"
}

// 404 Not Found
{
  "error": "Cart item not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

### 4. Remove from Cart

**DELETE** `/api/cart/[itemId]`

Removes a specific item from the cart.

#### Authentication
- ✅ Required

#### Request
```http
DELETE /api/cart/item_abc123 HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "id": "cart_abc123",
  "userId": "user_xyz789",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-16T14:40:00.000Z",
  "items": [
    {
      "id": "item_2",
      "cartId": "cart_abc123",
      "productId": "prod_hard_hat",
      "quantity": 25,
      "price": 18.00,
      "product": {
        "id": "prod_hard_hat",
        "name": "Safety Hard Hat",
        "sku": "HH-5678",
        "images": ["https://example.com/images/hard-hat-1.jpg"],
        "category": {
          "name": "Safety Equipment"
        }
      }
    }
  ]
}
```

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden - Not user's cart item
{
  "error": "Unauthorized"
}

// 404 Not Found
{
  "error": "Cart item not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

### 5. Clear Cart

**DELETE** `/api/cart`

Removes all items from the cart. The cart itself remains but becomes empty.

#### Authentication
- ✅ Required

#### Request
```http
DELETE /api/cart HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "success": true
}
```

#### Use Cases
- User wants to start over
- After order is placed (automatic)
- User wants to clear abandoned cart

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

## Implementation Details

### File Location
- Main route: `src/app/api/cart/route.ts`
- Dynamic route: `src/app/api/cart/[itemId]/route.ts`

### Database Model
```prisma
model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]

  @@index([userId])
}

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

### Security Features
- Users can only access their own cart
- Cart items are verified to belong to user's cart
- Automatic cleanup on user deletion (Cascade)
- Stock validation prevents overselling

### Performance Optimizations
- Single cart per user (unique constraint)
- Indexed by userId and cartId
- Includes product details in single query
- Calculates totals server-side

---

## Usage Examples

### JavaScript/TypeScript (fetch)
```typescript
// Get cart
const cart = await fetch('/api/cart', {
  credentials: 'include'
});
const cartData = await cart.json();
console.log(`Cart has ${cartData.itemCount} items, total: $${cartData.subtotal}`);

// Add to cart
const added = await fetch('/api/cart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    productId: 'prod_safety_vest',
    quantity: 10
  })
});

// Update quantity
const updated = await fetch('/api/cart/item_abc123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    quantity: 5
  })
});

// Remove item
await fetch('/api/cart/item_abc123', {
  method: 'DELETE',
  credentials: 'include'
});

// Clear cart
await fetch('/api/cart', {
  method: 'DELETE',
  credentials: 'include'
});
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

function useCart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    const res = await fetch('/api/cart', { credentials: 'include' });
    const data = await res.json();
    setCart(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (productId, quantity = 1) => {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId, quantity })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }

    const updatedCart = await res.json();
    setCart(updatedCart);
    return updatedCart;
  };

  const updateQuantity = async (itemId, quantity) => {
    const res = await fetch(`/api/cart/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quantity })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }

    const updatedCart = await res.json();
    setCart(updatedCart);
    return updatedCart;
  };

  const removeItem = async (itemId) => {
    const res = await fetch(`/api/cart/${itemId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const updatedCart = await res.json();
    setCart(updatedCart);
    return updatedCart;
  };

  const clearCart = async () => {
    await fetch('/api/cart', {
      method: 'DELETE',
      credentials: 'include'
    });
    await fetchCart(); // Refresh cart
  };

  return {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refresh: fetchCart
  };
}

// Shopping Cart Component
function ShoppingCart() {
  const { cart, loading, updateQuantity, removeItem } = useCart();

  if (loading) return <div>Loading cart...</div>;
  if (!cart || cart.items.length === 0) return <div>Your cart is empty</div>;

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart ({cart.itemCount} items)</h2>

      {cart.items.map(item => (
        <div key={item.id} className="cart-item">
          <img src={item.product.images[0]} alt={item.product.name} />
          <div>
            <h3>{item.product.name}</h3>
            <p>SKU: {item.product.sku}</p>
            <p>Price: ${item.price.toFixed(2)}</p>
          </div>
          <div>
            <input
              type="number"
              min="1"
              max={item.product.stockQuantity}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
            />
            <button onClick={() => removeItem(item.id)}>Remove</button>
          </div>
          <div>
            Subtotal: ${(item.price * item.quantity).toFixed(2)}
          </div>
        </div>
      ))}

      <div className="cart-total">
        <h3>Total: ${cart.subtotal.toFixed(2)}</h3>
        <button onClick={() => window.location.href = '/checkout'}>
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}
```

### Add to Cart Button Component
```typescript
function AddToCartButton({ productId, initialQuantity = 1 }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const handleAddToCart = async () => {
    setAdding(true);
    setError(null);

    try {
      await addToCart(productId, quantity);
      alert('Added to cart!');
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value))}
      />
      <button onClick={handleAddToCart} disabled={adding}>
        {adding ? 'Adding...' : 'Add to Cart'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

## Related Documentation
- [Orders API](./orders.md) - Creating orders from cart
- [Products API](../admin-api/products.md) - Product catalog
- [Checkout Page](../pages/customer-checkout.md) - Checkout flow
- [Cart Page](../pages/customer-cart.md) - Cart management UI
