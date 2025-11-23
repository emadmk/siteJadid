# Quick Order Pad Page

## Overview

The Quick Order Pad (`/quick-order`) is a specialized tool for customers who know exactly what they want to order. It allows rapid SKU-based ordering through a table interface with auto-population of product details and pricing.

**File Location:** `/home/user/siteJadid/src/app/quick-order/page.tsx`

**Route:** `/quick-order`

---

## Features List

1. **SKU Entry Table** - 10 rows by default for entering product SKUs
2. **Auto-Population** - Product details populate automatically when valid SKU is entered
3. **Quantity Input** - Quick quantity entry for each line
4. **Price Display** - Shows unit price and line total
5. **CSV Import** - Upload CSV file with SKU and quantity columns
6. **Template Export** - Download CSV template for bulk entry
7. **Add Rows** - Dynamically add more entry rows
8. **Clear All** - Reset entire form
9. **Estimated Total** - Real-time total calculation
10. **Keyboard Shortcuts** - Ctrl+Enter (add row), Ctrl+S (submit), Ctrl+K (clear)
11. **Instructions Sidebar** - Helpful tips and usage guide

---

## UI Components

### Entry Table
```typescript
<table className="w-full">
  <thead className="bg-gray-50">
    <tr>
      <th className="w-12">#</th>
      <th>SKU</th>
      <th>Product</th>
      <th>Price</th>
      <th>Qty</th>
      <th>Total</th>
      <th className="w-12"></th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-200">
    {[...Array(10)].map((_, i) => (
      <tr key={i} className="hover:bg-gray-50">
        <td className="px-6 py-4 text-sm text-gray-600">{i + 1}</td>
        <td className="px-6 py-4">
          <input
            type="text"
            placeholder="Enter SKU"
            className="w-full px-3 py-2 border border-gray-300 rounded
                       focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
          />
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-500">-</div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">-</div>
        </td>
        <td className="px-6 py-4">
          <input
            type="number"
            placeholder="Qty"
            className="w-20 px-3 py-2 border border-gray-300 rounded
                       focus:ring-2 focus:ring-safety-green-500 focus:border-transparent"
            min="1"
            defaultValue="1"
          />
        </td>
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-black">-</div>
        </td>
        <td className="px-6 py-4">
          <button className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

### Footer Controls
```typescript
<div className="p-6 border-t bg-gray-50">
  <div className="flex items-center justify-between">
    <div className="flex gap-3">
      <Button variant="outline">Clear All</Button>
      <Button variant="outline" className="gap-2">
        <Download className="w-4 h-4" />
        Export Template
      </Button>
    </div>
    <div className="flex items-center gap-6">
      <div>
        <div className="text-sm text-gray-600">Estimated Total</div>
        <div className="text-2xl font-bold text-black">$0.00</div>
      </div>
      <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2">
        <ShoppingCart className="w-5 h-5" />
        Add to Cart
      </Button>
    </div>
  </div>
</div>
```

### Instructions Sidebar
```typescript
<div className="bg-white rounded-lg border p-6 sticky top-4">
  <h3 className="text-lg font-bold mb-4">How to Use</h3>

  <div className="space-y-4">
    <div>
      <div className="font-medium mb-2">Manual Entry</div>
      <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
        <li>Enter product SKU in the SKU column</li>
        <li>Product details will auto-populate</li>
        <li>Enter desired quantity</li>
        <li>Click "Add to Cart" when ready</li>
      </ol>
    </div>

    <div className="border-t pt-4">
      <div className="font-medium mb-2">CSV Import</div>
      <p className="text-sm text-gray-700 mb-2">
        Upload a CSV file with two columns: SKU and Quantity
      </p>
      <div className="bg-gray-50 border rounded p-3 font-mono text-xs mb-2">
        SKU001,10<br />
        SKU002,25<br />
        SKU003,5
      </div>
      <Button size="sm" variant="outline" className="w-full gap-2">
        <Download className="w-3 h-3" />
        Download Template
      </Button>
    </div>

    <div className="border-t pt-4">
      <div className="font-medium mb-2">Keyboard Shortcuts</div>
      <div className="text-sm text-gray-700 space-y-1">
        <div className="flex justify-between">
          <span>Add row:</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
            Ctrl+Enter
          </kbd>
        </div>
        <div className="flex justify-between">
          <span>Submit:</span>
          <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
            Ctrl+S
          </kbd>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## Key Features

- **Tab Navigation**: Use Tab key to move between fields quickly
- **SKU Validation**: Invalid SKUs highlighted in red
- **Real-time Stock Check**: Stock availability checked as SKU is entered
- **Pricing Updates**: Prices auto-update based on account type
- **CSV Support**: Import/export for bulk operations
- **Error Handling**: Clear feedback for invalid SKUs or out-of-stock items
- **Keyboard Friendly**: Full keyboard navigation support

---

## Future Enhancements

1. **SKU Auto-Complete** - Suggest SKUs as user types
2. **Recent SKUs** - Quick access to frequently ordered SKUs
3. **Save Templates** - Save common order templates
4. **Barcode Scanner** - Support for barcode scanning
5. **Copy/Paste** - Paste multiple rows from Excel
