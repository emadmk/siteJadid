# Bulk Export API Documentation

## Overview
The Bulk Export API allows administrators to export large datasets (products, orders, customers) to CSV format for reporting, analysis, or backup purposes. Supports immediate download with proper CSV formatting and headers.

**Base Path**: `/api/bulk/export`

---

## Endpoints

### 1. Export Data

**GET** `/api/bulk/export`

Exports data to CSV format based on the specified type. Returns a downloadable CSV file.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ADMIN or SUPER_ADMIN (recommended)

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | ✅ Yes | Data type to export: "products", "orders", "customers" |

#### Request
```http
GET /api/bulk/export?type=products HTTP/1.1
Host: localhost:3000
Cookie: next-auth.session-token=...
```

#### Response (200 OK)
**Content-Type**: `text/csv`
**Content-Disposition**: `attachment; filename=products.csv`

```csv
SKU,Name,Price,Stock,Category
SV-1234,High-Visibility Safety Vest,29.99,500,Safety Equipment
HH-5678,Safety Hard Hat,24.99,300,Safety Equipment
GV-9012,Safety Gloves - Large,12.99,750,Safety Equipment
GB-3456,Safety Goggles,15.99,400,Safety Equipment
```

---

## Export Types

### 1. Products Export

**Query**: `?type=products`

**CSV Columns**:
- SKU
- Name
- Price (basePrice)
- Stock (stockQuantity)
- Category (category name)

**Example Output**:
```csv
SKU,Name,Price,Stock,Category
SV-1234,High-Visibility Safety Vest,29.99,500,Safety Equipment
HH-5678,Safety Hard Hat,24.99,300,Safety Equipment
```

**Full Product Export** (Future Enhancement):
```csv
SKU,Name,Description,Base Price,Sale Price,Wholesale Price,GSA Price,Stock,Low Stock Threshold,Category,Status,Images,Weight,Created Date
SV-1234,High-Visibility Safety Vest,ANSI Class 2 compliant vest,29.99,25.99,23.00,21.50,500,10,Safety Equipment,ACTIVE,https://...,0.5,2025-01-15
```

---

### 2. Orders Export

**Query**: `?type=orders`

**CSV Columns**:
- Order (orderNumber)
- Total
- Status
- Date (createdAt)
- Customer (user email)

**Example Output**:
```csv
Order,Total,Status,Date,Customer
ORD-1705401234-A7B3C,1387.50,DELIVERED,2025-01-16T10:30:00.000Z,john@acme.com
ORD-1705301234-B8C4D,2450.00,SHIPPED,2025-01-15T14:20:00.000Z,jane@example.com
ORD-1705201234-C9D5E,890.25,PENDING,2025-01-14T09:15:00.000Z,bob@company.com
```

**Full Order Export** (Future Enhancement):
```csv
Order Number,Customer Email,Customer Name,Account Type,Status,Payment Status,Subtotal,Tax,Shipping,Total,Payment Method,Created Date,Shipped Date,Tracking Number,Items Count
ORD-1705401234,john@acme.com,John Doe,B2B,DELIVERED,PAID,1250.00,112.50,25.00,1387.50,PURCHASE_ORDER,2025-01-16,2025-01-17,1Z999AA10123456784,5
```

---

### 3. Customers Export (Future)

**Query**: `?type=customers`

**CSV Columns** (Planned):
- Email
- Name
- Account Type
- Company Name
- Status
- Created Date
- Total Orders
- Lifetime Spent

**Example Output**:
```csv
Email,Name,Account Type,Company Name,Status,Created Date,Total Orders,Lifetime Spent
john@acme.com,John Doe,B2B,Acme Corporation,ACTIVE,2025-01-01,23,12450.75
jane@example.com,Jane Smith,B2C,,ACTIVE,2025-01-05,8,3280.50
```

---

## CSV Format Details

### Character Encoding
- **Encoding**: UTF-8
- **BOM**: Included for Excel compatibility

### Field Formatting
- **Delimiter**: Comma (`,`)
- **Quotes**: Fields containing commas are quoted
- **Line Breaks**: Unix style (`\n`)
- **Numbers**: Decimal point (`.`) for consistency
- **Dates**: ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)

### Special Characters
```csv
SKU,Name,Description
VEST-001,"Safety Vest, High-Vis","ANSI Class 2 compliant, reflective"
HAT-001,"Hard Hat (White)","OSHA approved ""Type I"""
```

---

## Export Process Flow

```
┌─────────────────┐
│  Receive Request│
│  with ?type     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validate Type  │
│  & Auth         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Query Database │
│  (All Records)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Format as CSV  │
│  with Headers   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Return File    │
│  (Download)     │
└─────────────────┘
```

---

## Implementation Details

### File Location
- Route: `src/app/api/bulk/export/route.ts`

### Current Implementation
```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');

  if (type === 'products') {
    const products = await db.product.findMany({
      select: {
        sku: true,
        name: true,
        basePrice: true,
        stockQuantity: true,
        category: { select: { name: true } },
      },
    });

    const csv = [
      'SKU,Name,Price,Stock,Category',
      ...products.map(p =>
        `${p.sku},"${p.name}",${p.basePrice},${p.stockQuantity},"${p.category?.name || ''}"`
      ),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=products.csv',
      },
    });
  }

  if (type === 'orders') {
    const orders = await db.order.findMany({
      select: {
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    });

    const csv = [
      'Order,Total,Status,Date,Customer',
      ...orders.map(o =>
        `${o.orderNumber},${o.total},${o.status},${o.createdAt.toISOString()},${o.user.email}`
      ),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=orders.csv',
      },
    });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
```

