# Prisma Schema Fixes - Complete Reference

This document lists all the corrections made to align code with the Prisma schema during the Salem 01 release.

## 📊 Overview

**Problem**: Code was using incorrect field names, types, and model names that didn't match the actual Prisma schema.

**Solution**: Updated all code to use the correct schema fields without modifying the database schema.

**Impact**: Zero database migrations needed - only TypeScript code changes.

---

## 🔧 Model-by-Model Fixes

### 1. User Model

#### Schema Definition
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?   // ✅ Single name field
  password      String?
  phone         String?
  image         String?
  emailVerified DateTime?
  accountType   AccountType @default(B2C)
  role          UserRole @default(CUSTOMER)
  isActive      Boolean @default(true)
  // ... relations
}
```

#### ❌ Wrong Code
```typescript
// Selecting non-existent fields
db.user.findUnique({
  select: {
    firstName: true,  // DOESN'T EXIST
    lastName: true,   // DOESN'T EXIST
  }
})

// Displaying non-existent fields
<div>{user.firstName} {user.lastName}</div>
```

#### ✅ Correct Code
```typescript
// Use the actual field
db.user.findUnique({
  select: {
    name: true,  // ✅ Correct
  }
})

// Display correctly
<div>{user.name || 'User'}</div>
```

#### Files Fixed
- `src/app/dashboard/page.tsx:10-21, 100`
- `src/app/checkout/page.tsx:45-52`
- `src/app/admin/page.tsx:49-54, 400`

---

### 2. B2BProfile Model

#### Schema Definition
```prisma
model B2BProfile {
  id                String    @id @default(cuid())
  userId            String    @unique
  companyName       String
  taxId             String    @unique
  businessLicense   String?
  creditLimit       Decimal   @default(0) @db.Decimal(12, 2)
  creditUsed        Decimal   @default(0) @db.Decimal(12, 2)  // ✅ creditUsed, NOT currentBalance
  paymentTerms      Int       @default(30)                      // ✅ Int (30, 60, 90), NOT String
  discountPercent   Decimal   @default(0) @db.Decimal(5, 2)
  status            B2BStatus @default(PENDING)                 // ✅ status enum, NOT isApproved boolean
  // ... other fields
}

enum B2BStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}
```

#### ❌ Wrong Code
```typescript
// Wrong field names
b2bProfile: {
  select: {
    currentBalance: true,  // DOESN'T EXIST - should be creditUsed
    isApproved: true,      // DOESN'T EXIST - should be status
  }
}

// Wrong type assumptions
{user.b2bProfile.paymentTerms.replace(/_/g, ' ')}  // paymentTerms is Int, not String
{user.b2bProfile.isApproved ? 'Approved' : 'Pending'}  // Wrong field
${user.b2bProfile.currentBalance}  // Wrong field
```

#### ✅ Correct Code
```typescript
// Correct field names
b2bProfile: {
  select: {
    creditUsed: true,  // ✅
    status: true,      // ✅
    paymentTerms: true, // ✅ Int type
  }
}

// Correct usage
Net {user.b2bProfile.paymentTerms}  // Displays "Net 30", "Net 60"

{user.b2bProfile.status === 'APPROVED' ? (
  <span>Approved</span>
) : user.b2bProfile.status === 'REJECTED' ? (
  <span>Rejected</span>
) : user.b2bProfile.status === 'SUSPENDED' ? (
  <span>Suspended</span>
) : (
  <span>Pending</span>
)}

${Number(user.b2bProfile.creditUsed).toLocaleString()}  // ✅
```

#### Files Fixed
- `src/app/profile/page.tsx:30-38, 195-211, 231-236, 238-253`

---

### 3. GSAProfile Model

#### Schema Definition
```prisma
model GSAProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  agencyName      String
  contractNumber  String   @unique
  gsaSchedule     String
  vendorId        String
  cageCode        String?
  dunsBradstreet  String?
  fiscalYear      String
  isActive        Boolean  @default(true)  // ✅ isActive, NOT isVerified
  // ... other fields
}
```

#### ❌ Wrong Code
```typescript
// Wrong field name
gsaProfile: {
  select: {
    isVerified: true,  // DOESN'T EXIST
  }
}

