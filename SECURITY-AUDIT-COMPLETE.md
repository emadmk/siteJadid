# Security Audit Report - ADA Supply E-Commerce Platform

**Date:** 2026-02-17
**Scope:** Full codebase security review
**Project:** safety-equipment-store v1.0.0
**Framework:** Next.js 14.0.4 + Prisma + NextAuth
**Total API Routes:** 148 files in `src/app/api/`

---

## Executive Summary

| Severity | Count |
|----------|-------|
| **CRITICAL** | 5 |
| **HIGH** | 20 |
| **MEDIUM** | 18 |
| **LOW** | 7 |
| **TOTAL** | **50** |

### Top 5 Most Dangerous Issues:
1. `/api/admin/make-admin/` - Open privilege escalation backdoor (no auth)
2. `/api/email/send/` - Open email relay (no auth)
3. `next@14.0.4` - 15 CVEs including middleware auth bypass (CVSS 9.1)
4. Payment amount tampering - 3 endpoints accept client-side amounts
5. Stored XSS via `dangerouslySetInnerHTML` on product descriptions

---

## PART 1: CRITICAL VULNERABILITIES (5)

### CRIT-1: Open Admin Privilege Escalation Endpoint
- **File:** `src/app/api/admin/make-admin/route.ts` (lines 7-127)
- **Severity:** CRITICAL
- **Description:** This endpoint allows ANY user on the internet to promote ANY email to `SUPER_ADMIN` by sending a `secretKey`. The secret key defaults to the hardcoded literal `'change-me-in-production'` (line 13). NO session authentication required. The GET handler also exposes the ENTIRE user list (id, email, name, role) to anyone with the key.
- **Impact:** Full administrative takeover of the application.
- **Fix:** DELETE this file immediately or add proper session-based auth + SUPER_ADMIN role check.

### CRIT-2: Open Email Relay (No Auth)
- **File:** `src/app/api/email/send/route.ts` (lines 6-82)
- **Severity:** CRITICAL
- **Description:** Anyone can call this endpoint with `to`, `subject`, and `html` fields to send emails using the application's credentials. No authentication. No rate limiting. No HTML sanitization.
- **Impact:** Spam/phishing abuse, domain blacklisting, email service cost exhaustion.
- **Fix:** Add authentication + admin role check. Add rate limiting. Sanitize HTML content.

### CRIT-3: Next.js 14.0.4 Has 15 Known CVEs
- **File:** `package.json` line 65: `"next": "14.0.4"`
- **Severity:** CRITICAL (CVSS 9.1)
- **Description:** The Next.js version has 15 separate CVEs including:
  - **GHSA-f82v-jwr5-mffw** - Authorization Bypass in Middleware (CVSS 9.1)
  - **GHSA-fr5h-rqp8-mj6g** - SSRF in Server Actions (CVSS 7.5)
  - **GHSA-gp8f-8m3g-qvj9** - Cache Poisoning (CVSS 7.5)
  - **GHSA-7gfc-8cq8-jh5f** - Authorization bypass (CVSS 7.5)
  - Plus 11 more DoS, SSRF, and info disclosure vulnerabilities
- **Impact:** Attackers can bypass all middleware auth checks, perform SSRF, poison cache.
- **Fix:** `npm install next@14.2.35` (patch upgrade, low risk)

### CRIT-4: Stored XSS via Product Descriptions
- **File:** `src/components/storefront/products/ProductDetail.tsx` (line 851)
- **Severity:** CRITICAL
- **Description:** `dangerouslySetInnerHTML={{ __html: product.description }}` renders unsanitized HTML from database. HTML enters through:
  1. Admin rich text editor with raw HTML mode (`src/components/ui/rich-text-editor.tsx` line 103-106)
  2. PiP Excel import (`src/lib/services/pip-import.ts` lines 830-886) which builds HTML from unescaped spreadsheet data
- **Impact:** Any admin or malicious Excel import can inject JavaScript that executes on every visitor's browser (cookie theft, session hijacking).
- **Fix:** Install DOMPurify and sanitize: `dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}`

### CRIT-5: `xlsx` Package Has Unfixable Vulnerabilities
- **File:** `package.json` line 78: `"xlsx": "^0.18.5"`
- **Severity:** CRITICAL (CVSS 7.8 - Prototype Pollution + ReDoS)
- **Description:** The `xlsx` package (SheetJS community edition) has NO fix available. Used in 12+ files. The project already has `exceljs` installed (used in 2 files) doing the same work.
- **Impact:** Prototype pollution can lead to RCE. ReDoS can cause server DoS.
- **Fix:** Migrate all 12+ usages from `xlsx` to `exceljs`, then `npm uninstall xlsx`.

