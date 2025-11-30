# Admin Product Attributes Page

## Overview

The Product Attributes page (`/admin/attributes`) provides administrative tools for managing custom product attributes, variants, and options. This interface enables administrators to create dynamic product attributes like size, color, material, and other custom specifications for catalog products.

**File Location:** `/home/user/siteJadid/src/app/admin/attributes/page.tsx`

**Route:** `/admin/attributes`

---

## User Access Requirements

### Authorized Roles
- All authenticated admin users

### Authentication Check
```typescript
// Basic authentication (should be enhanced with role-based access)
const session = await getServerSession(authOptions);
if (!session?.user?.id) redirect('/auth/signin');
```

---

## Features List

### Core Features

1. **Attribute Listing**
   - Display all product attributes
   - Attribute names
   - Attribute types
   - Product usage count

2. **Attribute Types**
   - TEXT - Text input
   - SELECT - Dropdown selection
   - MULTISELECT - Multiple selections
   - NUMBER - Numeric values
   - BOOLEAN - Yes/No toggle
   - COLOR - Color picker
   - DATE - Date selector

3. **Attribute Management**
   - Create new attributes
   - Edit existing attributes
   - Delete unused attributes
   - Track attribute usage

4. **Product Association**
   - See which products use each attribute
   - Bulk attribute assignment
   - Attribute value management

---

## Database Queries Used

### Get All Attributes with Product Count
```typescript
const attributes = await db.productAttribute.findMany({
  include: { _count: { select: { products: true } } },
});
```

### Database Schema (ProductAttribute Model)
```prisma
model ProductAttribute {
  id          String   @id @default(cuid())
  name        String   @unique
  displayName String
  type        AttributeType
  isRequired  Boolean  @default(false)
  isFilterable Boolean @default(true)
  isSearchable Boolean @default(false)

  // For SELECT/MULTISELECT types
  options     String[] // JSON array of options

  // Display settings
  sortOrder   Int      @default(0)
  groupName   String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  products    ProductAttributeValue[]

  @@index([type])
  @@index([isFilterable])
}

model ProductAttributeValue {
  id          String   @id @default(cuid())
  productId   String
  attributeId String

  value       String

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product     Product          @relation(fields: [productId], references: [id], onDelete: Cascade)
  attribute   ProductAttribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)

  @@unique([productId, attributeId])
  @@index([attributeId])
}

enum AttributeType {
  TEXT
  SELECT
  MULTISELECT
  NUMBER
  BOOLEAN
  COLOR
  DATE
}
```

---

## UI Components Breakdown

### 1. Page Header with Action Button
```typescript
<div className="flex justify-between mb-6">
  <h1 className="text-3xl font-bold">Product Attributes</h1>
  <Button>
    <Plus className="w-4 h-4 mr-2" />
    Add Attribute
  </Button>
</div>
```

### 2. Attributes Table
```typescript
<div className="bg-white rounded-lg border">
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Name
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Type
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
          Products
        </th>
      </tr>
    </thead>
    <tbody>
      {attributes.map((attr: any) => (
        <tr key={attr.id}>
          <td className="px-6 py-4">{attr.name}</td>
          <td className="px-6 py-4">{attr.type}</td>
          <td className="px-6 py-4">{attr._count.products}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Icons Used:**
- `Plus` - Add attribute button

---

## User Flows

### Flow 1: View Attributes
```
1. Admin navigates to /admin/attributes
2. System fetches all attributes with product counts
3. Table displays all attributes
4. Admin can see which attributes are most used
```

### Flow 2: Create New Attribute
```
1. Admin clicks "Add Attribute"
2. Admin fills attribute form:
   - Attribute name (e.g., "Size")
   - Display name
   - Attribute type (SELECT, TEXT, etc.)
   - Options (if SELECT/MULTISELECT)
   - Is required
   - Is filterable
   - Is searchable
3. Admin saves attribute
4. Attribute available for products
```

### Flow 3: Apply Attribute to Products
```
1. Admin edits product
2. Admin adds attribute values:
   - Select attribute from list
   - Enter/select value
3. System saves product-attribute relationship
4. Attribute appears on product page
5. Can be used for filtering/search
```

---

## Attribute Type Examples

### SELECT Attribute
```
Name: Size
Type: SELECT
Options: ["Small", "Medium", "Large", "XL", "XXL"]
Usage: Clothing, apparel
```

### COLOR Attribute
```
Name: Color
Type: COLOR
Options: ["#FF0000", "#00FF00", "#0000FF", "#000000"]
Usage: Colored products
```

### BOOLEAN Attribute
```
Name: Waterproof
Type: BOOLEAN
Options: []
Usage: Outdoor equipment
```

### NUMBER Attribute
```
Name: Weight (lbs)
Type: NUMBER
Options: []
Usage: Shipping calculations
```

---

## Related APIs

### 1. GET /api/admin/attributes
**Purpose:** Fetch all attributes

**Response:**
```typescript
[
  {
    id: string,
    name: string,
    displayName: string,
    type: AttributeType,
    options: string[],
    _count: {
      products: number
    }
  }
]
```

### 2. POST /api/admin/attributes
**Purpose:** Create new attribute

**Request Body:**
```typescript
{
  name: string,
  displayName: string,
  type: AttributeType,
  options?: string[],
  isRequired?: boolean,
  isFilterable?: boolean,
  isSearchable?: boolean
}
```

---

## Future Enhancements

1. **Advanced Features**
   - Attribute groups (e.g., "Physical", "Technical")
   - Conditional attributes (show if condition met)
   - Attribute templates for categories
   - Bulk attribute assignment

2. **Filtering & Search**
   - Use attributes for faceted search
   - Dynamic filter generation
   - Attribute-based recommendations

3. **Variants**
   - Generate product variants from attributes
   - SKU generation rules
   - Variant pricing
   - Stock tracking per variant

4. **Validation**
   - Min/max values for numbers
   - Regex patterns for text
   - Required combinations
   - Attribute dependencies
