# Bulk Import API Documentation

## Overview
The Bulk Import API allows administrators to import large datasets (products, orders, customers) via CSV or JSON format. Supports batch processing with detailed success/failure reporting for each imported item.

**Base Path**: `/api/bulk/import`

---

## Endpoints

### 1. Import Data

**POST** `/api/bulk/import`

Imports bulk data from JSON format. Currently supports product imports with plans to expand to orders and customers.

#### Authentication
- ✅ Required
- 🔐 **Required Role**: ADMIN or SUPER_ADMIN (recommended)

#### Request Body
```json
{
  "type": "products",
  "data": [
    {
      "sku": "VEST-001",
      "name": "High-Visibility Safety Vest - Yellow",
      "basePrice": "29.99",
      "stockQuantity": "500",
      "categoryId": "cat_safety_equipment"
    },
    {
      "sku": "VEST-002",
      "name": "High-Visibility Safety Vest - Orange",
      "basePrice": "29.99",
      "stockQuantity": "450",
      "categoryId": "cat_safety_equipment"
    },
    {
      "sku": "HAT-001",
      "name": "Safety Hard Hat - White",
      "basePrice": "24.99",
      "stockQuantity": "300",
      "categoryId": "cat_safety_equipment"
    }
  ]
}
```

#### Field Validation

**Type: "products"**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| sku | string | ✅ Yes | Must be unique across all products |
| name | string | ✅ Yes | Product name |
| basePrice | string/number | ✅ Yes | Will be parsed to decimal |
| stockQuantity | string/number | ✅ Yes | Will be parsed to integer |
| categoryId | string | ✅ Yes | Must be valid category ID |

**Future Support:**
- **orders**: Import historical orders
- **customers**: Bulk customer creation
- **categories**: Import category hierarchy
- **inventory**: Stock adjustments

#### Response (200 OK)
```json
{
  "results": [
    {
      "success": true,
      "sku": "VEST-001",
      "id": "prod_new_abc123"
    },
    {
      "success": true,
      "sku": "VEST-002",
      "id": "prod_new_def456"
    },
    {
      "success": false,
      "sku": "HAT-001",
      "error": "Failed to import"
    }
  ]
}
```

#### Response Fields
Each result object contains:
- **success**: Boolean indicating if import succeeded
- **sku**: The SKU that was attempted
- **id**: Product ID (only on success)
- **error**: Error message (only on failure)

#### Error Responses
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
  "error": "Import failed"
}
```

---

## CSV Format Specifications

### Products CSV Format

```csv
SKU,Name,Price,Stock,Category
VEST-001,High-Visibility Safety Vest - Yellow,29.99,500,cat_safety_equipment
VEST-002,High-Visibility Safety Vest - Orange,29.99,450,cat_safety_equipment
HAT-001,Safety Hard Hat - White,24.99,300,cat_safety_equipment
HAT-002,Safety Hard Hat - Yellow,24.99,275,cat_safety_equipment
```

#### CSV Requirements
- **Header Row**: Must include column names (case-insensitive)
- **Encoding**: UTF-8
- **Delimiter**: Comma (`,`)
- **Quotes**: Use double quotes for fields containing commas
- **Line Breaks**: Unix (`\n`) or Windows (`\r\n`)

#### CSV Column Mapping
| CSV Column | Database Field | Required |
|------------|---------------|----------|
| SKU | sku | ✅ Yes |
| Name | name | ✅ Yes |
| Description | description | ❌ No |
| Price | basePrice | ✅ Yes |
| Sale Price | salePrice | ❌ No |
| Wholesale Price | wholesalePrice | ❌ No |
| GSA Price | gsaPrice | ❌ No |
| Stock | stockQuantity | ✅ Yes |
| Category | categoryId | ✅ Yes |
| Weight | weight | ❌ No |
| Images | images (JSON array or semicolon-separated) | ❌ No |

### Orders CSV Format (Future)

```csv
Order Number,Customer Email,Total,Status,Date,Shipping Address
ORD-001,customer@example.com,299.99,DELIVERED,2025-01-15,123 Main St|New York|NY|10001
ORD-002,customer2@example.com,450.00,SHIPPED,2025-01-16,456 Oak Ave|Brooklyn|NY|11201
```

### Customers CSV Format (Future)

```csv
Email,Name,Account Type,Company Name,Tax ID
john@acme.com,John Doe,B2B,Acme Corporation,12-3456789
jane@example.com,Jane Smith,B2C,,
```

---

## Import Process Flow

```
┌─────────────────┐
│  Receive Data   │
│  (JSON/CSV)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validate Type  │
│  (products/etc) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse Records  │
│  (Line by line) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  For Each Item: │
│  1. Validate    │
│  2. Check Dups  │
│  3. Create      │
│  4. Log Result  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Results  │
│ (Success/Fail)  │
└─────────────────┘
```

### Validation Steps
1. **Schema Validation**: Check all required fields present
2. **Data Type Validation**: Parse strings to numbers/dates
3. **Duplicate Check**: Verify SKU uniqueness
4. **Foreign Key Check**: Validate categoryId exists
5. **Business Rules**: Price > 0, stock >= 0, etc.

### Error Handling
- **Partial Success**: Some items succeed, some fail
- **Transaction Safety**: Each item imported independently
- **Rollback**: Failed items don't affect successful ones
- **Detailed Logging**: Each failure includes specific error

---

## Implementation Details

### File Location
- Route: `src/app/api/bulk/import/route.ts`

### Current Implementation
```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, data } = await request.json();

  if (type === 'products') {
    const results = [];
    for (const item of data) {
      try {
        const product = await db.product.create({
          data: {
            sku: item.sku,
            name: item.name,
            basePrice: parseFloat(item.basePrice),
            stockQuantity: parseInt(item.stockQuantity),
            categoryId: item.categoryId,
          },
        });
        results.push({ success: true, sku: item.sku, id: product.id });
      } catch (error) {
        results.push({ success: false, sku: item.sku, error: 'Failed to import' });
      }
    }
    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
```

### Security Features
- Authentication required
- Admin role recommended
- Per-item error handling
- No destructive batch operations

### Performance Considerations
- **Small Batches**: Process 100-500 items at a time
- **Background Jobs**: Use queue for large imports (1000+ items)
- **Progress Tracking**: Future: WebSocket updates
- **Rate Limiting**: Prevent abuse

---

## Usage Examples

### JavaScript/TypeScript (fetch)
```typescript
// Prepare product data
const productsToImport = [
  {
    sku: 'VEST-001',
    name: 'High-Visibility Safety Vest - Yellow',
    basePrice: '29.99',
    stockQuantity: '500',
    categoryId: 'cat_safety'
  },
  {
    sku: 'HAT-001',
    name: 'Safety Hard Hat - White',
    basePrice: '24.99',
    stockQuantity: '300',
    categoryId: 'cat_safety'
  }
];

// Import products
const response = await fetch('/api/bulk/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    type: 'products',
    data: productsToImport
  })
});

