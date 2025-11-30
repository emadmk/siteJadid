# B2B Approvals Dashboard Page

## Overview

The B2B Approvals Dashboard (`/b2b/approvals`) is a specialized interface for approvers and account administrators to review and process order approvals within B2B organizations. This page displays pending approval requests from team members, allows approval or rejection actions, and provides a history of approval requests made by the current user.

**File Location:** `/home/user/siteJadid/src/app/b2b/approvals/page.tsx`

**Route:** `/b2b/approvals`

---

## User Access Requirements

### Authorized Roles
- `APPROVER` (B2B Account Members)
- `ACCOUNT_ADMIN` (B2B Account Members)

### Required Conditions
1. User must be authenticated
2. User must have `accountType: 'B2B'`
3. User must be a B2BAccountMember with APPROVER or ACCOUNT_ADMIN role

### Authentication Check
```typescript
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  redirect('/auth/signin?callbackUrl=/b2b/approvals');
}

if (session.user.accountType !== 'B2B') {
  redirect('/dashboard');
}
```

Users without B2B account membership are automatically redirected to their dashboard.

---

## Features List

### Core Features
1. **Approval Statistics Dashboard**
   - Pending approvals count (requiring user's action)
   - User's total requests count
   - User's pending requests count

2. **Pending Approvals Section**
   - Display orders requiring the user's approval
   - Show requester information
   - Display order details and total
   - Preview order items (first 5 with images)
   - Approve/Reject action buttons
   - View details link

3. **My Requests Section**
   - Table of user's own approval requests
   - Show order number, amount, date
   - Display assigned approver
   - Show current approval status
   - Quick links to order details

4. **Order Approval Actions**
   - Approve pending orders
   - Reject pending orders with optional reason
   - View full order details

5. **Visual Indicators**
   - Color-coded status badges
   - Status icons (Clock, CheckCircle, XCircle)
   - Product image thumbnails
   - Request timestamps

---

## Database Queries Used

### 1. Get Approval Data
```typescript
async function getApprovalData(userId: string) {
  const membership = await db.b2BAccountMember.findFirst({
    where: { userId },
  });

  if (!membership) return null;

  const [pendingApprovals, myRequests] = await Promise.all([
    // Approvals pending user's action
    db.orderApproval.findMany({
      where: {
        approverId: membership.id,
        status: 'PENDING',
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
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
        },
        requester: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    }),
    // User's own approval requests
    db.orderApproval.findMany({
      where: { requestedById: membership.id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
          },
        },
        approver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
      take: 10,
    }),
  ]);

  return { pendingApprovals, myRequests };
}
```

### Database Schema (OrderApproval Model)

```prisma
model OrderApproval {
  id              String   @id @default(cuid())
  orderId         String
  requestedById   String
  approverId      String
  status          ApprovalStatus @default(PENDING)
  orderTotal      Decimal  @db.Decimal(12, 2)
  reason          String?
  requestedAt     DateTime @default(now())
  reviewedAt      DateTime?
  reviewNotes     String?

  order           Order    @relation(fields: [orderId], references: [id])
  requester       B2BAccountMember @relation("RequestedApprovals", fields: [requestedById], references: [id])
  approver        B2BAccountMember @relation("ApproverApprovals", fields: [approverId], references: [id])
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

---

## UI Components Breakdown

### 1. Statistics Cards (3 Cards Grid)
```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  {/* Pending Approval */}
  <div className="bg-white rounded-lg border p-6">
    <Clock className="w-5 h-5 text-yellow-600" />
    <div className="text-3xl font-bold text-black">{pendingApprovals.length}</div>
    <span className="text-gray-600 text-sm">Pending Approval</span>
  </div>

  {/* My Requests */}
  <div className="bg-white rounded-lg border p-6">
    <Package className="w-5 h-5 text-blue-600" />
    <div className="text-3xl font-bold text-black">{myRequests.length}</div>
    <span className="text-gray-600 text-sm">My Requests</span>
  </div>

  {/* Pending Requests */}
  <div className="bg-white rounded-lg border p-6">
    <Clock className="w-5 h-5 text-orange-600" />
    <div className="text-3xl font-bold text-black">
      {myRequests.filter((r) => r.status === 'PENDING').length}
    </div>
    <span className="text-gray-600 text-sm">Pending Requests</span>
  </div>
</div>
```

**Icons Used:**
- `Clock` - Pending items (yellow/orange)
- `Package` - Total requests (blue)
- `CheckCircle` - Approved status (green)
- `XCircle` - Rejected/Cancelled status (red)

### 2. Pending Approvals Cards
```typescript
<div className="bg-white rounded-lg border p-6">
  <div className="flex items-start justify-between mb-4">
    <div className="flex-1">
      <Link href={`/orders/${approval.order.orderNumber}`}>
        {approval.order.orderNumber}
      </Link>
      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[approval.status]}`}>
        {approval.status}
      </span>
      <div className="text-sm text-gray-600">
        Requested by {approval.requester.user.name}
        {' • '}
        {new Date(approval.requestedAt).toLocaleDateString()}
      </div>
    </div>
    <div className="text-right">
      <div className="text-2xl font-bold">${Number(approval.orderTotal).toFixed(2)}</div>
      <div className="text-sm text-gray-600">{approval.order.items.length} items</div>
    </div>
  </div>

  {/* Items Preview (first 5) */}
  <div className="border-t pt-4 mb-4">
    <div className="flex gap-2 overflow-x-auto">
      {approval.order.items.slice(0, 5).map((item) => (
        <div className="w-16 h-16 bg-gray-100 rounded">
          <img src={item.product.images[0]} />
        </div>
      ))}
    </div>
  </div>

  {/* Action Buttons */}
  {approval.status === 'PENDING' && (
    <div className="flex gap-3">
      <Button className="flex-1 bg-safety-green-600">Approve</Button>
      <Button variant="outline" className="flex-1 border-red-300">Reject</Button>
      <Button variant="outline">View Details</Button>
    </div>
  )}
</div>
```

