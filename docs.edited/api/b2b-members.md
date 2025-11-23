# B2B Members API Documentation

## Overview
The B2B Members API manages multi-user team accounts for B2B customers. Allows account admins to invite team members, assign roles, set spending limits, and manage permissions.

**Base Path**: `/api/b2b/members`

---

## Endpoints

### 1. Get All Team Members

**GET** `/api/b2b/members`

Returns all team members for the authenticated user's B2B account. Only accessible by ACCOUNT_ADMIN or APPROVER roles.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ACCOUNT_ADMIN or APPROVER

#### Request
```http
GET /api/b2b/members HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "members": [
    {
      "id": "member_admin123",
      "b2bProfileId": "b2b_acme_corp",
      "userId": "user_john",
      "role": "ACCOUNT_ADMIN",
      "department": "Management",
      "costCenterId": null,
      "orderLimit": null,
      "monthlyLimit": null,
      "requiresApproval": false,
      "approvalThreshold": null,
      "isActive": true,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "updatedAt": "2025-01-01T10:00:00.000Z",
      "user": {
        "name": "John Admin",
        "email": "john@acme.com"
      },
      "costCenter": null,
      "_count": {
        "ordersCreated": 45,
        "approvalsRequested": 12,
        "approvalsGiven": 28
      }
    },
    {
      "id": "member_purchaser456",
      "b2bProfileId": "b2b_acme_corp",
      "userId": "user_jane",
      "role": "PURCHASER",
      "department": "IT",
      "costCenterId": "cc_it_dept",
      "orderLimit": 5000.00,
      "monthlyLimit": 20000.00,
      "requiresApproval": true,
      "approvalThreshold": 2000.00,
      "isActive": true,
      "createdAt": "2025-01-05T14:30:00.000Z",
      "updatedAt": "2025-01-15T09:20:00.000Z",
      "user": {
        "name": "Jane Purchaser",
        "email": "jane@acme.com"
      },
      "costCenter": {
        "name": "IT Department",
        "code": "IT-001",
        "budget": 100000.00,
        "spent": 45230.50
      },
      "_count": {
        "ordersCreated": 23,
        "approvalsRequested": 8,
        "approvalsGiven": 0
      }
    },
    {
      "id": "member_approver789",
      "b2bProfileId": "b2b_acme_corp",
      "userId": "user_sarah",
      "role": "APPROVER",
      "department": "Finance",
      "costCenterId": null,
      "orderLimit": null,
      "monthlyLimit": null,
      "requiresApproval": false,
      "approvalThreshold": null,
      "isActive": true,
      "createdAt": "2025-01-03T11:15:00.000Z",
      "updatedAt": "2025-01-03T11:15:00.000Z",
      "user": {
        "name": "Sarah Approver",
        "email": "sarah@acme.com"
      },
      "costCenter": null,
      "_count": {
        "ordersCreated": 2,
        "approvalsRequested": 0,
        "approvalsGiven": 34
      }
    }
  ],
  "account": {
    "companyName": "Acme Corporation",
    "totalMembers": 3,
    "activeMembers": 3
  }
}
```

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden - Not admin or approver
{
  "error": "Access denied. Admin or Approver role required."
}

