# Complete API Reference - All Endpoints

**Complete documentation of all API endpoints with request/response examples, authentication, validation, and error handling.**

---

## Table of Contents

1. [Authentication](#authentication)
2. [Public Endpoints](#public-endpoints)
3. [Cart & Checkout](#cart--checkout)
4. [Admin - Products](#admin---products)
5. [Admin - Orders](#admin---orders)
6. [Admin - Customers](#admin---customers)
7. [Admin - B2B Features](#admin---b2b-features)
8. [Admin - Inventory](#admin---inventory)
9. [Admin - Suppliers](#admin---suppliers)
10. [Admin - Advanced Features](#admin---advanced-features)
11. [Admin - Settings](#admin---settings)

---

## Authentication

### POST `/api/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "+1-555-0100",
  "accountType": "B2C" | "B2B" | "GSA",

  // B2B Only
  "companyName": "Acme Corp",
  "taxId": "12-3456789",
  "businessLicense": "BL123456",

  // GSA Only
  "gsaNumber": "GS-00F-0001X",
  "agencyName": "Department of Defense",
  "contractNumber": "GS-00F-0001X-DOD",
  "gsaSchedule": "Schedule 84",
  "vendorId": "V1234567",
  "cageCode": "1ABC2",
  "dunsBradstreet": "123456789",
  "fiscalYear": "2024"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "clx123...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER",
    "accountType": "B2C"
  },
  "message": "Account created successfully. Please verify your email."
}
```

**Errors:**
- `400` - Email already exists
- `400` - Invalid email format
- `400` - Password too weak
- `400` - Missing required fields for B2B/GSA

---

### POST `/api/auth/[...nextauth]`
NextAuth.js authentication endpoints.

**Sign In:**
```bash
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "callbackUrl": "/dashboard"
}
```

**Session:**
```bash
GET /api/auth/session
```

**Sign Out:**
```bash
POST /api/auth/signout
```

---

## Public Endpoints

### GET `/api/products`
Get paginated list of products.

**Query Parameters:**
```
?page=1
&limit=20
&category=hard-hats
&sort=price_asc | price_desc | name_asc | name_desc | newest | featured
&minPrice=10.00
&maxPrice=500.00
&status=ACTIVE
&isFeatured=true
&isNewArrival=true
&search=safety+glasses
```

**Response (200 OK):**
```json
{
  "products": [
    {
      "id": "clx123...",
      "sku": "PPE-HH-001",
      "name": "Hard Hat - Class E",
      "slug": "hard-hat-class-e",
      "shortDescription": "ANSI Z89.1 certified hard hat",
      "description": "Full description...",
      "status": "ACTIVE",

      "basePrice": "45.99",
      "salePrice": "39.99",
      "wholesalePrice": "35.99",
      "gsaPrice": "38.50",

      "stockQuantity": 150,
      "lowStockThreshold": 20,

      "images": [
        "/uploads/products/hardhat-001.jpg",
        "/uploads/products/hardhat-002.jpg"
      ],
      "videos": [],

      "category": {
        "id": "clx456...",
        "name": "Head Protection",
        "slug": "head-protection"
      },

      "isFeatured": true,
      "isNewArrival": false,
      "isBestSeller": true,

      "complianceCertifications": [
        {
          "name": "ANSI Z89.1",
          "issuer": "ANSI",
          "expiryDate": "2025-12-31"
        }
      ],

      "averageRating": 4.5,
      "reviewCount": 24,

      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-11-20T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 350,
    "totalPages": 18,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### GET `/api/products/[id]`
Get single product by ID or slug.

**Request:**
```bash
GET /api/products/clx123...
# OR
GET /api/products/hard-hat-class-e
```

**Response (200 OK):**
```json
{
  "id": "clx123...",
  "sku": "PPE-HH-001",
  "name": "Hard Hat - Class E",
  "slug": "hard-hat-class-e",
  "description": "Full detailed description...",
  "shortDescription": "ANSI Z89.1 certified",
  "status": "ACTIVE",

  "basePrice": "45.99",
  "salePrice": "39.99",
  "costPrice": "25.00",
  "wholesalePrice": "35.99",
  "gsaPrice": "38.50",
  "minimumOrderQty": 1,

  "stockQuantity": 150,
  "lowStockThreshold": 20,
  "trackInventory": true,

  "images": ["/uploads/products/hardhat-001.jpg"],
  "videos": [],

  "weight": "0.85",
  "length": "10.5",
  "width": "9.5",
  "height": "6.5",

  "category": {
    "id": "clx456...",
    "name": "Head Protection",
    "slug": "head-protection",
    "description": "Hard hats and helmets"
  },

  "variants": [
    {
      "id": "clxv1...",
      "sku": "PPE-HH-001-YEL",
      "name": "Yellow",
      "attributes": "{\"color\":\"Yellow\"}",
      "price": "45.99",
      "stockQuantity": 75,
      "images": ["/uploads/variants/hh-yellow.jpg"]
    }
  ],

  "tieredPrices": [
    {
      "minQuantity": 10,
      "maxQuantity": 49,
      "price": "42.99"
    },
    {
      "minQuantity": 50,
      "maxQuantity": null,
      "price": "39.99"
    }
  ],

  "reviews": [
    {
      "id": "clxr1...",
      "rating": 5,
      "title": "Excellent quality!",
      "comment": "Very durable and comfortable",
      "user": {
        "name": "John D.",
        "isVerified": true
      },
      "createdAt": "2024-10-15T14:30:00Z"
    }
  ],

  "averageRating": 4.5,
  "reviewCount": 24,

  "relatedProducts": [
    {
      "id": "clx789...",
      "name": "Face Shield Attachment",
      "slug": "face-shield-attachment",
      "basePrice": "15.99",
      "images": ["/uploads/products/face-shield.jpg"]
    }
  ]
}
```

**Errors:**
- `404` - Product not found
- `400` - Invalid product ID

---

### GET `/api/search`
Full-text product search with autocomplete.

**Query Parameters:**
```
?q=safety+glasses
&limit=10
&includeCategories=true
```

**Response (200 OK):**
```json
{
  "products": [
    {
      "id": "clx123...",
      "name": "Safety Glasses - Clear Lens",
      "slug": "safety-glasses-clear",
      "basePrice": "12.99",
      "images": ["/uploads/products/glasses-001.jpg"],
      "category": "Eye Protection"
    }
  ],
  "categories": [
    {
      "id": "clxc1...",
      "name": "Eye Protection",
      "slug": "eye-protection",
      "productCount": 45
    }
  ],
  "total": 45
}
```

---

## Cart & Checkout

### GET `/api/cart`
Get user's shopping cart.

**Headers:**
```
Authorization: Bearer <session-token>
```

**Response (200 OK):**
```json
{
  "id": "clxcart1...",
  "userId": "clxu1...",
  "items": [
    {
      "id": "clxci1...",
      "product": {
        "id": "clxp1...",
        "sku": "PPE-HH-001",
        "name": "Hard Hat - Class E",
        "slug": "hard-hat-class-e",
        "images": ["/uploads/products/hardhat-001.jpg"],
        "stockQuantity": 150
      },
      "quantity": 2,
      "price": "39.99",
      "total": "79.98"
    }
  ],
  "subtotal": "79.98",
  "tax": "6.40",
  "shipping": "12.00",
  "discount": "0.00",
  "total": "98.38",
  "itemCount": 2,
  "createdAt": "2024-11-20T10:00:00Z",
  "updatedAt": "2024-11-22T14:30:00Z"
}
```

---

### POST `/api/cart`
Add item to cart or update quantity.

**Headers:**
```
Authorization: Bearer <session-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "clxp1...",
  "quantity": 2,
  "action": "add" | "update" | "remove"
}
```

**Response (200 OK):**
```json
{
  "cart": {
    "id": "clxcart1...",
    "items": [...],
    "total": "98.38",
    "itemCount": 2
  },
  "message": "Item added to cart"
}
```

**Errors:**
- `400` - Product out of stock
- `400` - Quantity exceeds available stock
- `401` - Unauthorized
- `404` - Product not found

---

### GET `/api/cart/count`
Get cart item count (lightweight endpoint).

**Headers:**
```
Authorization: Bearer <session-token>
```

**Response (200 OK):**
```json
{
  "count": 3
}
```

---

### POST `/api/payments/create-intent`
Create Stripe payment intent for checkout.

**Headers:**
```
Authorization: Bearer <session-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 9838,
  "currency": "usd",
  "cartId": "clxcart1...",
  "billingAddressId": "clxaddr1...",
  "shippingAddressId": "clxaddr2...",
  "shippingMethod": "standard",
  "customerNotes": "Please leave at front door"
}
```

**Response (200 OK):**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

**Errors:**
- `400` - Invalid amount
- `400` - Cart is empty
- `401` - Unauthorized
- `500` - Stripe API error

---

## Admin - Products

### GET `/api/admin/products`
Get all products (admin view with full details).

**Headers:**
```
Authorization: Bearer <admin-session-token>
```

**Query Parameters:**
```
?page=1
&limit=50
&status=ACTIVE | INACTIVE | DRAFT | OUT_OF_STOCK | DISCONTINUED
&category=clxc1...
&lowStock=true
&search=PPE-HH
```

**Response (200 OK):**
```json
{
  "products": [
    {
      "id": "clxp1...",
      "sku": "PPE-HH-001",
      "name": "Hard Hat - Class E",
      "status": "ACTIVE",
      "basePrice": "45.99",
      "salePrice": "39.99",
      "costPrice": "25.00",
      "stockQuantity": 150,
      "lowStockThreshold": 20,
      "category": {
        "name": "Head Protection"
      },
      "suppliers": [
        {
          "supplier": {
            "name": "Safety Supply Co"
          },
          "costPrice": "25.00",
          "isPrimary": true
        }
      ],
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 350,
    "totalPages": 7
  },
  "stats": {
    "totalProducts": 350,
    "activeProducts": 320,
    "lowStockProducts": 12,
    "outOfStockProducts": 8
  }
}
```

---

### POST `/api/admin/products`
Create new product.

**Headers:**
```
Authorization: Bearer <admin-session-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sku": "PPE-HH-002",
  "name": "Hard Hat - Class G",
  "slug": "hard-hat-class-g",
  "description": "Full description with HTML",
  "shortDescription": "Brief summary",
  "status": "DRAFT",

  "basePrice": 55.99,
  "salePrice": 49.99,
  "costPrice": 30.00,
  "wholesalePrice": 45.99,
  "gsaPrice": 48.50,
  "minimumOrderQty": 1,

  "stockQuantity": 100,
  "lowStockThreshold": 15,
  "trackInventory": true,

  "categoryId": "clxc1...",

  "images": [
    "/uploads/products/hardhat-g-001.jpg",
    "/uploads/products/hardhat-g-002.jpg"
  ],
  "videos": [],

  "weight": 0.90,
  "length": 10.5,
  "width": 9.5,
  "height": 6.5,

  "complianceCertifications": [
    {
      "name": "ANSI Z89.1 Class G",
      "issuer": "ANSI",
      "expiryDate": "2025-12-31"
    }
  ],

  "metaTitle": "Class G Hard Hat | Safety Equipment",
  "metaDescription": "ANSI Z89.1 Class G certified...",
  "metaKeywords": "hard hat, class g, electrical, safety",

  "isFeatured": false,
  "isNewArrival": true,
  "allowReviews": true
}
```

**Response (201 Created):**
```json
{
  "product": {
    "id": "clxp2...",
    "sku": "PPE-HH-002",
    "name": "Hard Hat - Class G",
    ...
  },
  "message": "Product created successfully"
}
```

**Errors:**
- `400` - SKU already exists
- `400` - Slug already exists
- `400` - Invalid price format
- `400` - Missing required fields
- `401` - Unauthorized
- `403` - Forbidden (not admin)

---

### PUT `/api/admin/products/[id]`
Update existing product.

**Headers:**
```
Authorization: Bearer <admin-session-token>
Content-Type: application/json
```

**Request Body:** (Same as POST, all fields optional)
```json
{
  "name": "Updated Product Name",
  "basePrice": 59.99,
  "status": "ACTIVE"
}
```

**Response (200 OK):**
```json
{
  "product": {
    "id": "clxp2...",
    "name": "Updated Product Name",
    ...
  },
  "message": "Product updated successfully"
}
```

---

### DELETE `/api/admin/products/[id]`
Delete product (soft delete - sets status to DISCONTINUED).

**Headers:**
```
Authorization: Bearer <admin-session-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Errors:**
- `404` - Product not found
- `400` - Cannot delete product with active orders

---

### PUT `/api/admin/products/[id]/inventory`
Update product inventory across warehouses.

**Headers:**
```
Authorization: Bearer <admin-session-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "warehouseId": "clxw1...",
  "action": "add" | "subtract" | "set",
  "quantity": 50,
  "notes": "Received shipment from supplier"
}
```

**Response (200 OK):**
```json
{
  "product": {
    "id": "clxp1...",
    "stockQuantity": 200,
    "warehouseStock": [
      {
        "warehouse": {
          "name": "Main Warehouse"
        },
        "quantity": 150,
        "reserved": 10,
        "available": 140
      }
    ]
  },
  "inventoryLog": {
    "id": "clxil1...",
    "action": "PURCHASE",
    "quantity": 50,
    "previousQty": 150,
    "newQty": 200
  }
}
```

---

### POST `/api/admin/products/[id]/suppliers`
Assign supplier to product.

**Headers:**
```
Authorization: Bearer <admin-session-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "supplierId": "clxs1...",
  "supplierSku": "SUP-HH-001",
  "costPrice": 25.00,
  "minimumOrderQty": 10,
  "leadTimeDays": 7,
  "isPrimary": true,
  "priority": 1
}
```

**Response (201 Created):**
```json
{
  "productSupplier": {
    "id": "clxps1...",
    "product": {
      "name": "Hard Hat - Class E"
    },
    "supplier": {
      "name": "Safety Supply Co"
    },
    "costPrice": "25.00",
    "isPrimary": true
  }
}
```

---

## Admin - Orders

### GET `/api/admin/orders`
Get all orders.

**Query Parameters:**
```
?page=1
&limit=50
&status=PENDING | CONFIRMED | PROCESSING | SHIPPED | DELIVERED | CANCELLED
&paymentStatus=PENDING | PAID | FAILED
&accountType=B2C | B2B | GSA
&startDate=2024-01-01
&endDate=2024-12-31
&search=ORD-2024
```

**Response (200 OK):**
```json
{
  "orders": [
    {
      "id": "clxo1...",
      "orderNumber": "ORD-2024-001234",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "accountType": "B2C",
      "status": "PROCESSING",
      "paymentStatus": "PAID",
      "subtotal": "125.00",
      "tax": "10.00",
      "shipping": "15.00",
      "total": "150.00",
      "itemCount": 3,
      "createdAt": "2024-11-20T10:30:00Z"
    }
  ],
  "pagination": {...},
  "stats": {
    "totalOrders": 1543,
    "pendingOrders": 23,
    "processingOrders": 45,
    "shippedOrders": 12,
    "totalRevenue": "245678.90"
  }
}
```

---

### GET `/api/admin/orders/[id]`
Get order details.

**Response (200 OK):**
```json
{
  "id": "clxo1...",
  "orderNumber": "ORD-2024-001234",

  "user": {
    "id": "clxu1...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0100"
  },

  "accountType": "B2C",
  "status": "PROCESSING",
  "paymentStatus": "PAID",

  "items": [
    {
      "id": "clxoi1...",
      "product": {
        "id": "clxp1...",
        "name": "Hard Hat - Class E",
        "sku": "PPE-HH-001",
        "images": ["/uploads/products/hardhat-001.jpg"]
      },
      "quantity": 2,
      "price": "39.99",
      "discount": "0.00",
      "tax": "6.40",
      "total": "79.98"
    }
  ],

  "subtotal": "125.00",
  "tax": "10.00",
  "taxAmount": "10.00",
  "shipping": "15.00",
  "shippingCost": "15.00",
  "discount": "0.00",
  "total": "150.00",
  "totalAmount": "150.00",

  "billingAddress": {
    "fullName": "John Doe",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },

  "shippingAddress": {
    "fullName": "John Doe",
    "addressLine1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },

  "paymentMethod": "CREDIT_CARD",
  "paymentIntentId": "pi_xxx",
  "paidAt": "2024-11-20T10:35:00Z",

  "shippingCarrier": "UPS",
  "shippingMethod": "Ground",
  "trackingNumber": "1Z999AA10123456784",
  "shippedAt": "2024-11-21T09:00:00Z",

  "customerNotes": "Please leave at front door",
  "adminNotes": "VIP customer - priority handling",

  "statusHistory": [
    {
      "status": "PENDING",
      "notes": "Order created",
      "createdAt": "2024-11-20T10:30:00Z"
    },
    {
      "status": "CONFIRMED",
      "notes": "Payment confirmed",
      "changedBy": "System",
      "createdAt": "2024-11-20T10:35:00Z"
    },
    {
      "status": "PROCESSING",
      "notes": "Preparing shipment",
      "changedBy": "admin@site.com",
      "createdAt": "2024-11-21T08:00:00Z"
    }
  ],

  "createdAt": "2024-11-20T10:30:00Z",
  "updatedAt": "2024-11-21T09:00:00Z"
}
```

---

### PUT `/api/admin/orders/[id]/status`
Update order status.

**Request Body:**
```json
{
  "status": "SHIPPED",
  "trackingNumber": "1Z999AA10123456784",
  "shippingCarrier": "UPS",
  "notes": "Shipped via UPS Ground"
}
```

**Response (200 OK):**
```json
{
  "order": {
    "id": "clxo1...",
    "status": "SHIPPED",
    "trackingNumber": "1Z999AA10123456784"
  },
  "message": "Order status updated successfully"
}
```

---

## Admin - Customers

### GET `/api/admin/customers`
Get all customers.

**Query Parameters:**
```
?page=1
&limit=50
&accountType=B2C | B2B | GSA
&role=CUSTOMER | B2B_CUSTOMER | GSA_CUSTOMER
&search=john@example
```

**Response (200 OK):**
```json
{
  "customers": [
    {
      "id": "clxu1...",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1-555-0100",
      "role": "B2B_CUSTOMER",
      "accountType": "B2B",
      "isActive": true,

      "b2bProfile": {
        "companyName": "Acme Corp",
        "taxId": "12-3456789",
        "creditLimit": "50000.00",
        "creditUsed": "12500.00",
        "status": "APPROVED"
      },

      "orderCount": 45,
      "totalSpent": "125678.50",

      "createdAt": "2023-06-15T10:00:00Z"
    }
  ],
  "pagination": {...},
  "stats": {
    "totalCustomers": 2345,
    "b2cCustomers": 2100,
    "b2bCustomers": 200,
    "gsaCustomers": 45
  }
}
```

---

### GET `/api/admin/customers/[id]`
Get customer details.

**Response (200 OK):**
```json
{
  "id": "clxu1...",
  "email": "john@example.com",
  "name": "John Doe",
  "phone": "+1-555-0100",
  "role": "B2B_CUSTOMER",
  "accountType": "B2B",
  "isActive": true,

  "b2bProfile": {
    "companyName": "Acme Corp",
    "taxId": "12-3456789",
    "businessLicense": "BL123456",
    "creditLimit": "50000.00",
    "creditUsed": "12500.00",
    "paymentTerms": 30,
    "discountPercent": "5.00",
    "status": "APPROVED",
    "approvedAt": "2023-06-16T14:00:00Z"
  },

  "customerCredit": {
    "creditLimit": "50000.00",
    "availableCredit": "37500.00",
    "usedCredit": "12500.00",
    "status": "ACTIVE"
  },

  "addresses": [
    {
      "id": "clxaddr1...",
      "type": "BOTH",
      "fullName": "John Doe",
      "company": "Acme Corp",
      "addressLine1": "123 Business Ave",
      "city": "Chicago",
      "state": "IL",
      "zipCode": "60601",
      "isDefault": true
    }
  ],

  "orders": {
    "total": 45,
    "totalSpent": "125678.50",
    "lastOrderDate": "2024-11-15T10:00:00Z"
  },

  "customerGroups": [
    {
      "group": {
        "name": "Preferred Partners",
        "defaultDiscount": "10.00"
      },
      "assignedAt": "2023-07-01T10:00:00Z"
    }
  ],

  "activityLog": [
    {
      "action": "LOGIN",
      "description": "User logged in",
      "createdAt": "2024-11-22T09:00:00Z"
    }
  ]
}
```

---

### POST `/api/admin/customers/[id]/credit`
Set or update customer credit.

**Request Body:**
```json
{
  "creditLimit": 75000.00,
  "paymentTerms": 60,
  "notes": "Increased credit limit due to strong payment history"
}
```

**Response (200 OK):**
```json
{
  "customerCredit": {
    "id": "clxcc1...",
    "creditLimit": "75000.00",
    "availableCredit": "62500.00",
    "usedCredit": "12500.00",
    "paymentTerms": 60,
    "status": "ACTIVE"
  },
  "message": "Credit updated successfully"
}
```

---

### POST `/api/admin/customers/[id]/gsa-approval`
Approve or reject GSA customer application.

**Request Body:**
```json
{
  "action": "approve" | "reject",
  "notes": "Contract number verified"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "clxu1...",
    "gsaApprovalStatus": "APPROVED",
    "role": "GSA_CUSTOMER"
  },
  "message": "GSA application approved"
}
```

---

## Admin - B2B Features

### GET `/api/admin/customer-groups`
Get all customer groups.

**Response (200 OK):**
```json
{
  "groups": [
    {
      "id": "clxcg1...",
      "name": "Preferred Partners",
      "description": "Top tier B2B customers",
      "defaultDiscount": "10.00",
      "accountTypes": ["B2B"],
      "loyaltyTiers": ["GOLD", "PLATINUM", "DIAMOND"],
      "isActive": true,
      "memberCount": 45,
      "createdAt": "2023-01-15T10:00:00Z"
    }
  ]
}
```

---

### POST `/api/admin/customer-groups`
Create new customer group.

**Request Body:**
```json
{
  "name": "Enterprise Partners",
  "description": "Enterprise-level customers with special pricing",
  "defaultDiscount": 15.00,
  "accountTypes": ["B2B"],
  "loyaltyTiers": ["PLATINUM", "DIAMOND"],
  "isActive": true,
  "priority": 1
}
```

**Response (201 Created):**
```json
{
  "group": {
    "id": "clxcg2...",
    "name": "Enterprise Partners",
    "defaultDiscount": "15.00"
  },
  "message": "Customer group created successfully"
}
```

---

### POST `/api/admin/customer-groups/[id]/members`
Add members to customer group.

**Request Body:**
```json
{
  "userIds": ["clxu1...", "clxu2...", "clxu3..."]
}
```

**Response (200 OK):**
```json
{
  "added": 3,
  "members": [
    {
      "id": "clxcgm1...",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "assignedAt": "2024-11-22T14:30:00Z"
    }
  ]
}
```

---

### GET `/api/admin/quotes`
Get all quote requests.

**Query Parameters:**
```
?status=DRAFT | SENT | VIEWED | ACCEPTED | REJECTED | EXPIRED | CONVERTED
&page=1
&limit=50
```

**Response (200 OK):**
```json
{
  "quotes": [
    {
      "id": "clxq1...",
      "quoteNumber": "QTE-2024-00123",
      "user": {
        "name": "Jane Smith",
        "email": "jane@acme.com",
        "company": "Acme Corp"
      },
      "status": "SENT",
      "total": "15678.50",
      "validUntil": "2024-12-15T23:59:59Z",
      "createdBy": "admin@site.com",
      "sentAt": "2024-11-20T10:00:00Z",
      "createdAt": "2024-11-19T15:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### POST `/api/admin/quotes`
Create new quote.

**Request Body:**
```json
{
  "userId": "clxu1...",
  "items": [
    {
      "productId": "clxp1...",
      "quantity": 100,
      "unitPrice": 35.99,
      "discount": 5.00,
      "notes": "Bulk discount applied"
    }
  ],
  "validUntil": "2024-12-31T23:59:59Z",
  "customerNotes": "Quote for annual supply contract",
  "internalNotes": "Important customer - best pricing",
  "termsConditions": "Standard B2B terms apply"
}
```

**Response (201 Created):**
```json
{
  "quote": {
    "id": "clxq2...",
    "quoteNumber": "QTE-2024-00124",
    "status": "DRAFT",
    "subtotal": "3599.00",
    "tax": "287.92",
    "total": "3886.92"
  }
}
```

---

### GET `/api/admin/contracts`
Get all contracts.

**Response (200 OK):**
```json
{
  "contracts": [
    {
      "id": "clxcon1...",
      "contractNumber": "CNT-2024-001",
      "user": {
        "name": "Acme Corp",
        "email": "purchasing@acme.com"
      },
      "name": "Annual Supply Agreement 2024",
      "status": "ACTIVE",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T23:59:59Z",
      "discountPercent": "12.00",
      "minimumSpend": "100000.00",
      "volumeCommitment": 5000,
      "currentSpend": "45678.90",
      "currentVolume": 2341
    }
  ]
}
```

---

### POST `/api/admin/contracts`
Create new contract.

**Request Body:**
```json
{
  "userId": "clxu1...",
  "name": "2025 Supply Agreement",
  "description": "Annual contract with volume pricing",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "autoRenew": true,
  "renewalPeriod": 12,
  "discountPercent": 15.00,
  "minimumSpend": 150000.00,
  "volumeCommitment": 10000,
  "paymentTerms": 60,
  "items": [
    {
      "productId": "clxp1...",
      "contractPrice": 32.99,
      "minimumQuantity": 100
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "contract": {
    "id": "clxcon2...",
    "contractNumber": "CNT-2025-001",
    "status": "DRAFT"
  }
}
```

---

### GET `/api/admin/tiered-prices`
Get all tiered pricing rules.

**Response (200 OK):**
```json
{
  "tieredPrices": [
    {
      "id": "clxtp1...",
      "product": {
        "name": "Hard Hat - Class E",
        "sku": "PPE-HH-001"
      },
      "minQuantity": 50,
      "maxQuantity": 99,
      "price": "37.99",
      "customerGroup": {
        "name": "Preferred Partners"
      },
      "accountTypes": ["B2B"],
      "isActive": true
    }
  ]
}
```

---

### POST `/api/admin/tiered-prices`
Create tiered pricing rule.

**Request Body:**
```json
{
  "productId": "clxp1...",
  "minQuantity": 100,
  "maxQuantity": 499,
  "price": 35.99,
  "customerGroupId": "clxcg1...",
  "accountTypes": ["B2B"],
  "priority": 1
}
```

**Response (201 Created):**
```json
{
  "tieredPrice": {
    "id": "clxtp2...",
    "minQuantity": 100,
    "maxQuantity": 499,
    "price": "35.99"
  }
}
```

---

## Admin - Inventory

### GET `/api/admin/warehouses`
Get all warehouses.

**Response (200 OK):**
```json
{
  "warehouses": [
    {
      "id": "clxw1...",
      "code": "WH-MAIN",
      "name": "Main Warehouse",
      "address": "500 Warehouse Blvd",
      "city": "Chicago",
      "state": "IL",
      "zipCode": "60601",
      "phone": "+1-555-0200",
      "email": "warehouse@site.com",
      "managerName": "Mike Johnson",
      "isActive": true,
      "isPrimary": true,
      "priority": 1,
      "productCount": 350,
      "totalStock": 125678
    }
  ]
}
```

---

### POST `/api/admin/warehouses`
Create new warehouse.

**Request Body:**
```json
{
  "code": "WH-WEST",
  "name": "West Coast Distribution",
  "address": "1000 Distribution Way",
  "city": "Los Angeles",
  "state": "CA",
  "zipCode": "90001",
  "phone": "+1-555-0300",
  "email": "westcoast@site.com",
  "managerName": "Sarah Williams",
  "isActive": true,
  "isPrimary": false,
  "priority": 2
}
```

**Response (201 Created):**
```json
{
  "warehouse": {
    "id": "clxw2...",
    "code": "WH-WEST",
    "name": "West Coast Distribution"
  }
}
```

---

### GET `/api/admin/inventory`
Get inventory across all warehouses.

**Query Parameters:**
```
?warehouseId=clxw1...
&productId=clxp1...
&lowStock=true
&page=1
&limit=50
```

**Response (200 OK):**
```json
{
  "inventory": [
    {
      "id": "clxws1...",
      "warehouse": {
        "code": "WH-MAIN",
        "name": "Main Warehouse"
      },
      "product": {
        "sku": "PPE-HH-001",
        "name": "Hard Hat - Class E"
      },
      "quantity": 150,
      "reserved": 25,
      "available": 125,
      "reorderPoint": 50,
      "reorderQuantity": 200,
      "aisle": "A",
      "rack": "12",
      "shelf": "3",
      "lastRestocked": "2024-11-15T10:00:00Z",
      "lastCounted": "2024-11-20T14:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### POST `/api/admin/warehouse-transfers`
Create warehouse transfer.

**Request Body:**
```json
{
  "sourceWarehouseId": "clxw1...",
  "destinationWarehouseId": "clxw2...",
  "productId": "clxp1...",
  "quantity": 50,
  "notes": "Rebalancing stock levels",
  "estimatedArrival": "2024-11-25"
}
```

**Response (201 Created):**
```json
{
  "transfer": {
    "id": "clxwt1...",
    "transferNumber": "TRF-2024-00123",
    "status": "PENDING",
    "quantity": 50
  }
}
```

---

## Admin - Suppliers

### GET `/api/admin/suppliers`
Get all suppliers.

**Response (200 OK):**
```json
{
  "suppliers": [
    {
      "id": "clxs1...",
      "code": "SUP-001",
      "name": "Safety Supply Co",
      "email": "sales@safetysupply.com",
      "phone": "+1-555-1000",
      "website": "https://safetysupply.com",
      "address": "200 Industrial Park",
      "city": "Cleveland",
      "state": "OH",
      "zipCode": "44101",
      "country": "USA",
      "rating": "4.75",
      "onTimeDeliveryRate": "96.50",
      "qualityRating": "4.80",
      "totalPurchases": "456789.00",
      "paymentTerms": 30,
      "status": "ACTIVE",
      "productCount": 125
    }
  ]
}
```

---

### POST `/api/admin/suppliers`
Create new supplier.

**Request Body:**
```json
{
  "name": "Acme Safety Products",
  "code": "SUP-002",
  "email": "orders@acmesafety.com",
  "phone": "+1-555-2000",
  "website": "https://acmesafety.com",
  "address": "300 Manufacturing Dr",
  "city": "Detroit",
  "state": "MI",
  "zipCode": "48201",
  "country": "USA",
  "taxId": "45-6789012",
  "businessLicense": "BL789012",
  "paymentTerms": 45,
  "currency": "USD",
  "status": "PENDING_APPROVAL",
  "notes": "New supplier - needs evaluation"
}
```

**Response (201 Created):**
```json
{
  "supplier": {
    "id": "clxs2...",
    "code": "SUP-002",
    "name": "Acme Safety Products",
    "status": "PENDING_APPROVAL"
  }
}
```

---

### GET `/api/admin/purchase-orders`
Get all purchase orders.

**Query Parameters:**
```
?status=DRAFT | SENT | ACKNOWLEDGED | PARTIALLY_RECEIVED | RECEIVED | CANCELLED
&supplierId=clxs1...
&page=1
&limit=50
```

**Response (200 OK):**
```json
{
  "purchaseOrders": [
    {
      "id": "clxpo1...",
      "poNumber": "PO-2024-00456",
      "supplier": {
        "name": "Safety Supply Co",
        "code": "SUP-001"
      },
      "status": "SENT",
      "subtotal": "12500.00",
      "tax": "1000.00",
      "shipping": "250.00",
      "total": "13750.00",
      "orderDate": "2024-11-20T10:00:00Z",
      "expectedDelivery": "2024-11-27T10:00:00Z",
      "warehouse": {
        "name": "Main Warehouse"
      },
      "itemCount": 15,
      "receivedItems": 0,
      "createdBy": "admin@site.com"
    }
  ],
  "pagination": {...}
}
```

---

### POST `/api/admin/purchase-orders`
Create purchase order.

**Request Body:**
```json
{
  "supplierId": "clxs1...",
  "warehouseId": "clxw1...",
  "expectedDelivery": "2024-12-01",
  "paymentTerms": 30,
  "notes": "Urgent order - expedite shipping",
  "items": [
    {
      "productId": "clxp1...",
      "quantity": 200,
      "unitCost": 25.00,
      "notes": "Class E hard hats"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "purchaseOrder": {
    "id": "clxpo2...",
    "poNumber": "PO-2024-00457",
    "status": "DRAFT",
    "total": "5000.00"
  }
}
```

---

## Admin - Advanced Features

### GET `/api/admin/bundles`
Get all product bundles.

**Response (200 OK):**
```json
{
  "bundles": [
    {
      "id": "clxb1...",
      "sku": "BUNDLE-SAFETY-01",
      "name": "Complete Safety Kit",
      "slug": "complete-safety-kit",
      "bundlePrice": "129.99",
      "retailValue": "165.00",
      "savings": "35.01",
      "isActive": true,
      "isFeatured": true,
      "items": [
        {
          "product": {
            "name": "Hard Hat - Class E",
            "basePrice": "45.99"
          },
          "quantity": 1
        },
        {
          "product": {
            "name": "Safety Glasses",
            "basePrice": "12.99"
          },
          "quantity": 2
        }
      ],
      "createdAt": "2024-10-01T10:00:00Z"
    }
  ]
}
```

---

### POST `/api/admin/bundles`
Create product bundle.

**Request Body:**
```json
{
  "sku": "BUNDLE-WELDING-01",
  "name": "Welding Safety Bundle",
  "slug": "welding-safety-bundle",
  "description": "Complete welding safety equipment",
  "bundlePrice": 199.99,
  "image": "/uploads/bundles/welding-bundle.jpg",
  "isActive": true,
  "isFeatured": false,
  "items": [
    {
      "productId": "clxp1...",
      "quantity": 1,
      "sortOrder": 1
    },
    {
      "productId": "clxp2...",
      "quantity": 1,
      "sortOrder": 2
    }
  ]
}
```

---

### GET `/api/admin/backorders`
Get all backorders.

**Query Parameters:**
```
?status=PENDING | NOTIFIED | FULFILLED | CANCELLED
&productId=clxp1...
```

**Response (200 OK):**
```json
{
  "backorders": [
    {
      "id": "clxbo1...",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "product": {
        "name": "Hard Hat - Class G",
        "sku": "PPE-HH-002"
      },
      "quantity": 25,
      "pricePerUnit": "49.99",
      "status": "PENDING",
      "expectedDate": "2024-12-01T00:00:00Z",
      "createdAt": "2024-11-18T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/admin/rma`
Get all RMA requests.

**Query Parameters:**
```
?status=REQUESTED | APPROVED | REJECTED | ITEMS_RECEIVED | INSPECTION | REFUNDED | REPLACED | CLOSED
&type=REFUND | EXCHANGE | REPAIR | STORE_CREDIT
```

**Response (200 OK):**
```json
{
  "rmas": [
    {
      "id": "clxrma1...",
      "rmaNumber": "RMA-000123",
      "user": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "order": {
        "orderNumber": "ORD-2024-001100"
      },
      "type": "REFUND",
      "status": "REQUESTED",
      "reason": "DEFECTIVE",
      "description": "Product arrived damaged",
      "refundAmount": "125.00",
      "images": ["/uploads/rma/damage-001.jpg"],
      "createdAt": "2024-11-20T14:00:00Z"
    }
  ]
}
```

---

### POST `/api/admin/rma`
Create RMA (admin-initiated).

**Request Body:**
```json
{
  "userId": "clxu1...",
  "orderId": "clxo1...",
  "items": [
    {
      "orderItemId": "clxoi1...",
      "productId": "clxp1...",
      "quantity": 1,
      "unitPrice": 45.99
    }
  ],
  "type": "REFUND",
  "reason": "DEFECTIVE",
  "description": "Customer reported defect",
  "customerNotes": "Handle with priority"
}
```

---

### GET `/api/admin/subscriptions`
Get all subscriptions.

**Query Parameters:**
```
?status=ACTIVE | PAUSED | CANCELLED | EXPIRED | PAST_DUE
&frequency=WEEKLY | BIWEEKLY | MONTHLY | QUARTERLY | YEARLY
```

**Response (200 OK):**
```json
{
  "subscriptions": [
    {
      "id": "clxsub1...",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "ACTIVE",
      "frequency": "MONTHLY",
      "nextOrderDate": "2024-12-15T00:00:00Z",
      "lastOrderDate": "2024-11-15T00:00:00Z",
      "items": [
        {
          "product": {
            "name": "Safety Gloves - Pack of 12"
          },
          "quantity": 2,
          "price": "24.99"
        }
      ],
      "orderCount": 6,
      "totalRevenue": "299.88"
    }
  ]
}
```

---

### POST `/api/admin/subscriptions`
Create subscription for customer.

**Request Body:**
```json
{
  "userId": "clxu1...",
  "frequency": "MONTHLY",
  "shippingAddressId": "clxaddr1...",
  "paymentMethod": "CREDIT_CARD",
  "startDate": "2024-12-01",
  "items": [
    {
      "productId": "clxp1...",
      "quantity": 2,
      "price": 39.99
    }
  ],
  "discountPercent": 5.00
}
```

---

### GET `/api/admin/commissions`
Get all sales commissions.

**Query Parameters:**
```
?status=PENDING | APPROVED | PAID | CANCELLED
&salesRepId=clxsr1...
&startDate=2024-01-01
&endDate=2024-12-31
```

**Response (200 OK):**
```json
{
  "commissions": [
    {
      "id": "clxcom1...",
      "salesRep": {
        "code": "REP-001",
        "name": "Mike Johnson"
      },
      "order": {
        "orderNumber": "ORD-2024-001234"
      },
      "orderTotal": "5000.00",
      "commissionRate": "5.00",
      "commissionAmount": "250.00",
      "status": "PENDING",
      "createdAt": "2024-11-20T10:00:00Z"
    }
  ],
  "totals": {
    "totalCommissions": "12500.00",
    "pendingCommissions": "3500.00",
    "paidCommissions": "9000.00"
  }
}
```

---

### GET `/api/admin/tax-exemptions`
Get all tax exemption requests.

**Query Parameters:**
```
?status=PENDING | APPROVED | REJECTED | EXPIRED
```

**Response (200 OK):**
```json
{
  "taxExemptions": [
    {
      "id": "clxte1...",
      "user": {
        "name": "Non-Profit Org",
        "email": "admin@nonprofit.org"
      },
      "certificateNumber": "EXEMPT-IL-123456",
      "exemptionType": "Non-Profit",
      "states": ["IL", "IN", "WI"],
      "status": "PENDING",
      "issueDate": "2024-01-01T00:00:00Z",
      "expiryDate": "2025-12-31T23:59:59Z",
      "certificateUrl": "/uploads/tax-exemptions/cert-123456.pdf",
      "createdAt": "2024-11-15T10:00:00Z"
    }
  ]
}
```

---

## Admin - Settings

### GET `/api/admin/categories`
Get all categories.

**Response (200 OK):**
```json
{
  "categories": [
    {
      "id": "clxc1...",
      "name": "Head Protection",
      "slug": "head-protection",
      "description": "Hard hats, helmets, and head protection",
      "image": "/uploads/categories/head-protection.jpg",
      "parentId": null,
      "displayOrder": 1,
      "isActive": true,
      "productCount": 45,
      "children": [
        {
          "id": "clxc2...",
          "name": "Hard Hats",
          "slug": "hard-hats",
          "productCount": 25
        }
      ]
    }
  ]
}
```

---

### POST `/api/admin/categories`
Create new category.

**Request Body:**
```json
{
  "name": "Respiratory Protection",
  "slug": "respiratory-protection",
  "description": "Masks, respirators, and breathing equipment",
  "image": "/uploads/categories/respiratory.jpg",
  "parentId": null,
  "displayOrder": 5,
  "isActive": true,
  "metaTitle": "Respiratory Protection Equipment",
  "metaDescription": "Shop NIOSH approved respirators...",
  "metaKeywords": "respirator, mask, n95, breathing"
}
```

---

### GET `/api/admin/product-attributes`
Get all product attributes.

**Response (200 OK):**
```json
{
  "attributes": [
    {
      "id": "clxpa1...",
      "name": "Color",
      "code": "color",
      "type": "SELECT",
      "options": ["Red", "Yellow", "Blue", "Green", "Orange", "White"],
      "displayOrder": 1,
      "isFilterable": true,
      "isRequired": false,
      "isVariant": true,
      "isActive": true
    },
    {
      "id": "clxpa2...",
      "name": "Size",
      "code": "size",
      "type": "SELECT",
      "options": ["Small", "Medium", "Large", "X-Large"],
      "displayOrder": 2,
      "isFilterable": true,
      "isRequired": true,
      "isVariant": true,
      "isActive": true
    }
  ]
}
```

---

### GET `/api/admin/reviews`
Get all product reviews (for moderation).

**Query Parameters:**
```
?status=PENDING | APPROVED | REJECTED
&productId=clxp1...
```

**Response (200 OK):**
```json
{
  "reviews": [
    {
      "id": "clxr1...",
      "product": {
        "name": "Hard Hat - Class E",
        "sku": "PPE-HH-001"
      },
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "rating": 5,
      "title": "Excellent quality!",
      "comment": "Very durable and comfortable. Highly recommend!",
      "status": "PENDING",
      "isVerified": true,
      "images": [],
      "helpfulCount": 0,
      "createdAt": "2024-11-22T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/admin/wishlists`
View all customer wishlists.

**Response (200 OK):**
```json
{
  "wishlists": [
    {
      "user": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "itemCount": 5,
      "items": [
        {
          "product": {
            "name": "Safety Glasses - Anti-Fog",
            "basePrice": "18.99"
          },
          "addedAt": "2024-11-15T10:00:00Z"
        }
      ]
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required",
  "message": "Please sign in to access this resource"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

**404 Not Found:**
```json
{
  "error": "Not found",
  "message": "The requested resource was not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## Rate Limiting

All API endpoints are rate-limited:

- **Public endpoints:** 100 requests per 15 minutes per IP
- **Authenticated endpoints:** 1000 requests per 15 minutes per user
- **Admin endpoints:** 2000 requests per 15 minutes per admin

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

**Rate Limit Exceeded (429):**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 900
}
```

---

## Webhooks (Future)

Webhook endpoints for external integrations:

- Order created: `/api/webhooks/orders/created`
- Order status updated: `/api/webhooks/orders/status`
- Payment received: `/api/webhooks/payments/received`
- Shipment tracking: `/api/webhooks/shipments/tracking`

---

**Last Updated:** November 2024
**API Version:** 1.0.0
