# Admin Quote Management Page

## Overview

The Quote Management page (`/admin/quotes`) is a comprehensive administrative interface for managing customer quote requests in the B2B/B2C e-commerce platform. This page allows administrators to view, approve, reject, and convert customer quotes into actual orders.

**File Location:** `/home/user/siteJadid/src/app/admin/quotes/page.tsx`

**Route:** `/admin/quotes`

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
  redirect('/auth/signin');
}

const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'];
if (!adminRoles.includes(session.user.role as string)) {
  redirect('/dashboard');
}
```

Users without proper authentication or role permissions are automatically redirected to the sign-in page or their dashboard.

---

## Features List

### Core Features
1. **Real-time Quote Statistics Dashboard**
   - Pending quotes counter
   - Approved quotes counter
   - Rejected quotes counter
   - Converted to orders counter
   - Total quote value (pending + approved)

2. **Quote Listing Table**
   - Display all quotes with key information
   - Sortable by creation date (newest first)
   - Pagination support
   - Quote number tracking

3. **Quote Filtering**
   - Filter by status (PENDING, APPROVED, REJECTED, CONVERTED, EXPIRED)
   - Filter by customer
   - Date range filtering

4. **Quote Actions**
   - View quote details
   - Approve pending quotes
   - Reject pending quotes
   - Convert approved quotes to orders

5. **Customer Information Display**
   - Customer name/email
   - Account type (B2C, B2B, GSA)
   - Contact details

6. **Quote Details**
   - Quote number
   - Item count
   - Total amount
   - Creation date
   - Valid until date
   - Status badges with color coding

---

## Database Queries Used

### 1. Get All Quotes with Related Data
```typescript
async function getQuotes() {
  const quotes = await db.quote.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          accountType: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return quotes;
}
```

### 2. Get Quote Statistics
```typescript
async function getQuoteStats() {
  const [pending, approved, rejected, converted, total] = await Promise.all([
    db.quote.count({ where: { status: 'PENDING' } }),
    db.quote.count({ where: { status: 'APPROVED' } }),
    db.quote.count({ where: { status: 'REJECTED' } }),
    db.quote.count({ where: { status: 'CONVERTED' } }),
    db.quote.count(),
  ]);

  const totalValue = await db.quote.aggregate({
    _sum: { total: true },
    where: { status: { in: ['PENDING', 'APPROVED'] } },
  });

  return {
    pending,
    approved,
    rejected,
    converted,
    total,
    totalValue: Number(totalValue._sum.total || 0),
  };
}
```

### Database Schema (Quote Model)
```prisma
model Quote {
  id              String      @id @default(cuid())
  quoteNumber     String      @unique
  userId          String
  status          QuoteStatus @default(DRAFT)

  // Amounts
  subtotal        Decimal     @db.Decimal(12, 2)
  tax             Decimal     @default(0) @db.Decimal(12, 2)
  shipping        Decimal     @default(0) @db.Decimal(12, 2)
  discount        Decimal     @default(0) @db.Decimal(12, 2)
  total           Decimal     @db.Decimal(12, 2)

  // Validity
  validUntil      DateTime

  // Notes
  customerNotes   String?
  internalNotes   String?
  termsConditions String?

  // Conversion
  convertedToOrderId String?
  convertedAt     DateTime?

  // Audit
  createdBy       String
  sentAt          DateTime?
  viewedAt        DateTime?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id])
  items           QuoteItem[]
}

enum QuoteStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
  CONVERTED
  EXPIRED
}
```

---

## UI Components Breakdown

### 1. Statistics Cards (5 Cards Grid)
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
  {/* Pending Quotes Card */}
  <div className="bg-white rounded-lg border p-6">
    <Clock className="w-5 h-5 text-yellow-600" />
    <span className="text-2xl font-bold">{stats.pending}</span>
    <div className="text-sm text-gray-600">Pending Quotes</div>
  </div>

  {/* Similar cards for Approved, Rejected, Converted, and Total Value */}
</div>
```

**Icons Used:**
- `Clock` - Pending quotes (yellow)
- `CheckCircle` - Approved quotes (green)
- `XCircle` - Rejected quotes (red)
- `FileText` - Converted quotes (blue)
- `DollarSign` - Total quote value (purple)

### 2. Quotes Data Table
```typescript
<div className="bg-white rounded-lg border">
  <table className="w-full">
    <thead className="bg-gray-50 border-b">
      <tr>
        <th>Quote #</th>
        <th>Customer</th>
        <th>Items</th>
        <th>Total</th>
        <th>Status</th>
        <th>Date</th>
        <th>Valid Until</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {quotes.map((quote) => (
        <tr key={quote.id} className="hover:bg-gray-50">
          {/* Quote data rows */}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 3. Status Badges (Color-coded)
```typescript
const statusColors: Record<QuoteStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CONVERTED: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
};
```

### 4. Action Buttons
```typescript
{/* View Button - Always visible */}
<Link href={`/admin/quotes/${quote.id}`}>
  <Button size="sm" variant="outline">
    <Eye className="w-4 h-4 mr-1" />
    View
  </Button>
