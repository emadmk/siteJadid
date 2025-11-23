# Admin Purchase Order Management Page

## Overview

The Purchase Order Management page (`/admin/purchase-orders`) is an administrative interface for managing purchase orders from suppliers. This page enables administrators to track inventory procurement, manage supplier relationships, monitor order receiving, and maintain stock replenishment workflows.

**File Location:** `/home/user/siteJadid/src/app/admin/purchase-orders/page.tsx`

**Route:** `/admin/purchase-orders`

---

## User Access Requirements

### Authorized Roles
- `SUPER_ADMIN`
- `ADMIN`
- `WAREHOUSE_MANAGER`
- `ACCOUNTANT`

### Authentication Check
```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.id) redirect('/auth/signin');
```

**Note:** Current implementation requires authentication but should add role-based authorization for production use.

---

## Features List

### Core Features
1. **Purchase Order Listing**
   - Display all purchase orders
   - PO number tracking
   - Supplier identification
   - Order totals
   - Status tracking

2. **Supplier Management**
   - Link POs to suppliers
   - Display supplier names
   - Track supplier performance

3. **Order Status Tracking**
   - DRAFT - Being created
   - PENDING - Awaiting approval
   - APPROVED - Approved, sent to supplier
   - ORDERED - Confirmed with supplier
   - RECEIVING - Partially received
   - RECEIVED - Fully received
   - CANCELLED - Order cancelled

4. **Financial Tracking**
   - Subtotal calculation
   - Tax tracking
   - Shipping costs
   - Total amount
   - Payment terms
   - Payment status

5. **Receiving Management**
   - Track received quantities
   - Partial receiving support
   - Receipt documentation
   - Quality control notes

---

## Database Queries Used

### Get All Purchase Orders with Supplier Data
```typescript
const pos = await db.purchaseOrder.findMany({
  include: { supplier: { select: { name: true } } },
  orderBy: { createdAt: 'desc' },
});
```

### Database Schema (PurchaseOrder Model)
```prisma
model PurchaseOrder {
  id              String    @id @default(cuid())
  poNumber        String    @unique
  supplierId      String

  status          POStatus  @default(DRAFT)

  // Amounts
  subtotal        Decimal   @db.Decimal(12, 2)
  tax             Decimal   @default(0) @db.Decimal(12, 2)
  shipping        Decimal   @default(0) @db.Decimal(12, 2)
  total           Decimal   @db.Decimal(12, 2)

  // Dates
  orderDate       DateTime  @default(now())
  expectedDelivery DateTime?
  receivedDate    DateTime?

  // Delivery
  warehouseId     String?

  // Payment
  paymentTerms    Int       @default(30)
  paidAt          DateTime?

  // Notes
  notes           String?

  // Audit
  createdBy       String
  approvedBy      String?
  approvedAt      DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  supplier        Supplier  @relation(fields: [supplierId], references: [id])
  warehouse       Warehouse? @relation(fields: [warehouseId], references: [id])
  items           PurchaseOrderItem[]
  receipts        POReceipt[]
}

model PurchaseOrderItem {
  id              String        @id @default(cuid())
  purchaseOrderId String
  productId       String

  sku             String
  description     String?
  quantity        Int
  receivedQuantity Int          @default(0)
  unitCost        Decimal       @db.Decimal(12, 2)
  total           Decimal       @db.Decimal(12, 2)

  notes           String?

  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  product         Product       @relation(fields: [productId], references: [id])
}

model POReceipt {
  id              String        @id @default(cuid())
  purchaseOrderId String

  receiptNumber   String        @unique
  status          ReceiptStatus @default(PENDING)

  receivedDate    DateTime      @default(now())
  receivedBy      String

  notes           String?
  images          String[]      // Photos of shipment

  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  items           POReceiptItem[]
}

enum POStatus {
  DRAFT
  PENDING
  APPROVED
  ORDERED
  RECEIVING
  RECEIVED
  CANCELLED
}

enum ReceiptStatus {
  PENDING
  PARTIAL
  COMPLETE
  DAMAGED
  REJECTED
}
```

---

## UI Components Breakdown

### 1. Page Header
```typescript
<div className="p-8">
  <h1 className="text-3xl font-bold mb-6">Purchase Orders</h1>
</div>
```

### 2. Purchase Orders Table
```typescript
<div className="bg-white rounded-lg border">
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          PO #
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Supplier
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Total
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Status
        </th>
      </tr>
    </thead>
    <tbody>
      {pos.map((po: any) => (
        <tr key={po.id}>
          <td className="px-6 py-4">{po.poNumber}</td>
          <td className="px-6 py-4">{po.supplier.name}</td>
          <td className="px-6 py-4">${Number(po.total).toFixed(2)}</td>
          <td className="px-6 py-4">{po.status}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Icons Used:**
- `FileText` - Purchase orders icon
- `Package` - Items/products icon

---

## User Flows

### Flow 1: View All Purchase Orders
```
1. Admin navigates to /admin/purchase-orders
2. System authenticates user
3. System fetches all POs with supplier names
4. Table displays:
   - PO numbers
   - Supplier names
   - Total amounts
   - Current status
5. Admin reviews procurement pipeline
```

### Flow 2: Create New Purchase Order
```
1. Admin clicks "New PO" button
2. Admin selects supplier
3. Admin adds products/items:
   - Select product
   - Enter quantity
   - Enter unit cost
   - Add notes
4. System calculates subtotal, tax, shipping
5. Admin specifies:
   - Expected delivery date
   - Destination warehouse
   - Payment terms