// 404 Not Found - Not a B2B account
{
  "error": "B2B account not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch members"
}
```

---

### 2. Add Team Member

**POST** `/api/b2b/members`

Invites a new team member to the B2B account. Only accessible by ACCOUNT_ADMIN.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ACCOUNT_ADMIN

#### Request Body
```json
{
  "email": "newmember@acme.com",
  "role": "PURCHASER",
  "department": "Operations",
  "costCenterId": "cc_ops_dept",
  "orderLimit": 3000.00,
  "monthlyLimit": 15000.00,
  "requiresApproval": true,
  "approvalThreshold": 1500.00
}
```

#### Field Validation
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | ✅ Yes | Must be valid email, user must exist in system |
| role | enum | ✅ Yes | ACCOUNT_ADMIN, PURCHASER, APPROVER, VIEWER, FINANCE |
| department | string | ❌ No | Max 100 characters |
| costCenterId | string | ❌ No | Must be valid cost center ID for this account |
| orderLimit | decimal | ❌ No | Max order amount per transaction |
| monthlyLimit | decimal | ❌ No | Max total orders per month |
| requiresApproval | boolean | ❌ No | Requires approval for all orders (default: false) |
| approvalThreshold | decimal | ❌ No | Orders above this amount require approval |

#### B2B Roles Explained
- **ACCOUNT_ADMIN**: Full control, can manage members, settings, approvals
- **PURCHASER**: Can create orders (subject to limits and approvals)
- **APPROVER**: Can approve orders, view team activity
- **VIEWER**: Read-only access to orders and reports
- **FINANCE**: Access to financial reports, invoices, payments

#### Response (201 Created)
```json
{
  "id": "member_new999",
  "b2bProfileId": "b2b_acme_corp",
  "userId": "user_newmember",
  "role": "PURCHASER",
  "department": "Operations",
  "costCenterId": "cc_ops_dept",
  "orderLimit": 3000.00,
  "monthlyLimit": 15000.00,
  "requiresApproval": true,
  "approvalThreshold": 1500.00,
  "isActive": true,
  "createdAt": "2025-01-16T15:30:00.000Z",
  "updatedAt": "2025-01-16T15:30:00.000Z",
  "user": {
    "name": "New Member",
    "email": "newmember@acme.com"
  },
  "costCenter": {
    "name": "Operations Department",
    "code": "OPS-001"
  }
}
```

#### Error Responses
```json
// 400 Bad Request - Missing required fields
{
  "error": "Email and role are required"
}

// 400 Bad Request - User not found
{
  "error": "User not found with this email"
}

// 400 Bad Request - Already a member
{
  "error": "User is already a member of this B2B account"
}

// 403 Forbidden - Not account admin
{
  "error": "Access denied. Account Admin role required."
}

// 404 Not Found - Cost center not found
{
  "error": "Cost center not found"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to add member"
}
```

---

### 3. Get Single Member

**GET** `/api/b2b/members/[memberId]`

Retrieves detailed information for a specific team member.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ACCOUNT_ADMIN or APPROVER

#### Request
```http
GET /api/b2b/members/member_purchaser456 HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "id": "member_purchaser456",
  "b2bProfileId": "b2b_acme_corp",
  "userId": "user_jane",
  "role": "PURCHASER",
  "department": "IT",
  "costCenterId": "cc_it_dept",
  "orderLimit": 5000.00,
  "monthlyLimit": 20000.00,
  "requiresApproval": true,
  "approvalThreshold": 2000.00,
  "isActive": true,
  "createdAt": "2025-01-05T14:30:00.000Z",
  "updatedAt": "2025-01-15T09:20:00.000Z",
  "user": {
    "id": "user_jane",
    "name": "Jane Purchaser",
    "email": "jane@acme.com",
    "phone": "+1-555-0124"
  },
  "costCenter": {
    "id": "cc_it_dept",
    "name": "IT Department",
    "code": "IT-001",
    "budget": 100000.00,
    "spent": 45230.50,
    "available": 54769.50
  },
  "statistics": {
    "totalOrders": 23,
    "totalSpent": 12450.75,
    "thisMonthOrders": 5,
    "thisMonthSpent": 3200.00,
    "pendingApprovals": 2,
    "averageOrderValue": 541.34
  },
  "recentOrders": [
    {
      "orderNumber": "ORD-1705401234-A7B3C",
      "total": 1387.50,
      "status": "DELIVERED",
      "createdAt": "2025-01-10T10:30:00.000Z"
    }
  ]
}
```

#### Error Responses
```json
// 403 Forbidden
{
  "error": "Access denied"
}