### 3. Status Colors
```typescript
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-safety-green-100 text-safety-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};
```

### 4. My Requests Table
```typescript
<table className="w-full">
  <thead className="bg-gray-50">
    <tr>
      <th>Order</th>
      <th>Amount</th>
      <th>Requested</th>
      <th>Approver</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
    {myRequests.map((approval) => (
      <tr key={approval.id} className="hover:bg-gray-50">
        <td>
          <Link href={`/orders/${approval.order.orderNumber}`}>
            {approval.order.orderNumber}
          </Link>
        </td>
        <td>${Number(approval.orderTotal).toFixed(2)}</td>
        <td>{new Date(approval.requestedAt).toLocaleDateString()}</td>
        <td>{approval.approver.user.name}</td>
        <td>
          <span className={statusColors[approval.status]}>
            {approval.status}
          </span>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## User Flows

### Flow 1: View Pending Approvals
```
1. Approver/Admin navigates to /b2b/approvals
2. System checks authentication and role
3. System fetches pending approvals assigned to user
4. Dashboard displays:
   - 3 statistics cards at top
   - List of pending approval cards
   - Table of user's own requests
5. User sees orders requiring action
```

### Flow 2: Approve an Order
```
1. Approver views pending approvals list
2. Approver reviews order details:
   - Order number and total
   - Requester information
   - Item preview images
   - Request date and reason
3. Approver clicks "Approve" button
4. System updates approval status to APPROVED
5. System updates order status to allow processing
6. Requester receives approval notification
7. Order proceeds to fulfillment
8. Approval removed from pending list
```

### Flow 3: Reject an Order
```
1. Approver views pending approvals list
2. Approver identifies order to reject
3. Approver clicks "Reject" button
4. System prompts for rejection reason (optional)
5. System updates approval status to REJECTED
6. Requester receives rejection notification with reason
7. Order is blocked from processing
8. Approval removed from pending list
```

### Flow 4: View Order Details Before Decision
```
1. Approver clicks "View Details" on approval card
2. System redirects to /orders/{orderNumber}
3. Approver sees:
   - Complete item list with pricing
   - Customer information
   - Shipping details
   - Order history