---

## PART 2: HIGH SEVERITY VULNERABILITIES (20)

### AUTH-H1: Missing Admin Role Check on Bulk Export
- **File:** `src/app/api/bulk/export/route.ts` (lines 6-72)
- **Description:** Only checks `session?.user?.id`. Any logged-in customer can export ALL products and ALL orders (including every customer's email and order totals).
- **Fix:** Add admin role check: `if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role))`

### AUTH-H2: Missing Admin Role Check on Bulk Import
- **File:** `src/app/api/bulk/import/route.ts` (lines 28-67)
- **Description:** Any authenticated user can bulk-import products.
- **Fix:** Add admin role check.

### AUTH-H3: Missing Admin Role Check on Webhooks
- **File:** `src/app/api/webhooks/route.ts` (lines 6-45)
- **Description:** Any logged-in user can list all webhooks (including secrets) and create new ones pointing to arbitrary URLs.
- **Fix:** Add admin role check.

### AUTH-H4: Reviews GET Exposes User Emails Publicly
- **File:** `src/app/api/reviews/route.ts` (lines 7-60)
- **Description:** GET handler has no authentication. Includes `email: true` in user select (line 27). Anyone can scrape all user emails.
- **Fix:** Remove `email: true` from the select. Add pagination limits.

### PAY-H1: Payment Amount Tampering (Stripe create-intent)
- **File:** `src/app/api/payments/create-intent/route.ts` (lines 7-45)
- **Description:** Accepts `amount` directly from client. Creates Stripe PaymentIntent without validating against order total. Attacker can pay $0.01 for any order.
- **Fix:** Fetch order from database and use `order.total` instead of client amount.

### PAY-H2: Payment Amount Tampering (Stripe create-payment)
- **File:** `src/app/api/payments/stripe/create-payment/route.ts` (lines 8-89)
- **Description:** Same as PAY-H1. Line 48: `amount: Math.round(data.amount * 100)` is client-controlled.
- **Fix:** Validate amount against order total from database.

### PAY-H3: Payment Amount Tampering (PayPal create-order)
- **File:** `src/app/api/payments/paypal/create-order/route.ts` (lines 7-123)
- **Description:** Same as PAY-H1. Line 74 uses `data.amount.toFixed(2)` directly from client.
- **Fix:** Validate amount against order total from database.

### PAY-H4: Client-Supplied Shipping Cost Trusted
- **File:** `src/app/api/orders/route.ts` (lines 301-308)
- **Description:** Lines 303-304: `if (typeof providedShippingCost === 'number') { shippingCost = providedShippingCost; }`. Attacker can pass `shippingCost: 0` or negative.
- **Fix:** Always calculate shipping server-side. Never trust client value.

### XSS-H1: document.write() with Unvalidated API Response
- **File:** `src/app/admin/accounting/invoices/page.tsx` (lines 130-133)
- **Description:** HTML from invoice API written directly via `document.write()` into new window.
- **Fix:** Use sandboxed iframe or sanitize with DOMPurify.

### XSS-H2: Unsanitized HTML in Email Template Preview
- **File:** `src/app/admin/marketing/emails/page.tsx` (line 680)
- **Description:** `dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }}` - email template HTML rendered without sanitization. Could be used for privilege escalation between admin roles.
- **Fix:** Use `<iframe sandbox="" srcDoc={...}>` for preview.

### XSS-H3: HTML from Import Data Not Escaped
- **File:** `src/lib/services/pip-import.ts` (lines 830-886)
- **Description:** Values from Excel rows interpolated directly into HTML strings. Malicious Excel can inject `<img onerror=alert(1)>`.
- **Fix:** Create `escapeHtml()` utility and escape all interpolated values.

### DATA-H1: Admin Settings API Exposes Secret Keys
- **File:** `src/app/api/admin/settings/route.ts` (lines 47-133)
- **Description:** GET response includes `payment.stripeSecretKey`, `payment.stripeWebhookSecret`, `payment.paypalClientSecret`, `shipping.shippoApiKey` as raw values.
- **Fix:** Mask all secret keys (show only last 4 chars).

### DATA-H2: Bulk Export Leaks All Customer Emails
- **File:** `src/app/api/bulk/export/route.ts` (lines 42-58)
- **Description:** Combined with AUTH-H1, any authenticated user can download all customer emails as CSV.
- **Fix:** Fix auth (AUTH-H1) and limit exported fields.

### DEP-H1: nodemailer DoS + Email Misdirection
- **File:** `package.json` line 68: `"nodemailer": "^6.9.7"` (installed 6.10.1)
- **Description:** GHSA-rcmh-qjqh-p98v (DoS via recursive address parsing), GHSA-mm7p-fcc7-pg87 (email to unintended domain)
- **Fix:** `npm install nodemailer@8`

### DEP-H2: axios DoS via __proto__ Key
- **File:** `package.json` line 55: `"axios": "^1.6.2"`
- **Description:** GHSA-43fc-jf86-j433 (CVSS 7.5)
- **Fix:** `npm install axios@latest`

### DEP-H3: fast-xml-parser RangeError DoS (via resend -> AWS SDK)
- **Description:** 16 `@aws-sdk/*` packages affected through `resend` dependency.
- **Fix:** `npm install resend@latest`

### RATE-H1: No Rate Limiting on ANY Endpoint
- **Files:** All route files
- **Description:** No rate limiting on:
  - `/api/auth/signup/` - unlimited account creation
  - `/api/track-order/` - order number enumeration
  - `/api/gift-cards/check/` - gift card brute-forcing
  - `/api/coupons/validate/` - coupon code brute-forcing
  - `/api/contact/` - spam
  - `/api/email/send/` - open relay abuse
- **Fix:** Implement rate limiting middleware (e.g., `upstash/ratelimit` or custom Redis-based).

### AUTH-H5: JWT Secret Falls Back to Weak Default
- **File:** `src/lib/auth.ts`
- **Description:** `secret: process.env.NEXTAUTH_SECRET || 'fallback-secret'` - if env var missing, all sessions use predictable secret.
- **Fix:** Remove fallback. Throw error if `NEXTAUTH_SECRET` not set.

### AUTH-H6: Admin Route Middleware Incomplete
- **File:** `src/middleware.ts`
- **Description:** Middleware protects `/admin` routes but doesn't check user role. Relies on page-level auth. Any authenticated user can access admin pages.
- **Fix:** Add role check in middleware using JWT token claims.

### AUTH-H7: Session Callback Missing Role Refresh
- **File:** `src/lib/auth.ts`
- **Description:** User role added to JWT at sign-in but never refreshed from DB. If role is revoked, old JWT still has admin access until token expires.
- **Fix:** Refresh role from database in session callback periodically.

---

## PART 3: MEDIUM SEVERITY VULNERABILITIES (18)

| ID | File | Issue |
|----|------|-------|
| MED-1 | `src/app/api/chat/messages/route.ts` | POST allows unauthenticated message injection (senderId: undefined) |
| MED-2 | `src/app/api/chat/conversations/route.ts` | POST creates conversations without auth (spam/DoS vector) |
| MED-3 | `src/app/api/reviews/route.ts` (line 113) | No rating bounds validation (`parseInt(rating)` - allows 999999 or -1) |
| MED-4 | `src/app/api/reviews/[reviewId]/route.ts` (line 44) | Same rating bounds issue on PATCH |
| MED-5 | `src/app/api/orders/route.ts` (lines 117-128) | No ownership check on shippingAddressId/billingAddressId |
| MED-6 | `src/app/api/b2b/members/[memberId]/route.ts` | GET can leak cross-B2B profile data |
| MED-7 | `src/app/api/bulk-orders/route.ts` (lines 68-80) | CSV parsing: no sanitization, no line limit (DoS) |
| MED-8 | `src/middleware.ts` (lines 38, 64) | Missing `encodeURIComponent()` on callbackUrl |
| MED-9 | `next.config.js` (line 105) | CSP allows `unsafe-eval` and `unsafe-inline` |
| MED-10 | `src/app/api/admin/redis-settings/route.ts` | GET returns Redis password in plaintext |
| MED-11 | `src/app/api/track-order/route.ts` | Returns full statusHistory with internal admin notes |
| MED-12 | Multiple payment/email routes | Error responses include `error.message` (leaks stack traces) |
| MED-13 | `src/app/api/uploads/[...path]/route.ts` | Path traversal check only checks for `..` (misses URL-encoded) |
| MED-14 | `src/app/api/webhooks/route.ts` (line 37) | Weak webhook secret: `Math.random()` instead of `crypto.randomBytes()` |
| MED-15 | Multiple upload handlers | No client-side file size validation (slow fail) |
| MED-16 | Multiple upload inputs | `accept="image/*"` too permissive (allows SVG with scripts) |
| MED-17 | `src/app/b2b/bulk-orders/page.tsx` | CSV upload: no file type/size client validation |
| MED-18 | `lodash`, `markdown-it`, `undici` (transitive) | Moderate CVEs in transitive dependencies |

---

## PART 4: LOW SEVERITY VULNERABILITIES (7)

| ID | File | Issue |
|----|------|-------|
| LOW-1 | `src/app/api/admin/banners/route.ts` | File extension not sanitized (`.php` possible) |
| LOW-2 | `src/components/ui/rich-text-editor.tsx` | HTML mode allows arbitrary HTML (admin-only) |
| LOW-3 | `src/app/api/reviews/route.ts` | No server-side sanitization (safe due to React escaping) |
| LOW-4 | `@next-auth/prisma-adapter` | Package superseded by `@auth/prisma-adapter` |
| LOW-5 | `@sentry/nextjs` v7 | Many major versions behind (v10 current) |
| LOW-6 | `diff` (transitive) | DoS in parsePatch |
| LOW-7 | `preact`, `qs` (transitive) | Known CVEs, auto-fixable |

---

## PART 5: POSITIVE FINDINGS (What's Done Well)

1. **Server-side file upload validation** - Upload API validates file type whitelist and 10MB limit
2. **Zod validation on signup** - Registration API uses Zod schema validation
3. **React JSX auto-escaping** - Most user content rendered safely via `{value}`
4. **Security headers configured** - X-Frame-Options, HSTS, X-Content-Type-Options present
5. **No `eval()` or `.innerHTML` usage** found (except `document.write`)
6. **`rel="noopener noreferrer"`** properly used on external links
7. **Most routes use field whitelisting** - No direct `data: body` Prisma patterns found
8. **Stripe webhook signature verification** - Main webhook handler validates signatures
9. **Password hashing with bcrypt** - Proper password storage
10. **No install script malware** - All postinstall scripts are legitimate

---

## PART 6: npm audit Summary (27 vulnerabilities)

| Severity | Count | Auto-fixable |
|----------|-------|-------------|
| Critical | 1 (next.js) | No - manual upgrade needed |
| High | 22 | Partially |
| Moderate | 3 | Yes |
| Low | 1 | Yes |

---

## PART 7: REMEDIATION PRIORITY

### IMMEDIATE (Before Going Live)

```bash
# 1. Delete the backdoor
rm src/app/api/admin/make-admin/route.ts

# 2. Upgrade Next.js (fixes 15 CVEs)
npm install next@14.2.35

# 3. Upgrade vulnerable deps
npm install axios@latest
npm install resend@latest
npm audit fix

# 4. Install DOMPurify for XSS fix
npm install dompurify @types/dompurify
```

Then code changes:
1. Add auth to `/api/email/send/`
2. Add admin role checks to bulk export/import/webhooks
3. Sanitize product description rendering with DOMPurify
4. Validate payment amounts server-side (3 endpoints)
5. Remove email from public reviews API
6. Remove JWT secret fallback
7. Mask API keys in admin settings response

### SHORT-TERM (First Week)

8. Replace `xlsx` with `exceljs` in all 12+ files
9. Upgrade `nodemailer` to v8
10. Add rate limiting on sensitive endpoints
11. Fix shipping cost server-side validation
12. Add address ownership validation in orders
13. Escape HTML in pip-import.ts
14. Strengthen CSP (remove unsafe-eval/unsafe-inline)

### MEDIUM-TERM (First Month)

15. Add role check in middleware (not just page-level)
16. Implement session role refresh from database
17. Add rating bounds validation
18. Fix chat endpoint auth
19. Fix path traversal check (URL-encoded variants)
20. Add webhook secret with crypto.randomBytes()

---

## AREAS NOT COVERED IN THIS AUDIT

- **Penetration testing** - This was code review only, not runtime testing
- **Infrastructure security** - Server config, firewall, network
- **Third-party integrations** - Stripe/PayPal/Shippo API configuration
- **Performance/DoS resilience** - Load testing, memory limits
- **Mobile responsiveness security** - Touch-specific attacks
- **Social engineering** - Admin user training

---

*This report was generated from 6 parallel security analysis agents covering: API routes, authentication/middleware, frontend XSS, database/infrastructure, dependency vulnerabilities, and payment/data security.*
