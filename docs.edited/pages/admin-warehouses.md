# Admin Warehouse Management Page

## Overview

The Warehouse Management page (`/admin/warehouses`) is a comprehensive administrative interface for managing multi-warehouse inventory operations. This page enables administrators to oversee multiple warehouse locations, track stock levels across facilities, manage warehouse transfers, monitor low stock alerts, and optimize inventory distribution.

**File Location:** `/home/user/siteJadid/src/app/admin/warehouses/page.tsx`

**Route:** `/admin/warehouses`

---

## User Access Requirements

### Authorized Roles
- `SUPER_ADMIN`
- `ADMIN`
- `WAREHOUSE_MANAGER`

### Authentication Check
```typescript
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
  redirect('/auth/signin?callbackUrl=/admin/warehouses');
}

const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'];
if (!adminRoles.includes(session.user.role)) {
  redirect('/admin');
}
```

Users without proper authentication or role permissions are automatically redirected.

---

## Features List

### Core Features

1. **Multi-Warehouse Dashboard**
   - View all warehouse locations
   - Real-time inventory statistics
   - Warehouse status (Active/Inactive)
   - Total stock across all locations

2. **Warehouse Information Display**
   - Warehouse name and code
   - Physical address and location
   - Contact information
   - Manager details
   - Active/Inactive status
   - Priority settings

3. **Inventory Statistics**
   - Total warehouses count
   - Total stock units across all warehouses
   - Total inventory value
   - Low stock items count

4. **Stock Level Tracking**
   - Products per warehouse
   - Total units per warehouse
   - Inventory value per warehouse
   - Available vs reserved quantities
   - Reorder points

5. **Warehouse Transfers**
   - Pending transfer list
   - Transfer tracking between warehouses
   - Transfer status monitoring
   - Transfer approval workflow

6. **Low Stock Alerts**
   - Real-time low stock notifications
   - Product-specific alerts per warehouse
   - Threshold-based warnings
   - Current quantity display

7. **Warehouse Actions**
   - Add new warehouse
   - View warehouse details
   - Edit warehouse information
   - Deactivate warehouses

---

## Database Queries Used

### 1. Get All Warehouse Data
```typescript
async function getWarehouseData() {
  const [warehouses, transfers, lowStockProducts] = await Promise.all([
    // Get warehouses with stock information
    db.warehouse.findMany({
      include: {
        stock: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        _count: {
          select: {
            stock: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),

    // Get pending transfers
    db.warehouseTransfer.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
      },
      take: 5,
      orderBy: {
        requestedDate: 'desc',
      },
    }),

    // Get low stock products
    db.warehouseStock.findMany({
      where: {
        quantity: {
          lte: 10,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            lowStockThreshold: true,
          },
        },
        warehouse: true,
      },
      orderBy: {
        quantity: 'asc',
      },
      take: 10,
    }),
  ]);

  // Calculate aggregate statistics
  const totalStock = warehouses.reduce((sum, warehouse) => {
    return sum + warehouse.stock.reduce((s, stock) => s + stock.quantity, 0);
  }, 0);

  const totalValue = warehouses.reduce((sum, warehouse) => {
    return (
      sum +
      warehouse.stock.reduce((s, stock) => {
        return s + stock.quantity * Number(stock.averageCost || 0);
      }, 0)
    );
  }, 0);

  return { warehouses, transfers, lowStockProducts, totalStock, totalValue };
}
```

