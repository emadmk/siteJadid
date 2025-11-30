# Orders API Documentation

## Overview
The Orders API handles order creation, retrieval, and management with full B2B support including approval workflows, cost center tracking, and multi-user capabilities.

**Base Path**: `/api/orders`

---

## Endpoints

### 1. Get User Orders

**GET** `/api/orders`

Returns all orders for the authenticated user with pagination and filtering support.

#### Authentication
- ✅ Required

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | ❌ No | 1 | Page number |
| limit | number | ❌ No | 20 | Items per page |
| status | string | ❌ No | - | Filter by status |

#### Request
```http
GET /api/orders?page=1&limit=10&status=PENDING HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "orders": [
    {
      "id": "order_abc123",
      "orderNumber": "ORD-1705401234-A7B3C",
      "userId": "user_xyz789",
      "status": "PENDING_APPROVAL",
      "subtotal": 1250.00,
      "tax": 112.50,
      "shipping": 25.00,
      "total": 1387.50,
      "paymentMethod": "CREDIT_CARD",
      "paymentStatus": "PENDING",
      "trackingNumber": null,
      "notes": "Urgent order for Q1 project",
      "createdAt": "2025-01-16T10:30:00.000Z",
      "updatedAt": "2025-01-16T10:30:00.000Z",
      "shippingAddress": {
        "id": "addr_ship123",
        "firstName": "John",
        "lastName": "Doe",
        "address1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "United States"
      },
      "createdByMember": {
        "id": "member_xyz",
        "role": "PURCHASER",
        "user": {
          "name": "John Doe",
          "email": "john@acme.com"
        }
      },
      "costCenter": {
        "id": "cc_123",
        "code": "DEPT-001",
        "name": "IT Department"
      },
      "approvals": [
        {
          "id": "approval_abc",
          "status": "PENDING",
          "orderTotal": 1387.50,
          "createdAt": "2025-01-16T10:30:00.000Z",
          "approver": {
            "user": {
              "name": "Jane Manager",
              "email": "jane@acme.com"
            }
          }
        }
      ],
      "_count": {
        "items": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch orders"
}
```

---

### 2. Create Order

**POST** `/api/orders`

Creates a new order from the user's cart. Automatically handles B2B approval workflow if required.

#### Authentication
- ✅ Required

#### Request Body
```json
{
  "shippingAddressId": "addr_ship123",
  "billingAddressId": "addr_bill456",
  "paymentMethod": "CREDIT_CARD",
  "costCenterId": "cc_dept001",
  "notes": "Please deliver before Friday"
}
```

#### Field Validation
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| shippingAddressId | string | ✅ Yes | Must be user's address |
| billingAddressId | string | ✅ Yes | Must be user's address |
| paymentMethod | enum | ✅ Yes | CREDIT_CARD, PURCHASE_ORDER, NET_30, GSA_CONTRACT |
| costCenterId | string | ❌ No | Required for B2B if not using default |
| notes | string | ❌ No | Max 500 characters |

#### Response (201 Created)
```json
{
  "id": "order_new789",
  "orderNumber": "ORD-1705402345-B8C4D",
  "userId": "user_xyz789",
  "status": "PENDING_APPROVAL",
  "subtotal": 2500.00,
  "tax": 225.00,
  "shipping": 35.00,
  "total": 2760.00,
  "paymentMethod": "PURCHASE_ORDER",
  "paymentStatus": "PENDING",
  "costCenterId": "cc_dept001",
  "createdByMemberId": "member_xyz",
  "requiresApproval": true,
  "approvalThreshold": 2000.00,
  "createdAt": "2025-01-16T14:25:00.000Z",
  "items": [
    {
      "id": "item_1",
      "productId": "prod_safety_vest",
      "quantity": 50,
      "price": 25.00,
      "subtotal": 1250.00,
      "product": {
        "name": "High-Visibility Safety Vest",
        "sku": "SV-1234",
        "images": ["https://..."]
      }
    },
    {
      "id": "item_2",
      "productId": "prod_hard_hat",
      "quantity": 50,
      "price": 25.00,
      "subtotal": 1250.00,
      "product": {
        "name": "Safety Hard Hat",
        "sku": "HH-5678",
        "images": ["https://..."]
      }
    }
  ],
  "approvals": [
    {
      "id": "approval_new",
      "status": "PENDING",
      "orderTotal": 2760.00,
      "createdAt": "2025-01-16T14:25:00.000Z",
      "approver": {
        "user": {
          "name": "Sarah Approver",
          "email": "sarah@acme.com"
        }
      }
    }
  ]
}
```

