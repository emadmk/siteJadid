# Admin Backorder Management Page

## Overview

The Backorder Management page (`/admin/backorders`) provides administrative tools for managing out-of-stock customer orders. This interface enables administrators to track products on backorder, update expected availability dates, notify customers, and automatically fulfill orders when stock becomes available.

**File Location:** `/home/user/siteJadid/src/app/admin/backorders/page.tsx`

**Route:** `/admin/backorders`

---

## User Access Requirements

### Authorized Roles
- `ADMIN`

### Authentication Check
```typescript
const session = await getServerSession(authOptions);

if (!session || session.user.role !== 'ADMIN') {
  redirect('/');
}
```

---

## Features List

### Core Features

1. **Backorder Statistics Dashboard**
   - Total backorders count
   - Pending backorders
   - Total units on backorder
   - Fulfilled backorders

2. **Backorder Listing Table**
   - Customer information
   - Product details
   - Quantity on backorder
   - Order number reference
   - Expected availability date
   - Current stock status
   - Notification status

3. **Status Tracking**
   - PENDING - Awaiting stock
   - NOTIFIED - Customer notified of availability
   - FULFILLED - Order fulfilled
   - CANCELLED - Backorder cancelled

4. **Customer Communication**
   - Track notification status
   - Send availability notifications
   - Update customers on ETAs

5. **Stock Monitoring**
   - Current stock quantities
   - Expected restock dates
   - Auto-fulfill when available

---

## Database Queries Used

### Get All Backorders with Related Data
```typescript
async function getBackorders() {
  const backorders = await prisma.backOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
        },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
        },
      },
    },
  });

  return backorders;
}
```

### Database Schema (BackOrder Model)
```prisma
model BackOrder {
  id              String          @id @default(cuid())
  userId          String
  productId       String

  quantity        Int
  status          BackOrderStatus @default(PENDING)

  // Pricing (locked at time of backorder)
  pricePerUnit    Decimal         @db.Decimal(12, 2)

  // Expected availability
  expectedDate    DateTime?
  notifiedAt      DateTime?
  fulfilledAt     DateTime?

  // Link to order when fulfilled
  orderId         String?

  notes           String?

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  user            User            @relation(fields: [userId], references: [id])
  product         Product         @relation(fields: [productId], references: [id])
  order           Order?          @relation(fields: [orderId], references: [id])

  @@index([userId])
  @@index([productId])
  @@index([status])
  @@index([orderId])
}

enum BackOrderStatus {
  PENDING
  NOTIFIED
  FULFILLED
  CANCELLED
}
```

---

## UI Components Breakdown

### 1. Page Header
```typescript
<div className="flex justify-between items-center">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Backorders</h1>
    <p className="text-gray-600 mt-1">
      Manage out-of-stock customer orders
    </p>
  </div>
</div>
```

### 2. Statistics Cards (4 Cards Grid)
```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  {/* Total Backorders */}
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-sm font-medium text-gray-600">Total Backorders</div>
    <div className="text-2xl font-bold text-gray-900 mt-2">
      {backorders.length}
    </div>
  </div>

  {/* Pending */}
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-sm font-medium text-gray-600">Pending</div>
    <div className="text-2xl font-bold text-yellow-600 mt-2">
      {pendingCount}
    </div>
  </div>

  {/* Total Units */}
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-sm font-medium text-gray-600">Total Units</div>
    <div className="text-2xl font-bold text-gray-900 mt-2">
      {totalQuantity}
    </div>
  </div>

  {/* Fulfilled */}
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-sm font-medium text-gray-600">Fulfilled</div>
    <div className="text-2xl font-bold text-green-600 mt-2">
      {backorders.filter((b) => b.status === 'FULFILLED').length}
    </div>
  </div>
</div>
```

### 3. Backorders Table
```typescript
<div className="bg-white rounded-lg shadow overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
          Customer
        </th>
        <th>Product</th>
        <th>Quantity</th>
        <th>Order #</th>
        <th>Expected Date</th>
        <th>Current Stock</th>
        <th>Status</th>
        <th>Notify</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {backorders.map((backorder) => (
        <tr key={backorder.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 text-sm">
            <div className="font-medium text-gray-900">
              {backorder.user.name || 'N/A'}
            </div>
            <div className="text-gray-500">{backorder.user.email}</div>
          </td>
          <td className="px-6 py-4 text-sm">
            <div className="font-medium text-gray-900">
              {backorder.product.name}
            </div>
            <div className="text-gray-500">{backorder.product.sku}</div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {backorder.quantity}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {backorder.order?.orderNumber || 'N/A'}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {backorder.expectedDate
              ? new Date(backorder.expectedDate).toLocaleDateString()
              : 'TBD'}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {backorder.product.stockQuantity}
          </td>
          <td className="px-6 py-4">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                backorder.status === 'FULFILLED'
                  ? 'bg-green-100 text-green-800'
                  : backorder.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : backorder.status === 'NOTIFIED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {backorder.status}
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {backorder.notifiedAt ? 'Yes' : 'No'}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## User Flows

### Flow 1: View Backorders Dashboard
```
1. Admin navigates to /admin/backorders
2. System authenticates admin user
3. System fetches all backorders with:
   - Customer information
   - Product details
   - Current stock levels
