# API Documentation

Complete REST API reference for SafetyPro E-commerce Platform.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

Most endpoints require authentication via NextAuth.js session cookies.

### Headers
```
Cookie: next-auth.session-token=<token>
Content-Type: application/json
```

---

## Authentication APIs

### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1234567890",
  "accountType": "B2C"  // B2C, B2B, or GSA
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "accountType": "B2C",
    "role": "CUSTOMER"
  }
}
```

---

## Products APIs

### GET /api/products
Get paginated list of products with filters.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `search` (string) - Search products by name/description/SKU
- `categoryId` (string) - Filter by category UUID
- `featured` (boolean) - Show only featured products
- `bestSeller` (boolean) - Show only best sellers
- `newArrival` (boolean) - Show only new arrivals
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter
- `sort` (string) - Sort field and order: `price_asc`, `price_desc`, `name_asc`, `name_desc`, `createdAt_desc`

**Example:**
```
GET /api/products?page=1&limit=20&categoryId=abc&sort=price_asc
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "sku": "SAFE-001",
      "name": "Safety Helmet",
      "slug": "safety-helmet",
      "description": "ANSI certified safety helmet",
      "basePrice": 49.99,
      "salePrice": 39.99,
      "wholesalePrice": 35.99,
      "gsaPrice": 37.99,
      "images": ["https://..."],
      "stockQuantity": 150,
      "isFeatured": true,
      "status": "ACTIVE",
      "category": {
        "id": "uuid",
        "name": "Head Protection"
      },
      "averageRating": 4.5,
      "reviewCount": 24
    }
  ],
  "total": 150,
  "pages": 8,
  "currentPage": 1
}
```

### GET /api/products/[id]
Get detailed product information by ID or slug.

**Response:**
```json
{
  "id": "uuid",
  "sku": "SAFE-001",
  "name": "Safety Helmet",
  "description": "Full description...",
  "basePrice": 49.99,
  "salePrice": 39.99,
  "images": ["https://..."],
  "stockQuantity": 150,
  "weight": 0.5,
  "dimensions": "10x10x12",
  "features": ["ANSI Z89.1", "Impact resistant"],
  "specifications": {...},
  "category": {...},
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "title": "Great product",
      "comment": "Very satisfied",
      "user": {
        "firstName": "John",
        "lastName": "D."
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "relatedProducts": [...]
}
```

### POST /api/products
Create a new product (Admin only).

**Request Body:**
```json
{
  "sku": "SAFE-002",
  "name": "Safety Vest",
  "slug": "safety-vest",
  "description": "Hi-vis safety vest",
  "shortDescription": "ANSI Class 2 safety vest",
  "status": "ACTIVE",
  "basePrice": 29.99,
  "salePrice": 24.99,
  "wholesalePrice": 22.99,
  "gsaPrice": 23.99,
  "cost": 15.00,
  "categoryId": "uuid",
  "stockQuantity": 200,
  "lowStockThreshold": 20,
  "weight": 0.3,
  "dimensions": "One Size",
  "images": ["https://..."],
  "features": ["ANSI/ISEA 107", "Reflective"],
  "isFeatured": false,
  "isBestSeller": false,
  "isNewArrival": true,
  "tags": ["safety", "vest", "hi-vis"]
}
```

### PUT /api/products/[id]
Update product (Admin only).

### DELETE /api/products/[id]
Delete product (Admin only).

---

## Cart APIs

### GET /api/cart
Get current user's shopping cart.

**Response:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "ACTIVE",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "quantity": 2,
      "price": 39.99,
      "product": {
        "id": "uuid",
        "name": "Safety Helmet",
        "sku": "SAFE-001",
        "images": ["https://..."],
        "basePrice": 49.99,
        "salePrice": 39.99,
        "stockQuantity": 150
      }
    }
  ],
  "subtotal": 79.98,
  "itemCount": 2
}
```

### POST /api/cart
Add item to cart.

**Request Body:**
```json
{
  "productId": "uuid",
  "quantity": 2
}
```

**Response:**
```json
{
  "cartItem": {
    "id": "uuid",
    "productId": "uuid",
    "quantity": 2,
    "price": 39.99
  }
}
```

### PUT /api/cart/[itemId]
Update cart item quantity.

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE /api/cart/[itemId]
Remove item from cart.

### DELETE /api/cart
Clear entire cart.

---

## Orders APIs

### GET /api/orders
Get list of user's orders.

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `status` (string) - Filter by order status

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "orderNumber": "ORD-2024-0001",
      "status": "SHIPPED",
      "paymentStatus": "PAID",
      "totalAmount": 199.99,
      "shippingAmount": 15.00,
      "taxAmount": 16.00,
      "items": [
        {
          "id": "uuid",
          "productId": "uuid",
          "product": {
            "name": "Safety Helmet",
            "sku": "SAFE-001",
            "images": ["https://..."]
          },
          "quantity": 2,
          "price": 39.99
        }
      ],
      "shippingAddress": {
        "address1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001"
      },
      "shipments": [
        {
          "trackingNumber": "1Z999AA10123456784",
          "carrier": "UPS",
          "status": "IN_TRANSIT"
        }
      ],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 25,
  "pages": 3
}
```

### GET /api/orders/[orderNumber]
Get detailed order information.

### POST /api/orders
Create order from cart.

**Request Body:**
```json
{
  "billingAddressId": "uuid",
  "shippingAddressId": "uuid",
  "paymentMethod": "CREDIT_CARD",
  "shippingMethod": "UPS Ground",
  "discountCode": "SAVE10",
  "customerNotes": "Please leave at door",
  "loyaltyPointsToUse": 500,
  "purchaseOrderNumber": "PO-12345"  // B2B only
}
```

**Response:**
```json
{
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-2024-0001",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": 199.99,
    "paymentIntentId": "pi_...",  // Stripe payment intent
    "clientSecret": "pi_..._secret_..."  // For Stripe confirmation
  }
}
```

### PUT /api/orders/[id]/status
Update order status (Admin only).

**Request Body:**
```json
{
  "status": "SHIPPED",
  "notes": "Shipped via UPS"
}
```

---

## Reviews APIs

### GET /api/reviews
Get product reviews.

**Query Parameters:**
- `productId` (string, required) - Product UUID
- `page` (number) - Page number
- `limit` (number) - Items per page
- `rating` (number) - Filter by rating (1-5)
- `status` (string) - Filter by status (APPROVED, PENDING, REJECTED)

**Response:**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "productId": "uuid",
      "userId": "uuid",
      "rating": 5,
      "title": "Excellent product!",
      "comment": "Very satisfied with this purchase",
      "status": "APPROVED",
      "images": ["https://..."],
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "stats": {
    "averageRating": 4.5,
    "totalReviews": 124,
    "ratingDistribution": {
      "5": 80,
      "4": 30,
      "3": 10,
      "2": 3,
      "1": 1
    }
  }
}
```

