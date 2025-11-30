# Cost Centers API Documentation

## Overview
The Cost Centers API manages budget tracking and departmental spending for B2B accounts. Allows account admins to create cost centers, set budgets, assign team members, and track spending against budgets.

**Base Path**: `/api/b2b/cost-centers`

---

## Endpoints

### 1. Get All Cost Centers

**GET** `/api/b2b/cost-centers`

Returns all cost centers for the authenticated user's B2B account with spending details and member assignments.

#### Authentication
- ✅ Required
- 🔐 **Required**: B2B account member

#### Request
```http
GET /api/b2b/cost-centers HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
[
  {
    "id": "cc_it_dept_123",
    "b2bProfileId": "b2b_acme_corp",
    "code": "IT-001",
    "name": "IT Department",
    "description": "Information Technology budget",
    "budgetAmount": 100000.00,
    "budgetPeriod": "MONTHLY",
    "budgetStartDate": "2025-01-01T00:00:00.000Z",
    "budgetEndDate": null,
    "currentSpent": 45230.50,
    "managerId": "member_manager_456",
    "isActive": true,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-15T14:30:00.000Z",
    "members": [
      {
        "id": "member_john_789",
        "role": "PURCHASER",
        "department": "IT",
        "user": {
          "id": "user_john",
          "name": "John IT",
          "email": "john.it@acme.com"
        }
      },
      {
        "id": "member_jane_012",
        "role": "PURCHASER",
        "department": "IT",
        "user": {
          "id": "user_jane",
          "name": "Jane Developer",
          "email": "jane@acme.com"
        }
      }
    ],
    "_count": {
      "orders": 23
    }
  },
  {
    "id": "cc_ops_dept_456",
    "b2bProfileId": "b2b_acme_corp",
    "code": "OPS-001",
    "name": "Operations Department",
    "description": "Operations and logistics budget",
    "budgetAmount": 50000.00,
    "budgetPeriod": "QUARTERLY",
    "budgetStartDate": "2025-01-01T00:00:00.000Z",
    "budgetEndDate": "2025-03-31T23:59:59.000Z",
    "currentSpent": 18750.25,
    "managerId": null,
    "isActive": true,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-10T09:15:00.000Z",
    "members": [
      {
        "id": "member_ops_345",
        "role": "PURCHASER",
        "department": "Operations",
        "user": {
          "id": "user_ops",
          "name": "Operations Manager",
          "email": "ops@acme.com"
        }
      }
    ],
    "_count": {
      "orders": 12
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

// 404 Not Found - No B2B profile
{
  "error": "B2B profile not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

### 2. Create Cost Center

**POST** `/api/b2b/cost-centers`

Creates a new cost center for budget tracking. Only accessible by account admins.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ACCOUNT_ADMIN

#### Request Body
```json
{
  "code": "SALES-001",
  "name": "Sales Department",
  "description": "Sales and marketing budget for Q1 2025",
  "budgetAmount": 75000.00,
  "budgetPeriod": "QUARTERLY",
  "budgetStartDate": "2025-01-01",
  "budgetEndDate": "2025-03-31",
  "managerId": "member_manager_789"
}
```

#### Field Validation
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | string | ✅ Yes | Unique within B2B account, max 50 chars |
| name | string | ✅ Yes | Display name, max 200 chars |
| description | string | ❌ No | Optional description |
| budgetAmount | decimal | ✅ Yes | Total budget allocation |
| budgetPeriod | enum | ❌ No | MONTHLY, QUARTERLY, YEARLY, CUSTOM (default: MONTHLY) |
| budgetStartDate | date | ✅ Yes | Budget period start date |
| budgetEndDate | date | ❌ No | Budget period end date (null for rolling budgets) |
| managerId | string | ❌ No | B2B member ID of the cost center manager |

#### Budget Period Options
- **MONTHLY**: Budget resets every month
- **QUARTERLY**: Budget resets every 3 months
- **YEARLY**: Budget resets annually
- **CUSTOM**: Custom date range specified by budgetStartDate and budgetEndDate

#### Response (201 Created)
```json
{
  "id": "cc_sales_new_999",
  "b2bProfileId": "b2b_acme_corp",
  "code": "SALES-001",
  "name": "Sales Department",
  "description": "Sales and marketing budget for Q1 2025",
  "budgetAmount": 75000.00,
  "budgetPeriod": "QUARTERLY",
  "budgetStartDate": "2025-01-01T00:00:00.000Z",
  "budgetEndDate": "2025-03-31T00:00:00.000Z",
  "currentSpent": 0.00,
  "managerId": "member_manager_789",
  "isActive": true,
  "createdAt": "2025-01-16T15:30:00.000Z",
  "updatedAt": "2025-01-16T15:30:00.000Z"
}
```

#### Error Responses
```json
// 400 Bad Request - Missing required fields
{
  "error": "Code, name, budget amount, and start date are required"
}

