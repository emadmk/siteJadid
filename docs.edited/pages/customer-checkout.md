# Enhanced Checkout Page

## Overview

The Enhanced Checkout Page (`/checkout`) is a comprehensive order completion interface that supports B2C, B2B, and GSA customers with specialized features including approval workflows, cost center selection, and dynamic pricing based on account type.

**File Location:** `/home/user/siteJadid/src/app/checkout/page.tsx`

**Route:** `/checkout`

---

## User Access Requirements

- All authenticated customers
- Requires non-empty cart
- Redirects to `/cart` if cart is empty

---

## Features List

### Core Features
1. **Multi-Step Checkout Form**
   - Step 1: Shipping Address
   - Step 2: Cost Center Selection (B2B only)
   - Step 3: Shipping Method
   - Step 4: Payment Method

2. **Dynamic Pricing**
   - B2C: Base/Sale pricing + tax
   - B2B: Wholesale pricing, tax-exempt
   - GSA: GSA contract pricing, tax-exempt

3. **B2B Approval Workflow Integration**
   - Approval threshold checking
   - Order limit validation
   - Visual approval warnings

4. **Cost Center Budget Management**
   - Available cost centers display
   - Budget remaining calculations
   - Insufficient budget warnings

5. **Order Summary Sidebar**
   - Item preview with images
   - Pricing breakdown
   - Total calculation
   - Security badges

6. **B2B Quote Mode**
   - Alternative checkout for quote requests
   - Quote confirmation screen

---

## Database Queries Used

```typescript
async function getCheckoutData(userId: string) {
  const [cart, addresses, user, b2bMembership, costCenters] = await Promise.all([
    // Cart with product details
    db.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                slug: true,
                basePrice: true,
                salePrice: true,
                wholesalePrice: true,
                gsaPrice: true,
                images: true,
                weight: true,
              },
            },
          },
        },
      },
    }),
    // Saved addresses
    db.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    }),
    // User account info
    db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        accountType: true,
      },
    }),
    // B2B membership with approval settings
    db.b2BAccountMember.findFirst({
      where: { userId },
      include: {
        account: {
          select: {
            companyName: true,
            requiresApprovalAbove: true,
          },
        },
        costCenter: true,
      },
    }),
    // Available cost centers
    db.b2BAccountMember.findFirst({
      where: { userId },
      include: {
        account: {
          select: {
            costCenters: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                code: true,
                budget: true,
                spent: true,
              },
            },
          },
        },
      },
    }).then((member) => member?.account.costCenters || []),
  ]);

  return { cart, addresses, user, b2bMembership, costCenters };
}
```

---

## UI Components Breakdown

### 1. Shipping Address Selection
```typescript
<div className="bg-white rounded-lg border p-6">
  <div className="flex items-center gap-3 mb-6">
    <div className="w-8 h-8 rounded-full bg-safety-green-600 text-white">1</div>
    <h2 className="text-xl font-bold">Shipping Address</h2>
  </div>

  {defaultAddress ? (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-safety-green-600" />
        <div>
          <div className="font-medium">{defaultAddress.firstName} {defaultAddress.lastName}</div>
          <div className="text-sm text-gray-700">{defaultAddress.address1}</div>
          <div className="text-sm text-gray-700">
            {defaultAddress.city}, {defaultAddress.state} {defaultAddress.zipCode}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-gray-600 mb-4">No shipping address on file</div>
  )}

  <Button variant="outline">
    {defaultAddress ? 'Change Address' : 'Add Address'}
  </Button>
</div>
```

