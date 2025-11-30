# Admin Customer Credit Dashboard Page

## Overview

The Customer Credit Dashboard (`/admin/customer-credit`) provides administrative tools for managing B2B customer credit limits, outstanding balances, and payment terms. This interface enables administrators to monitor credit utilization, approve credit increases, and track payment obligations.

**File Location:** `/home/user/siteJadid/src/app/admin/customer-credit/page.tsx`

**Route:** `/admin/customer-credit`

---

## User Access Requirements

### Authorized Roles
- All authenticated admin users (should be enhanced with specific roles)

### Authentication Check
```typescript
// Basic authentication check
const session = await getServerSession(authOptions);
if (!session?.user?.id) redirect('/auth/signin');
```

---

## Features List

### Core Features

1. **Credit Overview Table**
   - Company name
   - Credit limit
   - Credit used
   - Available credit
   - Payment terms

2. **Credit Monitoring**
   - Real-time credit utilization
   - Outstanding balance tracking
   - Credit limit management
   - Payment term tracking

3. **B2B Profile Management**
   - View B2B customer profiles
   - Credit history
   - Payment history
   - Account status

---

## Database Queries Used

### Get All B2B Profiles with Credit Information
```typescript
const b2bProfiles = await db.b2BProfile.findMany({
  select: {
    id: true,
    companyName: true,
    creditLimit: true,
    creditUsed: true,
    user: { select: { email: true } },
  },
});
```

### Database Schema (B2BProfile Model)
```prisma
model B2BProfile {
  id                String    @id @default(cuid())
  userId            String    @unique
  companyName       String
  taxId             String    @unique
  businessLicense   String?
  creditLimit       Decimal   @default(0) @db.Decimal(12, 2)
  creditUsed        Decimal   @default(0) @db.Decimal(12, 2)
  paymentTerms      Int       @default(30) // Net 30, Net 60, etc.

  status            B2BStatus @default(PENDING)

  // Contact
  businessPhone     String?
  businessEmail     String?
  website           String?

  // Industry
  industry          String?
  yearsInBusiness   Int?
  annualRevenue     Decimal?  @db.Decimal(15, 2)

  // Banking
  bankName          String?
  accountNumber     String?
  routingNumber     String?

  // Tax Exemption
  taxExemptionCert  String?
  taxExemptNumber   String?

  // Approval
  approvedBy        String?
  approvedAt        DateTime?

  notes             String?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user              User      @relation(fields: [userId], references: [id])
  addresses         B2BAddress[]
  contacts          B2BContact[]
  contracts         Contract[]
  accountMembers    B2BAccountMember[]

  @@index([userId])
  @@index([status])
  @@index([companyName])
}

enum B2BStatus {
  PENDING
  APPROVED
  SUSPENDED
  REJECTED
}
```

---

## UI Components Breakdown

### 1. Page Header
```typescript
<div className="p-8">
  <h1 className="text-3xl font-bold mb-6">Customer Credit Dashboard</h1>
</div>
```

### 2. Credit Table
```typescript
<div className="bg-white rounded-lg border">
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Company
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Credit Limit
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Used
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Available
        </th>
      </tr>
    </thead>
    <tbody>
      {b2bProfiles.map((profile: any) => {
        const available = Number(profile.creditLimit) - Number(profile.creditUsed);
        return (
          <tr key={profile.id}>
            <td className="px-6 py-4">{profile.companyName}</td>
            <td className="px-6 py-4">
              ${Number(profile.creditLimit).toLocaleString()}
            </td>
            <td className="px-6 py-4">
              ${Number(profile.creditUsed).toLocaleString()}
            </td>
            <td className="px-6 py-4">
              ${available.toLocaleString()}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
```

**Icons Used:**
- `DollarSign` - Financial metrics
- `TrendingUp` - Credit trends

---

## User Flows

### Flow 1: View Credit Dashboard
```
1. Admin navigates to /admin/customer-credit
2. System fetches all B2B profiles with credit data
3. Table displays:
   - Company names
   - Credit limits
   - Used amounts
   - Available credit (calculated)
4. Admin monitors credit utilization
```

### Flow 2: Calculate Available Credit
```
Available Credit = Credit Limit - Credit Used

Example:
- Credit Limit: $50,000
- Credit Used: $23,450
- Available: $26,550
```

### Flow 3: Monitor High Utilization
```
1. Admin reviews credit used vs limit
2. Identifies customers near limit
3. Can:
   - Increase credit limit
   - Contact customer
   - Hold future orders
   - Require payment
```

---

## Credit Utilization Metrics

### Utilization Percentage
```typescript
const utilizationPercent = (creditUsed / creditLimit) * 100;

// Color coding:
// 0-50%: Green (Healthy)
// 51-80%: Yellow (Warning)
// 81-100%: Red (High risk)
```

### Credit Status Indicators
```
✓ Good Standing: < 80% utilization, current on payments
⚠ Warning: 80-95% utilization
⛔ At Limit: 95-100% utilization
🚫 Over Limit: > 100% utilization (should not happen)
```

---

## Related APIs

### 1. GET /api/admin/customer-credit
**Purpose:** Fetch all B2B credit profiles

**Response:**
```typescript
[
  {
    id: string,
    companyName: string,
    creditLimit: Decimal,
    creditUsed: Decimal,
    availableCredit: Decimal,
    paymentTerms: number,
    status: B2BStatus
  }
]
```

### 2. PATCH /api/admin/customer-credit/[id]
**Purpose:** Update credit limit

**Request Body:**
```typescript
{
  creditLimit?: Decimal,
  paymentTerms?: number,
  status?: B2BStatus
}
```

### 3. POST /api/admin/customer-credit/[id]/adjust
**Purpose:** Adjust credit used (for payments/charges)

**Request Body:**
```typescript
{
  amount: Decimal,
  type: 'charge' | 'payment',
  notes?: string
}
```

---

## Code Snippets from Implementation

### Calculate Available Credit
```typescript
{b2bProfiles.map((profile: any) => {
  const available = Number(profile.creditLimit) - Number(profile.creditUsed);
  return (
    <tr key={profile.id}>
      <td className="px-6 py-4">{profile.companyName}</td>
      <td className="px-6 py-4">
        ${Number(profile.creditLimit).toLocaleString()}
      </td>
      <td className="px-6 py-4">
        ${Number(profile.creditUsed).toLocaleString()}
      </td>
      <td className="px-6 py-4">
        ${available.toLocaleString()}
      </td>
    </tr>
  );
})}
```

---

## Future Enhancements

1. **Enhanced Dashboard**
   - Credit utilization chart
   - Aging report (30/60/90 days)
   - Payment history graph
   - Risk indicators

2. **Advanced Features**
   - Automated credit checks
   - Credit score integration
   - Payment reminders
   - Credit limit requests workflow

3. **Reporting**
   - Days sales outstanding (DSO)
   - Bad debt tracking
   - Collection efficiency
   - Credit exposure by customer

4. **Automation**
   - Auto-hold orders at limit
   - Payment due notifications
   - Credit review alerts
   - Statement generation

5. **Integration**
   - Accounting software sync
   - Credit bureau integration
   - Payment gateway linking
   - ERP system connection