### Database Schema (Warehouse Models)
```prisma
model Warehouse {
  id              String   @id @default(cuid())
  code            String   @unique
  name            String

  // Address
  address         String
  city            String
  state           String
  zipCode         String
  country         String   @default("USA")

  // Contact
  phone           String?
  email           String?
  managerName     String?

  // Settings
  isActive        Boolean  @default(true)
  isPrimary       Boolean  @default(false)
  priority        Int      @default(0)

  // Coordinates for distance calculation
  latitude        Decimal? @db.Decimal(10, 8)
  longitude       Decimal? @db.Decimal(11, 8)

  notes           String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  stock           WarehouseStock[]
  transfers       WarehouseTransfer[] @relation("SourceWarehouse")
  receivedTransfers WarehouseTransfer[] @relation("DestinationWarehouse")
  purchaseOrders  PurchaseOrder[]
}

model WarehouseStock {
  id              String   @id @default(cuid())
  warehouseId     String
  productId       String

  quantity        Int      @default(0)
  reserved        Int      @default(0)
  available       Int      @default(0)

  // Reorder Settings
  reorderPoint    Int      @default(10)
  reorderQuantity Int      @default(50)

  // Locations within warehouse
  aisle           String?
  rack            String?
  shelf           String?
  bin             String?

  lastRestocked   DateTime?
  lastCounted     DateTime?

  averageCost     Decimal? @db.Decimal(12, 2)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  warehouse       Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  product         Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([warehouseId, productId])
}

model WarehouseTransfer {
  id                    String         @id @default(cuid())
  transferNumber        String         @unique

  sourceWarehouseId     String
  destinationWarehouseId String
  productId             String

  quantity              Int
  status                TransferStatus @default(PENDING)

  // Shipping
  shippedAt             DateTime?
  receivedAt            DateTime?
  estimatedArrival      DateTime?

  // Tracking
  trackingNumber        String?
  carrier               String?

  // Audit
  requestedBy           String
  requestedDate         DateTime       @default(now())
  approvedBy            String?
  notes                 String?

  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt

  sourceWarehouse       Warehouse      @relation("SourceWarehouse", fields: [sourceWarehouseId], references: [id])
  destinationWarehouse  Warehouse      @relation("DestinationWarehouse", fields: [destinationWarehouseId], references: [id])
  product               Product        @relation(fields: [productId], references: [id])
}

enum TransferStatus {
  PENDING
  IN_TRANSIT
  COMPLETED
  CANCELLED
}
```

---

## UI Components Breakdown

### 1. Page Header with Action Button
```typescript
<div className="flex items-center justify-between mb-8">
  <div>
    <h1 className="text-3xl font-bold text-black mb-2">Warehouse Management</h1>
    <p className="text-gray-600">Manage inventory across multiple locations</p>
  </div>
  <Link href="/admin/warehouses/new">
    <Button className="gap-2 bg-primary hover:bg-primary/90">
      <Plus className="w-4 h-4" />
      Add Warehouse
    </Button>
  </Link>
</div>
```

### 2. Statistics Dashboard (4 Cards Grid)
```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
  {/* Total Warehouses */}
  <div className="bg-white rounded-lg border p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600 text-sm">Total Warehouses</span>
      <Warehouse className="w-5 h-5 text-blue-600" />
    </div>
    <div className="text-3xl font-bold text-black">{warehouses.length}</div>
  </div>

  {/* Total Stock Units */}
  <div className="bg-white rounded-lg border p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600 text-sm">Total Stock Units</span>
      <Package className="w-5 h-5 text-safety-green-600" />
    </div>
    <div className="text-3xl font-bold text-black">{totalStock.toLocaleString()}</div>
  </div>

  {/* Inventory Value */}
  <div className="bg-white rounded-lg border p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600 text-sm">Inventory Value</span>
      <TrendingUp className="w-5 h-5 text-purple-600" />
    </div>
    <div className="text-3xl font-bold text-black">${totalValue.toFixed(0)}</div>
  </div>

  {/* Low Stock Items */}
  <div className="bg-white rounded-lg border p-6">
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-600 text-sm">Low Stock Items</span>
      <AlertTriangle className="w-5 h-5 text-orange-600" />
    </div>
    <div className="text-3xl font-bold text-black">{lowStockProducts.length}</div>
  </div>
</div>
```

**Icons Used:**
- `Warehouse` - Total warehouses (blue)
- `Package` - Stock units (green)
- `TrendingUp` - Inventory value (purple)
- `AlertTriangle` - Low stock alerts (orange)
- `Plus` - Add warehouse button
- `MapPin` - Location indicator

### 3. Warehouse List with Details
```typescript
<div className="bg-white rounded-lg border">
  <div className="p-6 border-b">
    <h2 className="text-xl font-bold text-black">Warehouses</h2>
  </div>

  <div className="divide-y">
    {warehouses.map((warehouse) => {
      const totalUnits = warehouse.stock.reduce((sum, s) => sum + s.quantity, 0);
      const totalValue = warehouse.stock.reduce(
        (sum, s) => sum + s.quantity * Number(s.averageCost || 0),
        0
      );

      return (
        <div key={warehouse.id} className="p-6 hover:bg-gray-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Link
                href={`/admin/warehouses/${warehouse.id}`}
                className="text-lg font-semibold text-black hover:text-safety-green-700 mb-1"
              >
                {warehouse.name}
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <MapPin className="w-4 h-4" />
                {warehouse.address}, {warehouse.city}, {warehouse.state} {warehouse.zipCode}
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                warehouse.isActive
                  ? 'bg-safety-green-100 text-safety-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {warehouse.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Products</div>
              <div className="text-lg font-semibold text-black">{warehouse._count.stock}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Units</div>
              <div className="text-lg font-semibold text-black">{totalUnits.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Value</div>
              <div className="text-lg font-semibold text-black">${totalValue.toFixed(0)}</div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
</div>
```

