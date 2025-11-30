# Admin Contract Management Page

## Overview

The Contract Management page (`/admin/contracts`) provides administrative tools for managing B2B and GSA (Government Services Administration) contracts. This interface allows administrators to track customer contracts, monitor contract terms, manage renewal cycles, and maintain contract-based pricing agreements.

**File Location:** `/home/user/siteJadid/src/app/admin/contracts/page.tsx`

**Route:** `/admin/contracts`

---

## User Access Requirements

### Authorized Roles
- `SUPER_ADMIN`
- `ADMIN`
- `ACCOUNTANT`
- `CUSTOMER_SERVICE`

### Authentication Check
```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.id) redirect('/auth/signin');
```

**Note:** The current implementation has basic authentication. In production, role-based authorization should be added similar to the quotes page.

---

## Features List

### Core Features
1. **Contract Listing**
   - Display all active contracts
   - Contract number tracking
   - Customer/company identification
   - Contract type differentiation (B2B vs GSA)

2. **Contract Information Display**
   - Contract number (unique identifier)
   - Customer name (B2B company or GSA agency)
   - Contract type (B2B or GSA)
   - Contract value
   - Contract status

3. **Contract Types**
   - **B2B Contracts:** Corporate purchasing agreements
   - **GSA Contracts:** Government agency contracts with GSA-specific terms

4. **Contract Status Tracking**
   - DRAFT - Contract being created
   - ACTIVE - Currently valid contract
   - EXPIRED - Past end date
   - RENEWED - Contract renewed for new term
   - CANCELLED - Contract terminated
   - SUSPENDED - Temporarily inactive

5. **Date Management**
   - Start date tracking
   - End date tracking
   - Auto-renewal settings
   - Renewal period configuration
   - Notice period management

---

## Database Queries Used

### Get All Contracts with Customer Information
```typescript
const contracts = await db.contract.findMany({
  include: {
    b2bProfile: { select: { companyName: true } },
    gsaProfile: { select: { agencyName: true } },
  },
  orderBy: { createdAt: 'desc' },
});
```

### Database Schema (Contract Model)
```prisma
model Contract {
  id                String         @id @default(cuid())
  contractNumber    String         @unique
  userId            String

  // Contract Details
  name              String
  description       String?
  status            ContractStatus @default(DRAFT)

  // Dates
  startDate         DateTime
  endDate           DateTime
  autoRenew         Boolean        @default(false)
  renewalPeriod     Int?           // Months
  noticePeriod      Int?           // Days before expiry

  // Pricing
  discountPercent   Decimal        @default(0) @db.Decimal(5, 2)
  minimumSpend      Decimal?       @db.Decimal(12, 2)
  volumeCommitment  Int?           // Minimum units to purchase
  value             Decimal        @db.Decimal(12, 2)

  // Payment Terms
  paymentTerms      Int            @default(30)

  // Documents
  documentUrl       String?
  signedDocumentUrl String?

  // Approval
  approvedBy        String?
  approvedAt        DateTime?

  // Audit
  createdBy         String
  lastReviewDate    DateTime?
  nextReviewDate    DateTime?

  notes             String?

  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  user              User           @relation(fields: [userId], references: [id])
  b2bProfile        B2BProfile?    @relation(fields: [b2bProfileId], references: [id])
  gsaProfile        GSAProfile?    @relation(fields: [gsaProfileId], references: [id])
  items             ContractItem[]
  orders            Order[]
}

model ContractItem {
  id              String   @id @default(cuid())
  contractId      String
  productId       String

  // Pricing
  contractPrice   Decimal  @db.Decimal(12, 2)
  minimumQuantity Int?
  maximumQuantity Int?

  // Valid dates (can differ from contract)
  startDate       DateTime?
  endDate         DateTime?

  isActive        Boolean  @default(true)
  notes           String?

  contract        Contract @relation(fields: [contractId], references: [id], onDelete: Cascade)
  product         Product  @relation(fields: [productId], references: [id])
}

enum ContractStatus {
  DRAFT
  ACTIVE
  EXPIRED
  RENEWED
  CANCELLED
  SUSPENDED
}
```

---

## UI Components Breakdown

### 1. Page Header
```typescript
<div className="mb-8">
  <h1 className="text-3xl font-bold mb-2">Contract Management</h1>
  <p className="text-gray-600">Manage B2B and GSA contracts</p>
</div>
```

