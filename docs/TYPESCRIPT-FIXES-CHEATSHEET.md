# TypeScript Fixes - Quick Cheatsheet

Quick reference guide for common TypeScript errors and their fixes in the SafetyPro Supply e-commerce platform.

## 🎯 Quick Fixes

### User Model

```typescript
// ❌ Wrong
user.firstName
user.lastName

// ✅ Correct
user.name
user.name || 'User'
```

### B2BProfile

```typescript
// ❌ Wrong
b2bProfile.currentBalance
b2bProfile.isApproved
b2bProfile.paymentTerms.replace(/_/g, ' ')

// ✅ Correct
Number(b2bProfile.creditUsed)
b2bProfile.status === 'APPROVED'
`Net ${b2bProfile.paymentTerms}`
```

### GSAProfile

```typescript
// ❌ Wrong
gsaProfile.isVerified

// ✅ Correct
gsaProfile.isActive
```

### LoyaltyProfile

```typescript
// ❌ Wrong
db.loyaltyAccount.findUnique(...)
loyaltyAccount.currentPoints

// ✅ Correct
db.loyaltyProfile.findUnique(...)
loyaltyProfile.points
```

### Product

```typescript
// ❌ Wrong
{ isActive: true }
product.basePrice
product.weight

// ✅ Correct
{ status: 'ACTIVE' }
Number(product.basePrice).toFixed(2)
Number(product.weight)
```

### Order

```typescript
// ❌ Wrong
order.totalAmount

// ✅ Correct
Number(order.total)
```

### Cart

```typescript
// ❌ Wrong
{ userId, status: 'ACTIVE' }

// ✅ Correct
{ userId }
```

## 🔢 Decimal Type Conversions

### Always Use Number()

```typescript
// For Display
${Number(price).toFixed(2)}
{Number(weight)} lbs
${Number(total).toLocaleString()}

// For Arithmetic
const total = Number(price) * quantity;
const discount = Number(basePrice) - Number(salePrice);
const sum = Number(a) + Number(b);

// For Comparison
if (Number(creditUsed) > Number(creditLimit)) { }
```

### All Decimal Fields

```typescript
// Product
Number(product.basePrice)
Number(product.salePrice)
Number(product.wholesalePrice)
Number(product.gsaPrice)
Number(product.weight)

// Order
Number(order.total)
Number(order.subtotal)
Number(order.tax)
Number(order.shipping)
Number(order.discount)

// B2BProfile
Number(b2bProfile.creditLimit)
Number(b2bProfile.creditUsed)
Number(b2bProfile.discountPercent)

// OrderItem
Number(item.price)
Number(item.total)
```

## ✅ Nullable Field Handling

### Check Before Use

```typescript
// categoryId (nullable)
const related = product.categoryId
  ? await getRelatedProducts(product.categoryId, id)
  : [];

// Optional fields
user.name || 'User'
user.phone || 'Not provided'
product.salePrice || product.basePrice
b2bProfile.taxId || 'Not provided'
```

## 📦 Enum Values

### Product Status

```typescript
// ❌ Wrong
isActive: true

// ✅ Correct
status: 'ACTIVE'
status: 'DRAFT'
status: 'INACTIVE'
status: 'OUT_OF_STOCK'
```

### B2B Status

```typescript
// Check status
b2bProfile.status === 'APPROVED'
b2bProfile.status === 'PENDING'
b2bProfile.status === 'REJECTED'
b2bProfile.status === 'SUSPENDED'
```

### Account Type

```typescript
accountType: 'B2C'
accountType: 'B2B'
accountType: 'GSA'
```

### User Role

```typescript
role: 'CUSTOMER'
role: 'B2B_CUSTOMER'
role: 'GSA_CUSTOMER'
role: 'ADMIN'
role: 'SUPER_ADMIN'
```

## 🔍 Common Error Messages

### "Object literal may only specify known properties"

```typescript
// ❌ Error: 'status' does not exist in type 'CartWhereInput'
where: { userId, status: 'ACTIVE' }

// ✅ Fix: Remove non-existent field
where: { userId }
```

### "Property does not exist on type"

```typescript
// ❌ Error: 'currentBalance' does not exist
b2bProfile.currentBalance

// ✅ Fix: Use correct field name
b2bProfile.creditUsed
```

### "Type 'Decimal' is not assignable to type 'ReactNode'"