### 4. Sidebar Widgets

#### Pending Transfers Widget
```typescript
<div className="bg-white rounded-lg border">
  <div className="p-6 border-b">
    <h3 className="font-bold text-black">Pending Transfers</h3>
  </div>
  <div className="divide-y max-h-96 overflow-y-auto">
    {transfers.map((transfer) => (
      <div key={transfer.id} className="p-4">
        <div className="text-sm font-medium text-black mb-1">
          {transfer.fromWarehouse.name} → {transfer.toWarehouse.name}
        </div>
        <div className="text-xs text-gray-600">
          {new Date(transfer.requestedDate).toLocaleDateString()}
        </div>
        <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
          Pending
        </span>
      </div>
    ))}
  </div>
</div>
```

#### Low Stock Alerts Widget
```typescript
<div className="bg-white rounded-lg border">
  <div className="p-6 border-b">
    <h3 className="font-bold text-black">Low Stock Alerts</h3>
  </div>
  <div className="divide-y max-h-96 overflow-y-auto">
    {lowStockProducts.map((stock) => (
      <div key={stock.id} className="p-4">
        <div className="text-sm font-medium text-black mb-1">{stock.product.name}</div>
        <div className="text-xs text-gray-600 mb-2">
          {stock.warehouse.name} • SKU: {stock.product.sku}
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded font-medium">
            {stock.quantity} units
          </span>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## User Flows

### Flow 1: View Warehouse Dashboard
```
1. Admin navigates to /admin/warehouses
2. System checks authentication and role
3. System fetches warehouse data in parallel:
   - All warehouses with stock
   - Pending transfers
   - Low stock alerts
4. Dashboard displays:
   - 4 statistics cards
   - Warehouse list with details
   - Pending transfers sidebar
   - Low stock alerts sidebar
5. Admin gets complete overview
```

### Flow 2: Add New Warehouse
```
1. Admin clicks "Add Warehouse" button
2. System redirects to /admin/warehouses/new
3. Admin enters warehouse information:
   - Name and code
   - Full address
   - Contact details
   - Manager name
   - Priority level
   - Geographic coordinates (optional)
4. Admin saves warehouse
5. System creates warehouse record
6. Warehouse appears in list
```

### Flow 3: Manage Warehouse Transfers
```
1. Admin views pending transfers sidebar
2. Transfer shows:
   - Source warehouse → Destination warehouse
   - Request date
   - Pending status
3. Admin clicks transfer for details
4. Admin can:
   - Approve transfer
   - Mark as in transit
   - Mark as completed
   - Cancel transfer
5. Stock levels update automatically upon completion
```

### Flow 4: Monitor Low Stock
```
1. Low stock alerts sidebar shows critical items
2. Each alert displays:
   - Product name
   - Warehouse location
   - SKU
   - Current quantity (highlighted in orange)
3. Admin identifies products needing reorder
4. Admin can:
   - Create purchase order
   - Initiate warehouse transfer
   - Adjust reorder points
```

### Flow 5: View Warehouse Details
```
1. Admin clicks warehouse name
2. System redirects to /admin/warehouses/{id}
3. Detail view shows:
   - Complete warehouse information
   - All products in stock
   - Stock quantities and locations
   - Recent transfers
   - Receiving history
   - Manager and contact info
