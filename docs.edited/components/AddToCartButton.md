# AddToCartButton Component Documentation

## Overview
A client-side React component that allows users to add products to their shopping cart with quantity selection and stock validation.

**File Location**: `src/components/product/AddToCartButton.tsx`

**Type**: Client Component (`'use client'`)

---

## Component Purpose

The `AddToCartButton` provides a user-friendly interface for adding products to the cart with:
- Quantity selection
- Stock availability checking
- Real-time cart updates
- Loading states
- Error handling
- Success feedback

---

## Props Interface

```typescript
interface AddToCartButtonProps {
  productId: string;      // Unique product identifier
  stockQuantity: number;  // Available stock for the product
}
```

### Prop Descriptions

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| productId | string | ✅ Yes | The ID of the product to add to cart |
| stockQuantity | number | ✅ Yes | Current available stock quantity |

---

## Component State

```typescript
const [quantity, setQuantity] = useState(1);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState('');
```

### State Variables

- **quantity** - Currently selected quantity (default: 1)
- **loading** - API call in progress flag
- **message** - Success/error message for user feedback

---

## Features

### 1. Quantity Selection
- Increment/decrement buttons
- Direct number input
- Min value: 1
- Max value: Available stock quantity
- Disabled when out of stock

### 2. Stock Validation
- Real-time stock checking
- Prevents adding more than available
- Displays "Out of Stock" when stock = 0
- Shows remaining quantity for low stock

### 3. Add to Cart
- API call to `/api/cart/items`
- Loading state during API call
- Success message on completion
- Error handling with user feedback

### 4. User Feedback
- Success messages (green)
- Error messages (red)
- Auto-dismiss after 3 seconds
- Loading spinner on button

---

## Implementation

### Full Component Code

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

interface AddToCartButtonProps {
  productId: string;
  stockQuantity: number;
}

export function AddToCartButton({ productId, stockQuantity }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddToCart = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });

      if (response.ok) {
        setMessage('Added to cart!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to add to cart');
      }
    } catch (error) {
      setMessage('Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (stockQuantity === 0) {
    return (
      <Button size="lg" disabled className="w-full">
        Out of Stock
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity:</span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <input
            type="number"
            min={1}
            max={stockQuantity}
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= 1 && val <= stockQuantity) {
                setQuantity(val);
              }
            }}
            className="w-16 text-center border rounded px-2 py-1"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={incrementQuantity}
            disabled={quantity >= stockQuantity}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full bg-safety-green-600 hover:bg-safety-green-700"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Adding...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart
          </>
        )}
      </Button>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`text-sm text-center p-2 rounded ${
            message.includes('success') || message.includes('Added')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
```

---

## User Flows

### Flow 1: Add Product to Cart (Success)

```
1. User lands on product page
   └─► Component renders with stock quantity

2. User adjusts quantity (optional)
   ├─► Click + to increment
   ├─► Click - to decrement
   └─► Type number directly

3. User clicks "Add to Cart"
   └─► Button shows loading spinner

4. API call to /api/cart/items
   └─► POST with productId and quantity

5. Success response received
   ├─► Green success message appears
   ├─► Message auto-dismisses after 3s
   └─► Cart count updates (if CartContext used)

6. User can add more or navigate away
```

### Flow 2: Out of Stock Scenario

```
1. Product has stockQuantity = 0
   └─► Component renders disabled button

2. Button displays "Out of Stock"
   └─► User cannot interact

3. Quantity selector is hidden
   └─► No way to add to cart
```

### Flow 3: Limited Stock Warning

```
1. Product has stockQuantity = 5
   └─► Component renders normally

2. User tries to select quantity = 10
   ├─► Input prevents value > 5
   ├─► + button disabled when quantity = 5
   └─► Warning message (optional)

3. User must select ≤ 5 items
```

---

## API Integration

### Endpoint Used

**POST** `/api/cart/items`

**Request Body:**
```json
{
  "productId": "prod_abc123",
  "quantity": 2
}
```

**Success Response (200):**
```json
{
  "id": "cart_item_xyz",
  "cartId": "cart_user123",
  "productId": "prod_abc123",
  "quantity": 2,
  "price": 25.00,
  "product": {
    "name": "Safety Vest",
    "basePrice": 25.00
  }
}
```

**Error Response (400):**
```json
{
  "error": "Insufficient stock"
}
```

---

## Styling

### Tailwind Classes Used

```css
/* Button States */
.bg-safety-green-600        /* Primary button background */
.hover:bg-safety-green-700  /* Hover state */
.w-full                      /* Full width button */

/* Quantity Controls */
.flex.items-center.gap-2     /* Horizontal layout */
.w-16.text-center            /* Centered number input */

/* Messages */
.bg-green-100.text-green-800 /* Success message */
.bg-red-100.text-red-800     /* Error message */

/* Loading Spinner */
.animate-spin                /* Rotation animation */
.rounded-full                /* Circular shape */
.border-b-2.border-white     /* White border bottom */
```

---

## Usage Examples

### Basic Usage on Product Page

```tsx
import { AddToCartButton } from '@/components/product/AddToCartButton';

export default function ProductPage({ product }: { product: Product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.basePrice}</p>

      <AddToCartButton
        productId={product.id}
        stockQuantity={product.stockQuantity}
      />
    </div>
  );
}
```