4. Approver returns to approvals page
5. Approver makes informed approval decision
```

### Flow 5: Track Own Approval Requests
```
1. User (who has made requests) views "My Requests" section
2. System displays table of user's approval requests
3. User sees for each request:
   - Order number (clickable)
   - Order amount
   - Request date
   - Assigned approver name
   - Current status (Pending/Approved/Rejected)
4. User can track approval progress
```

---

## Approval Workflow

```
┌─────────────────┐
│ Order Created   │ (By Purchaser/Member)
│ Over Threshold  │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Approval Request│ (Automatically created)
│ Status: PENDING │
└────────┬────────┘
         │
         ├─────────────────┐
         v                 v
┌──────────────┐   ┌──────────────┐
│  APPROVED    │   │  REJECTED    │
│ (by Approver)│   │ (by Approver)│
└──────┬───────┘   └──────┬───────┘
       │                  │
       v                  v
┌──────────────┐   ┌──────────────┐
│ Order        │   │ Order        │
│ Proceeds     │   │ Blocked      │
└──────────────┘   └──────────────┘
```

**Status Transitions:**
- `Order Created` → `PENDING` (Automatic if over approval threshold)
- `PENDING` → `APPROVED` (Approver approves)
- `PENDING` → `REJECTED` (Approver rejects)
- `PENDING` → `CANCELLED` (Requester cancels order)

---

## Screenshots/Mockup Descriptions

### Main Approvals Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ Order Approvals                                              │
│ Review and approve team orders                               │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│ │ ⏰ 3     │ │ 📦 12    │ │ ⏰ 2     │                      │
│ │ Pending  │ │ My Req   │ │ Pending  │                      │
│ └──────────┘ └──────────┘ └──────────┘                      │
├─────────────────────────────────────────────────────────────┤
│ Pending Your Approval                                        │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ORD-001234                    [PENDING]      $1,234.56│   │
│ │ Requested by John Smith • Nov 20, 2025                │   │
│ │ Reason: Monthly supply restock                        │   │
│ │                                                        │   │
│ │ [img] [img] [img] [img] [img] +3                      │   │
│ │                                                        │   │
│ │ [✓ Approve] [✗ Reject] [View Details]                 │   │
│ └───────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ My Requests                                                  │
├─────────────────────────────────────────────────────────────┤
│ Order      Amount    Requested  Approver       Status       │
│────────────────────────────────────────────────────────────││
│ ORD-001234 $1,234.56 Nov 20     Jane Doe      [PENDING]    ││
│ ORD-001233 $567.89   Nov 19     Jane Doe      [APPROVED]   ││
└─────────────────────────────────────────────────────────────┘
```

### Approval Card Detail
```
┌─────────────────────────────────────────────────────────┐
│ ORD-001234               [⏰ PENDING]        $1,234.56  │
│                                              15 items    │
│ Requested by John Smith                                 │
│ November 20, 2025, 10:30 AM                             │
│ Reason: Monthly supply restock for warehouse           │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ [📦] [📦] [📦] [📦] [📦] +10                           │
│                                                         │
│ ─────────────────────────────────────────────────────── │
│                                                         │
│ [✓ Approve Order] [✗ Reject] [👁 View Details]         │
└─────────────────────────────────────────────────────────┘
```

---

## Related APIs

### 1. GET /api/b2b/approvals
**Purpose:** Fetch pending approvals and user's requests