#### Order Creation Flow
1. **Validate Cart**: Ensure cart has items and all products are in stock
2. **Calculate Totals**: Subtotal, tax, shipping, total
3. **Check B2B Membership**: If user is B2B member, retrieve membership details
4. **Determine Approval Requirement**:
   - If total > B2B account's `requiresApprovalAbove` threshold: requires approval
   - If member has `requiresApproval: true`: requires approval
   - If member's `orderLimit` is exceeded: reject order
5. **Check Cost Center Budget**: If cost center specified, verify budget availability
6. **Create Order**: With status PENDING_APPROVAL or PENDING
7. **Create Approval Request**: If approval required, create OrderApproval record
8. **Deduct Inventory**: Reserve stock for order items
9. **Clear Cart**: Remove items from cart
10. **Return Order**: With all details

#### Error Responses
```json
// 400 Bad Request - Empty cart
{
  "error": "Cart is empty"
}

// 400 Bad Request - Out of stock
{
  "error": "Some items are out of stock",
  "details": {
    "outOfStock": ["prod_123", "prod_456"]
  }
}

// 400 Bad Request - Order limit exceeded
{
  "error": "Order exceeds your limit",
  "details": {
    "orderTotal": 5000.00,
    "yourLimit": 2000.00
  }
}

// 400 Bad Request - Budget exceeded
{
  "error": "Order exceeds cost center budget",
  "details": {
    "costCenter": "DEPT-001",
    "budget": 10000.00,
    "spent": 8500.00,
    "available": 1500.00,
    "orderTotal": 2760.00
  }
}

// 404 Not Found - Address not found
{
  "error": "Shipping address not found"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to create order"
}
```

---

### 3. Get Order Details

**GET** `/api/orders/[orderNumber]`

Retrieves detailed information for a specific order including items, shipments, and approvals.

#### Authentication
- ✅ Required