### With Conditional Rendering

```tsx
{product.status === 'ACTIVE' && product.stockQuantity > 0 ? (
  <AddToCartButton
    productId={product.id}
    stockQuantity={product.stockQuantity}
  />
) : (
  <Button disabled>Unavailable</Button>
)}
```

### In Product Card (Catalog)

```tsx
<div className="product-card">
  <img src={product.images[0]} alt={product.name} />
  <h3>{product.name}</h3>
  <p>${product.basePrice}</p>

  <AddToCartButton
    productId={product.id}
    stockQuantity={product.stockQuantity}
  />
</div>
```

---

## Accessibility

### Keyboard Navigation
- ✅ Tab through all interactive elements
- ✅ Enter/Space to click buttons
- ✅ Arrow keys for number input

### Screen Reader Support
```tsx
<Button aria-label={`Add ${quantity} items to cart`}>
  Add to Cart
</Button>

<input
  type="number"
  aria-label="Quantity"
  aria-valuemin={1}
  aria-valuemax={stockQuantity}
  aria-valuenow={quantity}
/>
```

### ARIA Attributes
- `aria-label` - Descriptive labels
- `aria-disabled` - Disabled state
- `aria-live="polite"` - Message announcements

---

## Performance Optimizations

### 1. Debounced API Calls
Consider adding debounce for rapid clicks:

```tsx
import { useCallback } from 'react';
import debounce from 'lodash/debounce';

const debouncedAddToCart = useCallback(
  debounce(handleAddToCart, 300),
  [productId, quantity]
);
```

### 2. Optimistic UI Updates
Update UI before API response:

```tsx
const handleAddToCart = async () => {
  // Immediately show success message
  setMessage('Adding to cart...');

  try {
    await fetch('/api/cart/items', { /* ... */ });
    setMessage('Added to cart!');
  } catch {
    setMessage('Failed to add to cart');
    // Revert optimistic update
  }
};
```

---

## Error Handling

### Common Errors

| Error | Cause | User Message |
|-------|-------|--------------|
| 401 Unauthorized | User not logged in | "Please sign in to add items" |
| 400 Insufficient stock | Not enough stock | "Only X items available" |
| 404 Product not found | Invalid productId | "Product not found" |
| 500 Server error | Database issue | "Something went wrong. Try again." |

### Error Handling Code

```tsx
try {
  const response = await fetch('/api/cart/items', { /* ... */ });

  if (!response.ok) {
    const error = await response.json();

    if (response.status === 401) {
      setMessage('Please sign in to add items to cart');
    } else if (response.status === 400) {
      setMessage(error.error || 'Insufficient stock');
    } else {
      setMessage('Failed to add to cart. Please try again.');
    }
    return;
  }

  setMessage('Added to cart!');
} catch (error) {
  console.error('Cart error:', error);
  setMessage('Network error. Please check your connection.');
}
```

---

## Future Enhancements

### 1. Cart Context Integration
```tsx
import { useCart } from '@/contexts/CartContext';

const { addItem, cartCount } = useCart();

const handleAddToCart = async () => {
  await addItem(productId, quantity);
  setMessage(`Added! Cart now has ${cartCount} items`);
};
```

### 2. Price Display
```tsx
<div className="text-sm text-gray-600">
  Subtotal: ${(product.basePrice * quantity).toFixed(2)}
</div>
```

### 3. Wishlist Alternative
```tsx
{stockQuantity === 0 && (
  <Button variant="outline" onClick={addToWishlist}>
    Add to Wishlist
  </Button>
)}
```

### 4. Bulk Discount Indicator
```tsx
{quantity >= 10 && (
  <div className="text-sm text-green-600">
    🎉 Bulk discount applied: 10% off!
  </div>
)}
```

---

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AddToCartButton } from './AddToCartButton';

describe('AddToCartButton', () => {
  it('renders with initial quantity of 1', () => {
    render(<AddToCartButton productId="123" stockQuantity={10} />);
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });

  it('increments quantity on + click', () => {
    render(<AddToCartButton productId="123" stockQuantity={10} />);
    fireEvent.click(screen.getByRole('button', { name: /plus/i }));
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  it('shows out of stock when stock is 0', () => {
    render(<AddToCartButton productId="123" stockQuantity={0} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('prevents quantity above stock', () => {
    render(<AddToCartButton productId="123" stockQuantity={5} />);
    const input = screen.getByDisplayValue('1');
    fireEvent.change(input, { target: { value: '10' } });
    // Should stay at max stock
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });
});
```

---

## Related Documentation

- [Cart API](../api/cart.md) - Cart Items API documentation
- [Product Page](../pages/product-details.md) - Product detail page
- [Button Component](./Button.md) - UI Button component
- [Shopping Cart Page](../pages/shopping-cart.md) - Cart page

---

## Component Dependencies

```json
{
  "dependencies": {
    "@/components/ui/button": "Button component",
    "lucide-react": "Icons (ShoppingCart, Plus, Minus)",
    "react": "useState hook"
  },
  "apis": {
    "/api/cart/items": "Add item to cart"
  }
}
```

---

Last Updated: 2025-11-23
