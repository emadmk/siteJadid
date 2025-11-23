# Admin Reports Builder Page

## Overview

The Reports Builder page (`/admin/reports`) provides administrative tools for generating and exporting various business reports. This interface enables administrators to create custom reports, export data to Excel or PDF formats, and analyze business performance across multiple dimensions.

**File Location:** `/home/user/siteJadid/src/app/admin/reports/page.tsx`

**Route:** `/admin/reports`

---

## User Access Requirements

### Authorized Roles
- All authenticated admin users

### Authentication Check
```typescript
// Basic authentication
const session = await getServerSession(authOptions);
if (!session?.user?.id) redirect('/auth/signin');
```

---

## Features List

### Core Features

1. **Pre-built Report Templates**
   - Sales Report
   - Inventory Report
   - Customer Report
   - Product Performance
   - Order History

2. **Export Formats**
   - Excel (.xlsx)
   - PDF (.pdf)
   - CSV (.csv)

3. **Report Categories**
   - Financial reports
   - Inventory reports
   - Customer analytics
   - Product analytics
   - Sales analytics

---

## UI Components Breakdown

### 1. Page Header
```typescript
<div className="p-8">
  <h1 className="text-3xl font-bold mb-6">Reports & Export</h1>
</div>
```

### 2. Report Cards Grid
```typescript
<div className="grid grid-cols-2 gap-6">
  {/* Sales Report Card */}
  <div className="bg-white rounded-lg border p-6">
    <FileText className="w-8 h-8 text-blue-600 mb-4" />
    <h3 className="text-xl font-bold mb-2">Sales Report</h3>
    <p className="text-gray-600 mb-4">Export sales data to Excel or PDF</p>
    <Button>
      <Download className="w-4 h-4 mr-2" />
      Download Excel
    </Button>
  </div>

  {/* Inventory Report Card */}
  <div className="bg-white rounded-lg border p-6">
    <FileText className="w-8 h-8 text-green-600 mb-4" />
    <h3 className="text-xl font-bold mb-2">Inventory Report</h3>
    <p className="text-gray-600 mb-4">Export inventory data</p>
    <Button>
      <Download className="w-4 h-4 mr-2" />
      Download PDF
    </Button>
  </div>
</div>
```

**Icons Used:**
- `FileText` - Report documents
- `Download` - Export/download action

---

## Available Report Types

### 1. Sales Report
```
Data Included:
- Order number
- Customer name
- Order date
- Order total
- Payment status
- Fulfillment status
- Line items

Filters:
- Date range
- Customer type (B2C, B2B, GSA)
- Status
- Payment method

Export Formats: Excel, PDF, CSV
```

### 2. Inventory Report
```
Data Included:
- Product SKU
- Product name
- Current stock
- Reserved stock
- Available stock
- Warehouse location
- Last restocked date
- Stock value

Filters:
- Warehouse
- Category
- Low stock only
- Stock value range

Export Formats: Excel, PDF, CSV
```

### 3. Customer Report
```
Data Included:
- Customer name/email
- Account type
- Registration date
- Total orders
- Total spend
- Last order date
- Loyalty tier

Filters:
- Account type
- Registration date range
- Order count
- Spend range

Export Formats: Excel, CSV
```

### 4. Product Performance Report
```
Data Included:
- Product name/SKU
- Units sold
- Revenue generated
- Average order value
- Stock turns
- Profit margin

Filters:
- Category
- Date range
- Stock status
- Sales threshold

Export Formats: Excel, PDF
```

---

## User Flows

### Flow 1: View Report Options
```
1. Admin navigates to /admin/reports
2. System displays report cards
3. Admin reviews available reports
4. Admin selects desired report type
```

### Flow 2: Generate and Download Report
```
1. Admin clicks on report card
2. System may show filter options:
   - Date range picker
   - Category selector
   - Status filters
3. Admin configures filters
4. Admin clicks "Download Excel" or "Download PDF"
5. System:
   - Queries database with filters
   - Formats data for export
   - Generates file (Excel/PDF)
   - Triggers browser download
6. Admin receives file
```

### Flow 3: Schedule Recurring Reports
```
1. Admin opens report configuration
2. Admin enables "Schedule Report"
3. Admin sets:
   - Frequency (daily, weekly, monthly)
   - Recipients (email addresses)
   - Format (Excel, PDF)
4. System saves schedule
5. System automatically generates and emails report
```

---

## Screenshots/Mockup Descriptions

### Reports Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ Reports & Export                                        │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────┐ ┌───────────────────┐           │
│ │ 📄 Sales Report   │ │ 📄 Inventory      │           │
│ │                   │ │    Report         │           │
│ │ Export sales data │ │ Export inventory  │           │
│ │ to Excel or PDF   │ │ data              │           │
│ │                   │ │                   │           │
│ │ [Download Excel]  │ │ [Download PDF]    │           │
│ └───────────────────┘ └───────────────────┘           │
│                                                         │
│ ┌───────────────────┐ ┌───────────────────┐           │
│ │ 📄 Customer       │ │ 📄 Product        │           │
│ │    Report         │ │    Performance    │           │
│ │                   │ │                   │           │
│ │ [Download CSV]    │ │ [Download Excel]  │           │
│ └───────────────────┘ └───────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

---

## Related APIs

### 1. POST /api/admin/reports/sales
**Purpose:** Generate sales report

**Request Body:**
```typescript
{
  startDate: DateTime,
  endDate: DateTime,
  customerType?: 'B2C' | 'B2B' | 'GSA',
  status?: OrderStatus,
  format: 'excel' | 'pdf' | 'csv'
}
```

**Response:**
```typescript
{
  fileUrl: string,
  fileName: string,
  recordCount: number
}
```

### 2. POST /api/admin/reports/inventory
**Purpose:** Generate inventory report

**Request Body:**
```typescript
{
  warehouseId?: string,
  categoryId?: string,
  lowStockOnly?: boolean,
  format: 'excel' | 'pdf' | 'csv'
}
```

### 3. POST /api/admin/reports/custom
**Purpose:** Generate custom report with SQL query or filters

**Request Body:**
```typescript
{
  reportType: string,
  filters: Record<string, any>,
  columns: string[],
  format: 'excel' | 'pdf' | 'csv'
}
```

---

## Code Snippets from Implementation

### Simple Report Card Component
```typescript
export default function ReportsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Reports & Export</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <FileText className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">Sales Report</h3>
          <p className="text-gray-600 mb-4">Export sales data to Excel or PDF</p>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Download Excel
          </Button>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <FileText className="w-8 h-8 text-green-600 mb-4" />
          <h3 className="text-xl font-bold mb-2">Inventory Report</h3>
          <p className="text-gray-600 mb-4">Export inventory data</p>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Future Enhancements

1. **Interactive Report Builder**
   - Drag-and-drop field selection
   - Custom filters UI
   - Preview before export
   - Save report templates

2. **Advanced Features**
   - Scheduled reports (daily, weekly, monthly)
   - Email delivery
   - Cloud storage integration (S3, Drive)
   - Report history/archive

3. **More Report Types**
   - Tax reports
   - Commission reports
   - Supplier performance
   - Shipping analytics
   - Return/RMA analytics
   - Customer segmentation

4. **Visualization**
   - Built-in charts and graphs
   - Dashboard widgets
   - Interactive data exploration
   - Real-time updates

5. **Export Enhancements**
   - Multiple formats simultaneously
   - Batch export
   - Compressed archives
   - Custom formatting options

6. **Security & Compliance**
   - Access control per report
   - Audit logging
   - Data anonymization options
   - GDPR compliance tools