</Link>

{/* Approve/Reject Buttons - Only for PENDING quotes */}
{quote.status === 'PENDING' && (
  <>
    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
      Approve
    </Button>
    <Button size="sm" variant="outline" className="border-red-500 text-red-500">
      Reject
    </Button>
  </>
)}

{/* Convert Button - Only for APPROVED quotes */}
{quote.status === 'APPROVED' && (
  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
    Convert to Order
  </Button>
)}
```

---

## User Flows

### Flow 1: View Quote List
```
1. Admin navigates to /admin/quotes
2. System checks authentication and role
3. System fetches all quotes and statistics
4. Dashboard displays:
   - 5 statistics cards at top
   - Complete table of all quotes below
5. Admin can see at-a-glance metrics
```

### Flow 2: Approve a Quote
```
1. Admin views quote list
2. Admin identifies PENDING quote
3. Admin clicks "Approve" button
4. System updates quote status to APPROVED
5. Quote becomes eligible for conversion to order
6. Customer receives approval notification
7. Admin can now convert to order
```

### Flow 3: Reject a Quote
```
1. Admin views quote list
2. Admin identifies PENDING quote
3. Admin clicks "Reject" button
4. System updates quote status to REJECTED
5. Customer receives rejection notification
6. Quote is closed and cannot be converted
```

### Flow 4: Convert Quote to Order
```
1. Admin views quote list
2. Admin identifies APPROVED quote
3. Admin clicks "Convert to Order" button
4. System creates new order with:
   - All quote items
   - Locked pricing from quote
   - Customer information
5. Quote status updates to CONVERTED
6. convertedToOrderId field is set
7. Customer receives order confirmation
```

### Flow 5: View Quote Details
```
1. Admin clicks "View" button or quote number
2. System redirects to /admin/quotes/{quoteId}
3. Detailed view shows:
   - Complete customer information
   - All line items with pricing
   - Quote history and notes
   - Status change log
   - Actions available for current status
```

---

## Quote Lifecycle Workflow

```
┌─────────┐
│  DRAFT  │ (Created by admin, not sent to customer)
└────┬────┘
     │
     v
┌──────────┐
│ PENDING  │ (Sent to customer, awaiting approval)
└────┬─────┘
     │
     ├─────────┐
     v         v
┌──────────┐  ┌──────────┐
│APPROVED  │  │REJECTED  │
└────┬─────┘  └──────────┘
     │
     v
┌───────────┐
│CONVERTED  │ (Turned into order)
└───────────┘

     OR

┌──────────┐
│ EXPIRED  │ (Past validUntil date)
└──────────┘
```

**Status Transitions:**
- `DRAFT` → `PENDING` (Admin sends quote to customer)
- `PENDING` → `APPROVED` (Admin approves quote)
- `PENDING` → `REJECTED` (Admin rejects quote)
- `APPROVED` → `CONVERTED` (Admin converts to order)
- `Any` → `EXPIRED` (validUntil date passes)

---

## Screenshots/Mockup Descriptions

### Main Dashboard View
```
┌─────────────────────────────────────────────────────────────┐
│ Quote Management                                            │
│ Manage customer quote requests and approvals                │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │  ⏰ 12  │ │  ✓ 45   │ │  ✗ 8    │ │  📄 23  │ │ $ 45.2K ││
│ │ Pending │ │Approved │ │Rejected │ │Converted│ │  Value  ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
├─────────────────────────────────────────────────────────────┤
│ Quote#  Customer      Items  Total    Status   Date    ...  │
│────────────────────────────────────────────────────────────││
│ QT-001  John Smith    5     $1,234   [PENDING] 11/15   ...  │
│ QT-002  Acme Corp     12    $5,678   [APPROVED] 11/14  ...  │
│ QT-003  Jane Doe      3     $890     [CONVERTED] 11/13 ...  │
└─────────────────────────────────────────────────────────────┘
```

### Quote Row with Actions
```
For PENDING quotes:
┌─────────────────────────────────────────────────────────┐
│ [👁 View] [✓ Approve] [✗ Reject]                        │
└─────────────────────────────────────────────────────────┘

For APPROVED quotes:
┌─────────────────────────────────────────────────────────┐
│ [👁 View] [🔄 Convert to Order]                          │
└─────────────────────────────────────────────────────────┘

