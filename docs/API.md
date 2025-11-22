# API Documentation

Complete API reference for the Enterprise E-commerce Platform.

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication

Most endpoints require authentication using NextAuth session cookies.

### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## Products

### List Products
```http
GET /api/products?page=1&limit=20&search=laptop&categoryId=xxx
```

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `search` (string): Search query
- `categoryId` (string): Filter by category ID
- `featured` (boolean): Show only featured products
- `bestSeller` (boolean): Show only best sellers
- `newArrival` (boolean): Show only new arrivals
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `sort` (string): Sort order (e.g., "price_asc", "createdAt_desc")

**Response:**
```json
{
  "products": [
    {
      "id": "xxx",
      "sku": "LAPTOP-001",
      "name": "Professional Laptop",
      "slug": "professional-laptop",
      "description": "High-performance laptop",
      "basePrice": 1299.99,
      "salePrice": 1199.99,
      "wholesalePrice": 1050.00,
      "gsaPrice": 1150.00,
      "stockQuantity": 50,
      "images": ["url1", "url2"],
      "category": {
        "id": "xxx",
        "name": "Computers"
      },
      "isFeatured": true,
      "_count": {
        "reviews": 45
      }
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### Get Product by ID
```http
GET /api/products/{id}
```

**Response:**
```json
{
  "id": "xxx",
  "sku": "LAPTOP-001",
  "name": "Professional Laptop",
  "description": "High-performance laptop",
  "basePrice": 1299.99,
  "stockQuantity": 50,
  "category": { "id": "xxx", "name": "Computers" },
  "variants": [
    {
      "id": "xxx",
      "name": "16GB RAM",
      "price": 1299.99,
      "stockQuantity": 30
    }
  ],
  "reviews": [
    {
      "id": "xxx",
      "rating": 5,
      "title": "Excellent!",
      "comment": "Great product",
      "user": {
        "name": "John Doe"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "avgRating": 4.5,
  "reviewCount": 45
}
```

### Create Product (Admin Only)
```http
POST /api/products
Authorization: Required (Admin/Super Admin)
Content-Type: application/json

{
  "sku": "LAPTOP-002",
  "name": "New Laptop",
  "slug": "new-laptop",
  "description": "Latest model",
  "basePrice": 1499.99,
  "wholesalePrice": 1200.00,
  "stockQuantity": 25,
  "categoryId": "xxx",
  "status": "ACTIVE",
  "images": ["url1"],
  "isFeatured": true
}
```

### Update Product (Admin Only)
```http
PATCH /api/products/{id}
Authorization: Required (Admin/Super Admin)
Content-Type: application/json

{
  "name": "Updated Name",
  "basePrice": 1399.99
}
```

### Delete Product (Admin Only)
```http
DELETE /api/products/{id}
Authorization: Required (Admin/Super Admin)
```

## Cart

### Get Cart
```http
GET /api/cart
Authorization: Required
```

**Response:**
```json
{
  "id": "xxx",
  "userId": "xxx",
  "items": [
    {
      "id": "xxx",
      "productId": "xxx",
      "quantity": 2,
      "price": 1199.99,
      "product": {
        "id": "xxx",
        "name": "Professional Laptop",
        "images": ["url1"]
      }
    }
  ],
  "subtotal": 2399.98,
  "itemCount": 2
}
```

### Add to Cart
```http
POST /api/cart
Authorization: Required
Content-Type: application/json

{
  "productId": "xxx",
  "quantity": 1
}
```

### Update Cart Item
```http
PATCH /api/cart/items/{itemId}
Authorization: Required
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove from Cart
```http
DELETE /api/cart/items/{itemId}
Authorization: Required
```

### Clear Cart
```http
DELETE /api/cart
Authorization: Required
```

## Orders

### List Orders
```http
GET /api/orders?page=1&status=PENDING
Authorization: Required
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status

**Response:**
```json
{
  "orders": [
    {
      "id": "xxx",
      "orderNumber": "ORD-2024-00001",
      "status": "SHIPPED",
      "paymentStatus": "PAID",
      "total": 1299.99,
      "createdAt": "2024-01-01T00:00:00Z",
      "items": [
        {
          "id": "xxx",
          "name": "Professional Laptop",
          "quantity": 1,
          "price": 1199.99
        }
      ]
    }
  ],
  "total": 50,
  "page": 1
}
```

### Get Order by ID
```http
GET /api/orders/{id}
Authorization: Required
```

### Create Order
```http
POST /api/orders
Authorization: Required
Content-Type: application/json

{
  "billingAddressId": "xxx",
  "shippingAddressId": "xxx",
  "paymentMethod": "STRIPE",
  "discountCode": "WELCOME10"
}
```

**Response:**
```json
{
  "id": "xxx",
  "orderNumber": "ORD-2024-00002",
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "subtotal": 1199.99,
  "tax": 96.00,
  "shipping": 15.00,
  "discount": 120.00,
  "total": 1190.99,
  "paymentIntentId": "pi_xxx"
}
```

### Update Order Status (Admin)
```http
PATCH /api/orders/{id}/status
Authorization: Required (Admin)
Content-Type: application/json

{
  "status": "SHIPPED",
  "trackingNumber": "1234567890",
  "carrier": "FedEx"
}
```

## Payments

### Create Payment Intent
```http
POST /api/payments/create-intent
Authorization: Required
Content-Type: application/json

{
  "amount": 1299.99,
  "orderId": "xxx"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### Confirm Payment
```http
POST /api/payments/confirm
Authorization: Required
Content-Type: application/json

{
  "paymentIntentId": "pi_xxx",
  "orderId": "xxx"
}
```

## Reviews

### List Product Reviews
```http
GET /api/products/{productId}/reviews?page=1
```

### Create Review
```http
POST /api/reviews
Authorization: Required
Content-Type: application/json

{
  "productId": "xxx",
  "orderId": "xxx",
  "rating": 5,
  "title": "Excellent product!",
  "comment": "Very satisfied with this purchase"
}
```

### Update Review
```http
PATCH /api/reviews/{id}
Authorization: Required
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated review"
}
```

## Categories

### List Categories
```http
GET /api/categories
```

**Response:**
```json
{
  "categories": [
    {
      "id": "xxx",
      "name": "Electronics",
      "slug": "electronics",
      "children": [
        {
          "id": "xxx",
          "name": "Computers",
          "slug": "computers"
        }
      ]
    }
  ]
}
```

### Get Category by ID
```http
GET /api/categories/{id}
```

## Discounts

### Validate Discount Code
```http
POST /api/discounts/validate
Authorization: Required
Content-Type: application/json

{
  "code": "WELCOME10",
  "cartTotal": 100.00
}
```

**Response:**
```json
{
  "valid": true,
  "discount": {
    "id": "xxx",
    "code": "WELCOME10",
    "type": "PERCENTAGE",
    "value": 10,
    "minPurchase": 50
  },
  "discountAmount": 10.00
}
```

## Search

### Search Products
```http
GET /api/search?q=laptop&category=electronics&minPrice=500
```

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Category filter
- `minPrice`, `maxPrice` (number): Price range
- `page`, `limit` (number): Pagination

### Autocomplete Suggestions
```http
GET /api/search/suggest?q=lap
```

**Response:**
```json
{
  "suggestions": [
    "laptop",
    "laptop bag",
    "laptop stand"
  ]
}
```

## User Management

### Get User Profile
```http
GET /api/users/profile
Authorization: Required
```

### Update User Profile
```http
PATCH /api/users/profile
Authorization: Required
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890"
}
```

### List Users (Admin)
```http
GET /api/users?role=CUSTOMER&page=1
Authorization: Required (Admin)
```

## Loyalty

### Get Loyalty Profile
```http
GET /api/loyalty/profile
Authorization: Required
```

**Response:**
```json
{
  "tier": "GOLD",
  "points": 1500,
  "lifetimePoints": 3000,
  "lifetimeSpent": 5000.00,
  "nextTier": "PLATINUM",
  "pointsToNextTier": 500
}
```

### Get Loyalty Transactions
```http
GET /api/loyalty/transactions
Authorization: Required
```

## Addresses

### List Addresses
```http
GET /api/addresses
Authorization: Required
```

### Create Address
```http
POST /api/addresses
Authorization: Required
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "address1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "phone": "+1234567890",
  "type": "BOTH",
  "isDefault": true
}
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Status Codes:**
- `200` OK
- `201` Created
- `400` Bad Request
- `401` Unauthorized
- `403` Forbidden
- `404` Not Found
- `500` Internal Server Error

## Rate Limiting

API requests are rate limited:
- Authenticated: 100 requests per minute
- Unauthenticated: 20 requests per minute

## Pagination

Paginated endpoints return:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

## Filtering & Sorting

Use query parameters for filtering:
- `?field=value` - Exact match
- `?field_gt=value` - Greater than
- `?field_lt=value` - Less than
- `?sort=field_asc` - Sort ascending
- `?sort=field_desc` - Sort descending

## Webhooks

### Stripe Webhooks
```http
POST /api/webhooks/stripe
```

Handles:
- `payment_intent.succeeded`
- `payment_intent.failed`
- `charge.refunded`

## SDK Examples

### JavaScript/TypeScript
```typescript
const response = await fetch('/api/products', {
  headers: {
    'Content-Type': 'application/json',
  },
});
const data = await response.json();
```

### cURL
```bash
curl -X GET 'http://localhost:3000/api/products?page=1&limit=20'
```

---

For more information, see the main [README.md](../README.md)