```typescript
// ❌ Error: Can't render Decimal directly
<div>{product.basePrice}</div>

// ✅ Fix: Convert to number
<div>${Number(product.basePrice).toFixed(2)}</div>
```

### "The left-hand side of an arithmetic operation must be..."

```typescript
// ❌ Error: Can't use Decimal in arithmetic
const total = product.price * quantity;

// ✅ Fix: Convert to number first
const total = Number(product.price) * quantity;
```

### "Type 'undefined' is not assignable to type 'string'"

```typescript
// ❌ Error: Optional field not checked
await db.b2BProfile.create({
  data: { taxId: optionalValue }  // Could be undefined
})

// ✅ Fix: Don't create if optional fields missing
// Or ensure value exists before creating
```

## 📝 Select Statements

### Correct Field Names

```typescript
// User
db.user.findUnique({
  select: {
    name: true,  // NOT firstName/lastName
    email: true,
    accountType: true,
    role: true,
  }
})

// B2BProfile
b2bProfile: {
  select: {
    creditUsed: true,    // NOT currentBalance
    status: true,        // NOT isApproved
    paymentTerms: true,  // Int type
    creditLimit: true,
  }
}

// GSAProfile
gsaProfile: {
  select: {
    isActive: true,  // NOT isVerified
    agencyName: true,
    contractNumber: true,
  }
}

// LoyaltyProfile
db.loyaltyProfile.findUnique({  // NOT loyaltyAccount
  select: {
    points: true,         // NOT currentPoints
    lifetimePoints: true,
    tier: true,
  }
})

// Product
db.product.findMany({
  where: {
    status: 'ACTIVE',  // NOT isActive: true
  }
})

// Order
db.order.aggregate({
  _sum: {
    total: true,  // NOT totalAmount
  }
})
```

## 🎨 Display Patterns

### Currency

```typescript
${Number(price).toFixed(2)}
${Number(total).toLocaleString('en-US', {
  style: 'currency',
  currency: 'USD'
})}
```

### Numbers

```typescript
{Number(points).toLocaleString()}
{Number(weight)} lbs
{Number(quantity)}
```

### Status Badges

```typescript
{b2bProfile.status === 'APPROVED' ? (
  <span className="bg-green-100 text-green-800">Approved</span>
) : b2bProfile.status === 'REJECTED' ? (
  <span className="bg-red-100 text-red-800">Rejected</span>
) : b2bProfile.status === 'SUSPENDED' ? (
  <span className="bg-orange-100 text-orange-800">Suspended</span>
) : (
  <span className="bg-yellow-100 text-yellow-800">Pending</span>
)}
```

## 🔧 API Route Patterns

### Creating Users

```typescript
// ✅ Correct - Only create what you have data for
const user = await db.user.create({
  data: {
    email: validatedData.email,
    password: hashedPassword,
    name: validatedData.name,  // NOT firstName/lastName
    phone: validatedData.phone,
    accountType: validatedData.accountType,
    role: role,
  }
});

// Create loyalty profile (required fields only)
await db.loyaltyProfile.create({  // NOT loyaltyAccount
  data: {
    userId: user.id,
    points: 0,  // NOT currentPoints
    lifetimePoints: 0,
    tier: 'BRONZE',
  }
});

// ❌ Don't create B2B/GSA profiles at signup
// Missing required fields: contractNumber, gsaSchedule, etc.
// Let admin create these during approval
```

### Querying with Decimals

```typescript
// In API route
const cart = await db.cart.findFirst({
  include: {
    items: {
      include: {
        product: true
      }
    }
  }
});

// Calculate total
const total = cart.items.reduce((sum, item) => {
  return sum + (Number(item.product.basePrice) * item.quantity);
}, 0);

// Return as number (will be JSON serialized)
return Response.json({ total });
```

## 🧪 Testing Checklist

Before committing:

- [ ] No TypeScript errors (`npm run build`)
- [ ] All Decimal fields wrapped in Number()
- [ ] All nullable fields checked before use
- [ ] Correct model names used
- [ ] Correct field names used
- [ ] Correct enum values used
- [ ] No non-existent fields in queries

## 📚 Quick Links

- [Full Schema Fixes](./SCHEMA-FIXES.md)
- [Release Notes](./SALEM-01-RELEASE-NOTES.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**Last Updated**: November 22, 2025 (Salem 01 Release)