### 2. Contracts Data Table
```typescript
<div className="bg-white rounded-lg border">
  <table className="w-full">
    <thead className="bg-gray-50 border-b">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Contract #
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Customer
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Type
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Value
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Status
        </th>
      </tr>
    </thead>
    <tbody>
      {contracts.map((c: any) => (
        <tr key={c.id}>
          <td className="px-6 py-4">{c.contractNumber}</td>
          <td className="px-6 py-4">
            {c.b2bProfile?.companyName || c.gsaProfile?.agencyName}
          </td>
          <td className="px-6 py-4">
            {c.b2bProfileId ? 'B2B' : 'GSA'}
          </td>
          <td className="px-6 py-4">
            ${Number(c.value).toFixed(2)}
          </td>
          <td className="px-6 py-4">{c.status}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 3. Contract Type Indicator
```typescript
// Determines if contract is B2B or GSA based on profile relationship
{c.b2bProfileId ? 'B2B' : 'GSA'}
```

---

## User Flows

### Flow 1: View All Contracts
```
1. Admin navigates to /admin/contracts
2. System authenticates user session
3. System fetches all contracts with customer information
4. Table displays:
   - Contract numbers
   - Customer names (company or agency)
   - Contract types (B2B/GSA)
   - Contract values
   - Current status
5. Admin can review all active contracts
```

### Flow 2: Identify Contract Type
```
1. Admin views contract list
2. "Type" column shows B2B or GSA
3. Customer column shows:
   - B2B: Company name from B2BProfile
   - GSA: Agency name from GSAProfile
4. Admin can quickly identify government vs corporate contracts
```

### Flow 3: Track Contract Value
```
1. Admin reviews contract values
2. Value column displays total contract worth
3. Admin can identify high-value contracts
4. Values displayed with 2 decimal precision
5. Currency formatting for readability
```

### Flow 4: Monitor Contract Status
```
1. Admin checks status column
2. Statuses indicate contract state:
   - DRAFT: Being created, not yet active
   - ACTIVE: Currently in force
   - EXPIRED: Past end date
   - RENEWED: Extended for new term
   - CANCELLED: Terminated early
   - SUSPENDED: Temporarily inactive
3. Admin can prioritize actions based on status
```

---

## Contract Lifecycle Workflow

```
┌─────────┐
│  DRAFT  │ (Contract being created)
└────┬────┘
     │ (Approved & signed)
     v
┌─────────┐
│ ACTIVE  │ (Contract in force)
└────┬────┘
     │
     ├──────────┬──────────┬──────────┐
     v          v          v          v
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ RENEWED  │ │ EXPIRED  │ │CANCELLED │ │SUSPENDED │
└──────────┘ └──────────┘ └──────────┘ └────┬─────┘
     │                                        │
     └────────────────────────────────────────┘
                       │
                       v
                  ┌─────────┐
                  │ ACTIVE  │
                  └─────────┘