// 400 Bad Request - Duplicate code
{
  "error": "Cost center code already exists"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden - Not account admin
{
  "error": "Only account admin can create cost centers"
}

// 404 Not Found - B2B profile not found
{
  "error": "B2B profile not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

### 3. Get Single Cost Center

**GET** `/api/b2b/cost-centers/[costCenterId]`

Retrieves detailed information for a specific cost center including recent orders and member assignments.

#### Authentication
- ✅ Required
- 🔐 **Required**: B2B account member (must belong to same account)

#### Request
```http
GET /api/b2b/cost-centers/cc_it_dept_123 HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "id": "cc_it_dept_123",
  "b2bProfileId": "b2b_acme_corp",
  "code": "IT-001",
  "name": "IT Department",
  "description": "Information Technology budget",
  "budgetAmount": 100000.00,
  "budgetPeriod": "MONTHLY",
  "budgetStartDate": "2025-01-01T00:00:00.000Z",
  "budgetEndDate": null,
  "currentSpent": 45230.50,
  "managerId": "member_manager_456",
  "isActive": true,
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-15T14:30:00.000Z",
  "b2bProfile": {
    "id": "b2b_acme_corp",
    "userId": "user_admin",
    "companyName": "Acme Corporation",
    "taxId": "12-3456789",
    "status": "APPROVED"
  },
  "members": [
    {
      "id": "member_john_789",
      "role": "PURCHASER",
      "department": "IT",
      "orderLimit": 5000.00,
      "monthlyLimit": 20000.00,
      "requiresApproval": true,
      "approvalThreshold": 2000.00,
      "isActive": true,
      "user": {
        "id": "user_john",
        "name": "John IT",
        "email": "john.it@acme.com"
      }
    }
  ],
  "orders": [
    {
      "id": "order_recent_1",
      "orderNumber": "ORD-1705401234-A7B3C",
      "total": 2450.00,
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": "order_recent_2",
      "orderNumber": "ORD-1705301234-B8C4D",
      "total": 1890.50,
      "createdAt": "2025-01-14T14:20:00.000Z"
    }
  ]
}
```

#### Budget Calculation
The response includes:
- **budgetAmount**: Total allocated budget
- **currentSpent**: Amount spent in current period
- **Available**: `budgetAmount - currentSpent` (calculated client-side)
- **Percentage Used**: `(currentSpent / budgetAmount) * 100` (calculated client-side)

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden - Not from same B2B account
{
  "error": "Forbidden"
}

// 404 Not Found
{
  "error": "Cost center not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

### 4. Update Cost Center

**PATCH** `/api/b2b/cost-centers/[costCenterId]`

Updates an existing cost center. Only accessible by account admins.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ACCOUNT_ADMIN

#### Request Body (Partial Update)
```json
{
  "name": "IT & Infrastructure Department",
  "description": "Updated to include infrastructure costs",
  "budgetAmount": 120000.00,
  "budgetPeriod": "MONTHLY",
  "isActive": true
}
```

#### Updatable Fields
All fields from the creation endpoint can be updated individually except:
- `id`
- `b2bProfileId`
- `code` (cannot be changed once created)
- `currentSpent` (calculated automatically)

#### Response (200 OK)
```json
{
  "id": "cc_it_dept_123",
  "b2bProfileId": "b2b_acme_corp",
  "code": "IT-001",
  "name": "IT & Infrastructure Department",
  "description": "Updated to include infrastructure costs",
  "budgetAmount": 120000.00,
  "budgetPeriod": "MONTHLY",
  "budgetStartDate": "2025-01-01T00:00:00.000Z",
  "budgetEndDate": null,
  "currentSpent": 45230.50,
  "managerId": "member_manager_456",
  "isActive": true,
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-16T16:45:00.000Z"
}
```

#### Special Cases
- **Deactivating a cost center**: Set `isActive: false` to prevent new orders but keep historical data
- **Budget period changes**: When changing budget period, consider resetting `currentSpent` to 0
- **Budget increase/decrease**: Can be done mid-period; existing spending is retained

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden - Not account admin
{
  "error": "Only account admin can update cost centers"
}

// 404 Not Found
{
  "error": "Cost center not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

### 5. Delete Cost Center

**DELETE** `/api/b2b/cost-centers/[costCenterId]`

Deletes a cost center. Historical orders linked to this cost center will retain the reference but the cost center will be removed.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ACCOUNT_ADMIN

#### Request
```http
DELETE /api/b2b/cost-centers/cc_it_dept_123 HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
```json
{
  "success": true
}
```

#### Deletion Rules
- Cannot delete cost center with active members assigned (must reassign first)
- Historical orders remain intact with cost center ID reference
- Consider setting `isActive: false` instead of deleting for data integrity

#### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 403 Forbidden - Not account admin
{
  "error": "Only account admin can delete cost centers"
}

// 404 Not Found
{
  "error": "Cost center not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

---

## Budget Tracking & Enforcement

### How Budgets are Tracked

1. **Budget Period Start**
   - When a cost center is created, `currentSpent` starts at 0
   - Budget starts tracking from `budgetStartDate`

2. **Order Creation**
   - When an order is placed with `costCenterId` specified
   - Order total is checked against available budget
   - If budget exceeded, order is rejected
   - If approved, order total is added to `currentSpent`

3. **Budget Period Reset**
   - For MONTHLY: Reset on first day of each month
   - For QUARTERLY: Reset every 3 months
   - For YEARLY: Reset on budget anniversary
   - Reset sets `currentSpent` back to 0

### Budget Enforcement Logic

```typescript
// Check if order can be placed
const costCenter = await getCostCenter(costCenterId);
const available = costCenter.budgetAmount - costCenter.currentSpent;

if (orderTotal > available) {
  throw new Error(`Order exceeds cost center budget. Available: $${available}, Required: $${orderTotal}`);
}

// Approve order
await updateCostCenter(costCenterId, {
  currentSpent: costCenter.currentSpent + orderTotal
});
```

### Budget Alerts

Recommended alert thresholds:
- **75% used**: Warning notification to cost center manager
- **90% used**: Critical alert, consider approval requirement
- **100% used**: Block new orders until budget reset or increase

---

## Implementation Details

### File Location
- Main route: `src/app/api/b2b/cost-centers/route.ts`
- Dynamic route: `src/app/api/b2b/cost-centers/[costCenterId]/route.ts`

### Database Model
```prisma
enum BudgetPeriod {
  MONTHLY
  QUARTERLY
  YEARLY
  CUSTOM
}

model CostCenter {
  id              String   @id @default(cuid())
  b2bProfileId    String

  code            String
  name            String
  description     String?

  // Budget allocation
  budgetAmount    Decimal  @db.Decimal(12, 2)
  budgetPeriod    BudgetPeriod @default(MONTHLY)
  budgetStartDate DateTime
  budgetEndDate   DateTime?

  // Spending tracking
  currentSpent    Decimal  @default(0) @db.Decimal(12, 2)

  // Manager
  managerId       String?

  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  b2bProfile      B2BProfile @relation(fields: [b2bProfileId], references: [id], onDelete: Cascade)
  members         B2BAccountMember[]
  orders          Order[]  @relation("OrderCostCenter")

  @@unique([b2bProfileId, code])
  @@index([b2bProfileId])
  @@index([isActive])
}
```

### Security Features
- Only account admins can create/modify cost centers
- Users can only access cost centers from their B2B account
- Code uniqueness enforced per B2B account
- Automatic cleanup on account deletion (Cascade)

### Performance Optimizations
- Indexed by b2bProfileId and isActive
- Unique constraint on (b2bProfileId, code)
- Ordered by name ascending
- Related members and orders included efficiently

---

## Usage Examples

### JavaScript/TypeScript (fetch)
```typescript
// Get all cost centers
const costCenters = await fetch('/api/b2b/cost-centers', {
  credentials: 'include'
});
const centers = await costCenters.json();

// Create new cost center
const newCenter = await fetch('/api/b2b/cost-centers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    code: 'MKTG-001',
    name: 'Marketing Department',
    description: 'Q1 2025 marketing budget',
    budgetAmount: 50000,
    budgetPeriod: 'QUARTERLY',
    budgetStartDate: '2025-01-01',
    budgetEndDate: '2025-03-31'
  })
});

// Update cost center budget
const updated = await fetch('/api/b2b/cost-centers/cc_123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    budgetAmount: 60000, // Increase budget
    description: 'Budget increased for special campaign'
  })
});