const { results } = await response.json();

// Process results
const successful = results.filter(r => r.success);
const failed = results.filter(r => !r.success);

console.log(`Imported ${successful.length} products`);
console.log(`Failed: ${failed.length} products`);

failed.forEach(item => {
  console.error(`Failed to import ${item.sku}: ${item.error}`);
});
```

### CSV to JSON Converter
```typescript
function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = lines[i].split(',').map(v => v.trim());
    const item: any = {};

    headers.forEach((header, index) => {
      item[header.toLowerCase()] = values[index];
    });

    data.push(item);
  }

  return data;
}

// Usage
const csvContent = await file.text();
const products = parseCSV(csvContent);

const response = await fetch('/api/bulk/import', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    type: 'products',
    data: products
  })
});
```

### React Import Component
```typescript
function BulkImportProducts() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResults(null);

    try {
      const text = await file.text();
      const data = parseCSV(text);

      const response = await fetch('/api/bulk/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'products',
          data
        })
      });

      const result = await response.json();
      setResults(result.results);
    } catch (error) {
      alert('Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bulk-import">
      <h2>Bulk Import Products</h2>

      <div className="file-input">
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileChange}
        />
        <button onClick={handleImport} disabled={!file || importing}>
          {importing ? 'Importing...' : 'Import'}
        </button>
      </div>

      {results && (
        <div className="results">
          <h3>Import Results</h3>
          <p>
            Successful: {results.filter(r => r.success).length} |
            Failed: {results.filter(r => !r.success).length}
          </p>

          {results.filter(r => !r.success).length > 0 && (
            <div className="errors">
              <h4>Failed Imports:</h4>
              <ul>
                {results.filter(r => !r.success).map((item, i) => (
                  <li key={i}>
                    {item.sku}: {item.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Best Practices

### Preparing Data
1. **Clean Data First**: Remove duplicates, fix formatting
2. **Test Small Batch**: Import 10-20 items first
3. **Backup Database**: Before large imports
4. **Validate References**: Ensure categoryIds exist
5. **Use Templates**: Provide CSV template downloads

### Error Prevention
1. **Unique SKUs**: Check for duplicates before import
2. **Valid Categories**: Pre-create all categories
3. **Number Formatting**: Use consistent decimal separators
4. **Encoding**: Ensure UTF-8 encoding
5. **Required Fields**: Validate all required fields present

### Large Imports
1. **Batch Processing**: Split into 500-item chunks
2. **Progress Tracking**: Implement status updates
3. **Background Jobs**: Use task queue for 1000+ items
4. **Retry Logic**: Retry failed items automatically
5. **Notifications**: Email completion status

---

## Future Enhancements

### Planned Features
1. **CSV File Upload**: Direct CSV file processing
2. **Background Processing**: Queue-based imports for large datasets
3. **Progress Tracking**: Real-time import progress
4. **Validation Preview**: Validate before importing
5. **Mapping UI**: Visual column mapping tool
6. **Dry Run Mode**: Test import without saving
7. **Duplicate Handling**: Update vs skip vs error
8. **Import Templates**: Downloadable CSV templates
9. **Import History**: Log all imports with rollback
10. **Scheduled Imports**: Automated recurring imports

### Additional Data Types
- **Orders**: Bulk historical order import
- **Customers**: Customer account creation
- **Inventory**: Stock level adjustments
- **Pricing**: Bulk price updates
- **Categories**: Category hierarchy import

---

## Related Documentation
- [Bulk Export API](./bulk-export.md) - Exporting data
- [Products API](../admin-api/products.md) - Product management
- [Admin Import Page](../pages/admin-bulk-import.md) - Import UI
- [Data Migration Guide](../guides/data-migration.md) - Migration best practices
