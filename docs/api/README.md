# API Documentation

Complete REST API documentation for all endpoints.

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Products](#products)
3. [Cart & Checkout](#cart--checkout)
4. [Orders](#orders)
5. [Admin - Products](#admin---products)
6. [Admin - Orders](#admin---orders)
7. [Admin - Customers](#admin---customers)
8. [Admin - B2B](#admin---b2b)
9. [Admin - Inventory](#admin---inventory)
10. [Admin - Suppliers](#admin---suppliers)
11. [Admin - Advanced](#admin---advanced)

---

## Authentication

All admin endpoints require authentication with `ADMIN` role.

### POST `/api/auth/signup`
Register new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+1234567890",
  "accountType": "B2C"  // B2C, B2B, GSA
}
```

**Response:**
```json
{
  "user": {
    "id": "cuid123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "accountType": "B2C"
  }
}
```

---

### POST `/api/auth/[...nextauth]`
NextAuth.js authentication endpoint.

**Providers:**
- Credentials (email/password)
- Google OAuth (optional)

**Session:**
```json
{
  "user": {
    "id": "cuid123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "accountType": "B2C"
  },
  "expires": "2024-12-31T23:59:59.999Z"
}
```

---

## Products

### GET `/api/products`
Get paginated list of products.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `category` (string): Filter by category slug
- `search` (string): Search term
- `status` (string): ACTIVE, OUT_OF_STOCK
- `isFeatured` (boolean): Featured products only
- `sortBy` (string): price, name, createdAt
- `sortOrder` (string): asc, desc

**Example Request:**
```
GET /api/products?page=1&limit=20&category=hard-hats&sortBy=price&sortOrder=asc
```

**Response:**
```json
{
  "products": [
    {
      "id": "prod123",
      "sku": "HH-001",
      "name": "Safety Hard Hat - Type I",
      "slug": "safety-hard-hat-type-i",
      "description": "ANSI Z89.1 compliant hard hat",
      "basePrice": 29.99,
      "salePrice": 24.99,
      "stockQuantity": 150,
      "images": ["url1.jpg", "url2.jpg"],
      "category": {
        "id": "cat123",
        "name": "Hard Hats",
        "slug": "hard-hats"
      },
      "isFeatured": true,
      "averageRating": 4.5,
      "reviewCount": 23
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### GET `/api/products/[id]`
Get product details by ID.

**Response:**
```json
{
  "id": "prod123",
  "sku": "HH-001",
  "name": "Safety Hard Hat - Type I",
  "slug": "safety-hard-hat-type-i",
  "description": "Full description...",
  "shortDescription": "Short desc...",
  "basePrice": 29.99,
  "salePrice": 24.99,
  "wholesalePrice": 22.00,
  "gsaPrice": 20.00,
  "stockQuantity": 150,
  "images": ["url1.jpg", "url2.jpg"],
  "videos": ["video1.mp4"],
  "specifications": {
    "weight": 0.85,
    "material": "HDPE",
    "certification": "ANSI Z89.1"
  },
  "category": {...},
  "variants": [...],
  "reviews": [...],
  "relatedProducts": [...]
}
```

---

### GET `/api/search`
Search products.

**Query Parameters:**
- `q` (string): Search query
- `category` (string): Category filter
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price

**Response:**
```json
{
  "results": [...],
  "total": 45,
  "query": "safety glasses"
}
```

---

## Cart & Checkout

### GET `/api/cart`
Get current user's cart.

**Response:**
```json
{
  "id": "cart123",
  "items": [
    {
      "id": "item123",
      "product": {
        "id": "prod123",
        "name": "Safety Hard Hat",
        "sku": "HH-001",
        "images": ["url.jpg"]
      },
      "quantity": 2,
      "price": 24.99,
      "total": 49.98
    }
  ],
  "subtotal": 49.98,
  "itemCount": 2
}
```

---

### POST `/api/cart`
Add item to cart.

**Request Body:**
```json
{
  "productId": "prod123",
  "quantity": 2
}
```

**Response:**
```json
{
  "item": {...},
  "cart": {...}
}
```

---

### PUT `/api/cart`
Update cart item quantity.

**Request Body:**
```json
{
  "itemId": "item123",
  "quantity": 3
}
```

---

### DELETE `/api/cart`
Remove item from cart.

**Query Parameters:**
- `itemId` (string): Cart item ID

---

### GET `/api/cart/count`
Get cart item count (for header badge).

**Response:**
```json
{
  "count": 3
}
```

---

## Orders

### POST `/api/orders`
Create new order (checkout).

**Request Body:**
```json
{
  "billingAddressId": "addr123",
  "shippingAddressId": "addr456",
  "paymentMethod": "STRIPE",
  "paymentIntentId": "pi_123",
  "shippingMethod": "STANDARD",
  "customerNotes": "Please ring doorbell",
  "loyaltyPointsToUse": 100,
  "purchaseOrderNumber": "PO-12345" // B2B only
}
```

**Response:**
```json
{
  "order": {
    "id": "order123",
    "orderNumber": "ORD-20241122-001",
    "status": "PENDING",
    "total": 149.99,
    "items": [...],
    "estimatedDelivery": "2024-11-25"
  }
}
```

---

### GET `/api/orders`
Get current user's orders.

**Query Parameters:**
- `status` (string): Filter by status
- `page` (number)
- `limit` (number)

**Response:**
```json
{
  "orders": [
    {
      "id": "order123",
      "orderNumber": "ORD-20241122-001",
      "status": "SHIPPED",
      "total": 149.99,
      "createdAt": "2024-11-22T10:00:00Z",
      "trackingNumber": "1Z999AA10123456784",
      "itemCount": 3
    }
  ],
  "pagination": {...}
}
```

---

### GET `/api/orders/[id]`
Get order details.

**Response:**
```json
{
  "id": "order123",
  "orderNumber": "ORD-20241122-001",
  "status": "SHIPPED",
  "paymentStatus": "PAID",
  "subtotal": 129.99,
  "tax": 10.40,
  "shipping": 9.60,
  "discount": 0,
  "total": 149.99,
  "items": [
    {
      "id": "item123",
      "product": {...},
      "quantity": 2,
      "price": 24.99,
      "total": 49.98
    }
  ],
  "billingAddress": {...},
  "shippingAddress": {...},
  "trackingNumber": "1Z999AA10123456784",
  "statusHistory": [
    {
      "status": "PENDING",
      "changedAt": "2024-11-22T10:00:00Z"
    },
    {
      "status": "CONFIRMED",
      "changedAt": "2024-11-22T10:05:00Z"
    }
  ]
}
```

---

## Admin - Products

### GET `/api/admin/products`
Get all products (admin).

**Query Parameters:**
- `page`, `limit`, `search`, `status`, `category`

**Authorization:** ADMIN role required

---

### POST `/api/admin/products`
Create new product.

**Request Body:**
```json
{
  "sku": "HH-002",
  "name": "Premium Hard Hat",
  "slug": "premium-hard-hat",
  "description": "Full description",
  "shortDescription": "Short desc",
  "basePrice": 39.99,
  "salePrice": 34.99,
  "wholesalePrice": 30.00,
  "gsaPrice": 28.00,
  "categoryId": "cat123",
  "stockQuantity": 100,
  "lowStockThreshold": 20,
  "images": ["url1.jpg", "url2.jpg"],
  "status": "ACTIVE",
  "isFeatured": false,
  "complianceCertifications": [
    {
      "name": "ANSI Z89.1",
      "number": "CERT-123",
      "issuedDate": "2024-01-01"
    }
  ]
}
```

---

### PUT `/api/admin/products/[id]`
Update product.

---

### DELETE `/api/admin/products/[id]`
Delete product.

---

### PUT `/api/admin/products/[id]/inventory`
Update product inventory.

**Request Body:**
```json
{
  "stockQuantity": 150,
  "action": "ADJUSTMENT",  // PURCHASE, SALE, RETURN, ADJUSTMENT
  "notes": "Physical count adjustment"
}
```

---

### GET `/api/admin/products/[id]/suppliers`
Get product suppliers.

---

### POST `/api/admin/products/[id]/suppliers`
Add supplier to product.

**Request Body:**
```json
{
  "supplierId": "sup123",
  "costPrice": 15.00,
  "supplierSku": "SUP-HH-002",
  "minimumOrderQty": 50,
  "leadTimeDays": 14,
  "isPrimary": true
}
```

---

## Admin - Orders

### GET `/api/admin/orders`
Get all orders (admin).

**Query Parameters:**
- `status`, `paymentStatus`, `userId`, `dateFrom`, `dateTo`

---

### PUT `/api/admin/orders/[id]/status`
Update order status.

**Request Body:**
```json
{
  "status": "SHIPPED",
  "trackingNumber": "1Z999AA10123456784",
  "carrier": "UPS",
  "notes": "Shipped via UPS Ground"
}
```

---

## Admin - Customers

### GET `/api/admin/customers`
Get all customers.

**Query Parameters:**
- `accountType`, `search`, `page`, `limit`

---

### GET `/api/admin/customers/[id]`
Get customer details.

**Response:**
```json
{
  "id": "user123",
  "email": "customer@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "accountType": "B2B",
  "role": "CUSTOMER",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "addresses": [...],
  "orders": [...],
  "b2bProfile": {
    "companyName": "ABC Corp",
    "taxId": "12-3456789",
    "creditLimit": 50000,
    "creditUsed": 10000,
    "paymentTerms": 30,
    "status": "APPROVED"
  },
  "loyaltyProfile": {
    "tier": "GOLD",
    "points": 1500,
    "lifetimeSpent": 25000
  },
  "statistics": {
    "totalOrders": 45,
    "totalSpent": 25000,
    "averageOrderValue": 555.56
  }
}
```

---

### PUT `/api/admin/customers/[id]/credit`
Manage customer credit (B2B).

**Request Body:**
```json
{
  "creditLimit": 75000,
  "paymentTerms": 60,
  "status": "ACTIVE",
  "notes": "Credit increase approved"
}
```

---

### PUT `/api/admin/customers/[id]/gsa-approval`
Approve/reject GSA customer.

**Request Body:**
```json
{
  "status": "APPROVED",
  "notes": "Verified GSA contract number"
}
```

---

## Admin - B2B

### GET `/api/admin/customer-groups`
Get all customer groups.

---

### POST `/api/admin/customer-groups`
Create customer group.

**Request Body:**
```json
{
  "name": "Gold Tier Wholesale",
  "description": "Premium wholesale customers",
  "defaultDiscount": 15.00,
  "accountTypes": ["B2B"],
  "loyaltyTiers": ["GOLD", "PLATINUM", "DIAMOND"],
  "isActive": true
}
```

---

### POST `/api/admin/customer-groups/[id]/members`
Add member to group.

**Request Body:**
```json
{
  "userId": "user123"
}
```

---

### DELETE `/api/admin/customer-groups/[id]/members`
Remove member from group.

**Query Parameters:**
- `userId` (string)

---

### GET `/api/admin/quotes`
Get all quotes.

---

### POST `/api/admin/quotes`
Create quote for customer.

**Request Body:**
```json
{
  "userId": "user123",
  "items": [
    {
      "productId": "prod123",
      "sku": "HH-001",
      "name": "Safety Hard Hat",
      "quantity": 100,
      "unitPrice": 22.00,
      "discount": 200.00,
      "taxRate": 0.08
    }
  ],
  "validUntil": "2024-12-31",
  "customerNotes": "Bulk order quote",
  "termsConditions": "Net 30 payment terms"
}
```

---

### GET `/api/admin/contracts`
Get all contracts.

---

### POST `/api/admin/contracts`
Create contract.

**Request Body:**
```json
{
  "userId": "user123",
  "contractNumber": "CNT-2024-001",
  "name": "Annual Safety Equipment Contract",
  "description": "12-month contract for safety equipment",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "minimumSpend": 100000,
  "paymentTerms": 60,
  "items": [
    {
      "productId": "prod123",
      "contractPrice": 20.00,
      "minimumQuantity": 50,
      "maximumQuantity": 500
    }
  ]
}
```

---

### GET `/api/admin/tiered-prices`
Get all tiered prices.

---

### POST `/api/admin/tiered-prices`
Create tiered price.

**Request Body:**
```json
{
  "productId": "prod123",
  "customerGroupId": "group123",
  "minQuantity": 50,
  "maxQuantity": 99,
  "price": 22.00,
  "accountTypes": ["B2B"],
  "isActive": true
}
```

---

### GET `/api/admin/category-discounts`
Get category discounts.

---

### POST `/api/admin/category-discounts`
Create category discount for group.

**Request Body:**
```json
{
  "categoryId": "cat123",
  "customerGroupId": "group123",
  "discountType": "PERCENTAGE",
  "discountValue": 15.00,
  "name": "Hard Hats - Gold Tier Discount",
  "startsAt": "2024-01-01",
  "endsAt": "2024-12-31",
  "isActive": true
}
```

---

## Admin - Inventory

### GET `/api/admin/warehouses`
Get all warehouses.

---

### POST `/api/admin/warehouses`
Create warehouse.

**Request Body:**
```json
{
  "code": "WH-NYC",
  "name": "New York City Warehouse",
  "address": "123 Industrial Blvd",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "phone": "+1234567890",
  "email": "nyc@warehouse.com",
  "managerName": "Jane Smith",
  "isActive": true,
  "isPrimary": false
}
```

---

### GET `/api/admin/inventory`
Get inventory across all warehouses.

**Query Parameters:**
- `warehouseId`, `productId`, `lowStock` (boolean)

**Response:**
```json
{
  "inventory": [
    {
      "product": {
        "id": "prod123",
        "sku": "HH-001",
        "name": "Safety Hard Hat"
      },
      "warehouses": [
        {
          "warehouse": {
            "id": "wh123",
            "name": "NYC Warehouse",
            "code": "WH-NYC"
          },
          "quantity": 150,
          "reserved": 20,
          "available": 130,
          "reorderPoint": 50
        }
      ],
      "totalQuantity": 150,
      "totalAvailable": 130
    }
  ]
}
```

---

### POST `/api/admin/warehouse-transfers`
Create warehouse transfer.

**Request Body:**
```json
{
  "sourceWarehouseId": "wh123",
  "destinationWarehouseId": "wh456",
  "productId": "prod123",
  "quantity": 50,
  "estimatedArrival": "2024-11-25",
  "notes": "Restocking LA warehouse"
}
```

---

## Admin - Suppliers

### GET `/api/admin/suppliers`
Get all suppliers.

---

### POST `/api/admin/suppliers`
Create supplier.

**Request Body:**
```json
{
  "name": "Safety Equipment Inc",
  "code": "SUP-001",
  "email": "orders@safetyequip.com",
  "phone": "+1234567890",
  "website": "https://safetyequip.com",
  "address": "456 Industrial Park",
  "city": "Chicago",
  "state": "IL",
  "zipCode": "60601",
  "country": "USA",
  "taxId": "12-3456789",
  "businessLicense": "BL-12345",
  "paymentTerms": 30,
  "currency": "USD",
  "status": "ACTIVE"
}
```

---

### PUT `/api/admin/suppliers/[id]`
Update supplier.

---

### GET `/api/admin/purchase-orders`
Get all purchase orders.

---

### POST `/api/admin/purchase-orders`
Create purchase order to supplier.

**Request Body:**
```json
{
  "supplierId": "sup123",
  "warehouseId": "wh123",
  "expectedDelivery": "2024-12-01",
  "paymentTerms": 30,
  "items": [
    {
      "productId": "prod123",
      "sku": "HH-001",
      "quantity": 200,
      "unitCost": 15.00
    }
  ],
  "notes": "Rush order for holiday season"
}
```

---

## Admin - Advanced

### GET `/api/admin/backorders`
Get all backorders.

---

### POST `/api/admin/backorders`
Create backorder.

**Request Body:**
```json
{
  "userId": "user123",
  "productId": "prod123",
  "quantity": 10,
  "pricePerUnit": 24.99,
  "expectedDate": "2024-12-15",
  "notes": "Customer notified of expected date"
}
```

---

### GET `/api/admin/bundles`
Get all product bundles.

---

### POST `/api/admin/bundles`
Create product bundle.

**Request Body:**
```json
{
  "sku": "BUNDLE-001",
  "name": "Complete Safety Kit",
  "slug": "complete-safety-kit",
  "description": "Everything you need for job site safety",
  "bundlePrice": 149.99,
  "retailValue": 199.99,
  "savings": 50.00,
  "image": "bundle.jpg",
  "items": [
    {
      "productId": "prod123",
      "quantity": 1,
      "sortOrder": 1,
      "isOptional": false
    },
    {
      "productId": "prod456",
      "quantity": 1,
      "sortOrder": 2,
      "isOptional": false
    }
  ]
}
```

---

### GET `/api/admin/rma`
Get all RMA requests.

---

### POST `/api/admin/rma`
Create RMA.

**Request Body:**
```json
{
  "userId": "user123",
  "orderId": "order123",
  "reason": "DEFECTIVE",
  "requestType": "REFUND",
  "description": "Product arrived damaged",
  "customerNotes": "Box was crushed",
  "items": [
    {
      "orderItemId": "item123",
      "productId": "prod123",
      "quantity": 1,
      "unitPrice": 24.99
    }
  ]
}
```

---

### GET `/api/admin/subscriptions`
Get all subscriptions.

---

### POST `/api/admin/subscriptions`
Create subscription for customer.

**Request Body:**
```json
{
  "userId": "user123",
  "frequency": "MONTHLY",
  "shippingAddressId": "addr123",
  "paymentMethod": "CREDIT_CARD",
  "startDate": "2024-12-01",
  "items": [
    {
      "productId": "prod123",
      "quantity": 10,
      "price": 22.00
    }
  ]
}
```

---

### GET `/api/admin/commissions`
Get commission records.

---

### GET `/api/admin/tax-exemptions`
Get tax exemption requests.

---

### POST `/api/admin/tax-exemptions`
Create tax exemption.

**Request Body:**
```json
{
  "userId": "user123",
  "certificateNumber": "CERT-123456",
  "exemptionType": "Resale",
  "states": ["CA", "NY", "TX"],
  "issueDate": "2024-01-01",
  "expiryDate": "2025-01-01",
  "certificateUrl": "https://..."
}
```

---

### GET `/api/admin/reviews`
Get all product reviews.

---

### PUT `/api/admin/reviews/[id]`
Approve/reject review.

**Request Body:**
```json
{
  "status": "APPROVED"  // APPROVED, REJECTED, PENDING
}
```

---

### GET `/api/admin/product-attributes`
Get all product attributes.

---

### POST `/api/admin/product-attributes`
Create product attribute.

**Request Body:**
```json
{
  "name": "Size",
  "code": "size",
  "type": "SELECT",
  "options": ["Small", "Medium", "Large", "X-Large"],
  "isFilterable": true,
  "isRequired": false,
  "isVariant": true
}
```

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

## Rate Limiting

- Public endpoints: 100 requests/minute
- Authenticated endpoints: 1000 requests/minute
- Admin endpoints: Unlimited

## Pagination

All list endpoints support pagination:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

**Last Updated:** November 2024