4. Dashboard displays:
   - Statistics cards
   - Complete backorder table
5. Admin reviews backorder status
```

### Flow 2: Update Expected Date
```
1. Admin receives updated ETA from supplier
2. Admin opens backorder record
3. Admin updates expected date field
4. System saves new expected date
5. System can send update notification to customer
6. Customer receives email with new ETA
```

### Flow 3: Notify Customer of Availability
```
1. Stock arrives for backordered product
2. System detects stock increase
3. Admin reviews pending backorders
4. Admin clicks "Notify Customer"
5. System:
   - Sends availability email
   - Updates status to NOTIFIED
   - Records notification timestamp
6. Customer receives notification
7. Customer can complete purchase
```

### Flow 4: Auto-Fulfill Backorder
```
1. Product restocked in warehouse
2. System checks for pending backorders
3. If auto-fulfill enabled:
   - System creates order for backorder
   - Allocates stock to customer
   - Charges customer payment method
   - Updates backorder status to FULFILLED
   - Sends order confirmation
4. Backorder marked complete
```

### Flow 5: Cancel Backorder
```
1. Customer requests cancellation
2. Admin opens backorder record
3. Admin clicks "Cancel Backorder"
4. System:
   - Updates status to CANCELLED
   - Processes refund if deposit taken
   - Frees up backorder allocation
   - Notifies customer
```

---

## Backorder Lifecycle

```
┌─────────┐
│ PENDING │ (Customer wants out-of-stock item)
└────┬────┘
     │
     v
┌──────────┐
│NOTIFIED  │ (Customer notified stock available)
└────┬─────┘
     │
     v
┌──────────┐
│FULFILLED │ (Order completed)
└──────────┘

     OR

┌──────────┐
│CANCELLED │ (Customer or admin cancels)
└──────────┘
```

---

## Screenshots/Mockup Descriptions

### Backorders Dashboard
```
┌──────────────────────────────────────────────────────────────┐
│ Backorders                                                   │
│ Manage out-of-stock customer orders                         │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │   45     │ │   32     │ │  234     │ │   13     │        │
│ │  Total   │ │ Pending  │ │  Units   │ │Fulfilled │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├──────────────────────────────────────────────────────────────┤
│ Customer    Product      Qty  Order#  ETA     Stock  Status │
│──────────────────────────────────────────────────────────────│
│ John Smith  Widget X     5    #12345  12/01   0      PENDING│
│ Jane Doe    Gadget Y     2    #12346  12/15   3      NOTIFIED│
└──────────────────────────────────────────────────────────────┘
```

---

## Related APIs

### 1. GET /api/admin/backorders
**Purpose:** Fetch all backorders

**Response:**
```typescript
[
  {
    id: string,
    user: { name: string, email: string },
    product: { name: string, sku: string, stockQuantity: number },
    quantity: number,
    status: BackOrderStatus,
    expectedDate?: DateTime,
    notifiedAt?: DateTime
  }
]
```

### 2. PATCH /api/admin/backorders/[id]
**Purpose:** Update backorder

**Request Body:**
```typescript
{
  expectedDate?: DateTime,
  status?: BackOrderStatus,
  notes?: string
}
```

### 3. POST /api/admin/backorders/[id]/notify
**Purpose:** Notify customer of availability

**Response:**
```typescript
{
  success: boolean,
  notifiedAt: DateTime
}
```

### 4. POST /api/admin/backorders/[id]/fulfill
**Purpose:** Fulfill backorder

**Request Body:**
```typescript
{
  createOrder: boolean,
  sendEmail: boolean
}
```

---

## Code Snippets from Implementation

### Calculate Statistics
```typescript
const pendingCount = backorders.filter((b) => b.status === 'PENDING').length;
const totalQuantity = backorders
  .filter((b) => b.status === 'PENDING')
  .reduce((sum, b) => sum + b.quantity, 0);
```

### Status Badge Styling
```typescript
className={`px-2 py-1 text-xs rounded-full ${
  backorder.status === 'FULFILLED'
    ? 'bg-green-100 text-green-800'
    : backorder.status === 'PENDING'
    ? 'bg-yellow-100 text-yellow-800'
    : backorder.status === 'NOTIFIED'
    ? 'bg-blue-100 text-blue-800'
    : 'bg-gray-100 text-gray-800'
}`}
```

---

## Future Enhancements

1. **Automated Notifications**
   - Auto-notify when stock arrives
   - ETA reminders
   - Stock threshold alerts

2. **Pre-order Support**
   - Accept pre-orders for upcoming products
   - Payment hold/authorization
   - Release date management

3. **Priority Queuing**
   - VIP customer priority
   - First-come-first-served
   - Partial fulfillment

4. **Advanced Analytics**
   - Backorder trends
   - Product demand forecasting
   - Customer retention on backorders

5. **Supplier Integration**
   - Auto-create POs for backordered items
   - Supplier ETA tracking
   - Inbound shipment visibility