// 404 Not Found
{
  "error": "Member not found"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch member"
}
```

---

### 4. Update Team Member

**PATCH** `/api/b2b/members/[memberId]`

Updates a team member's role, limits, or settings. Only accessible by ACCOUNT_ADMIN.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ACCOUNT_ADMIN

#### Request Body (Partial Update)
```json
{
  "role": "APPROVER",
  "department": "Finance",
  "orderLimit": 10000.00,
  "monthlyLimit": 50000.00,
  "requiresApproval": false,
  "approvalThreshold": null,
  "isActive": true
}
```

#### Updatable Fields
All fields from the creation endpoint can be updated individually.

#### Response (200 OK)
```json
{
  "id": "member_purchaser456",
  "b2bProfileId": "b2b_acme_corp",
  "userId": "user_jane",
  "role": "APPROVER",
  "department": "Finance",
  "costCenterId": "cc_it_dept",
  "orderLimit": 10000.00,
  "monthlyLimit": 50000.00,
  "requiresApproval": false,
  "approvalThreshold": null,
  "isActive": true,
  "createdAt": "2025-01-05T14:30:00.000Z",
  "updatedAt": "2025-01-16T16:45:00.000Z",
  "user": {
    "name": "Jane Approver",
    "email": "jane@acme.com"
  },
  "costCenter": {
    "name": "IT Department",
    "code": "IT-001"
  }
}
```

#### Special Cases
- **Deactivating a member**: Set `isActive: false` to prevent login and order creation
- **Changing role to ACCOUNT_ADMIN**: Must have at least one other active ACCOUNT_ADMIN
- **Removing cost center**: Set `costCenterId: null`

#### Error Responses
```json
// 400 Bad Request - Last admin
{
  "error": "Cannot deactivate the last account admin"
}

// 403 Forbidden
{
  "error": "Access denied. Account Admin role required."
}

// 404 Not Found
{
  "error": "Member not found"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to update member"
}
```

---

### 5. Remove Team Member

**DELETE** `/api/b2b/members/[memberId]`

Removes a team member from the B2B account. Only accessible by ACCOUNT_ADMIN.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ACCOUNT_ADMIN

#### Request
```http
DELETE /api/b2b/members/member_purchaser456 HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

#### Deletion Rules
- Cannot delete the last ACCOUNT_ADMIN
- Cannot delete yourself (must have another admin remove you)
- Past orders created by this member remain intact
- Pending approvals assigned to this member are reassigned to another approver

#### Error Responses
```json
// 400 Bad Request - Last admin
{
  "error": "Cannot remove the last account admin"
}

// 400 Bad Request - Cannot remove self
{
  "error": "Cannot remove yourself. Ask another admin to remove you."
}

// 403 Forbidden
{
  "error": "Access denied. Account Admin role required."
}

// 404 Not Found
{
  "error": "Member not found"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to remove member"
}
```

---

## Role Permissions Matrix

| Permission | ACCOUNT_ADMIN | PURCHASER | APPROVER | VIEWER | FINANCE |
|-----------|---------------|-----------|----------|--------|---------|
| View team members | ✅ | ❌ | ✅ | ❌ | ❌ |
| Add members | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit members | ✅ | ❌ | ❌ | ❌ | ❌ |
| Remove members | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create orders | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve orders | ✅ | ❌ | ✅ | ❌ | ❌ |
| View orders | ✅ | Own only | All | All | All |
| Manage cost centers | ✅ | ❌ | ❌ | ❌ | ✅ |
| View reports | ✅ | Own only | All | All | All |
| Manage account settings | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Order Limits & Approval Logic

### Order Limit Hierarchy
```
1. Member orderLimit (per transaction)
   └─► If order exceeds this: REJECTED

2. Member monthlyLimit (cumulative per month)
   └─► If month-to-date + order exceeds this: REJECTED

3. Cost Center budget
   └─► If spent + order exceeds budget: REJECTED

4. Member approvalThreshold
   └─► If order exceeds this: REQUIRES_APPROVAL

5. Account requiresApprovalAbove
   └─► If order exceeds this: REQUIRES_APPROVAL

6. Member requiresApproval flag
   └─► If true: ALL orders REQUIRE_APPROVAL
```