4. Admin can edit warehouse or manage stock
```

---

## Warehouse Stock Management Features

### Stock Tracking Fields
- **Quantity:** Total physical units in warehouse
- **Reserved:** Units allocated to pending orders
- **Available:** Quantity minus reserved (available for sale)
- **Reorder Point:** Threshold that triggers reorder alert
- **Reorder Quantity:** Suggested quantity to reorder

### Warehouse Locations
Products can be tracked to specific locations within warehouse:
- **Aisle:** Warehouse aisle number/letter
- **Rack:** Rack or shelf unit
- **Shelf:** Specific shelf level
- **Bin:** Bin or box location

Example: `A5-R12-S3-B7` (Aisle A5, Rack 12, Shelf 3, Bin 7)

---

## Screenshots/Mockup Descriptions

### Main Dashboard View
```
┌──────────────────────────────────────────────────────────────────┐
│ Warehouse Management              [+ Add Warehouse]              │
│ Manage inventory across multiple locations                      │
├──────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ 🏬 5     │ │ 📦 12.5K │ │ 📈 $1.2M │ │ ⚠️ 15    │            │
│ │Warehouses│ │Stock Units│ │  Value   │ │Low Stock │            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
├──────────────────────────────────────────┬───────────────────────┤
│ Warehouses                               │ Pending Transfers     │
│──────────────────────────────────────────│───────────────────────│
│ 📍 Main Warehouse                [Active]│ WH1 → WH2             │
│    123 Main St, City, ST 12345           │ 11/20 [Pending]       │
│    Products: 450 | Units: 8,234          │                       │
│    Value: $523,456                       │ WH3 → WH1             │
│                                          │ 11/19 [Pending]       │
│ 📍 East Distribution Center     [Active]│───────────────────────│
│    456 East Ave, City, ST 12346          │ Low Stock Alerts      │
│    Products: 320 | Units: 4,123          │───────────────────────│
│    Value: $234,567                       │ Widget X              │
│                                          │ Main WH • SKU: WX001  │
│                                          │ [8 units]             │
└──────────────────────────────────────────┴───────────────────────┘
```

---

## Related APIs

### 1. GET /api/admin/warehouses
**Purpose:** Fetch all warehouses with stock data

**Response:**
```typescript
[
  {
    id: string,
    code: string,
    name: string,
    address: string,
    city: string,
    state: string,
    zipCode: string,
    isActive: boolean,
    stock: WarehouseStock[],
    _count: {
      stock: number
    }
  }
]
```

### 2. POST /api/admin/warehouses
**Purpose:** Create new warehouse

**Request Body:**
```typescript
{
  code: string,
  name: string,
  address: string,
  city: string,
  state: string,
  zipCode: string,
  country?: string,
  phone?: string,
  email?: string,
  managerName?: string,
  isActive?: boolean,
  isPrimary?: boolean,
  priority?: number,
  latitude?: Decimal,
  longitude?: Decimal
}
```

### 3. POST /api/admin/warehouses/transfers
**Purpose:** Create stock transfer between warehouses

**Request Body:**
```typescript
{
  sourceWarehouseId: string,
  destinationWarehouseId: string,
  productId: string,
  quantity: number,
  notes?: string,
  estimatedArrival?: DateTime
}
```

### 4. GET /api/admin/warehouses/low-stock
**Purpose:** Get low stock alerts across all warehouses

**Response:**
```typescript
[
  {
    warehouseId: string,
    warehouseName: string,
    productId: string,
    productName: string,
    sku: string,
    quantity: number,
    reorderPoint: number
  }
]
```

---

## Code Snippets from Implementation

### Parallel Data Fetching for Performance
```typescript
async function getWarehouseData() {
  const [warehouses, transfers, lowStockProducts] = await Promise.all([
    db.warehouse.findMany({
      include: {
        stock: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
        _count: { select: { stock: true } },
      },
      orderBy: { name: 'asc' },
    }),
    db.warehouseTransfer.findMany({
      where: { status: 'PENDING' },
      include: { fromWarehouse: true, toWarehouse: true },
      take: 5,
      orderBy: { requestedDate: 'desc' },
    }),
    db.warehouseStock.findMany({
      where: { quantity: { lte: 10 } },
      include: {
        product: {
          select: { id: true, name: true, sku: true, lowStockThreshold: true },
        },
        warehouse: true,
      },
      orderBy: { quantity: 'asc' },
      take: 10,
    }),
  ]);

  return { warehouses, transfers, lowStockProducts, totalStock, totalValue };
}
```

### Aggregate Statistics Calculation
```typescript
const totalStock = warehouses.reduce((sum, warehouse) => {
  return sum + warehouse.stock.reduce((s, stock) => s + stock.quantity, 0);
}, 0);

const totalValue = warehouses.reduce((sum, warehouse) => {
  return (
    sum +
    warehouse.stock.reduce((s, stock) => {
      return s + stock.quantity * Number(stock.averageCost || 0);
    }, 0)
  );
}, 0);
```

---

## Future Enhancements

1. **Interactive Map View**
   - Display warehouses on map using lat/long
   - Distance calculator between warehouses
   - Route optimization for transfers

2. **Advanced Analytics**
   - Stock turnover rates per warehouse
   - Warehouse utilization metrics
   - Transfer efficiency analysis
   - Cost per warehouse

3. **Inventory Optimization**
   - AI-powered stock allocation
   - Automatic transfer suggestions
   - Demand forecasting per location
   - Seasonal stock adjustments

4. **Barcode/RFID Integration**
   - Scan-based receiving
   - Real-time location tracking
   - Cycle counting support
   - Mobile warehouse management

5. **Enhanced Transfers**
   - Batch transfers
   - Transfer templates
   - Approval workflows
   - Cost tracking per transfer

6. **Reporting**
   - Warehouse performance dashboard
   - Stock aging reports
   - ABC analysis by warehouse
   - Dead stock identification