#### Request
```http
GET /api/orders/ORD-1705401234-A7B3C HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "id": "order_abc123",
  "orderNumber": "ORD-1705401234-A7B3C",
  "userId": "user_xyz789",
  "status": "SHIPPED",
  "subtotal": 1250.00,
  "tax": 112.50,
  "shipping": 25.00,
  "total": 1387.50,
  "paymentMethod": "PURCHASE_ORDER",
  "paymentStatus": "PAID",
  "trackingNumber": "1Z999AA10123456784",
  "notes": "Urgent order for Q1 project",
  "createdAt": "2025-01-16T10:30:00.000Z",
  "updatedAt": "2025-01-18T09:15:00.000Z",
  "shippingAddress": {
    "id": "addr_ship123",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Acme Corp",
    "address1": "123 Main St",
    "address2": "Suite 100",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "United States",
    "phone": "+1-555-0123"
  },
  "billingAddress": {
    "id": "addr_bill456",
    "firstName": "John",
    "lastName": "Doe",
    "company": "Acme Corp",
    "address1": "123 Main St",
    "address2": "Suite 100",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "United States",
    "phone": "+1-555-0123"
  },
  "items": [
    {
      "id": "item_1",
      "productId": "prod_safety_vest",
      "quantity": 50,
      "price": 25.00,
      "subtotal": 1250.00,
      "product": {
        "id": "prod_safety_vest",
        "name": "High-Visibility Safety Vest",
        "slug": "high-visibility-safety-vest",
        "sku": "SV-1234",
        "images": ["https://..."],
        "description": "ANSI Class 2 compliant safety vest"
      }
    }
  ],
  "shipments": [
    {
      "id": "ship_001",
      "carrier": "UPS",
      "trackingNumber": "1Z999AA10123456784",
      "shippedAt": "2025-01-17T14:00:00.000Z",
      "estimatedDelivery": "2025-01-20T17:00:00.000Z",
      "status": "IN_TRANSIT",
      "items": [
        {
          "id": "shipitem_1",
          "quantity": 50,
          "orderItem": {
            "product": {
              "name": "High-Visibility Safety Vest"
            }
          }
        }
      ]
    }
  ],
  "approvals": [
    {
      "id": "approval_abc",
      "status": "APPROVED",
      "orderTotal": 1387.50,
      "notes": "Approved for Q1 safety initiative",
      "createdAt": "2025-01-16T10:30:00.000Z",
      "approvedAt": "2025-01-16T15:45:00.000Z",
      "approver": {
        "id": "member_approver",
        "role": "APPROVER",
        "user": {
          "name": "Jane Manager",
          "email": "jane@acme.com"
        }
      },
      "requester": {
        "id": "member_requester",
        "role": "PURCHASER",
        "user": {
          "name": "John Doe",
          "email": "john@acme.com"
        }
      }
    }
  ],
  "costCenter": {
    "id": "cc_123",
    "code": "DEPT-001",
    "name": "IT Department",
    "budget": 50000.00,
    "spent": 12387.50
  },
  "createdByMember": {
    "id": "member_xyz",
    "role": "PURCHASER",
    "user": {
      "name": "John Doe",
      "email": "john@acme.com"
    }
  }
}
```

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 404 Not Found
{
  "error": "Order not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch order"
}
```

---

### 4. Update Order (Cancel)

**PATCH** `/api/orders/[orderNumber]`

Updates an order. Currently supports cancellation only.

#### Authentication
- ✅ Required

#### Request Body
```json
{
  "action": "cancel"
}
```

#### Cancellation Rules
- Can only cancel orders with status: PENDING, PENDING_APPROVAL, or PROCESSING
- Cannot cancel orders that are SHIPPED, DELIVERED, or already CANCELLED
- Inventory is automatically restored
- Pending approvals are automatically cancelled

#### Response (200 OK)
```json
{
  "id": "order_abc123",
  "orderNumber": "ORD-1705401234-A7B3C",
  "status": "CANCELLED",
  "items": [
    {
      "id": "item_1",
      "productId": "prod_safety_vest",
      "quantity": 50,
      "product": {
        "id": "prod_safety_vest",
        "name": "High-Visibility Safety Vest",
        "sku": "SV-1234"
      }
    }
  ]
}
```

#### Cancellation Flow
1. **Validate Order Status**: Must be PENDING, PENDING_APPROVAL, or PROCESSING
2. **Update Order Status**: Set to CANCELLED
3. **Restore Inventory**: Add quantities back to product stock
4. **Cancel Approvals**: Set all PENDING approvals to CANCELLED
5. **Return Updated Order**

#### Error Responses
```json
// 400 Bad Request - Cannot cancel
{
  "error": "Order cannot be cancelled"
}