// Wrong display
{user.gsaProfile.isVerified ? 'Verified' : 'Pending'}
```

#### ✅ Correct Code
```typescript
// Correct field name
gsaProfile: {
  select: {
    isActive: true,  // ✅
  }
}

// Correct display
{user.gsaProfile.isActive ? (
  <span>Active</span>
) : (
  <span>Inactive</span>
)}
```

#### Files Fixed
- `src/app/profile/page.tsx:40-45, 265-273`

---

### 4. LoyaltyProfile Model

#### Schema Definition
```prisma
model LoyaltyProfile {
  id              String       @id @default(cuid())
  userId          String       @unique
  points          Int          @default(0)  // ✅ points, NOT currentPoints
  lifetimePoints  Int          @default(0)
  tier            LoyaltyTier  @default(BRONZE)
  // ... other fields
}

enum LoyaltyTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}
```

#### ❌ Wrong Code
```typescript
// Wrong model name
db.loyaltyAccount.findUnique({  // WRONG MODEL NAME
  where: { userId },
  select: {
    currentPoints: true,  // WRONG FIELD NAME
  }
})

// Wrong display
{user.loyaltyAccount.currentPoints}
```

#### ✅ Correct Code
```typescript
// Correct model name
db.loyaltyProfile.findUnique({  // ✅
  where: { userId },
  select: {
    points: true,  // ✅
    lifetimePoints: true,
    tier: true,
  }
})

// Correct display
{user.loyaltyProfile.points.toLocaleString()}
{user.loyaltyProfile.tier}
```

#### Files Fixed
- `src/app/dashboard/page.tsx:51-58, 107-116, 159-161`

---

### 5. Order Model

#### Schema Definition
```prisma
model Order {
  id              String        @id @default(cuid())
  orderNumber     String        @unique
  userId          String
  total           Decimal       @db.Decimal(12, 2)  // ✅ total, NOT totalAmount
  subtotal        Decimal       @db.Decimal(12, 2)
  tax             Decimal       @db.Decimal(12, 2)
  shipping        Decimal       @db.Decimal(12, 2)
  discount        Decimal       @default(0) @db.Decimal(12, 2)
  // ... other fields
}
```

#### ❌ Wrong Code
```typescript
// Wrong field name
const revenue = await db.order.aggregate({
  _sum: {
    totalAmount: true,  // DOESN'T EXIST
  }
})

// Wrong display
{order.totalAmount}
```

#### ✅ Correct Code
```typescript
// Correct field name
const revenue = await db.order.aggregate({
  _sum: {
    total: true,  // ✅
  }
})

// Correct display with Decimal conversion
${Number(order.total).toFixed(2)}
```

#### Files Fixed
- `src/app/admin/page.tsx:64, 185, 415`
- `src/app/dashboard/page.tsx:232`
- `src/app/orders/page.tsx:119, 153`

---

### 6. Product Model

#### Schema Definition
```prisma
model Product {
  id              String        @id @default(cuid())
  sku             String        @unique
  name            String
  slug            String        @unique
  status          ProductStatus @default(DRAFT)  // ✅ status enum, NOT isActive boolean
  categoryId      String?                        // ✅ Nullable
  basePrice       Decimal       @db.Decimal(10, 2)
  salePrice       Decimal?      @db.Decimal(10, 2)
  wholesalePrice  Decimal?      @db.Decimal(10, 2)
  gsaPrice        Decimal?      @db.Decimal(10, 2)
  weight          Decimal?      @db.Decimal(10, 2)  // ✅ Decimal type
  // ... other fields
}

enum ProductStatus {
  DRAFT
  ACTIVE
  INACTIVE
  OUT_OF_STOCK
}
```

#### ❌ Wrong Code
```typescript
// Wrong field name (boolean instead of enum)
where: {
  isActive: true,  // DOESN'T EXIST
}

