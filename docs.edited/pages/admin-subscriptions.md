# Admin Subscription Management Page

## Overview

The Subscription Management page (`/admin/subscriptions`) provides administrative tools for managing recurring customer orders. This interface enables administrators to oversee subscription billing cycles, manage subscription status, track recurring revenue, and handle subscription modifications.

**File Location:** `/home/user/siteJadid/src/app/admin/subscriptions/page.tsx`

**Route:** `/admin/subscriptions`

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

1. **Subscription Statistics Dashboard**
   - Total subscriptions
   - Active subscriptions
   - Paused subscriptions
   - Total generated orders

2. **Subscription Listing Table**
   - Customer information
   - Subscription frequency
   - Next order date
   - Item count
   - Order history
   - Status tracking

3. **Status Management**
   - ACTIVE - Generating orders
   - PAUSED - Temporarily suspended
   - CANCELLED - Permanently stopped
   - EXPIRED - Reached end date

4. **Frequency Options**
   - WEEKLY
   - BIWEEKLY
   - MONTHLY
   - QUARTERLY
   - ANNUAL

5. **Subscription Actions**
   - Create new subscription
   - View subscription details
   - Pause/Resume subscription
   - Cancel subscription
   - Update items
   - Modify frequency

---

## Database Queries Used

### Get All Subscriptions with Customer Data
```typescript
async function getSubscriptions() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          items: true,
          orders: true,
        },
      },
    },
  });

  return subscriptions;
}
```

### Database Schema (Subscription Model)
```prisma
model Subscription {
  id              String                @id @default(cuid())
  userId          String

  status          SubscriptionStatus    @default(ACTIVE)
  frequency       SubscriptionFrequency

  // Next order
  nextOrderDate   DateTime
  lastOrderDate   DateTime?

  // Shipping Address
  shippingAddressId String

  // Payment
  paymentMethod   String

  // Discount
  discountPercent Decimal               @default(0) @db.Decimal(5, 2)

  // Pause/Cancel
  pausedUntil     DateTime?
  cancelledAt     DateTime?
  cancellationReason String?

  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  user            User                  @relation(fields: [userId], references: [id])
  address         Address               @relation(fields: [shippingAddressId], references: [id])
  items           SubscriptionItem[]
  orders          SubscriptionOrder[]

  @@index([userId])
  @@index([status])
  @@index([nextOrderDate])
}

model SubscriptionItem {
  id              String       @id @default(cuid())
  subscriptionId  String
  productId       String

  quantity        Int
  price           Decimal      @db.Decimal(12, 2)

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  subscription    Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  product         Product      @relation(fields: [productId], references: [id])
}

model SubscriptionOrder {
  id              String       @id @default(cuid())
  subscriptionId  String
  orderId         String

  scheduledFor    DateTime
  createdAt       DateTime     @default(now())

  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  order           Order        @relation(fields: [orderId], references: [id])
}

enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELLED
  EXPIRED
}

enum SubscriptionFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  ANNUAL
}
```

---

## UI Components Breakdown

### 1. Page Header with Action Button
```typescript
<div className="flex justify-between items-center">
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
    <p className="text-gray-600 mt-1">
      Manage recurring customer orders
    </p>
  </div>
  <Link
    href="/admin/subscriptions/new"
    className="bg-safety-green-600 text-white px-4 py-2 rounded-md hover:bg-safety-green-700"
  >
    New Subscription
  </Link>
</div>
```

### 2. Statistics Cards (4 Cards)
```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-sm font-medium text-gray-600">Total</div>
    <div className="text-2xl font-bold text-gray-900 mt-2">
      {subscriptions.length}
    </div>
  </div>

  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-sm font-medium text-gray-600">Active</div>
    <div className="text-2xl font-bold text-green-600 mt-2">
      {activeCount}
    </div>
  </div>

  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-sm font-medium text-gray-600">Paused</div>
    <div className="text-2xl font-bold text-yellow-600 mt-2">
      {subscriptions.filter((s) => s.status === 'PAUSED').length}
    </div>
  </div>

  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-sm font-medium text-gray-600">Total Orders</div>
    <div className="text-2xl font-bold text-gray-900 mt-2">
      {subscriptions.reduce((sum, s) => sum + s._count.orders, 0)}
    </div>
  </div>
</div>
```

