# B2B Approvals API Documentation

## Overview
The B2B Approvals API manages the order approval workflow for B2B customers. Allows approvers to review and approve/reject orders that exceed spending thresholds or require approval based on member settings.

**Base Path**: `/api/b2b/approvals`

---

## Endpoints

### 1. Get Pending Approvals

**GET** `/api/b2b/approvals`

Returns approval requests for the authenticated user. Can retrieve either approvals pending for the user to approve, or approvals requested by the user.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: B2B Account Member (APPROVER or higher for pending approvals)

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | ❌ No | - | Filter by status (PENDING, APPROVED, REJECTED, CANCELLED) |
| type | string | ❌ No | pending | "pending" (to approve) or "my-requests" (requested by user) |

#### Request
```http
GET /api/b2b/approvals?type=pending&status=PENDING HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK) - Pending Approvals to Approve
```json
[
  {
    "id": "approval_abc123",
    "orderId": "order_xyz789",
    "approverId": "member_approver456",
    "requestedById": "member_purchaser789",
    "status": "PENDING",
    "orderTotal": 2500.00,
    "reason": null,
    "approverNotes": null,
    "requestedAt": "2025-01-16T10:30:00.000Z",
    "approvedAt": null,
    "notifiedAt": "2025-01-16T10:30:00.000Z",
    "reminderSentAt": null,
    "createdAt": "2025-01-16T10:30:00.000Z",
    "updatedAt": "2025-01-16T10:30:00.000Z",
    "order": {
      "id": "order_xyz789",
      "orderNumber": "ORD-1705401234-A7B3C",
      "total": 2500.00,
      "createdAt": "2025-01-16T10:30:00.000Z",
      "items": [
        {
          "id": "item_1",
          "productId": "prod_safety_vest",
          "quantity": 100,
          "price": 25.00
        }
      ]
    },
    "requester": {
      "id": "member_purchaser789",
      "role": "PURCHASER",
      "department": "Operations",
      "user": {
        "id": "user_john",
        "name": "John Purchaser",
        "email": "john@acme.com"
      }
    }
  }
]
```

#### Response (200 OK) - My Requested Approvals
```json
[
  {
    "id": "approval_def456",
    "orderId": "order_abc123",
    "approverId": "member_approver456",
    "requestedById": "member_purchaser789",
    "status": "APPROVED",
    "orderTotal": 1800.00,
    "reason": null,
    "approverNotes": "Approved for Q1 budget",
    "requestedAt": "2025-01-15T14:20:00.000Z",
    "approvedAt": "2025-01-15T15:45:00.000Z",
    "notifiedAt": "2025-01-15T14:20:00.000Z",
    "reminderSentAt": null,
    "createdAt": "2025-01-15T14:20:00.000Z",
    "updatedAt": "2025-01-15T15:45:00.000Z",
    "order": {
      "id": "order_abc123",
      "orderNumber": "ORD-1705301234-B8C4D",
      "total": 1800.00,
      "createdAt": "2025-01-15T14:20:00.000Z"
    },
    "approver": {
      "id": "member_approver456",
      "role": "APPROVER",
      "user": {
        "id": "user_sarah",
        "name": "Sarah Manager",
        "email": "sarah@acme.com"
      }
    }
  }
]
```

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 404 Not Found - Not a B2B member
{
  "error": "Not a B2B member"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

### 2. Get Single Approval

**GET** `/api/b2b/approvals/[approvalId]`

Retrieves detailed information for a specific approval request.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: B2B Account Member

#### Request
```http
GET /api/b2b/approvals/approval_abc123 HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "id": "approval_abc123",
  "orderId": "order_xyz789",
  "approverId": "member_approver456",
  "requestedById": "member_purchaser789",
  "status": "PENDING",
  "orderTotal": 2500.00,
  "reason": "Order exceeds approval threshold of $2000",
  "approverNotes": null,
  "requestedAt": "2025-01-16T10:30:00.000Z",
  "approvedAt": null,
  "order": {
    "id": "order_xyz789",
    "orderNumber": "ORD-1705401234-A7B3C",
    "total": 2500.00,
    "subtotal": 2300.00,
    "tax": 150.00,
    "shipping": 50.00,
    "status": "PENDING_APPROVAL",
    "createdAt": "2025-01-16T10:30:00.000Z",
    "items": [
      {
        "id": "item_1",
        "productId": "prod_safety_vest",
        "sku": "SV-1234",
        "name": "High-Visibility Safety Vest",
        "quantity": 100,
        "price": 23.00,
        "total": 2300.00
      }
    ],
    "shippingAddress": {
      "id": "addr_ship123",
      "firstName": "John",
      "lastName": "Doe",
      "company": "Acme Corp",
      "address1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    }
  },
  "requester": {
    "id": "member_purchaser789",
    "role": "PURCHASER",
    "department": "Operations",
    "orderLimit": 5000.00,
    "approvalThreshold": 2000.00,
    "user": {
      "id": "user_john",
      "name": "John Purchaser",
      "email": "john@acme.com"
    }
  },
  "approver": {
    "id": "member_approver456",
    "role": "APPROVER",
    "user": {
      "id": "user_sarah",
      "name": "Sarah Manager",
      "email": "sarah@acme.com"
    }
  }
}
```

---

### 3. Approve or Reject Order

**PATCH** `/api/b2b/approvals/[approvalId]`

Approves or rejects a pending approval request. Only the assigned approver can perform this action.

#### Authentication
- ✅ Required
- 🔐 **Required**: Must be the assigned approver for this approval

#### Request Body
```json
{
  "status": "APPROVED",
  "approverNotes": "Approved for Q1 safety initiative budget"
}
```

#### Field Validation
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| status | enum | ✅ Yes | "APPROVED" or "REJECTED" |
| approverNotes | string | ❌ No | Optional notes explaining the decision |

#### Response (200 OK) - Approved
```json
{
  "id": "approval_abc123",
  "orderId": "order_xyz789",
  "approverId": "member_approver456",
  "requestedById": "member_purchaser789",
  "status": "APPROVED",
  "orderTotal": 2500.00,
  "approverNotes": "Approved for Q1 safety initiative budget",
  "requestedAt": "2025-01-16T10:30:00.000Z",
  "approvedAt": "2025-01-16T14:25:00.000Z",
  "createdAt": "2025-01-16T10:30:00.000Z",
  "updatedAt": "2025-01-16T14:25:00.000Z"
}
```

#### Approval Flow
When an order is **APPROVED**:
1. Update approval status to APPROVED
2. Set approvedAt timestamp
3. Update order status from PENDING_APPROVAL to PROCESSING
4. Send notification email to requester (TODO: Implementation pending)

When an order is **REJECTED**:
1. Update approval status to REJECTED
2. Set approvedAt timestamp
3. Update order status to CANCELLED
4. Restore inventory for order items
5. Send notification email to requester (TODO: Implementation pending)

#### Error Responses
```json
// 400 Bad Request - Invalid status
{
  "error": "Invalid status"
}