6. Admin saves as DRAFT or submits for approval
7. System generates unique PO number
```

### Flow 3: Approve Purchase Order
```
1. Admin views PENDING purchase order
2. Admin reviews:
   - Items and quantities
   - Supplier information
   - Pricing
   - Delivery terms
3. Admin clicks "Approve"
4. Status changes to APPROVED
5. System records approver and approval date
6. PO can now be sent to supplier
```

### Flow 4: Receive Inventory
```
1. Shipment arrives at warehouse
2. Warehouse staff opens PO
3. Staff creates receipt:
   - Scan/enter PO number
   - Verify items received
   - Enter received quantities
   - Note any damages/discrepancies
   - Upload photos if needed
4. System updates:
   - PO item received quantities
   - Warehouse stock levels
   - PO status (RECEIVING or RECEIVED)
5. If partial receipt:
   - Status = RECEIVING
   - Track pending quantities
6. If complete receipt:
   - Status = RECEIVED
   - Close PO
```

### Flow 5: Track Payment
```
1. Admin views RECEIVED purchase order
2. System displays payment information:
   - Total amount due
   - Payment terms (Net 30, etc.)
   - Due date calculated from receipt
3. When payment processed:
   - Admin marks as paid
   - System records payment date
4. PO marked as complete
```

---

## Purchase Order Lifecycle

```
┌─────────┐
│  DRAFT  │ (Being created)
└────┬────┘
     │
     v
┌──────────┐
│ PENDING  │ (Awaiting approval)
└────┬─────┘
     │
     v
┌──────────┐
│APPROVED  │ (Approved, ready to send)
└────┬─────┘
     │
     v
┌──────────┐
│ ORDERED  │ (Sent to supplier, confirmed)
└────┬─────┘
     │
     ├──────────────┐
     v              v
┌──────────┐    ┌──────────┐
│RECEIVING │    │CANCELLED │
└────┬─────┘    └──────────┘
     │
     v
┌──────────┐
│RECEIVED  │ (Fully received)
└──────────┘
```

---

## Screenshots/Mockup Descriptions

### Main Purchase Orders View
```
┌─────────────────────────────────────────────────────────────┐
│ Purchase Orders                                    [+ New PO]│
├─────────────────────────────────────────────────────────────┤
│ PO #      Supplier         Total       Status               │
│────────────────────────────────────────────────────────────││
│ PO-001    ABC Wholesale    $5,234.50   ORDERED              │
│ PO-002    XYZ Distributors $12,890.00  RECEIVING            │
│ PO-003    Parts Inc        $3,456.78   PENDING              │
│ PO-004    Supply Co        $8,912.34   RECEIVED             │
└─────────────────────────────────────────────────────────────┘
```

---

## Related APIs

### 1. GET /api/admin/purchase-orders
**Purpose:** Fetch all purchase orders

**Query Parameters:**
- `status` - Filter by PO status
- `supplierId` - Filter by supplier
- `warehouseId` - Filter by destination warehouse

**Response:**
```typescript
[
  {
    id: string,
    poNumber: string,
    supplier: {
      id: string,
      name: string
    },
    total: Decimal,
    status: POStatus,
    orderDate: DateTime,
    expectedDelivery?: DateTime,
    items: PurchaseOrderItem[]
  }
]
```

### 2. POST /api/admin/purchase-orders
**Purpose:** Create new purchase order

**Request Body:**
```typescript
{
  supplierId: string,
  warehouseId?: string,
  items: [
    {
      productId: string,
      quantity: number,
      unitCost: number
    }
  ],
  expectedDelivery?: DateTime,
  paymentTerms?: number,
  notes?: string
}
```

### 3. POST /api/admin/purchase-orders/[id]/receive
**Purpose:** Create receipt for PO

**Request Body:**
```typescript
{
  items: [
    {
      purchaseOrderItemId: string,
      receivedQuantity: number,
      notes?: string
    }
  ],
  receivedBy: string,
  images?: string[]
}
```

---

## Code Snippets from Implementation

### Simple PO Listing
```typescript
export default async function PurchaseOrdersPage() {
  const pos = await db.purchaseOrder.findMany({
    include: { supplier: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Purchase Orders</h1>
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th>PO #</th>
              <th>Supplier</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {pos.map((po: any) => (
              <tr key={po.id}>
                <td>{po.poNumber}</td>
                <td>{po.supplier.name}</td>
                <td>${Number(po.total).toFixed(2)}</td>
                <td>{po.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### PO Number Generation
```typescript
const lastPO = await prisma.purchaseOrder.findFirst({
  orderBy: { createdAt: 'desc' },
});

const nextNumber = lastPO
  ? parseInt(lastPO.poNumber.replace('PO-', '')) + 1
  : 1;

const poNumber = `PO-${String(nextNumber).padStart(6, '0')}`;
// Results in: PO-000001, PO-000002, etc.
```

---

## Future Enhancements

1. **Enhanced UI**
   - Status badges with colors
   - Action buttons (Approve, Receive, Cancel)
   - Statistics dashboard
   - Advanced filters and search

2. **Supplier Management**
   - Link to supplier details
   - Supplier performance metrics
   - Preferred supplier indicators
   - Lead time tracking

3. **Receiving Improvements**
   - Barcode scanning
   - Mobile receiving app
   - Quality inspection workflow
   - Damage documentation

4. **Financial Features**
   - Payment tracking
   - Invoice matching
   - Three-way matching (PO, Receipt, Invoice)
   - Accrual reporting

5. **Automation**
   - Automatic PO generation from low stock
   - Supplier email integration
   - Expected delivery notifications
   - Overdue PO alerts

6. **Reporting**
   - Spending by supplier
   - Open PO report
   - Receiving accuracy metrics
   - Inventory replenishment analysis