### Example Scenarios

#### Scenario 1: Order within limits, no approval
```json
{
  "memberOrderLimit": 5000,
  "memberApprovalThreshold": 2000,
  "orderTotal": 1500
}
// Result: ✅ PENDING (approved automatically)
```

#### Scenario 2: Order within limits, requires approval
```json
{
  "memberOrderLimit": 5000,
  "memberApprovalThreshold": 2000,
  "orderTotal": 2500
}
// Result: 🔔 PENDING_APPROVAL (needs approver)
```

#### Scenario 3: Order exceeds limit
```json
{
  "memberOrderLimit": 5000,
  "orderTotal": 5500
}
// Result: ❌ REJECTED (exceeds order limit)
```

#### Scenario 4: Monthly limit exceeded
```json
{
  "memberMonthlyLimit": 20000,
  "thisMonthSpent": 18000,
  "orderTotal": 3000
}
// Result: ❌ REJECTED (would exceed monthly limit)
```

---

## Implementation Details

### File Location
- Main route: `src/app/api/b2b/members/route.ts`
- Dynamic route: `src/app/api/b2b/members/[memberId]/route.ts`

### Database Model
```prisma
model B2BAccountMember {
  id                String      @id @default(cuid())
  b2bProfileId      String
  userId            String
  role              B2BUserRole @default(PURCHASER)
  department        String?
  costCenterId      String?
  orderLimit        Decimal?    @db.Decimal(12, 2)
  monthlyLimit      Decimal?    @db.Decimal(12, 2)
  requiresApproval  Boolean     @default(false)
  approvalThreshold Decimal?    @db.Decimal(12, 2)
  isActive          Boolean     @default(true)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  account             B2BProfile        @relation(fields: [b2bProfileId], references: [id], onDelete: Cascade)
  user                User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  costCenter          CostCenter?       @relation(fields: [costCenterId], references: [id])
  ordersCreated       Order[]
  approvalsRequested  OrderApproval[]   @relation("ApprovalRequester")
  approvalsGiven      OrderApproval[]   @relation("ApprovalApprover")

  @@unique([b2bProfileId, userId])
  @@index([userId])
  @@index([b2bProfileId])
  @@index([role])
  @@index([isActive])
}
```

---

## Usage Examples

### Get All Team Members
```typescript
const response = await fetch('/api/b2b/members', {
  credentials: 'include'
});
const { members, account } = await response.json();

console.log(`${account.companyName} has ${members.length} members`);
members.forEach(member => {
  console.log(`${member.user.name} - ${member.role}`);
});
```

### Add Team Member
```typescript
const response = await fetch('/api/b2b/members', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'newuser@company.com',
    role: 'PURCHASER',
    department: 'Operations',
    orderLimit: 5000,
    monthlyLimit: 20000,
    requiresApproval: true,
    approvalThreshold: 2000
  })
});

if (response.ok) {
  const member = await response.json();
  console.log('Member added:', member.id);
}
```

### Update Member Role
```typescript
const response = await fetch(`/api/b2b/members/${memberId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    role: 'APPROVER',
    orderLimit: null, // Remove limit
    requiresApproval: false
  })
});
```

### Deactivate Member
```typescript
const response = await fetch(`/api/b2b/members/${memberId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    isActive: false
  })
});
```

---

## Related Documentation
- [B2B Approvals API](./b2b-approvals.md) - Order approval workflow
- [Cost Centers API](./cost-centers.md) - Budget management
- [Orders API](./orders.md) - Order creation with limits
- [B2B Team Page](../pages/b2b-team.md) - Team management UI
- [B2B Approvals Page](../pages/b2b-approvals.md) - Approval UI