// Deactivate cost center
const deactivated = await fetch('/api/b2b/cost-centers/cc_123', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    isActive: false
  })
});

// Delete cost center
await fetch('/api/b2b/cost-centers/cc_123', {
  method: 'DELETE',
  credentials: 'include'
});
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react';

function useCostCenters() {
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/b2b/cost-centers', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setCostCenters(data);
        setLoading(false);
      });
  }, []);

  const createCostCenter = async (centerData) => {
    const res = await fetch('/api/b2b/cost-centers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(centerData)
    });
    const newCenter = await res.json();
    setCostCenters([...costCenters, newCenter]);
    return newCenter;
  };

  const updateCostCenter = async (centerId, updates) => {
    const res = await fetch(`/api/b2b/cost-centers/${centerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    const updated = await res.json();
    setCostCenters(costCenters.map(c => c.id === centerId ? updated : c));
    return updated;
  };

  return { costCenters, loading, createCostCenter, updateCostCenter };
}

// Budget Dashboard Component
function BudgetDashboard() {
  const { costCenters, loading } = useCostCenters();

  const calculateBudgetStatus = (center) => {
    const available = center.budgetAmount - center.currentSpent;
    const percentUsed = (center.currentSpent / center.budgetAmount) * 100;

    return {
      available,
      percentUsed,
      status: percentUsed >= 90 ? 'critical' : percentUsed >= 75 ? 'warning' : 'good'
    };
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Budget Overview</h1>
      {costCenters.map(center => {
        const budget = calculateBudgetStatus(center);
        return (
          <div key={center.id} className={`budget-card ${budget.status}`}>
            <h3>{center.name} ({center.code})</h3>
            <div className="budget-bar">
              <div
                className="budget-used"
                style={{ width: `${budget.percentUsed}%` }}
              />
            </div>
            <p>
              Budget: ${center.budgetAmount.toFixed(2)} |
              Spent: ${center.currentSpent.toFixed(2)} ({budget.percentUsed.toFixed(1)}%) |
              Available: ${budget.available.toFixed(2)}
            </p>
            <p>{center.members.length} members | {center._count.orders} orders</p>
          </div>
        );
      })}
    </div>
  );
}
```

---

## Related Documentation
- [B2B Members API](./b2b-members.md) - Assigning members to cost centers
- [Orders API](./orders.md) - Creating orders with cost center tracking
- [B2B Approvals API](./b2b-approvals.md) - Budget-based approval workflows
- [Cost Centers Page](../pages/b2b-cost-centers.md) - Budget management UI