**Response:**
```typescript
{
  pendingApprovals: [
    {
      id: string,
      order: {
        orderNumber: string,
        total: Decimal,
        items: OrderItem[]
      },
      requester: {
        user: {
          name: string,
          email: string
        }
      },
      orderTotal: Decimal,
      reason: string | null,
      status: ApprovalStatus,
      requestedAt: DateTime
    }
  ],
  myRequests: [
    {
      id: string,
      order: {
        orderNumber: string,
        total: Decimal
      },
      approver: {
        user: {
          name: string,
          email: string
        }
      },
      status: ApprovalStatus,
      requestedAt: DateTime
    }
  ]
}
```

### 2. POST /api/b2b/approvals/[id]/approve
**Purpose:** Approve a pending order approval request

**Request Body:**
```typescript
{
  reviewNotes?: string
}
```

**Response:**
```typescript
{
  success: true,
  approval: {
    id: string,
    status: 'APPROVED',
    reviewedAt: DateTime,
    reviewNotes: string | null
  }
}
```

### 3. POST /api/b2b/approvals/[id]/reject
**Purpose:** Reject a pending order approval request

**Request Body:**
```typescript
{
  reviewNotes: string  // Rejection reason
}
```

**Response:**
```typescript
{
  success: true,
  approval: {
    id: string,
    status: 'REJECTED',
    reviewedAt: DateTime,
    reviewNotes: string
  }
}
```

---

## Code Snippets from Implementation

### Parallel Data Fetching
```typescript
const [pendingApprovals, myRequests] = await Promise.all([
  db.orderApproval.findMany({
    where: {
      approverId: membership.id,
      status: 'PENDING',
    },
    include: { /* ... */ },
    orderBy: { requestedAt: 'desc' },
  }),
  db.orderApproval.findMany({
    where: { requestedById: membership.id },
    include: { /* ... */ },
    orderBy: { requestedAt: 'desc' },
    take: 10,
  }),
]);
```

### Image Preview with Overflow Indicator
```typescript
{approval.order.items.slice(0, 5).map((item) => {
  const images = item.product.images as string[];
  return (
    <div key={item.id} className="w-16 h-16 bg-gray-100 rounded">
      {images[0] ? (
        <img src={images[0]} alt={item.product.name} />
      ) : (
        <Package className="w-full h-full p-3 text-gray-400" />
      )}
    </div>
  );
})}
{approval.order.items.length > 5 && (
  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
    +{approval.order.items.length - 5}
  </div>
)}
```

### Date Formatting
```typescript
{new Date(approval.requestedAt).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})}
```

---

## Key Technical Details

### Performance Optimizations
- Parallel fetching of pending approvals and user requests
- Server-side rendering for instant page load
- Limited myRequests to 10 most recent (paginate if needed)
- Efficient nested includes for minimal queries

### Security Measures
- Server-side authentication check
- Account type verification (B2B only)
- Membership verification before data access
- Approver can only see approvals assigned to them

### Data Integrity
- Approval status tracked with enum
- Timestamps for request and review dates
- Optional notes for approval/rejection reasons
- Order total stored in approval record (immutable)

### User Experience
- Color-coded status badges for quick scanning
- Visual product previews in approval cards
- Contextual action buttons (only show for PENDING)
- Clear requester and approver identification
- Request date prominently displayed

---

## Future Enhancements

1. **Bulk Approval Actions**
   - Select multiple approvals
   - Approve/reject in batch
   - Filter by amount or requester

2. **Advanced Filtering**
   - Filter by date range
   - Filter by amount range
   - Filter by requester
   - Sort by various criteria

3. **Approval Delegation**
   - Temporarily delegate approval authority
   - Set out-of-office auto-approver
   - Escalation rules for delayed approvals

4. **Enhanced Notifications**
   - Real-time approval request alerts
   - Email digests of pending approvals
   - Push notifications for mobile

5. **Approval Analytics**
   - Average approval time
   - Approval/rejection rates
   - Most frequent requesters
   - Spending trends by requester

6. **Conditional Approval Rules**
   - Auto-approve below certain thresholds
   - Require multiple approvers for high amounts
   - Category-specific approval workflows