### POST /api/reviews
Create product review.

**Request Body:**
```json
{
  "productId": "uuid",
  "orderId": "uuid",  // Optional, for verified purchase
  "rating": 5,
  "title": "Great product",
  "comment": "Very satisfied with this purchase",
  "images": ["https://..."]
}
```

### PUT /api/reviews/[id]
Update own review.

### DELETE /api/reviews/[id]
Delete own review.

### PUT /api/reviews/[id]/approve
Approve review (Admin only).

### PUT /api/reviews/[id]/reject
Reject review (Admin only).

---

## Addresses APIs

### GET /api/addresses
Get user's saved addresses.

**Response:**
```json
{
  "addresses": [
    {
      "id": "uuid",
      "type": "BOTH",
      "firstName": "John",
      "lastName": "Doe",
      "company": "Acme Inc",
      "address1": "123 Main St",
      "address2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "phone": "+12125551234",
      "isDefault": true
    }
  ]
}
```

### POST /api/addresses
Create new address.

**Request Body:**
```json
{
  "type": "SHIPPING",  // BILLING, SHIPPING, or BOTH
  "firstName": "John",
  "lastName": "Doe",
  "address1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "phone": "+12125551234",
  "isDefault": false
}
```

### PUT /api/addresses/[id]
Update address.