```

**Status Transitions:**
- `DRAFT` → `ACTIVE` (Contract approved and activated)
- `ACTIVE` → `RENEWED` (Contract renewed for new term)
- `ACTIVE` → `EXPIRED` (End date reached, not renewed)
- `ACTIVE` → `CANCELLED` (Contract terminated)
- `ACTIVE` → `SUSPENDED` (Temporary suspension)
- `SUSPENDED` → `ACTIVE` (Reactivated)

---

## B2B vs GSA Contract Differences

### B2B Contracts
- **Customer Type:** Private companies
- **Profile Source:** B2BProfile table
- **Key Fields:**
  - Company name
  - Tax ID
  - Credit limit
  - Payment terms
- **Pricing:** Negotiated discounts, volume commitments
- **Compliance:** Standard commercial terms

### GSA Contracts
- **Customer Type:** Government agencies
- **Profile Source:** GSAProfile table
- **Key Fields:**
  - Agency name
  - GSA number
  - Contract vehicle
  - Schedule number
- **Pricing:** GSA-approved pricing schedules
- **Compliance:** Federal procurement regulations

---

## Screenshots/Mockup Descriptions

### Main Contract List View
```
┌─────────────────────────────────────────────────────────────┐
│ Contract Management                                         │
│ Manage B2B and GSA contracts                                │
├─────────────────────────────────────────────────────────────┤
│ Contract#  Customer        Type   Value      Status         │
│────────────────────────────────────────────────────────────││
│ CT-001     Acme Corp       B2B    $50,000    ACTIVE         │
│ CT-002     DoD Agency      GSA    $125,000   ACTIVE         │
│ CT-003     Tech Solutions  B2B    $35,000    RENEWED        │
│ CT-004     NASA            GSA    $200,000   ACTIVE         │
│ CT-005     BuildCo         B2B    $15,000    EXPIRED        │
└─────────────────────────────────────────────────────────────┘
```

---

## Related APIs

### 1. GET /api/admin/contracts
**Purpose:** Fetch all contracts with customer information

**Query Parameters:**
- `status` - Filter by contract status
- `type` - Filter by B2B or GSA
- `customerId` - Filter by specific customer

**Response:**
```typescript
[
  {
    id: string,
    contractNumber: string,
    name: string,
    status: ContractStatus,
    startDate: DateTime,
    endDate: DateTime,
    value: Decimal,
    b2bProfile?: {
      companyName: string
    },
    gsaProfile?: {
      agencyName: string
    },
    autoRenew: boolean,
    discountPercent: Decimal
  }
]
```

### 2. POST /api/admin/contracts
**Purpose:** Create a new contract

**Request Body:**
```typescript
{
  userId: string,
  name: string,
  description?: string,
  startDate: DateTime,
  endDate: DateTime,
  value: Decimal,
  discountPercent?: Decimal,
  minimumSpend?: Decimal,
  volumeCommitment?: Int,
  autoRenew?: boolean,
  renewalPeriod?: Int,
  paymentTerms?: Int,
  items?: [
    {
      productId: string,
      contractPrice: Decimal,
      minimumQuantity?: Int,
      maximumQuantity?: Int
    }
  ]
}
```

### 3. PATCH /api/admin/contracts/[id]
**Purpose:** Update contract details or status

**Request Body:**
```typescript
{
  status?: ContractStatus,
  endDate?: DateTime,
  autoRenew?: boolean,
  notes?: string,
  approvedBy?: string,
  approvedAt?: DateTime
}
```

### 4. POST /api/admin/contracts/[id]/renew
**Purpose:** Renew an expiring or expired contract

**Request Body:**
```typescript
{
  newEndDate: DateTime,
  newValue?: Decimal,
  updatePricing?: boolean
}
```

---

## Code Snippets from Implementation

### Simple Contract Listing Component
```typescript
export default async function ContractsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/signin');

  const contracts = await db.contract.findMany({
    include: {
      b2bProfile: { select: { companyName: true } },
      gsaProfile: { select: { agencyName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contract Management</h1>
        <p className="text-gray-600">Manage B2B and GSA contracts</p>
      </div>
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          {/* Table implementation */}
        </table>
      </div>
    </div>
  );
}
```

### Contract Type Detection
```typescript
// Check which profile is associated
const contractType = c.b2bProfileId ? 'B2B' : 'GSA';

// Get appropriate customer name
const customerName = c.b2bProfile?.companyName || c.gsaProfile?.agencyName;
```

### Contract Number Generation
```typescript
const lastContract = await prisma.contract.findFirst({
  orderBy: { createdAt: 'desc' },
});

const nextNumber = lastContract
  ? parseInt(lastContract.contractNumber.replace('CT-', '')) + 1
  : 1;

const contractNumber = `CT-${String(nextNumber).padStart(6, '0')}`;
// Results in: CT-000001, CT-000002, etc.
```

---

## Key Technical Details

### Performance Optimizations
- Single query with includes for customer data
- Indexed fields: contractNumber, status, userId
- Selective field projection for customer names
- Server-side rendering for fast initial load

### Data Integrity
- Unique contract numbers
- Foreign key relationships to profiles
- Decimal precision for currency (12,2)
- Cascading deletes for contract items
- Date validation (endDate > startDate)

### Security Measures
- Session-based authentication
- Server-side rendering (no client-side data exposure)
- Role-based access control (needs enhancement)

---

## Future Enhancements

1. **Enhanced UI Features**
   - Status badges with color coding
   - Sortable columns
   - Pagination for large contract lists
   - Search and filter functionality
   - Action buttons (View, Edit, Renew)

2. **Contract Statistics Dashboard**
   - Total active contracts
   - Total contract value
   - Expiring soon (30/60/90 days)
   - Revenue by contract type

3. **Renewal Management**
   - Automated renewal notifications
   - Renewal approval workflow
   - Contract comparison (old vs new terms)
   - Bulk renewal processing

4. **Document Management**
   - Upload signed contracts
   - Version control for contract documents
   - Digital signature integration
   - PDF generation from contract data

5. **Compliance Tracking**
   - GSA schedule compliance
   - Contract audit trail
   - Review cycle management
   - Compliance alerts

6. **Advanced Features**
   - Contract templates
   - Multi-year contracts
   - Tiered pricing structures
   - Volume-based discounts
   - Product-specific pricing
   - Contract amendments tracking

7. **Reporting**
   - Contract performance reports
   - Revenue by contract
   - Contract utilization (actual vs commitment)
   - Expiration forecasting

8. **Notifications**
   - Contract expiration alerts
   - Renewal reminders
   - Volume commitment tracking
   - Payment term reminders

9. **Integration**
   - Link contracts to quotes
   - Apply contract pricing to orders
   - Automatically enforce minimums/maximums
   - Track contract utilization

---

## Related Pages

- `/admin/contracts/[id]` - Contract detail view
- `/admin/contracts/new` - Create new contract
- `/admin/contracts/[id]/edit` - Edit contract
- `/admin/customers` - Customer management
- `/admin/quotes` - Quote management (contracts from quotes)
- `/admin/orders` - View orders under contracts