// Decimal type used directly
{product.basePrice}  // ERROR: Decimal is not assignable to ReactNode
{product.salePrice + product.basePrice}  // ERROR: Decimal can't be used in arithmetic

// Nullable field not checked
const related = await getRelatedProducts(product.categoryId, id);  // ERROR: could be null

// Wrong display
{product.weight} lbs  // ERROR: Decimal is not assignable to ReactNode
```

#### ✅ Correct Code
```typescript
// Correct enum field
where: {
  status: 'ACTIVE',  // ✅
}

// Decimal conversion for display
${Number(product.basePrice).toFixed(2)}

// Decimal conversion for arithmetic
${(Number(product.salePrice) + Number(product.basePrice)).toFixed(2)}

// Nullable field check
const related = product.categoryId
  ? await getRelatedProducts(product.categoryId, id)
  : [];

// Decimal conversion for display
{Number(product.weight)} lbs
```

#### Files Fixed
- `src/app/page.tsx:31`
- `src/app/products/page.tsx:27`
- `src/app/products/[slug]/page.tsx:69, 73-75, 175-197, 233, 361, 365`
- `src/app/admin/page.tsx:44, 80`
- `src/app/cart/page.tsx:75-77, 104`
- `src/app/checkout/page.tsx:82-92, 131, 322-329`

---

### 7. Cart Model

#### Schema Definition
```prisma
model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  // ❌ NO status field exists
}
```

#### ❌ Wrong Code
```typescript
// Querying non-existent field
const cart = await db.cart.findFirst({
  where: {
    userId,
    status: 'ACTIVE',  // FIELD DOESN'T EXIST
  }
})
```

#### ✅ Correct Code
```typescript
// Remove non-existent field
const cart = await db.cart.findFirst({
  where: {
    userId,
    // No status field
  }
})
```

#### Files Fixed
- `src/app/cart/page.tsx:10-13`
- `src/app/checkout/page.tsx:11-14`

---

## 🔢 Decimal Type Handling

### The Problem

Prisma's `Decimal` type is not a JavaScript number. It's an object that cannot be:
1. Used in arithmetic operations directly
2. Rendered in React components
3. Formatted without conversion

### The Solution

**Always convert Decimal to Number before use:**

```typescript
// ❌ Wrong
<div>${product.basePrice}</div>
const total = product.price * quantity;
const discount = product.price - product.salePrice;

// ✅ Correct
<div>${Number(product.basePrice).toFixed(2)}</div>
const total = Number(product.price) * quantity;
const discount = Number(product.price) - Number(product.salePrice);
```

### Fields That Need Conversion

All these fields are `Decimal` type and need `Number()` conversion:

#### Product
- `basePrice`
- `salePrice`
- `wholesalePrice`
- `gsaPrice`
- `weight`

#### Order
- `total`
- `subtotal`
- `tax`
- `shipping`
- `discount`

#### B2BProfile
- `creditLimit`
- `creditUsed`
- `discountPercent`

#### OrderItem
- `price`
- `total`

### Complete Example

```typescript
// Reading from database - Decimal type
const product = await db.product.findUnique({
  where: { id },
  select: {
    basePrice: true,    // Decimal
    salePrice: true,    // Decimal | null
    weight: true,       // Decimal | null
  }
})

// ❌ WRONG - Will cause TypeScript/Runtime errors
const price = product.basePrice;
const total = price * 2;
return <div>{price}</div>;

// ✅ CORRECT - Convert to number first
const price = Number(product.basePrice);
const total = price * 2;
return <div>${price.toFixed(2)}</div>;

// ✅ CORRECT - Handle nullable Decimals
const weight = product.weight ? Number(product.weight) : 0;
const salePrice = product.salePrice
  ? Number(product.salePrice)
  : Number(product.basePrice);
```

---

## 🔍 Nullable Field Handling

### categoryId in Product

```typescript
// Schema
categoryId String? // ✅ Nullable

// ❌ Wrong - Doesn't check for null
const related = await getRelatedProducts(product.categoryId, id);

// ✅ Correct - Check first
const related = product.categoryId
  ? await getRelatedProducts(product.categoryId, id)
  : [];
