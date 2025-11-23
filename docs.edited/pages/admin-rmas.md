# Admin RMA/Returns Management Page

## Overview

The RMA (Return Merchandise Authorization) Management page (`/admin/rmas`) is a comprehensive administrative interface for processing customer returns and managing the returns lifecycle. This page enables administrators to review return requests, approve RMAs, track returned items, process refunds, and manage restocking operations.

**File Location:** `/home/user/siteJadid/src/app/admin/rmas/page.tsx`

**Route:** `/admin/rmas`

---

## User Access Requirements

### Authorized Roles
- `SUPER_ADMIN`
- `ADMIN`
- `CUSTOMER_SERVICE`

### Authentication Check
```typescript
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  redirect('/auth/signin?callbackUrl=/admin/rmas');
}

const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'];
if (!adminRoles.includes(session.user.role)) {
  redirect('/admin');
}
```

---

## Features List

### Core Features

1. **RMA Dashboard Statistics**
   - Pending RMAs count
   - Approved RMAs count
   - Total RMAs
   - Total refunds amount

2. **RMA Listing Table**
   - Display all RMA requests
   - RMA number tracking
   - Customer information
   - Order reference
   - Return reason
   - Item count
   - Refund amount
   - Status badges

3. **RMA Status Tracking**
   - REQUESTED - Customer requested return
   - PENDING - Awaiting admin approval
   - APPROVED - RMA approved, label sent
   - RECEIVED - Items received at warehouse
   - INSPECTED - Items inspected for condition
   - COMPLETED - Refund processed

4. **Return Reasons Tracking**
   - DEFECTIVE - Product defective
   - WRONG_ITEM - Wrong item shipped
   - NOT_AS_DESCRIBED - Product not as described
   - NO_LONGER_NEEDED - Customer changed mind
   - DAMAGED - Shipping damage
   - OTHER - Other reasons

5. **Refund Processing**
   - Calculate refund amount
   - Restocking fee application
   - Shipping refund handling
   - Refund status tracking

6. **Item Inspection**
   - Track item condition
   - Mark defective items
   - Determine resellability
   - Document condition notes

---

## Database Queries Used

### 1. Get All RMAs with Relations
```typescript
async function getRMAData() {
  const [rmas, stats] = await Promise.all([
    db.rMA.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    }),
    db.rMA.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        refundAmount: true,
      },
    }),
  ]);

  return { rmas, stats };
}
```

### 2. Calculate Statistics
```typescript
const pending = stats.find((s) => s.status === 'PENDING')?._count || 0;
const approved = stats.find((s) => s.status === 'APPROVED')?._count || 0;
const totalRefunds = stats.reduce((sum, s) => sum + Number(s._sum.refundAmount || 0), 0);
```

### Database Schema (RMA Model)
```prisma
model RMA {
  id              String       @id @default(cuid())
  rmaNumber       String       @unique

  userId          String
  orderId         String

  type            RMAType
  status          RMAStatus    @default(REQUESTED)

  // Reason
  reason          ReturnReason
  description     String?
  images          String[]

  // Amount
  refundAmount    Decimal?     @db.Decimal(12, 2)
  restockingFee   Decimal      @default(0) @db.Decimal(12, 2)
  shippingRefund  Decimal      @default(0) @db.Decimal(12, 2)

  // Shipping
  returnTrackingNumber String?
  returnCarrier   String?
  returnLabel     String?

  // Processing
  approvedBy      String?
  approvedAt      DateTime?
  receivedAt      DateTime?
  inspectedAt     DateTime?
  processedAt     DateTime?

  // Resolution
  replacementOrderId String?
  refundedAt      DateTime?

  internalNotes   String?
  customerNotes   String?

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  user            User         @relation(fields: [userId], references: [id])
  order           Order        @relation(fields: [orderId], references: [id])
  items           RMAItem[]
}

model RMAItem {
  id              String   @id @default(cuid())
  rmaId           String
  orderItemId     String
  productId       String

  quantity        Int
  unitPrice       Decimal  @db.Decimal(12, 2)

  // Condition when received
  conditionNotes  String?
  isDefective     Boolean  @default(false)
  canResell       Boolean  @default(true)

  rma             RMA      @relation(fields: [rmaId], references: [id], onDelete: Cascade)
  product         Product  @relation(fields: [productId], references: [id])
}

enum RMAType {
  REFUND
  REPLACEMENT
  EXCHANGE
  STORE_CREDIT
}

enum RMAStatus {
  REQUESTED
  PENDING
  APPROVED
  REJECTED
  RECEIVED
  INSPECTED
  COMPLETED
  CANCELLED
}

enum ReturnReason {
  DEFECTIVE
  WRONG_ITEM
  NOT_AS_DESCRIBED
  NO_LONGER_NEEDED
  DAMAGED
  SIZE_ISSUE
  COLOR_ISSUE
  QUALITY_ISSUE
  LATE_DELIVERY
  OTHER
}
```

