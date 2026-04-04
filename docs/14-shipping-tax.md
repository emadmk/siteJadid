# 14. Shipping & Tax System

## Shipping

### Shippo Integration (`src/lib/services/shippo.ts`)

Live shipping rates from USPS, FedEx, UPS via Shippo API.

**Flow**:
```
Checkout → User enters address → POST /api/shipping/rates →
  Shippo API (origin + destination + weight) →
  Returns carrier options with prices →
  User selects rate → Stored in order
```

### Shipping Settings (Admin `/admin/settings`)

| Setting | Description |
|---------|-------------|
| `freeShippingEnabled` | Toggle free shipping |
| `freeThreshold` | Min amount for free shipping |
| `standardRate` | Flat rate fallback |
| `expressRate` | Express flat rate |
| `shippoApiKey` | Shippo API key |
| `shippoTestMode` | Test vs live mode |
| `markupFixedAmount` | Add $ to Shippo rates |
| `markupPercentage` | Add % to Shippo rates |
| `originName/Street/City/State/Zip` | Warehouse address |

### Flat-Rate Calculator (`src/lib/shipping-calculator.ts`)

Fallback when Shippo is unavailable:
```
weight > 20 lbs → $35
subtotal >= free threshold → $0
else → standardRate from settings
```

## Tax System

### Configuration (Admin `/admin/settings` → Tax Settings)

Tax rates are configurable **per customer type**:

| Customer Type | Default Enabled | Default Rate |
|--------------|:--------------:|:------------:|
| Personal Buyers | ✅ | 8% |
| B2C Customers | ✅ | 8% |
| B2B Customers | ✅ | 8% |
| Volume Buyers | ❌ | 0% |
| GSA Customers | ✅ | 8% |
| Government Buyers | ❌ | 0% |

### Tax in Order Creation

```typescript
// src/app/api/orders/route.ts
const taxSettings = await db.taxSettings.findFirst();
const taxFieldMap = {
  B2C:         { enabled: taxSettings.taxEnabledB2C,         rate: taxSettings.taxRateB2C },
  PERSONAL:    { enabled: taxSettings.taxEnabledPersonal,    rate: taxSettings.taxRatePersonal },
  VOLUME_BUYER:{ enabled: taxSettings.taxEnabledVolumeBuyer, rate: taxSettings.taxRateVolumeBuyer },
  GOVERNMENT:  { enabled: taxSettings.taxEnabledGovernment,  rate: taxSettings.taxRateGovernment },
  // ...
};
const customerTax = taxFieldMap[accountType];
let taxBase = subtotal - couponDiscount;
if (taxSettings.taxShipping) taxBase += shippingCost;
tax = customerTax.enabled ? taxBase * (customerTax.rate / 100) : 0;
```

### Tax Preview (Frontend)

- **Cart page**: Server component reads TaxSettings directly
- **Checkout**: Client fetches GET `/api/tax/rate` → returns rate for current user type
- **Consistent**: All paths read from same TaxSettings DB record

### Tax Exemption

- Customers upload tax exemption certificates at `/b2b/tax-exemption`
- Admin reviews at `/admin/tax-exemptions`
- Model: `TaxExemption { userId, status, certificateUrl }`

### TaxJar Integration (Optional)

- Provider selectable: Manual or TaxJar
- API: POST `/api/tax/calculate` with address + items
- Supports nexus-based state tax calculation
- Model: `TaxNexus { state, stateTaxRate, hasCountyTax, ... }`

---

*Next: [15 - Security](./15-security.md)*