// 400 Bad Request - Already processed
{
  "error": "Approval already processed"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden - Not the assigned approver
{
  "error": "Only assigned approver can approve/reject"
}

// 404 Not Found
{
  "error": "Approval not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

## Approval Workflow Diagram

```
┌─────────────────┐
│  Order Created  │
│  by Purchaser   │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │ Check   │
    │ Rules   │
    └────┬────┘
         │
         ├─► Order total > approval threshold? ──► YES ─┐
         │                                              │
         ├─► Member requires approval? ───────► YES ─┐ │
         │                                            │ │
         └─► Otherwise ──────────────────────► NO ─┐ │ │
                                                    │ │ │
                                                    ▼ ▼ ▼
                                               ┌─────────────┐
                                               │   PENDING   │
                                        ┌──────│  (No approval)│
                                        │      └─────────────┘
                                        │
                              ┌─────────▼──────────┐
                              │ PENDING_APPROVAL   │
                              │ (Needs approval)   │
                              └─────────┬──────────┘
                                        │
                              ┌─────────▼──────────┐
                              │ Create OrderApproval│
                              │ Assign to Approver  │
                              │ Send Notification   │
                              └─────────┬──────────┘
                                        │
                              ┌─────────▼──────────┐
                              │ Approver Reviews   │
                              └─────────┬──────────┘
                                        │
                                   ┌────┴────┐
                                   │         │
                              ┌────▼───┐ ┌───▼─────┐
                              │APPROVED│ │REJECTED │
                              └────┬───┘ └───┬─────┘
                                   │         │
                          ┌────────▼───┐ ┌───▼────────┐
                          │ PROCESSING │ │ CANCELLED  │
                          │ (Continue) │ │ (Restore   │
                          │            │ │ Inventory) │
                          └────────────┘ └────────────┘
```

---

## Approval Rules & Triggers

### When is approval required?

1. **Member-level approval threshold exceeded**
   - Member has `approvalThreshold` set (e.g., $2000)
   - Order total exceeds this amount
   - Example: Member with $2000 threshold places $2500 order

2. **Member requires approval for all orders**
   - Member has `requiresApproval: true`
   - ALL orders require approval regardless of amount
   - Example: New purchaser in probationary period

3. **Account-level approval threshold exceeded**
   - B2B Account has default approval threshold
   - Order total exceeds account-level threshold
   - Applies to all members unless overridden

### Who becomes the approver?

The system assigns the approval to a member with one of these roles:
- **APPROVER**: Dedicated approver role
- **ACCOUNT_ADMIN**: Account administrators can approve

The approval is typically assigned to:
1. The member's direct manager (if specified)
2. Any active APPROVER in the B2B account
3. Any active ACCOUNT_ADMIN

---

## Implementation Details

### File Location
- Main route: `src/app/api/b2b/approvals/route.ts`
- Dynamic route: `src/app/api/b2b/approvals/[approvalId]/route.ts`

### Database Model
```prisma
enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

model OrderApproval {
  id              String         @id @default(cuid())
  orderId         String

  // Requester
  requestedById   String
  requestedAt     DateTime       @default(now())

  // Approver
  approverId      String
  approvedAt      DateTime?

  status          ApprovalStatus @default(PENDING)

  // Approval details
  orderTotal      Decimal        @db.Decimal(12, 2)
  reason          String?
  approverNotes   String?

  // Notification
  notifiedAt      DateTime?
  reminderSentAt  DateTime?

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  order           Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  requester       B2BAccountMember @relation("ApprovalFor", fields: [requestedById], references: [id])
  approver        B2BAccountMember @relation("ApprovedBy", fields: [approverId], references: [id])

  @@index([orderId])
  @@index([status])
  @@index([approverId])
}
```

### Security Features
- Only assigned approver can approve/reject
- Cannot modify already processed approvals
- Audit trail with timestamps
- Notification system (pending implementation)

### Performance Optimizations
- Indexed by orderId, status, and approverId
- Includes related data in single query
- Ordered by requestedAt descending

---

## Usage Examples

### JavaScript/TypeScript (fetch)
```typescript
// Get pending approvals to review
const approvals = await fetch('/api/b2b/approvals?type=pending&status=PENDING', {
  credentials: 'include'
});
const data = await approvals.json();
console.log(`${data.length} approvals pending`);

// Get my requested approvals
const myRequests = await fetch('/api/b2b/approvals?type=my-requests', {
  credentials: 'include'
});
const requests = await myRequests.json();

// Approve an order
const approved = await fetch('/api/b2b/approvals/approval_abc123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    status: 'APPROVED',
    approverNotes: 'Budget approved for Q1 initiative'
  })
});

// Reject an order
const rejected = await fetch('/api/b2b/approvals/approval_abc123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    status: 'REJECTED',
    approverNotes: 'Exceeds quarterly budget. Please resubmit next quarter.'
  })
});
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

function useApprovals(type = 'pending') {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/b2b/approvals?type=${type}&status=PENDING`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setApprovals(data);
        setLoading(false);
      });
  }, [type]);

  const processApproval = async (approvalId, status, notes) => {
    const res = await fetch(`/api/b2b/approvals/${approvalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status,
        approverNotes: notes
      })
    });

    if (res.ok) {
      // Remove from pending list
      setApprovals(approvals.filter(a => a.id !== approvalId));
    }

    return res;
  };

  return { approvals, loading, processApproval };
}

// Usage
function ApprovalsPage() {
  const { approvals, loading, processApproval } = useApprovals('pending');

  const handleApprove = (approvalId) => {
    processApproval(approvalId, 'APPROVED', 'Approved');
  };

  const handleReject = (approvalId) => {
    const reason = prompt('Rejection reason:');
    processApproval(approvalId, 'REJECTED', reason);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Pending Approvals ({approvals.length})</h1>
      {approvals.map(approval => (
        <div key={approval.id}>
          <h3>Order {approval.order.orderNumber}</h3>
          <p>Total: ${approval.orderTotal}</p>
          <p>Requested by: {approval.requester.user.name}</p>
          <button onClick={() => handleApprove(approval.id)}>Approve</button>
          <button onClick={() => handleReject(approval.id)}>Reject</button>
        </div>
      ))}
    </div>
  );
}
```

---

## Related Documentation
- [Orders API](./orders.md) - Order creation and approval workflow
- [B2B Members API](./b2b-members.md) - Team member management and roles
- [Cost Centers API](./cost-centers.md) - Budget tracking for approvals
- [B2B Approvals Page](../pages/b2b-approvals.md) - Approval management UI