### 2. Cost Center Selection (B2B)
```typescript
{b2bMembership && costCenters.length > 0 && (
  <div className="bg-white rounded-lg border p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white">2</div>
      <h2 className="text-xl font-bold">Cost Center</h2>
    </div>

    <div className="space-y-3">
      {costCenters.map((cc) => {
        const remaining = Number(cc.budget) - Number(cc.spent);
        const canAfford = remaining >= total;

        return (
          <label
            key={cc.id}
            className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer ${
              canAfford ? 'border-gray-300 hover:border-blue-400' :
              'border-red-300 bg-red-50 cursor-not-allowed'
            }`}
          >
            <input type="radio" name="costCenter" value={cc.id} disabled={!canAfford} />
            <div className="flex-1">
              <div className="font-medium">{cc.name}</div>
              <div className="text-sm text-gray-600">
                Code: {cc.code} • Remaining: ${remaining.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Budget</div>
              <div className="font-bold">${Number(cc.budget).toLocaleString()}</div>
            </div>
          </label>
        );
      })}
    </div>

    {/* Insufficient Budget Warning */}
    {costCenters.every((cc) => Number(cc.budget) - Number(cc.spent) < total) && (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <div className="text-sm text-red-800">
          <div className="font-medium mb-1">Insufficient Budget</div>
          <div>None of your cost centers have sufficient budget for this order.</div>
        </div>
      </div>
    )}
  </div>
)}
```

### 3. Approval Warning Banner
```typescript
{requiresApproval && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-6 h-6 text-yellow-600" />
      <div>
        <div className="font-bold text-yellow-900 mb-2">Approval Required</div>
        <div className="text-sm text-yellow-800 mb-3">
          This order total (${total.toFixed(2)}) exceeds your company's approval threshold
          (${Number(b2bMembership.account.requiresApprovalAbove).toLocaleString()}).
          Your order will be sent for approval before processing.
        </div>
        {exceedsOrderLimit && (
          <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded p-2">
            ⚠️ This order also exceeds your personal order limit of
            ${Number(b2bMembership.orderLimit).toLocaleString()}.
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

### 4. Payment Method (B2B vs B2C)
```typescript
{isB2BAccount ? (
  <div className="space-y-3">
    <label className="flex items-center gap-4 p-4 border-2 border-safety-green-600 rounded-lg">
      <input type="radio" name="payment" defaultChecked />
      <div className="flex-1">
        <div className="font-medium">Net 30 Terms</div>
        <div className="text-sm text-gray-600">Pay within 30 days of invoice</div>
      </div>
    </label>
    <label className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg">
      <input type="radio" name="payment" />
      <div className="flex-1">
        <div className="font-medium">Credit Card</div>
        <div className="text-sm text-gray-600">Pay now with card</div>
      </div>
    </label>
  </div>
) : (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">Card Number</label>
      <input type="text" placeholder="1234 5678 9012 3456" className="w-full px-4 py-3 border rounded-md" />
    </div>
    {/* CVV and Expiry fields */}
  </div>
)}
```

### 5. Order Summary Sidebar
```typescript
<div className="lg:col-span-1">
  <div className="bg-white rounded-lg border p-6 sticky top-4">
    <h2 className="text-xl font-bold mb-6">Order Summary</h2>

    {/* Items */}
    <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
      {cart.items.map((item) => {
        let price = Number(item.product.salePrice || item.product.basePrice);
        if (isB2BAccount && item.product.wholesalePrice) {
          price = Number(item.product.wholesalePrice);
        } else if (isGSAAccount && item.product.gsaPrice) {
          price = Number(item.product.gsaPrice);
        }

        return (
          <div key={item.id} className="flex gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded">
              <img src={images[0]} alt={item.product.name} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium line-clamp-2">{item.product.name}</div>
              <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
            </div>
            <div className="text-sm font-bold">${(price * item.quantity).toFixed(2)}</div>
          </div>
        );
      })}
    </div>

    {/* Totals */}
    <div className="border-t pt-4 space-y-3 mb-6">
      <div className="flex justify-between text-gray-700">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-gray-700">
        <span>Shipping</span>
        <span>{estimatedShipping === 0 ? 'FREE' : `$${estimatedShipping.toFixed(2)}`}</span>
      </div>
      {!isB2BAccount && !isGSAAccount && (
        <div className="flex justify-between text-gray-700">
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
      )}
      {(isB2BAccount || isGSAAccount) && (
        <div className="text-xs text-safety-green-600">Tax-exempt account</div>
      )}
    </div>

    <div className="border-t pt-4 mb-6">
      <div className="flex justify-between items-center">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-3xl font-bold">${total.toFixed(2)}</span>
      </div>
    </div>

    <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
      <CreditCard className="w-5 h-5 mr-2" />
      Place Order
    </Button>

    {/* Security Badges */}
    <div className="mt-6 pt-6 border-t space-y-2 text-xs text-gray-600">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-safety-green-600" />
        <span>Secure 256-bit SSL encryption</span>
      </div>
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-safety-green-600" />
        <span>PCI DSS compliant payment processing</span>
      </div>
    </div>
  </div>
</div>
```

---

## Business Logic

### Price Calculation
```typescript
const subtotal = cart.items.reduce((sum, item) => {
  let price = Number(item.product.salePrice || item.product.basePrice);

  if (isB2BAccount && item.product.wholesalePrice) {
    price = Number(item.product.wholesalePrice);
  } else if (isGSAAccount && item.product.gsaPrice) {
    price = Number(item.product.gsaPrice);
  }

  return sum + price * item.quantity;
}, 0);
```

### Shipping Calculation
```typescript
const totalWeight = cart.items.reduce((sum, item) => {
  return sum + (item.product.weight || 0) * item.quantity;
}, 0);

const estimatedShipping = subtotal >= 99 ? 0 : totalWeight > 20 ? 35 : 15;
```

### Approval Check
```typescript
const requiresApproval = b2bMembership &&
  b2bMembership.account.requiresApprovalAbove &&
  total > Number(b2bMembership.account.requiresApprovalAbove);

const exceedsOrderLimit = b2bMembership &&
  b2bMembership.orderLimit &&
  total > Number(b2bMembership.orderLimit);
```

---

## Key Technical Details

### Performance
- Parallel data fetching for all checkout components
- Server-side rendering for instant page load
- Efficient pricing calculations

### Security
- Server-side authentication check
- Cart validation before checkout
- Secure payment processing indicators
- SSL and PCI DSS badges

### User Experience
- Progressive disclosure (step-by-step)
- Clear visual indicators for each step
- Contextual warnings and messages
- Sticky order summary sidebar
- Account type-specific features

---

## Future Enhancements

1. **Guest Checkout** - Allow non-authenticated users to checkout
2. **Save Payment Methods** - Store cards for B2C customers
3. **Address Validation** - Real-time address verification
4. **Shipping Calculator** - Real-time shipping quotes
5. **Promo Codes** - Discount code application
6. **Gift Options** - Gift wrapping and messages
