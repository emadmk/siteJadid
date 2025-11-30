# Bulk Order Entry Page

## Overview

The Bulk Order Entry page (`/bulk-order`) enables customers to upload large quantities of products at once via CSV file upload or manual text entry. It's designed for customers who need to order hundreds or thousands of items efficiently.

**File Location:** `/home/user/siteJadid/src/app/bulk-order/page.tsx`

**Route:** `/bulk-order`

---

## Features List

1. **CSV File Upload** - Drag-and-drop or click to upload CSV files (up to 5MB)
2. **Template Download** - Download pre-formatted CSV template
3. **Manual Text Entry** - Paste SKU/quantity pairs directly into textarea
4. **Validation** - Real-time validation of SKUs and quantities
5. **Error Reporting** - Detailed feedback on invalid SKUs or out-of-stock items
6. **Preview** - Review items before adding to cart
7. **Maximum Capacity** - Support up to 1000 items per upload
8. **Format Instructions** - Clear instructions and examples in sidebar

---

## UI Components

### Upload Area
```typescript
<div className="bg-white rounded-lg border p-6 mb-6">
  <h2 className="text-xl font-bold mb-4">Upload CSV File</h2>
  <p className="text-gray-600 mb-4">
    Upload a CSV file with SKU and quantity for each product. Maximum 1000 items per upload.
  </p>

  {/* Drag & Drop Zone */}
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-4">
    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <div className="text-lg font-semibold text-black mb-2">
      Drop CSV file here or click to upload
    </div>
    <div className="text-sm text-gray-600 mb-4">Supports .csv files up to 5MB</div>
    <Button className="bg-primary hover:bg-primary/90">Choose File</Button>
  </div>

  {/* Download Template Link */}
  <div className="flex items-center justify-center gap-2">
    <Download className="w-4 h-4 text-safety-green-600" />
    <button className="text-sm text-safety-green-600 hover:text-safety-green-700 font-medium">
      Download CSV Template
    </button>
  </div>
</div>
```

### Manual Entry Section
```typescript
<div className="bg-white rounded-lg border p-6">
  <h2 className="text-xl font-bold mb-4">Manual Entry</h2>
  <p className="text-gray-600 mb-4">
    Enter SKUs and quantities manually, one per line
  </p>

  <textarea
    className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none"
    placeholder="SKU001, 10&#10;SKU002, 25&#10;SKU003, 5"
  />

  <div className="flex gap-3 mt-4">
    <Button className="flex-1 bg-primary hover:bg-primary/90">Process Order</Button>
    <Button variant="outline" className="flex-1">Clear</Button>
  </div>
</div>
```

### Instructions Sidebar
```typescript
<div className="bg-white rounded-lg border p-6 sticky top-4">
  <h3 className="text-lg font-bold mb-4">CSV Format Instructions</h3>

  <div className="space-y-4">
    <div>
      <div className="font-medium mb-2">Required Columns:</div>
      <ul className="text-sm text-gray-700 space-y-1">
        <li>• <span className="font-mono bg-gray-100 px-1">SKU</span> - Product SKU code</li>
        <li>• <span className="font-mono bg-gray-100 px-1">Quantity</span> - Number of units</li>
      </ul>
    </div>

    <div>
      <div className="font-medium mb-2">Example Format:</div>
      <div className="bg-gray-50 border rounded p-3 font-mono text-xs">
        SKU001,10<br />
        SKU002,25<br />
        SKU003,5
      </div>
    </div>

    <div className="border-t pt-4">
      <div className="font-medium mb-2">Processing Rules:</div>
      <ul className="text-sm text-gray-700 space-y-2">
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-safety-green-600 flex-shrink-0 mt-0.5" />
          <span>Valid SKUs will be added to cart</span>
        </li>
        <li className="flex items-start gap-2">
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>Invalid SKUs will be reported</span>
        </li>
        <li className="flex items-start gap-2">
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>Out-of-stock items will be flagged</span>
        </li>
      </ul>
    </div>

    <div className="border-t pt-4">
      <div className="font-medium mb-2">Tips:</div>
      <ul className="text-sm text-gray-700 space-y-1">
        <li>• No header row needed</li>
        <li>• Use comma separation</li>
        <li>• One product per line</li>
        <li>• Quantities must be positive integers</li>
      </ul>
    </div>
  </div>
</div>
```

---

## CSV Format

### Required Format
```
SKU,Quantity
```

### Example
```csv
HELMET-001,10
GLOVES-002,25
BOOTS-003,5
VEST-004,15
```

### Rules
- No header row required
- Comma-separated values
- One product per line
- SKU must be valid and in-stock
- Quantity must be positive integer
- Maximum 1000 items per upload

---

## Processing Flow

```
1. User uploads CSV or enters text
2. System parses input
3. Validates each SKU against database
4. Checks stock availability
5. Calculates pricing (account-type specific)
6. Displays validation results:
   - ✓ Valid items ready to add
   - ✗ Invalid SKUs (with error message)
   - ⚠️ Out-of-stock items (with warning)
7. User confirms
8. System adds valid items to cart
```

---

## Key Features

- **Large Capacity**: Process up to 1000 items at once
- **Error Reporting**: Clear feedback on each line
- **Stock Validation**: Real-time stock checking
- **Format Flexibility**: CSV upload or manual text entry
- **Template Support**: Downloadable template for easy formatting
- **Progress Indicator**: Shows processing status for large uploads

---

## Future Enhancements

1. **Excel Support** - Accept .xlsx files in addition to CSV
2. **Historical Uploads** - Save and reuse previous uploads
3. **Partial Success** - Add valid items even if some fail
4. **Product Suggestions** - Suggest alternatives for invalid SKUs
5. **Scheduled Orders** - Schedule bulk orders for future dates
