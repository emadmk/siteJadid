# Order System Complete Fix Plan

## Total: 22 Issues to Fix

---

## Phase 1: CRITICAL Security & Financial Fixes (Issues 1-3)

### Fix #1: Amount Tampering Prevention
- **File:** `src/app/api/payments/checkout/route.ts`
- **Problem:** Payment amount comes from client with no server-side validation against order total
- **Fix:** When `orderId` is provided, enforce `amount === order.total`. Reject mismatched amounts.

### Fix #2: Coupon Discount Not Applied in Backend
- **Files:** `src/app/api/orders/route.ts`, `src/components/storefront/checkout/CheckoutForm.tsx`
- **Problem:** Frontend calculates `total = subtotal - discount + shipping + tax` but backend does `total = subtotal + shipping + tax`
- **Fix:** Accept discount data (couponCode, discountAmount, discountType) in order creation API. Validate coupon server-side. Apply discount to total.

### Fix #3: Inventory Decremented Before Payment
- **File:** `src/app/api/orders/route.ts`
- **Problem:** Stock reduced immediately, even if payment hasn't been confirmed
- **Fix:** For card payments, only reduce inventory after payment confirmation (in webhook). For invoice/net30, keep current behavior.

---

## Phase 2: HIGH Priority Fixes (Issues 4-9)

### Fix #4: Duplicate Stripe Webhook Handlers
- **Files:** `src/app/api/payments/stripe/webhook/route.ts` (remove), `src/app/api/webhooks/stripe/route.ts` (keep)
- **Problem:** Two separate webhook endpoints handling same events
- **Fix:** Remove the secondary handler at `/api/payments/stripe/webhook/`. Keep only `/api/webhooks/stripe/`.

### Fix #5: Shipping Markup Not Applied
- **File:** `src/lib/services/shippo.ts`
- **Problem:** `markupType` and `markupValue` fields exist in DB but never used
- **Fix:** After fetching Shippo rates, apply markup from ShippingService settings before returning to customer.

### Fix #6: Stripe Fee Tracking
- **Files:** `src/app/api/webhooks/stripe/route.ts`, `src/app/admin/accounting/revenue/page.tsx`
- **Problem:** Stripe processing fees (2.9% + $0.30) not tracked
- **Fix:** Extract fee from charge object in webhook. Store in PaymentTransaction. Show in revenue reports.

### Fix #7: Tax Calculation Inconsistency
- **File:** `src/app/api/orders/route.ts`
- **Problem:** Uses both original and normalized accountType. GSA without approval gets tax exempt.
- **Fix:** Use only the normalized `accountType` variable for tax check. Only GOVERNMENT (approved GSA) is exempt.

### Fix #8: Commission API Authorization Mismatch
- **File:** `src/app/api/admin/commissions/route.ts`
- **Problem:** API only allows ADMIN but page allows SUPER_ADMIN and ACCOUNTANT too
- **Fix:** Add SUPER_ADMIN and ACCOUNTANT to the API authorization check.

### Fix #9: Inventory Race Condition
- **File:** `src/app/api/orders/route.ts`
- **Problem:** No database transaction wrapping stock check and decrement
- **Fix:** Use Prisma interactive transaction with proper isolation. Check stock inside transaction.

---

## Phase 3: MEDIUM Priority Fixes (Issues 10-17)

### Fix #10: Invoice PDF Generation
- **File:** `src/app/api/admin/invoices/[id]/pdf/route.ts`
- **Problem:** Returns HTML not PDF. Address field names wrong.
- **Fix:** Fix address field names (address1 not addressLine1). Keep HTML format but fix content-type and extension.

### Fix #11: Duplicate Order Pages Consolidation
- **Files:** `src/app/orders/page.tsx`, `src/app/account/orders/page.tsx`
- **Problem:** Two nearly identical order listing pages
- **Fix:** Make `/orders` redirect to `/account/orders`. Keep `/orders/[orderNumber]` for Stripe redirect.

### Fix #12: Track Order Rate Limiting & Data Exposure
- **File:** `src/app/api/track-order/route.ts`
- **Problem:** No rate limiting, returns full addresses
- **Fix:** Add basic rate limiting. Reduce returned data to order status, tracking number, carrier only.

### Fix #13: Missing Subtotal in Discount Calculation
- **File:** `src/app/api/orders/route.ts`
- **Problem:** `calculateProductDiscount()` called without subtotal parameter
- **Fix:** Pass running subtotal to the function so minimum order discounts work.

### Fix #14: Profit/Loss in Revenue Page
- **File:** `src/app/admin/accounting/revenue/page.tsx`
- **Problem:** Only shows revenue, no cost/profit data
- **Fix:** Add cost tracking using product costPrice. Calculate profit = revenue - costs - stripe fees - shipping costs.

### Fix #15: Fake Address in Shippo
- **File:** `src/app/api/shipping/rates/route.ts`
- **Problem:** Uses `123 Main St` as fallback when address missing
- **Fix:** Require valid address. Return error if street1 is missing.

### Fix #16: Retry Payment After Failure
- **File:** `src/app/orders/[orderNumber]/page.tsx`
- **Problem:** "Retry Payment" button exists but doesn't work
- **Fix:** Add working retry flow that redirects back to checkout with the order pre-loaded.

### Fix #17: Non-functional Buttons
- **Files:** Multiple order pages
- **Problem:** Invoice Download, Cancel Order buttons not wired
- **Fix:** Wire Cancel Order to existing API. Wire Invoice Download to existing PDF API.

---

## Phase 4: LOW Priority Fixes (Issues 18-22)

### Fix #18: Stripe Payment Description
- **File:** `src/app/api/payments/checkout/route.ts`
- **Problem:** Description says "Checkout payment" instead of order number
- **Fix:** Always include order number in description when available.

### Fix #19: Shippo Test Mode
- **File:** `src/lib/services/shippo.ts`
- **Problem:** Test mode setting exists but is never checked
- **Fix:** Use test mode setting to select Shippo API endpoint or add test mode indicator.

### Fix #20: Shippo Tracking Webhook
- **File:** `src/app/api/webhooks/shippo/route.ts` (new)
- **Problem:** No webhook handler for Shippo tracking updates
- **Fix:** Create basic webhook endpoint for Shippo tracking events.

### Fix #21: Hardcoded Fallback Shipping Rates
- **File:** `src/app/api/shipping/rates/route.ts`
- **Problem:** Fallback rates are hardcoded
- **Fix:** Read fallback rates from database settings.

### Fix #22: Shippo API Key Encryption
- **File:** `src/lib/services/shippo.ts`
- **Problem:** API key stored as plain text
- **Fix:** Add basic obfuscation for API keys in settings display. Keys already in DB which is acceptable for server-side only access.

---

## Execution Order

1. Fixes 1-3 (Critical) - Must be done first, affects order creation
2. Fixes 7, 9 (also in order creation) - Same file, do together
3. Fixes 4, 6, 8 (Stripe/Admin) - Independent fixes
4. Fix 5, 15, 19, 21 (Shippo) - Shipping related
5. Fixes 10, 14 (Admin accounting) - Financial reports
6. Fixes 11, 16, 17 (Customer UI) - Order pages
7. Fixes 12, 13 (API fixes) - Smaller changes
8. Fixes 18, 20, 22 (Low priority) - Final cleanup
9. Build test - npm run build to verify no errors