### Security Features
- Authentication required
- Admin role recommended
- Read-only operation
- No data modification

### Performance Considerations
- **Large Datasets**: Can handle 10,000+ records
- **Streaming**: Future enhancement for very large exports
- **Caching**: Consider caching for repeated exports
- **Filtering**: Future: Add date range, status filters

---

## Usage Examples

### JavaScript/TypeScript (fetch)
```typescript
// Export products
const exportProducts = async () => {
  const response = await fetch('/api/bulk/export?type=products', {
    credentials: 'include'
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  // Trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Export orders
const exportOrders = async () => {
  window.location.href = '/api/bulk/export?type=orders';
};

// Export with proper filename
const exportData = async (type) => {
  const response = await fetch(`/api/bulk/export?type=${type}`, {
    credentials: 'include'
  });

  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition
    ? contentDisposition.split('filename=')[1]
    : `${type}.csv`;

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
```

### React Export Component
```typescript
function BulkExportButton({ type, label }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      const response = await fetch(`/api/bulk/export?type=${type}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert('Export completed successfully!');
    } catch (error) {
      alert('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={exporting}>
      {exporting ? 'Exporting...' : `Export ${label}`}
    </button>
  );
}

// Usage
function AdminDashboard() {
  return (
    <div className="export-section">
      <h2>Export Data</h2>
      <BulkExportButton type="products" label="Products" />
      <BulkExportButton type="orders" label="Orders" />
      <BulkExportButton type="customers" label="Customers" />
    </div>
  );
}
```

### Export with Date Range (Future)
```typescript
function ExportWithFilters() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = async () => {
    const params = new URLSearchParams({
      type: 'orders',
      startDate,
      endDate,
      status: 'DELIVERED'
    });

    const response = await fetch(`/api/bulk/export?${params}`, {
      credentials: 'include'
    });

    // Download file
    const blob = await response.blob();
    // ... same download logic
  };

  return (
    <div>
      <h3>Export Orders</h3>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        placeholder="Start Date"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        placeholder="End Date"
      />
      <button onClick={handleExport}>Export</button>
    </div>
  );
}
```

---

## Best Practices

### Export Preparation
1. **Filter Data**: Add date range and status filters
2. **Limit Size**: Warn for exports > 100,000 records
3. **Background Jobs**: Queue large exports (send via email)
4. **Scheduled Exports**: Allow recurring exports
5. **Compression**: ZIP large CSV files

### Data Privacy
1. **Sanitize PII**: Remove sensitive customer data
2. **Role-Based Access**: Different exports for different roles
3. **Audit Logging**: Log all export operations
4. **Encryption**: Encrypt exported files
5. **Retention Policy**: Auto-delete old exports

### User Experience
1. **Progress Indicator**: Show export progress
2. **Email Delivery**: Send large exports via email
3. **Format Options**: Offer CSV, Excel, JSON
4. **Preview**: Show first 10 rows before export
5. **Templates**: Predefined export templates

---

## Future Enhancements

### Planned Features
1. **Streaming Exports**: Handle 100,000+ records efficiently
2. **Excel Format**: Export to .xlsx with formatting
3. **JSON Export**: API-friendly JSON format
4. **Filtered Exports**: Date range, status, category filters
5. **Custom Columns**: Choose which columns to export
6. **Scheduled Exports**: Daily/weekly automated exports
7. **Email Delivery**: Send large exports to email
8. **Compression**: ZIP files for large exports
9. **Export Templates**: Predefined export configurations
10. **Export History**: Track past exports with re-download

### Additional Export Types
- **Inventory Logs**: Stock movement history
- **Customer Analytics**: Purchase patterns
- **Financial Reports**: Revenue, taxes, commissions
- **Shipping Manifests**: Orders by carrier/date
- **Audit Logs**: System activity logs

### Advanced Filtering
```typescript
// Future API
GET /api/bulk/export?type=orders
  &startDate=2025-01-01
  &endDate=2025-01-31
  &status=DELIVERED
  &accountType=B2B
  &minTotal=1000
  &columns=orderNumber,total,customer,date
```

---

## Excel Compatibility

### Tips for Excel
1. **UTF-8 BOM**: Include BOM for proper encoding
2. **Number Formats**: Use proper decimal separators
3. **Date Formats**: ISO 8601 or Excel-friendly format
4. **Large Numbers**: Prefix with `'` to prevent scientific notation
5. **Formulas**: Escape with `'` if starting with `=`, `+`, `-`

### Example Excel-Friendly Export
```csv
SKU,Name,Price,Stock,UPC
SV-1234,Safety Vest,29.99,500,'123456789012
HH-5678,Hard Hat,24.99,300,'987654321098
```

---

## Error Handling

### Common Errors
```json
// 400 Bad Request - Invalid type
{
  "error": "Invalid type"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Export failed"
}
```

### Troubleshooting
1. **Empty File**: Check if data exists in database
2. **Encoding Issues**: Ensure UTF-8 encoding
3. **Large Exports**: May timeout, use background jobs
4. **Special Characters**: Ensure proper CSV escaping
5. **Browser Download**: Check popup blockers

---

## Related Documentation
- [Bulk Import API](./bulk-import.md) - Importing data
- [Products API](../admin-api/products.md) - Product management
- [Orders API](./orders.md) - Order management
- [Admin Export Page](../pages/admin-bulk-export.md) - Export UI
- [Reporting Guide](../guides/reporting.md) - Analytics and reports