### 3. Subscriptions Table
```typescript
<div className="bg-white rounded-lg shadow overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
          Customer
        </th>
        <th>Frequency</th>
        <th>Next Order</th>
        <th>Items</th>
        <th>Total Orders</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {subscriptions.map((sub) => (
        <tr key={sub.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 text-sm">
            <div className="font-medium text-gray-900">
              {sub.user.name || 'N/A'}
            </div>
            <div className="text-gray-500">{sub.user.email}</div>
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {sub.frequency}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {new Date(sub.nextOrderDate).toLocaleDateString()}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {sub._count.items}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">
            {sub._count.orders}
          </td>
          <td className="px-6 py-4">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                sub.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : sub.status === 'PAUSED'
                  ? 'bg-yellow-100 text-yellow-800'
                  : sub.status === 'CANCELLED'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {sub.status}
            </span>
          </td>
          <td className="px-6 py-4 text-sm">
            <Link
              href={`/admin/subscriptions/${sub.id}`}
              className="text-safety-green-600 hover:text-safety-green-900"
            >
              View
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## User Flows

### Flow 1: View Subscriptions Dashboard
```
1. Admin navigates to /admin/subscriptions
2. System authenticates admin
3. System fetches all subscriptions with counts
4. Dashboard displays:
   - Total, active, paused, and order statistics
   - Complete subscription table
5. Admin reviews subscription status
```

### Flow 2: Create Subscription for Customer
```
1. Admin clicks "New Subscription"
2. Admin selects customer
3. Admin configures subscription:
   - Select products and quantities
   - Set frequency (weekly, monthly, etc.)
   - Choose shipping address
   - Set payment method
   - Apply discount if applicable
4. System calculates next order date
5. Admin confirms subscription
6. System creates subscription record
7. Customer receives confirmation email
```

### Flow 3: Pause Subscription
```
1. Customer requests pause
2. Admin opens subscription
3. Admin clicks "Pause Subscription"
4. Admin sets pause duration:
   - Until specific date
   - Indefinite pause
5. System:
   - Updates status to PAUSED
   - Sets pausedUntil date
   - Stops order generation
   - Notifies customer
```

### Flow 4: Resume Subscription
```
1. Customer wants to resume
2. Admin opens paused subscription
3. Admin clicks "Resume Subscription"
4. System:
   - Removes pausedUntil date
   - Updates status to ACTIVE
   - Calculates next order date
   - Resumes order generation
   - Notifies customer
```

### Flow 5: Process Subscription Order
```
1. System runs daily subscription job
2. For each subscription where nextOrderDate is today:
   - Create order with subscription items
   - Use locked pricing
   - Apply subscription discount
   - Charge payment method
   - Update nextOrderDate based on frequency
   - Link order to subscription
   - Send order confirmation
3. Track subscription order history
```

---

## Subscription Lifecycle

```
┌─────────┐
│ ACTIVE  │ (Generating orders)
└────┬────┘
     │
     ├──────────┬──────────┐
     v          v          v
┌─────────┐ ┌──────────┐ ┌──────────┐
│ PAUSED  │ │CANCELLED │ │ EXPIRED  │
└────┬────┘ └──────────┘ └──────────┘
     │
     v
┌─────────┐
│ ACTIVE  │ (Resumed)
└─────────┘
```

---

## Related APIs

### 1. GET /api/admin/subscriptions
**Purpose:** Fetch all subscriptions

**Response:**
```typescript
[
  {
    id: string,
    user: { name: string, email: string },
    frequency: SubscriptionFrequency,
    nextOrderDate: DateTime,
    status: SubscriptionStatus,
    _count: {
      items: number,
      orders: number
    }
  }
]
```

### 2. POST /api/admin/subscriptions
**Purpose:** Create subscription

**Request Body:**
```typescript
{
  userId: string,
  frequency: SubscriptionFrequency,
  shippingAddressId: string,
  paymentMethod: string,
  items: [
    {
      productId: string,
      quantity: number,
      price: Decimal
    }
  ],
  discountPercent?: Decimal
}
```

### 3. PATCH /api/admin/subscriptions/[id]/pause
**Purpose:** Pause subscription

**Request Body:**
```typescript
{
  pausedUntil?: DateTime
}
```

### 4. PATCH /api/admin/subscriptions/[id]/cancel
**Purpose:** Cancel subscription

**Request Body:**
```typescript
{
  reason?: string
}
```

---

## Future Enhancements

1. **Subscription Analytics**
   - Monthly recurring revenue (MRR)
   - Churn rate tracking
   - Lifetime value by subscription

2. **Flexible Billing**
   - Trial periods
   - Setup fees
   - Tiered pricing

3. **Customer Self-Service**
   - Skip next delivery
   - Change frequency
   - Add/remove items
   - Update payment method

4. **Advanced Features**
   - Gift subscriptions
   - Subscription bundles
   - Referral programs
   - Loyalty rewards