### DELETE /api/addresses/[id]
Delete address.

---

## Payments APIs

### POST /api/payments/create-intent
Create Stripe payment intent.

**Request Body:**
```json
{
  "orderId": "uuid",
  "amount": 19999,  // Amount in cents
  "currency": "usd"
}
```

**Response:**
```json
{
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_..."
}
```

### POST /api/payments/webhook
Stripe webhook handler (for Stripe events).

---

## Discounts APIs

### GET /api/discounts/validate
Validate discount code.

**Query Parameters:**
- `code` (string) - Discount code
- `totalAmount` (number) - Order total for validation

**Response:**
```json
{
  "valid": true,
  "discount": {
    "id": "uuid",
    "code": "SAVE10",
    "name": "10% Off",
    "type": "PERCENTAGE",
    "value": 10,
    "minPurchase": 50,
    "maxDiscount": 100,
    "endsAt": "2024-12-31T23:59:59Z"
  },
  "discountAmount": 19.99
}
```

### POST /api/discounts
Create discount code (Admin only).

**Request Body:**
```json
{
  "code": "SAVE20",
  "name": "20% Off",
  "description": "Summer sale discount",
  "type": "PERCENTAGE",  // PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING, BUY_X_GET_Y
  "scope": "GLOBAL",  // GLOBAL, CATEGORY, PRODUCT, USER, USER_TIER
  "value": 20,
  "minPurchase": 100,
  "maxDiscount": 50,
  "usageLimit": 1000,
  "perUserLimit": 1,
  "accountTypes": ["B2C", "B2B"],
  "loyaltyTiers": ["GOLD", "PLATINUM"],
  "startsAt": "2024-06-01T00:00:00Z",
  "endsAt": "2024-08-31T23:59:59Z",
  "isActive": true
}
```

---

## Categories APIs

### GET /api/categories
Get product categories with product counts.

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Head Protection",
      "slug": "head-protection",
      "description": "Safety helmets and hard hats",
      "image": "https://...",
      "isActive": true,
      "_count": {
        "products": 45
      }
    }
  ]
}
```

### POST /api/categories
Create category (Admin only).

---

## Dashboard APIs

### GET /api/dashboard/stats
Get user dashboard statistics.

**Response:**
```json
{
  "orders": {
    "total": 15,
    "pending": 2,
    "processing": 1,
    "shipped": 3,
    "delivered": 9
  },
  "spending": {
    "total": 1299.99,
    "thisMonth": 199.99,
    "lastMonth": 299.99
  },
  "loyalty": {
    "tier": "GOLD",
    "points": 2500,
    "lifetimePoints": 5000,
    "lifetimeSpent": 2500.00
  },
  "recentOrders": [...]
}
```

### GET /api/admin/dashboard
Get admin dashboard analytics (Admin only).

**Response:**
```json
{
  "revenue": {
    "total": 125000.00,
    "today": 1500.00,
    "thisWeek": 8500.00,
    "thisMonth": 32000.00
  },
  "orders": {
    "total": 450,
    "pending": 12,
    "processing": 8,
    "shipped": 25,
    "delivered": 405
  },
  "products": {
    "total": 230,
    "active": 215,
    "lowStock": 15,
    "outOfStock": 3
  },
  "customers": {
    "total": 1250,
    "new": 45,
    "b2c": 950,
    "b2b": 250,
    "gsa": 50
  },
  "topProducts": [...],
  "recentOrders": [...]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}  // Optional
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

### Common Error Codes

- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - No permission
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data
- `INSUFFICIENT_STOCK` - Product out of stock
- `INVALID_DISCOUNT` - Discount code invalid
- `PAYMENT_FAILED` - Payment processing failed

---

## Rate Limiting

API requests are rate limited:

- **Authenticated users**: 100 requests per minute
- **Anonymous users**: 20 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Webhooks

### Stripe Webhook
`POST /api/payments/webhook`

Events handled:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

---

## Testing

Use these test credentials in development:

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

### Test Accounts
See README.md for test account credentials.