---

## UI Components Breakdown

### 1. Page Header
```typescript
<div className="mb-8">
  <h1 className="text-3xl font-bold text-black mb-2">Returns & RMA Management</h1>
  <p className="text-gray-600">Process return merchandise authorizations and refunds</p>
</div>
```

### 2. Statistics Dashboard (4 Cards)
```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  {/* Pending RMAs */}
  <div className="bg-white rounded-lg border p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600 text-sm">Pending RMAs</span>
      <Clock className="w-5 h-5 text-yellow-600" />
    </div>
    <div className="text-3xl font-bold text-black">{pending}</div>
  </div>

  {/* Approved RMAs */}
  <div className="bg-white rounded-lg border p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600 text-sm">Approved RMAs</span>
      <CheckCircle className="w-5 h-5 text-safety-green-600" />
    </div>
    <div className="text-3xl font-bold text-black">{approved}</div>
  </div>

  {/* Total RMAs */}
  <div className="bg-white rounded-lg border p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600 text-sm">Total RMAs</span>
      <RotateCcw className="w-5 h-5 text-blue-600" />
    </div>
    <div className="text-3xl font-bold text-black">{rmas.length}</div>
  </div>

  {/* Total Refunds */}
  <div className="bg-white rounded-lg border p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600 text-sm">Total Refunds</span>
      <DollarSign className="w-5 h-5 text-red-600" />
    </div>
    <div className="text-3xl font-bold text-black">${totalRefunds.toFixed(2)}</div>
  </div>
</div>
```

**Icons Used:**
- `Clock` - Pending (yellow)
- `CheckCircle` - Approved (green)
- `XCircle` - Rejected (red)
- `Package` - Received (blue)
- `RotateCcw` - Returns icon
- `DollarSign` - Refunds

### 3. RMA Table
```typescript
<div className="bg-white rounded-lg border">
  <div className="p-6 border-b">
    <h2 className="text-xl font-bold text-black">Recent RMAs</h2>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            RMA Number
          </th>
          <th>Customer</th>
          <th>Order</th>
          <th>Reason</th>
          <th>Items</th>
          <th>Refund</th>
          <th>Status</th>
          <th>Date</th>
          <th className="text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {rmas.map((rma) => {
          const StatusIcon = statusIcons[rma.status];
          return (
            <tr key={rma.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/admin/rmas/${rma.id}`}
                  className="font-medium text-black hover:text-safety-green-700"
                >
                  {rma.rmaNumber}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-black">{rma.user.name || 'N/A'}</div>
                <div className="text-sm text-gray-600">{rma.user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/admin/orders/${rma.order.id}`}
                  className="text-sm text-safety-green-600 hover:text-safety-green-700"
                >
                  {rma.order.orderNumber}
                </Link>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-700 max-w-xs truncate">{rma.reason}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{rma.items.length}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {rma.refundAmount ? `$${Number(rma.refundAmount).toFixed(2)}` : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[rma.status]}`}>
                  <div className="flex items-center gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {rma.status}
                  </div>
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(rma.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <Link
                  href={`/admin/rmas/${rma.id}`}
                  className="text-safety-green-600 hover:text-safety-green-900 font-medium"
                >
                  View
                </Link>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>
```

### 4. Status Color Mapping
```typescript
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-safety-green-100 text-safety-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  RECEIVED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
};

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  APPROVED: CheckCircle,
  REJECTED: XCircle,
  RECEIVED: Package,
  COMPLETED: CheckCircle,
};
```

---

## User Flows

### Flow 1: View RMA Dashboard
```
1. Admin navigates to /admin/rmas
2. System authenticates and authorizes user
3. System fetches RMA data and statistics
4. Dashboard displays:
   - 4 statistics cards (pending, approved, total, refunds)
   - Complete RMA table with all details
5. Admin reviews return requests
```

### Flow 2: Approve RMA Request
```
1. Customer requests return through their account
2. RMA appears in admin panel with PENDING status
3. Admin clicks on RMA number to view details
4. Admin reviews:
   - Return reason
   - Product condition (if photos provided)
   - Original order details
   - Customer history
5. Admin clicks "Approve RMA"
6. System:
   - Updates status to APPROVED
   - Generates return label
   - Emails customer with return instructions
   - Records approver and timestamp
