# Security Audit Report - ADA Supply E-Commerce Platform

**Audit Date:** February 16, 2026
**Auditor:** Automated Deep Security Audit (Claude AI - 3 parallel agents + manual review)
**Platform:** Next.js 14+ App Router / Prisma / PostgreSQL / Stripe / PayPal
**Target Market:** United States (US)
**Compliance Standards:** OWASP Top 10 (2025), PCI-DSS 4.0, NIST 800-53, SOC 2
**API Routes Analyzed:** 162 files
**Components Analyzed:** 38+ frontend files with form/upload handling

---

## Executive Summary

This comprehensive security audit identified **50 vulnerabilities** across the codebase through line-by-line review of all API routes, authentication system, frontend components, and infrastructure configuration. Of these:

| Severity | Count | Requires Fix Before Launch |
|----------|-------|---------------------------|
| **CRITICAL** | 7 | YES - IMMEDIATELY |
| **HIGH** | 15 | YES - Before Go-Live |
| **MEDIUM** | 18 | Recommended Before Launch |
| **LOW** | 10 | Post-Launch Improvement |

**Overall Risk Level: CRITICAL** - Multiple payment bypass and privilege escalation vulnerabilities must be fixed before production deployment.

### Positive Findings
The audit also identified well-implemented security patterns:
- Stripe webhook signature verification is correctly implemented (`constructWebhookEvent()`)
- Order creation recalculates product prices server-side (doesn't trust client prices)
- `/api/payments/checkout` correctly validates payment amount against order total
- Password hashing uses bcrypt with cost factor 12
- Signup route strips password from response
- Address routes correctly verify user ownership (IDOR protection)
- Admin user management has proper RBAC with escalation prevention

---

## CRITICAL Vulnerabilities (Fix Immediately)

### C-1: Admin Privilege Escalation Endpoint Exposed
- **File:** `src/app/api/admin/make-admin/route.ts`
- **Lines:** 7-88 (entire file)
- **CVSS Score:** 9.8 / 10
- **Description:** The `/api/admin/make-admin` endpoint allows ANY unauthenticated user to escalate privileges to `SUPER_ADMIN`. The default secret key is hardcoded as `'change-me-in-production'` (line 13). If `ADMIN_SETUP_KEY` env var is not set, this default is used. The GET endpoint (line 91) lists ALL users with emails and roles.
- **Attack Vector:**
  ```bash
  curl -X POST https://yoursite.com/api/admin/make-admin \
    -H "Content-Type: application/json" \
    -d '{"email":"attacker@evil.com","role":"SUPER_ADMIN","secretKey":"change-me-in-production"}'
  ```
- **Impact:** Complete system takeover. Full admin access to all data.
- **Remediation:** **DELETE this file entirely** before production deployment.

---

### C-2: Open Email Relay - No Authentication
- **File:** `src/app/api/email/send/route.ts`
- **Lines:** 6-82
- **CVSS Score:** 9.1 / 10
- **Description:** The `/api/email/send` endpoint has **ZERO authentication**. No `getServerSession` call exists. Anyone on the internet can send arbitrary emails through the configured email service (Resend, SendGrid, SES) by posting `to`, `subject`, and `html` fields.
- **Attack Vector:**
  ```bash
  curl -X POST https://yoursite.com/api/email/send \
    -H "Content-Type: application/json" \
    -d '{"to":"victim@email.com","subject":"Urgent","html":"<a href=\"http://evil.com\">Click here</a>"}'
  ```
- **Impact:** Phishing attacks using your domain, spam, email service quota exhaustion, domain reputation damage, potential blacklisting.
- **Remediation:** Add authentication AND admin role verification:
  ```typescript
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  ```

---

### C-3: Payment Amount Bypass - `/api/payments/create-intent`
- **File:** `src/app/api/payments/create-intent/route.ts`
- **Lines:** 15-35
- **CVSS Score:** 9.4 / 10
- **Description:** The payment intent amount comes entirely from the client request. When an `orderId` is provided, the order is fetched only for ownership check -- the `order.total` is **never compared** against the client-supplied `amount`. An attacker can pay $0.01 for a $1,000 order.
- **Contrast:** `/api/payments/checkout/route.ts` (lines 113-121) correctly validates amount -- this route does NOT.
- **Attack Vector:** Intercept checkout request, change `amount` to `0.01`, complete payment.
- **Impact:** Direct financial loss on every order.
- **Remediation:**
  ```typescript
  if (orderId) {
    const order = await db.order.findUnique({ where: { id: orderId } });
    const orderTotalCents = Math.round(Number(order.total) * 100);
    const requestAmountCents = Math.round(amount * 100);
    if (orderTotalCents !== requestAmountCents) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }
  }
  ```

---

### C-4: Payment Amount Bypass - `/api/payments/stripe/create-payment`
- **File:** `src/app/api/payments/stripe/create-payment/route.ts`
- **Lines:** 16-58
- **CVSS Score:** 9.4 / 10
- **Description:** Same vulnerability as C-3. `data.amount` and `data.currency` come entirely from the client. When `data.orderId` is provided, it is stored in metadata but never used to verify the amount.
- **Remediation:** Require `orderId`, fetch order, verify ownership, use order total as authoritative amount.

---

### C-5: Payment Amount Bypass - `/api/payments/paypal/create-order`
- **File:** `src/app/api/payments/paypal/create-order/route.ts`
- **Lines:** 15-84
- **CVSS Score:** 9.4 / 10
- **Description:** PayPal order created with `data.amount` directly from client. No server-side verification against any order record. Combined with C-6, creates a complete payment bypass chain.
- **Remediation:** Same pattern: require `orderId`, fetch order total, use as authoritative amount.

---

### C-6: PayPal Capture Without Amount Verification
- **File:** `src/app/api/payments/paypal/capture-order/route.ts`
- **Lines:** 78-106
- **CVSS Score:** 9.0 / 10
- **Description:** After capturing PayPal payment, the code marks the order as `PAID` without verifying that the captured amount matches the order total. Combined with C-5, an attacker can: create PayPal order for $0.01 -> capture it -> system marks internal order as PAID.
- **Remediation:** After capture, compare `captureData.purchase_units[0].payments.captures[0].amount.value` against order total before marking PAID.

---

### C-7: No Rate Limiting on Authentication Endpoints
- **File:** `src/app/api/auth/signup/route.ts`, `src/lib/auth.ts` (CredentialsProvider)
- **CVSS Score:** 8.1 / 10
- **Description:** ZERO rate limiting on login or signup. The `.env.example` defines `RATE_LIMIT_MAX=100` but these variables are **never used anywhere in the code**. No rate limiting exists on ANY endpoint in the entire codebase.
- **Impact:** Brute-force password attacks, credential stuffing, signup spam, DoS.
- **Remediation:** Install `@upstash/ratelimit`:
  ```typescript
  import { Ratelimit } from '@upstash/ratelimit';
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1m'),
  });
  ```

---

## HIGH Vulnerabilities (Fix Before Go-Live)

### H-1: API Routes Completely Unprotected by Middleware
- **File:** `src/middleware.ts:89`
- **Description:** Middleware matcher excludes ALL API routes: `'/((?!api|...)'`. No middleware-level auth runs for any `/api/*` endpoint. Each route must self-implement auth, leading to missed routes (see C-2, H-2, H-4).
- **Remediation:** Remove `api` from exclusion, whitelist public endpoints.

### H-2: Admin Product Images - No Auth on GET, No Role Check on Others
- **File:** `src/app/api/admin/products/images/route.ts`
- **Description:**
  - **GET** (lines 124-146): NO authentication at all. Anyone can list product images.
  - **POST** (lines 8-121): Session check but NO admin role check. Any customer can upload images.
  - **DELETE** (lines 149-205): Session check but NO admin role check. Any customer can delete product images.
  - **PATCH** (lines 208-260): Session check but NO admin role check. Any customer can modify image metadata.
- **Remediation:** Add admin role verification to all handlers.

### H-3: Shippo Webhook - No Signature Verification
- **File:** `src/app/api/webhooks/shippo/route.ts`
- **Lines:** 10-109
- **Description:** Unlike the Stripe webhook (which correctly verifies signatures), the Shippo webhook accepts ANY POST body without verification. An attacker can forge `track_updated` events to mark orders as `DELIVERED` without actual delivery.
- **Remediation:** Verify `Shippo-Webhook-Hmac-SHA256` header:
  ```typescript
  const signature = request.headers.get('shippo-webhook-hmac-sha256');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  if (signature !== expected) return NextResponse.json({ error: 'Invalid' }, { status: 401 });
  ```

### H-4: Webhook Management Accessible to All Authenticated Users
- **File:** `src/app/api/webhooks/route.ts`
- **Lines:** 6-44
- **Description:** GET and POST only check `session?.user?.id`. Any customer can list ALL webhooks (including secrets) and create new webhooks pointing to attacker-controlled URLs to receive real-time order/payment data. Webhook secret uses `Math.random()`.
- **Remediation:** Add admin role check. Use `crypto.randomBytes()`. Don't return secrets in GET.

### H-5: Client-Supplied Shipping Cost Not Validated
- **File:** `src/app/api/orders/route.ts:302-308`
- **Description:** `providedShippingCost` accepted directly from client. Attacker can set to 0 or negative.
- **Remediation:** Recalculate server-side or validate against shipping provider API.

### H-6: Stored XSS via Product Descriptions
- **File:** `src/components/storefront/products/ProductDetail.tsx:851`
- **Description:** `dangerouslySetInnerHTML={{ __html: product.description }}` without sanitization.
- **Remediation:** Use `DOMPurify.sanitize(product.description)`.

### H-7: Stored XSS via Email Templates
- **File:** `src/app/admin/marketing/emails/page.tsx:680`
- **Description:** `dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }}` in admin panel.
- **Remediation:** Sanitize with DOMPurify, use sandboxed iframe.

### H-8: HTML Injection in B2B Inquiry Emails
- **File:** `src/app/api/storefront/b2b-inquiry/route.ts`
- **Lines:** 67-77
- **Description:** User-supplied `name`, `companyName`, `address`, `telephone`, `industry` are interpolated directly into HTML email without escaping. Attacker can inject arbitrary HTML/JavaScript into emails sent to admins.
- **Remediation:** HTML-encode all user inputs before email interpolation.

### H-9: JWT Token Role Never Refreshed
- **File:** `src/lib/auth.ts:92-100`
- **Description:** JWT stores role/accountType/approvalStatus set only at login. If admin revokes access, JWT carries old permissions for up to 30 days.
- **Remediation:** Periodic refresh from database in JWT callback (every 5 minutes).

### H-10: Session Max Age Too Long (30 Days)
- **File:** `src/lib/auth.ts:36`
- **Description:** `maxAge: 30 * 24 * 60 * 60`. Excessive for financial transactions.
- **Remediation:** 24 hours for users, 2 hours for admins, idle timeout.

### H-11: Error Details Leaked to Clients (50+ Routes)
- **Files:** Multiple payment and admin routes
- **Description:** `details: error.message` returned to clients in 50+ routes, including payment routes. Can leak database schema, API keys, internal paths.
- **Remediation:** Log internally, return generic error messages only.

### H-12: No Account Lockout After Failed Logins
- **File:** `src/lib/auth.ts:50-76`
- **Description:** Unlimited login attempts allowed. No tracking, no lockout.
- **Remediation:** Track attempts in Redis, lock after 5 failures for 15 minutes.

### H-13: Wildcard Remote Image Pattern (SSRF)
- **File:** `next.config.js:44`
- **Description:** `hostname: '**'` allows SSRF through `/_next/image` proxy.
- **Remediation:** Remove wildcard, list allowed hosts explicitly.

### H-14: Stripe Secret Key Stored in Database
- **File:** `src/app/api/payments/stripe/create-payment/route.ts:34,42`
- **Description:** Stripe keys in `PaymentGatewaySettings` DB table. DB compromise = Stripe key compromise.
- **Remediation:** Store Stripe keys ONLY in environment variables.

### H-15: Upload Endpoint - Any User Can Upload
- **File:** `src/app/api/upload/route.ts:8-11`
- **Description:** No role check. Any logged-in customer can upload files.
- **Remediation:** Restrict to admin/staff roles.

---

## MEDIUM Vulnerabilities (Recommended Before Launch)

### M-1: ~20 Admin Routes Exclude SUPER_ADMIN
- **Files:** `admin/backorders`, `admin/bundles`, `admin/customer-groups`, `admin/tiered-prices`, `admin/rma`, `admin/contracts`, and ~14 more
- **Description:** These routes use `session.user.role !== 'ADMIN'` (strict equality) instead of inclusive check. SUPER_ADMIN users are locked out.
- **Remediation:** Standardize to `!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)`.

### M-2: Coupon Validation - No Per-User Limit, No Auth Required
- **File:** `src/app/api/coupons/validate/route.ts`
- **Description:** Session fetched but never required. No per-user usage limit. Client-supplied subtotal for min-purchase check. No rate limiting enables coupon code brute-forcing.
- **Remediation:** Require auth, add per-user tracking, rate limit.

### M-3: Gift Card Check - Brute-Force Possible
- **File:** `src/app/api/gift-cards/check/route.ts`
- **Description:** No auth, no rate limiting. Returns balance for valid codes. Attacker can enumerate gift card codes.
- **Remediation:** Rate limit, CAPTCHA, or require authentication.

### M-4: Net Terms Application - Sensitive Data Without Auth
- **File:** `src/app/api/net-terms/route.ts`
- **Description:** Accepts company name, tax ID, annual revenue, bank details without authentication. No rate limiting.
- **Remediation:** Add CAPTCHA and rate limiting.

### M-5: Tax Calculate - No Auth, Paid API Abuse
- **File:** `src/app/api/tax/calculate/route.ts`
- **Description:** No authentication. Makes paid API calls to TaxJar. Attacker can exhaust API quota.
- **Remediation:** Require auth or rate limit per IP.

### M-6: Admin Settings - Arbitrary Key-Value Writes
- **File:** `src/app/api/admin/settings/route.ts`
- **Lines:** 155-253
- **Description:** POST iterates `Object.entries(settings)` from request body to write arbitrary key-value pairs. PUT accepts arbitrary `key` from user input. An admin could write/overwrite any setting.
- **Remediation:** Whitelist allowed setting keys.

### M-7: Weak Content Security Policy
- **File:** `next.config.js:104-105`
- **Description:** CSP includes `'unsafe-eval'` and `'unsafe-inline'` weakening XSS protection.
- **Remediation:** Remove `'unsafe-eval'`, use nonce-based CSP.

### M-8: Weak Password Policy
- **File:** `src/app/api/auth/signup/route.ts:12`
- **Description:** Only 8 char minimum. No complexity requirements.
- **Remediation:** 10+ chars, uppercase, lowercase, number, special character.

### M-9: No Email Verification Before Login
- **File:** `src/app/api/auth/signup/route.ts:71`
- **Description:** Users created with `emailVerified: null` can immediately login.
- **Remediation:** Implement email verification flow.

### M-10: Predictable Order Number Generation
- **File:** `src/app/api/orders/route.ts:324`
- **Description:** `Date.now()` + `Math.random()` = predictable.
- **Remediation:** Use `crypto.randomUUID()`.

### M-11: Path Traversal Protection Incomplete
- **File:** `src/app/api/uploads/[...path]/route.ts:26`
- **Description:** Only checks literal `..`. URL-encoded variants bypass this.
- **Remediation:** Use `path.resolve()` + verify within uploads directory.

### M-12: No CORS Configuration
- **Description:** No explicit CORS headers configured.
- **Remediation:** Add explicit CORS policy.

### M-13: No CSRF Protection
- **Description:** No CSRF tokens beyond NextAuth defaults.
- **Remediation:** SameSite cookies, Origin header verification.

### M-14: No File Count Limit on Uploads
- **Files:** `upload/route.ts`, `admin/products/images/route.ts`
- **Description:** Unlimited files per request. DoS vector.
- **Remediation:** Limit to 10-20 files per request.

### M-15: Contact Form Missing CAPTCHA
- **File:** `src/app/api/contact/route.ts`
- **Description:** No bot protection. Spam flooding possible.
- **Remediation:** Add reCAPTCHA v3 or hCaptcha.

### M-16: Track Order - Information Disclosure
- **File:** `src/app/api/track-order/route.ts`
- **Description:** Detailed order info returned with only order# + email. No rate limiting.
- **Remediation:** Rate limit, additional verification.

### M-17: Algolia Search - User-Supplied UserID in Logs
- **File:** `src/app/api/search/algolia/route.ts`
- **Description:** Accepts arbitrary `userId` and `sessionId` from client, stores in search log. Log poisoning.
- **Remediation:** Use server-side session user ID.

### M-18: Outdated Stripe API Version
- **File:** `src/app/api/payments/stripe/create-payment/route.ts:43`
- **Description:** Hardcoded `'2023-10-16'` -- over 2 years old.
- **Remediation:** Update to latest Stripe API version.

---

## LOW Vulnerabilities (Post-Launch Improvement)

### L-1: No Audit Logging for Admin Actions
### L-2: No Password History Enforcement
### L-3: No Multi-Factor Authentication (MFA/2FA)
### L-4: PII Logged to Console
- **File:** `src/app/api/contact/route.ts:32-40` -- Name, email, phone logged to stdout
- **File:** `src/app/api/webhooks/stripe/route.ts` -- 20+ console.log calls with payment IDs
### L-5: No Security Response Headers for API Routes
### L-6: Webhook Secret Uses Math.random()
### L-7: Development Logging Configuration
### L-8: Missing Input Validation (15+ Routes)
- Routes with no Zod or runtime type checking on mutating operations. Out of 118 routes parsing JSON bodies, only **8 use Zod**. Most rely on manual `if (!field)` checks or nothing.
### L-9: Bulk Orders CSV - No Line Limit (DoS)
- **File:** `src/app/api/bulk-orders/route.ts:65-66` -- `csvData` parsed with no limit on lines
### L-10: User Profile Image Field - No URL Validation
- **File:** `src/app/api/user/profile/route.ts:63` -- `image` accepts arbitrary string, could store XSS payload

---

## Pre-Launch Security Checklist

### DAY 1 - Must Fix (CRITICAL)

- [ ] **DELETE `/api/admin/make-admin/route.ts`** entirely
- [ ] **Add auth to `/api/email/send/route.ts`** -- currently an open email relay
- [ ] **Fix payment amount bypass** in `/api/payments/create-intent`, `/api/payments/stripe/create-payment`, `/api/payments/paypal/create-order`, `/api/payments/paypal/capture-order` -- validate amount against order total server-side
- [ ] **Implement rate limiting** on login, signup, and all unauthenticated endpoints
- [ ] Set strong `NEXTAUTH_SECRET` (min 32 chars): `openssl rand -base64 32`
- [ ] Set strong `ADMIN_SETUP_KEY` or remove the endpoint

### DAY 2 - Must Fix (HIGH)

- [ ] **Add admin role check** to `/api/admin/products/images` (all 4 methods) and `/api/webhooks`
- [ ] **Add Shippo webhook signature verification** (`Shippo-Webhook-Hmac-SHA256`)
- [ ] **Fix `dangerouslySetInnerHTML`** with DOMPurify in ProductDetail.tsx and email preview
- [ ] **HTML-encode** user inputs in B2B inquiry email template
- [ ] **Remove `error.message`** from all client-facing error responses (50+ routes)
- [ ] **Server-side shipping cost** validation (don't trust client)
- [ ] **Remove wildcard `hostname: '**'`** from next.config.js remotePatterns
- [ ] **Move Stripe keys** from database to environment variables only
- [ ] **Restrict upload endpoint** to admin roles
- [ ] **Reduce session maxAge** to 24 hours
- [ ] **Add JWT token refresh** for role changes

### WEEK 1 - Should Fix (MEDIUM)

- [ ] Fix ~20 admin routes that exclude SUPER_ADMIN
- [ ] Add auth to coupon validation, gift card check
- [ ] Add CAPTCHA to contact, signup, B2B inquiry forms
- [ ] Strengthen password policy (10+ chars, complexity)
- [ ] Add email verification flow
- [ ] Fix path traversal with `path.resolve()`
- [ ] Add CORS and CSRF protection
- [ ] Whitelist admin settings keys
- [ ] Update Stripe API version

### POST-LAUNCH Priorities

- [ ] Implement MFA/2FA for admin accounts
- [ ] Add audit logging for admin actions
- [ ] Set up WAF (Cloudflare / AWS WAF)
- [ ] Implement CSP nonces (remove unsafe-inline)
- [ ] Add password history enforcement
- [ ] Set up security monitoring (Sentry, Datadog)
- [ ] Professional penetration testing
- [ ] DDoS protection
- [ ] Regular dependency scanning (npm audit, Snyk)
- [ ] Implement structured logging (remove console.log PII)

---

## Environment Security Checklist

### Production Environment Variables

| Variable | Status | Notes |
|----------|--------|-------|
| `NODE_ENV` | Must be `production` | Controls logging, error display |
| `NEXTAUTH_SECRET` | Must be unique, 32+ chars | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Must match production domain | Include `https://` |
| `DATABASE_URL` | SSL required | Add `?sslmode=require` |
| `STRIPE_SECRET_KEY` | Must be live key (`sk_live_*`) | NOT test key |
| `STRIPE_WEBHOOK_SECRET` | Must be set | From Stripe dashboard |
| `ADMIN_SETUP_KEY` | Delete endpoint or set complex key | 64+ char random string |
| `REDIS_URL` | Password-protected | Enable AUTH |
| `REDIS_PASSWORD` | Must be set | Complex password |

### Infrastructure Recommendations

1. **Database:** SSL/TLS, connection pooling (PgBouncer), automated backups, network isolation
2. **Redis:** AUTH enabled, TLS, disable FLUSHDB/FLUSHALL/KEYS
3. **Hosting:** HTTPS-only, CDN (Cloudflare/CloudFront), DDoS protection, gzip/brotli
4. **DNS:** DNSSEC, CAA records, SPF/DKIM/DMARC for email domain
5. **Monitoring:** Error tracking (Sentry), uptime monitoring, security alerting

---

## Compliance Considerations (US Market)

### PCI-DSS 4.0
- Stripe handles card data (SAQ-A scope)
- Ensure no card numbers logged or stored locally
- Stripe.js loaded from js.stripe.com (confirmed in CSP)
- Strong access control for admin panel

### CCPA/CPRA (California)
- Data export functionality (right to know)
- Account deletion (right to delete)
- Privacy policy with CCPA disclosures
- Do not sell personal information without consent

### ADA Compliance
- WCAG 2.1 AA compliance
- Keyboard navigation, screen reader support
- Alt text for product images

### FTC Act
- Clear pricing, truthful advertising
- Clear return/refund policies
- Terms of service accessible

---

## Recommended Security Tools

| Category | Tool | Purpose |
|----------|------|---------|
| Rate Limiting | Upstash Ratelimit | API endpoint protection |
| WAF | Cloudflare | DDoS, bot protection |
| Monitoring | Sentry | Error tracking, security alerts |
| Scanning | Snyk / npm audit | Dependency vulnerabilities |
| Secrets | AWS Secrets Manager | Secure secret storage |
| Logging | DataDog / CloudWatch | Security event monitoring |
| CAPTCHA | hCaptcha / reCAPTCHA v3 | Bot protection |
| HTML Sanitization | DOMPurify | XSS prevention |
| Pen Testing | HackerOne / Bugcrowd | Professional security testing |

---

## Vulnerability Index (Quick Reference)

| ID | Severity | File | Issue |
|----|----------|------|-------|
| C-1 | CRITICAL | `api/admin/make-admin` | Privilege escalation with default key |
| C-2 | CRITICAL | `api/email/send` | Open email relay, no auth |
| C-3 | CRITICAL | `api/payments/create-intent` | Payment amount bypass |
| C-4 | CRITICAL | `api/payments/stripe/create-payment` | Payment amount bypass |
| C-5 | CRITICAL | `api/payments/paypal/create-order` | Payment amount bypass |
| C-6 | CRITICAL | `api/payments/paypal/capture-order` | Capture without amount verify |
| C-7 | CRITICAL | `api/auth/signup` + auth.ts | No rate limiting anywhere |
| H-1 | HIGH | `middleware.ts` | API routes excluded from middleware |
| H-2 | HIGH | `api/admin/products/images` | No auth on GET, no role check |
| H-3 | HIGH | `api/webhooks/shippo` | No signature verification |
| H-4 | HIGH | `api/webhooks` | Any user can manage webhooks |
| H-5 | HIGH | `api/orders` POST | Client shipping cost trusted |
| H-6 | HIGH | `ProductDetail.tsx` | XSS via dangerouslySetInnerHTML |
| H-7 | HIGH | `admin/marketing/emails` | XSS in email preview |
| H-8 | HIGH | `api/storefront/b2b-inquiry` | HTML injection in emails |
| H-9 | HIGH | `lib/auth.ts` | JWT role never refreshed |
| H-10 | HIGH | `lib/auth.ts` | 30-day session too long |
| H-11 | HIGH | 50+ routes | error.message leaked to clients |
| H-12 | HIGH | `lib/auth.ts` | No account lockout |
| H-13 | HIGH | `next.config.js` | Wildcard image host (SSRF) |
| H-14 | HIGH | `api/payments/stripe` | Stripe key in database |
| H-15 | HIGH | `api/upload` | Any user can upload |
| M-1 | MEDIUM | ~20 admin routes | SUPER_ADMIN excluded |
| M-2 | MEDIUM | `api/coupons/validate` | No auth, no per-user limit |
| M-3 | MEDIUM | `api/gift-cards/check` | Brute-force possible |
| M-4 | MEDIUM | `api/net-terms` | Sensitive data without auth |
| M-5 | MEDIUM | `api/tax/calculate` | No auth, paid API abuse |
| M-6 | MEDIUM | `api/admin/settings` | Arbitrary key-value writes |
| M-7 | MEDIUM | `next.config.js` | Weak CSP (unsafe-eval/inline) |
| M-8 | MEDIUM | `api/auth/signup` | Weak password policy |
| M-9 | MEDIUM | `api/auth/signup` | No email verification |
| M-10 | MEDIUM | `api/orders` | Predictable order numbers |
| M-11 | MEDIUM | `api/uploads/[...path]` | Incomplete path traversal check |
| M-12 | MEDIUM | Global | No CORS configuration |
| M-13 | MEDIUM | Global | No CSRF protection |
| M-14 | MEDIUM | Upload routes | No file count limit |
| M-15 | MEDIUM | `api/contact` | No CAPTCHA |
| M-16 | MEDIUM | `api/track-order` | Info disclosure without rate limit |
| M-17 | MEDIUM | `api/search/algolia` | User-supplied userId in logs |
| M-18 | MEDIUM | `api/payments/stripe` | Outdated API version |

---

*This report was generated on February 16, 2026 through automated deep analysis of 162 API routes, authentication system, frontend components, and infrastructure configuration using 3 parallel security audit agents + manual code review. Security posture should be re-evaluated quarterly and after major code changes.*