// 400 Bad Request - Invalid action
{
  "error": "Invalid action"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 404 Not Found
{
  "error": "Order not found"
}

// 500 Internal Server Error
{
  "error": "Failed to update order"
}
```

---

## Order Status Workflow

### Status Enum
```typescript
enum OrderStatus {
  PENDING_APPROVAL  // Waiting for B2B approval
  PENDING           // Approved/No approval needed, waiting for processing
  PROCESSING        // Being prepared for shipment
  SHIPPED           // In transit
  DELIVERED         // Completed successfully
  CANCELLED         // Cancelled by user or system
  RETURNED          // Customer returned the order
}
```

### Status Flow
```
┌─────────────────┐
│ PENDING_APPROVAL│──► Approval Required
└────────┬────────┘
         │ Approved
         ▼
    ┌─────────┐
    │ PENDING │──► Payment Processing
    └────┬────┘
         │
         ▼
  ┌────────────┐
  │ PROCESSING │──► Order Fulfillment
  └──────┬─────┘
         │
         ▼
    ┌─────────┐
    │ SHIPPED │──► In Transit
    └────┬────┘
         │
         ▼
  ┌───────────┐
  │ DELIVERED │──► Completed
  └───────────┘

         OR

    ┌───────────┐
    │ CANCELLED │◄── User/System Cancellation
    └───────────┘

         OR

    ┌──────────┐
    │ RETURNED │◄── Customer Return (from DELIVERED)
    └──────────┘
```

---

## Payment Methods

```typescript
enum PaymentMethod {
  CREDIT_CARD      // Credit/Debit card
  PURCHASE_ORDER   // B2B Purchase Order
  NET_30           // Net 30 payment terms
  GSA_CONTRACT     // GSA government contract
  WIRE_TRANSFER    // Bank wire transfer
  CHECK            // Check payment
}
```

---

## Implementation Details

### File Location
- Main route: `src/app/api/orders/route.ts`
- Dynamic route: `src/app/api/orders/[orderNumber]/route.ts`

### Database Model
```prisma
model Order {
  id                  String        @id @default(cuid())
  orderNumber         String        @unique
  userId              String
  createdByMemberId   String?
  costCenterId        String?
  status              OrderStatus   @default(PENDING)
  subtotal            Decimal       @db.Decimal(12, 2)
  tax                 Decimal       @db.Decimal(12, 2)
  shipping            Decimal       @db.Decimal(12, 2)
  total               Decimal       @db.Decimal(12, 2)
  paymentMethod       PaymentMethod
  paymentStatus       PaymentStatus @default(PENDING)
  shippingAddressId   String
  billingAddressId    String
  trackingNumber      String?
  notes               String?       @db.Text
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  user                User                @relation(fields: [userId], references: [id])
  createdByMember     B2BAccountMember?   @relation(fields: [createdByMemberId], references: [id])
  costCenter          CostCenter?         @relation(fields: [costCenterId], references: [id])
  shippingAddress     Address             @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  billingAddress      Address             @relation("BillingAddress", fields: [billingAddressId], references: [id])
  items               OrderItem[]
  shipments           Shipment[]
  approvals           OrderApproval[]

  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@index([createdByMemberId])
  @@index([costCenterId])
}
```

---

## Usage Examples

### Create Order (B2B with Approval)
```typescript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    shippingAddressId: 'addr_ship123',
    billingAddressId: 'addr_bill123',
    paymentMethod: 'PURCHASE_ORDER',
    costCenterId: 'cc_dept001',
    notes: 'Urgent - needed by Friday'
  })
});

const order = await response.json();
console.log('Order created:', order.orderNumber);
console.log('Requires approval:', order.status === 'PENDING_APPROVAL');
```

### Cancel Order
```typescript
const response = await fetch(`/api/orders/${orderNumber}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ action: 'cancel' })
});

if (response.ok) {
  console.log('Order cancelled successfully');
}
```

---

## Related Documentation
- [Addresses API](./addresses.md) - Shipping/billing addresses
- [B2B Approvals API](./b2b-approvals.md) - Approval workflow
- [Cost Centers API](./cost-centers.md) - Budget tracking
- [Cart API](./cart.md) - Shopping cart
- [Checkout Page](../pages/customer-checkout.md) - Order creation UI
- [Orders Page](../pages/customer-orders.md) - Order history UI