7. Customer ships items back
```

### Flow 3: Process Returned Items
```
1. Warehouse receives returned shipment
2. Staff opens RMA in admin panel
3. Staff verifies items against RMA
4. For each item, staff records:
   - Condition (defective, damaged, like new)
   - Can be resold (yes/no)
   - Condition notes
5. Staff uploads photos of items
6. System updates status to RECEIVED
7. Admin reviews inspection results
8. System updates status to INSPECTED
```

### Flow 4: Issue Refund
```
1. Admin reviews inspected RMA
2. System calculates refund:
   - Original item prices
   - Minus restocking fee (if applicable)
   - Plus shipping refund (if policy allows)
3. Admin confirms refund amount
4. Admin processes refund through payment gateway
5. System:
   - Updates status to COMPLETED
   - Records refund date and amount
   - Sends refund confirmation to customer
   - Updates inventory (if items can be resold)
```

### Flow 5: Handle Replacement
```
1. RMA type is set to REPLACEMENT
2. After items received and inspected
3. Admin creates replacement order:
   - Same products as returned
   - No charge to customer
   - Links to original RMA
4. Replacement ships to customer
5. RMA marked as COMPLETED
6. Original items handled per restocking policy
```

---

## RMA Lifecycle

```
┌────────────┐
│ REQUESTED  │ (Customer submits request)
└─────┬──────┘
      │
      v
┌────────────┐
│  PENDING   │ (Awaiting admin review)
└─────┬──────┘
      │
      ├──────────────┐
      v              v
┌────────────┐  ┌────────────┐
│  APPROVED  │  │  REJECTED  │
└─────┬──────┘  └────────────┘
      │
      v
┌────────────┐
│  RECEIVED  │ (Items arrived at warehouse)
└─────┬──────┘
      │
      v
┌────────────┐
│ INSPECTED  │ (Items inspected)
└─────┬──────┘
      │
      v
┌────────────┐
│ COMPLETED  │ (Refund issued)
└────────────┘
```

---

## Screenshots/Mockup Descriptions

### RMA Dashboard
```
┌──────────────────────────────────────────────────────────────┐
│ Returns & RMA Management                                     │
│ Process return merchandise authorizations and refunds        │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ ⏰ 8     │ │ ✓ 15     │ │ 🔄 45    │ │ 💲 $5.2K │        │
│ │ Pending  │ │ Approved │ │ Total    │ │ Refunds  │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├──────────────────────────────────────────────────────────────┤
│ RMA #    Customer    Order    Reason      Items  Refund  ... │
│──────────────────────────────────────────────────────────────│
│ RMA-001  John Doe    #12345  DEFECTIVE   2     $89.99   ...  │
│ RMA-002  Jane Smith  #12346  WRONG_ITEM  1     $45.00   ...  │
└──────────────────────────────────────────────────────────────┘
```

---

## Related APIs

### 1. GET /api/admin/rmas
**Purpose:** Fetch all RMAs

**Query Parameters:**
- `status` - Filter by RMA status
- `customerId` - Filter by customer

**Response:**
```typescript
[
  {
    id: string,
    rmaNumber: string,
    status: RMAStatus,
    user: {
      name: string,
      email: string
    },
    order: {
      orderNumber: string
    },
    reason: ReturnReason,
    items: RMAItem[],
    refundAmount?: Decimal
  }
]
```

### 2. PATCH /api/admin/rmas/[id]/approve
**Purpose:** Approve RMA request

**Request Body:**
```typescript
{
  generateLabel: boolean,
  notes?: string
}
```

### 3. PATCH /api/admin/rmas/[id]/receive
**Purpose:** Mark RMA as received and inspect items

**Request Body:**
```typescript
{
  items: [
    {
      rmaItemId: string,
      condition: string,
      isDefective: boolean,
      canResell: boolean,
      notes?: string
    }
  ],
  images?: string[]
}
```

### 4. POST /api/admin/rmas/[id]/refund
**Purpose:** Process refund

**Request Body:**
```typescript
{
  refundAmount: Decimal,
  restockingFee?: Decimal,
  shippingRefund?: Decimal,
  method: string
}
```

---

## Future Enhancements

1. **Automated RMA Approval**
   - Auto-approve based on rules
   - Customer tier-based auto-approval
   - Return history analysis

2. **Advanced Analytics**
   - Return rate by product
   - Return reasons trending
   - Refund cost analysis
   - Customer return patterns

3. **Integration Features**
   - Shipping label generation
   - Carrier tracking integration
   - Payment gateway integration
   - ERP system sync

4. **Quality Control**
   - Photo upload requirements
   - Inspection checklists
   - Restocking workflows
   - Disposition rules

5. **Customer Portal**
   - Self-service RMA creation
   - Return status tracking
   - Label printing
   - Refund tracking
