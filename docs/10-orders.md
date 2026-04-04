# 10. Order & Payment System

## Order Creation Flow

```
Cart → POST /api/orders → 
  1. Validate session & cart
  2. Calculate discounts per account type
  3. Validate coupon (if provided)
  4. Calculate shipping (Shippo rate or flat-rate)
  5. Calculate tax (per customer type from TaxSettings)
  6. Create order in transaction:
     - Create Order + OrderItems
     - Decrement product stock
     - Decrement variant stock
     - Clear cart
     - Create approval (if B2B threshold)
     - Increment coupon usage
  7. Send order confirmation email
  8. Send admin notification email + in-app notification
  9. Return order
```

## Order Statuses

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓         ↓          ↓
  ON_HOLD  CANCELLED   CANCELLED → REFUNDED
```

## Payment Methods

| Method | Type | Flow |
|--------|------|------|
| Credit/Debit Card | Stripe Elements | PaymentIntent → confirm → webhook |
| Net 30 Invoice | B2B only | Order created → invoice sent → payment later |
| Purchase Order | B2B/Gov | PO number stored, manual payment |
| GSA SmartPay | Government | P-Card processing |

### Stripe Integration (`src/lib/stripe.ts`)

```
Checkout → Create PaymentIntent (amount, metadata)
        → Stripe Elements renders card form
        → User submits → Stripe confirms
        → Webhook: payment_intent.succeeded → Update order paymentStatus=PAID
```

## Tax Calculation

### Per-Customer-Type Tax (`TaxSettings` model)

| Field | Type | Default |
|-------|------|---------|
| `taxEnabledB2C` | boolean | true |
| `taxRateB2C` | decimal | 8% |
| `taxEnabledPersonal` | boolean | true |
| `taxRatePersonal` | decimal | 8% |
| `taxEnabledVolumeBuyer` | boolean | false |
| `taxRateVolumeBuyer` | decimal | 0% |
| `taxEnabledGovernment` | boolean | false |
| `taxRateGovernment` | decimal | 0% |
| `taxShipping` | boolean | true/false |

### Tax Flow in Order Creation

```typescript
const taxSettings = await db.taxSettings.findFirst();
const taxFieldMap = {
  B2C: { enabled: taxSettings.taxEnabledB2C, rate: taxSettings.taxRateB2C },
  GOVERNMENT: { enabled: taxSettings.taxEnabledGovernment, rate: taxSettings.taxRateGovernment },
  // ... etc
};
const customerTax = taxFieldMap[accountType];
tax = customerTax.enabled ? taxableAmount * (customerTax.rate / 100) : 0;
```

## Shipping

### Shippo Integration (`src/lib/services/shippo.ts`)

```
Checkout → POST /api/shipping/rates
  → Send to Shippo: origin address, destination, package weight
  → Return carrier rates (USPS, FedEx, UPS)
  → User selects rate
  → Rate stored in order
```

### Settings (admin configurable)
- Free shipping threshold
- Markup: fixed amount + percentage on Shippo rates
- Origin address (warehouse)
- Carrier selection

## Order Admin Features

### Status Update (`OrderStatusUpdater`)
- Select new status → optional notes
- Creates `OrderStatusHistory` entry
- Sends customer email notification
- Sends admin email notification
- Creates in-app notification

### Print Documents (`OrderPrintButtons`)
1. **Invoice/Accounting** - US-standard commercial invoice
2. **Packing Slip** - Warehouse picking with checkboxes
3. **Shipping Label** - FROM/TO addresses, order number

### Admin Notes (`AdminNotesEditor`)
- Editable textarea with auto-save on blur
- PUT `/api/admin/orders/[id]` with `{ adminNotes }`
- Visible only to admin staff

### Customer Email (`EmailComposer`)
- Pre-filled with customer email
- 20 quick templates (shipping delay, address confirm, payment reminder, etc.)
- Uses branded HTML template
- Customer search dropdown

---

*Next: [11 - User & Customer Management](./11-users.md)*