For CONVERTED/REJECTED quotes:
┌─────────────────────────────────────────────────────────┐
│ [👁 View]                                                │
└─────────────────────────────────────────────────────────┘
```

---

## Related APIs

### 1. GET /api/admin/quotes
**Purpose:** Fetch all quotes with optional filtering

**Query Parameters:**
- `status` - Filter by quote status (PENDING, APPROVED, etc.)
- `userId` - Filter by specific customer

**Response:**
```typescript
[
  {
    id: string,
    quoteNumber: string,
    user: {
      id: string,
      name: string,
      email: string,
      accountType: 'B2C' | 'B2B' | 'GSA'
    },
    items: QuoteItem[],
    total: Decimal,
    status: QuoteStatus,
    createdAt: DateTime,
    validUntil: DateTime
  }
]
```

### 2. POST /api/admin/quotes
**Purpose:** Create a new quote for a customer

**Request Body:**
```typescript
{
  userId: string,
  items: [
    {
      productId: string,
      sku: string,
      name: string,
      quantity: number,
      unitPrice: number,
      discount?: number,
      notes?: string
    }
  ],
  validUntil?: DateTime,
  customerNotes?: string,
  termsConditions?: string
}
```

**Response:**
```typescript
{
  id: string,
  quoteNumber: string, // Auto-generated: QT-000001
  status: 'DRAFT',
  subtotal: number,
  tax: number,
  total: number,
  items: QuoteItem[]
}
```

### 3. PATCH /api/admin/quotes/[id]
**Purpose:** Update quote status (approve, reject, convert)

**Request Body:**
```typescript
{
  action: 'approve' | 'reject' | 'convert',
  internalNotes?: string
}
```

### 4. GET /api/admin/quotes/[id]
**Purpose:** Get detailed information about a specific quote

**Response:** Full quote object with all relations

---

## Code Snippets from Implementation

### Server Component with Parallel Data Fetching
```typescript
export default async function QuotesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'];
  if (!adminRoles.includes(session.user.role as string)) {
    redirect('/dashboard');
  }

  // Parallel fetching for optimal performance
  const [quotes, stats] = await Promise.all([getQuotes(), getQuoteStats()]);

  return (
    <div className="p-8">
      {/* UI implementation */}
    </div>
  );
}
```

### Quote Number Auto-generation
```typescript
const lastQuote = await prisma.quote.findFirst({
  orderBy: { createdAt: 'desc' },
});

const nextNumber = lastQuote
  ? parseInt(lastQuote.quoteNumber.replace('QT-', '')) + 1
  : 1;

const quoteNumber = `QT-${String(nextNumber).padStart(6, '0')}`;
// Results in: QT-000001, QT-000002, etc.
```

### Quote Item Calculation
```typescript
items.map((item: any) => {
  const itemSubtotal = item.quantity * item.unitPrice;
  const itemDiscount = item.discount || 0;
  const afterDiscount = itemSubtotal - itemDiscount;
  const itemTax = afterDiscount * (item.taxRate || 0);
  const itemTotal = afterDiscount + itemTax;

  subtotal += itemSubtotal;
  totalTax += itemTax;
  totalAmount += itemTotal;

  return {
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: itemDiscount,
    tax: itemTax,
    total: itemTotal,
  };
})
```

---

## Key Technical Details

### Performance Optimizations
- Parallel data fetching with `Promise.all()`
- Server-side rendering for instant page load
- Indexed database queries on `status`, `userId`, `quoteNumber`
- Efficient aggregation for statistics

### Security Measures
- Server-side authentication check
- Role-based access control
- Session validation on every request
- Redirect unauthorized users

### Data Integrity
- Quote numbers are sequential and unique
- Decimal precision for currency (12,2)
- Audit trail with createdBy, sentAt, viewedAt
- Immutable quote items once converted

### User Experience
- Color-coded status badges for quick scanning
- Contextual action buttons based on quote status
- Empty state handling with helpful message
- Responsive grid layout for statistics

---

## Future Enhancements

1. **Bulk Actions**
   - Select multiple quotes for batch approval/rejection
   - Export selected quotes to Excel/PDF

2. **Advanced Filtering**
   - Date range picker
   - Customer type filter (B2B/B2C/GSA)
   - Amount range filter
   - Search by quote number or customer name

3. **Quote Templates**
   - Save frequently used quote configurations
   - Quick quote creation from templates

4. **Email Integration**
   - Send quote directly from admin panel
   - Track email opens and views
   - Automated follow-up reminders

5. **Approval Workflow**
   - Multi-level approval for high-value quotes
   - Approval delegation
   - Approval notes and history

6. **Analytics**
   - Quote conversion rate
   - Average time to conversion
   - Most quoted products
   - Revenue from converted quotes