```

### Other Nullable Fields

Always check nullable fields before use:

```typescript
// User
user.name || 'User'
user.phone || 'Not provided'
user.image || '/default-avatar.png'

// Product
product.salePrice || product.basePrice
product.weight ? Number(product.weight) : 0

// B2BProfile
b2bProfile.taxId || 'Not provided'
b2bProfile.businessLicense || 'Not provided'
```

---

## 📋 Complete Checklist

Use this checklist when working with Prisma models:

### ✅ User Model
- [ ] Use `name` not `firstName`/`lastName`
- [ ] Check `name` for null (it's optional)
- [ ] Use `accountType` enum values correctly
- [ ] Use `role` enum values correctly

### ✅ B2BProfile Model
- [ ] Use `creditUsed` not `currentBalance`
- [ ] Use `status` enum not `isApproved` boolean
- [ ] `paymentTerms` is Int, display as "Net 30"
- [ ] Convert `creditLimit` and `creditUsed` with Number()
- [ ] Handle all B2BStatus enum values (PENDING/APPROVED/REJECTED/SUSPENDED)

### ✅ GSAProfile Model
- [ ] Use `isActive` not `isVerified`
- [ ] Remember: `contractNumber`, `gsaSchedule`, `vendorId` are required

### ✅ LoyaltyProfile Model
- [ ] Model name is `LoyaltyProfile` not `LoyaltyAccount`
- [ ] Use `points` not `currentPoints`
- [ ] Use `tier` enum values correctly

### ✅ Order Model
- [ ] Use `total` not `totalAmount`
- [ ] Convert all Decimal fields with Number()
- [ ] Handle `paymentStatus` and `status` enums correctly

### ✅ Product Model
- [ ] Use `status` enum not `isActive` boolean
- [ ] Check `categoryId` for null before use
- [ ] Convert ALL price fields with Number()
- [ ] Convert `weight` with Number() if not null
- [ ] Status values: DRAFT, ACTIVE, INACTIVE, OUT_OF_STOCK

### ✅ Cart Model
- [ ] NO `status` field exists
- [ ] Convert `price` in calculations

### ✅ Decimal Fields
- [ ] Always wrap with Number() for arithmetic
- [ ] Always wrap with Number() for display
- [ ] Use .toFixed(2) for currency formatting
- [ ] Use .toLocaleString() for large numbers

---

## 🚀 Quick Reference

### Common Fixes

```typescript
// User
❌ user.firstName + ' ' + user.lastName
✅ user.name || 'User'

// B2BProfile
❌ user.b2bProfile.currentBalance
✅ Number(user.b2bProfile.creditUsed)

❌ user.b2bProfile.isApproved
✅ user.b2bProfile.status === 'APPROVED'

❌ user.b2bProfile.paymentTerms.replace(/_/g, ' ')
✅ `Net ${user.b2bProfile.paymentTerms}`

// GSAProfile
❌ user.gsaProfile.isVerified
✅ user.gsaProfile.isActive

// LoyaltyProfile
❌ db.loyaltyAccount.findUnique(...)
✅ db.loyaltyProfile.findUnique(...)

❌ loyaltyAccount.currentPoints
✅ loyaltyProfile.points

// Order
❌ order.totalAmount
✅ Number(order.total)

// Product
❌ { isActive: true }
✅ { status: 'ACTIVE' }

❌ product.basePrice
✅ Number(product.basePrice).toFixed(2)

❌ product.weight
✅ Number(product.weight)

❌ await getRelatedProducts(product.categoryId, id)
✅ product.categoryId ? await getRelatedProducts(product.categoryId, id) : []

// Cart
❌ { userId, status: 'ACTIVE' }
✅ { userId }
```

---

## 📚 Additional Resources

- **Prisma Schema**: `/prisma/schema.prisma`
- **Type Definitions**: Generated in `node_modules/.prisma/client`
- **Enum Values**: Defined in Prisma schema
- **Decimal Docs**: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-decimal

---

**Last Updated**: November 22, 2025 (Salem 01 Release)
