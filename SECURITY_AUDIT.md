# Security Audit Report - ADA Supply E-Commerce Platform

**Audit Date:** February 16, 2026
**Auditor:** Automated Security Audit (Claude AI)
**Platform:** Next.js 14+ App Router / Prisma / PostgreSQL / Stripe
**Target Market:** United States (US)
**Compliance Standards:** OWASP Top 10 (2025), PCI-DSS 4.0, NIST 800-53, SOC 2

---

## Executive Summary

This security audit identified **31 vulnerabilities** across the codebase. Of these:

| Severity | Count | Requires Fix Before Launch |
|----------|-------|---------------------------|
| CRITICAL | 3 | YES - IMMEDIATELY |
| HIGH | 13 | YES - Before Go-Live |
| MEDIUM | 10 | Recommended Before Launch |
| LOW | 5 | Post-Launch Improvement |

**Overall Risk Level: HIGH** - Critical vulnerabilities must be fixed before production deployment.

---

## CRITICAL Vulnerabilities (Fix Immediately)

### C-1: Admin Privilege Escalation Endpoint Exposed
- **File:** `src/app/api/admin/make-admin/route.ts`
- **Lines:** 7-88 (entire file)
- **CVSS Score:** 9.8 / 10
- **Description:** The `/api/admin/make-admin` endpoint allows ANY user to escalate privileges to `SUPER_ADMIN` by sending a POST request with the secret key. The default secret key is hardcoded as `'change-me-in-production'` (line 13). If the `ADMIN_SETUP_KEY` environment variable is not set, this default is used. Additionally, the GET endpoint at line 91 lists ALL users with their emails and roles.
- **Attack Vector:**
  ```bash
  curl -X POST /api/admin/make-admin \
    -d '{"email":"attacker@evil.com","role":"SUPER_ADMIN","secretKey":"change-me-in-production"}'
  ```
- **Impact:** Complete system takeover. Attacker gains full admin access to all products, orders, customer data, and financial information.
- **Remediation:**
  1. **DELETE this file entirely** before production deployment
  2. Use database migration scripts or CLI tools for admin setup instead
  3. If must keep, add IP whitelisting, rate limiting, and require the endpoint to be explicitly enabled via env var

---

### C-2: No Rate Limiting on Authentication Endpoints
- **File:** `src/app/api/auth/signup/route.ts`, `src/lib/auth.ts` (CredentialsProvider)
- **Description:** There is NO rate limiting on login or signup endpoints. The only file mentioning rate limiting is `src/app/api/track-order/route.ts` and even there it's just a comment saying "In production, use a proper rate limiter." The `.env.example` defines `RATE_LIMIT_MAX=100` and `RATE_LIMIT_WINDOW=60000` but these variables are **never used anywhere in the code**.
- **Attack Vector:** Brute-force password attacks, credential stuffing, account enumeration, signup spam
- **Impact:** Account compromise, service degradation, database flooding
- **Remediation:**
  1. Install `@upstash/ratelimit` or `express-rate-limit` equivalent for Next.js
  2. Apply rate limiting to: `/api/auth/signup`, NextAuth login, `/api/contact`, `/api/track-order`
  3. Implement exponential backoff after failed login attempts
  4. Add CAPTCHA (reCAPTCHA v3 or hCaptcha) to signup and contact forms
  5. Example implementation:
  ```typescript
  import { Ratelimit } from '@upstash/ratelimit';
  import { Redis } from '@upstash/redis';

  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1m'), // 5 requests per minute
  });
  ```

---

### C-3: API Routes Completely Unprotected by Middleware
- **File:** `src/middleware.ts:89`
- **Description:** The middleware matcher explicitly excludes ALL API routes:
  ```
  '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ```
  This means no middleware-level authentication or authorization check runs for any `/api/*` endpoint. Each API route must implement its own auth check, and if any developer forgets, the route is completely open.
- **Impact:** If any API route misses auth check, it's publicly accessible. This is a systemic architectural vulnerability.
- **Remediation:**
  1. Remove `api` from the middleware exclusion pattern
  2. Add a whitelist of public API routes in middleware (e.g., `/api/products`, `/api/search`, `/api/contact`)
  3. Enforce authentication at the middleware level for all other API routes
  4. Add admin role verification in middleware for all `/api/admin/*` routes

---

## HIGH Vulnerabilities (Fix Before Go-Live)

### H-1: Stored XSS via Product Descriptions
- **File:** `src/components/storefront/products/ProductDetail.tsx:851`
- **Description:** Product descriptions are rendered using `dangerouslySetInnerHTML={{ __html: product.description }}` without sanitization. While descriptions are set by admins, a compromised admin account or XSS in the admin panel could inject malicious scripts served to all customers.
- **Remediation:** Use DOMPurify to sanitize HTML before rendering:
  ```typescript
  import DOMPurify from 'dompurify';
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
  ```

### H-2: Stored XSS via Email Templates
- **File:** `src/app/admin/marketing/emails/page.tsx:680`
- **Description:** Email template HTML is rendered with `dangerouslySetInnerHTML={{ __html: previewTemplate.htmlContent }}`. Malicious HTML in email templates could execute scripts in admin browsers.
- **Remediation:** Sanitize with DOMPurify, render preview in sandboxed iframe.

### H-3: Webhook Endpoint Missing Admin Authorization
- **File:** `src/app/api/webhooks/route.ts:23-44`
- **Description:** The webhook creation endpoint only checks `session?.user?.id` (any authenticated user). There is NO admin role check. Any logged-in customer can create webhooks, potentially receiving sensitive order and payment data.
- **Remediation:** Add admin role check:
  ```typescript
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  ```

### H-4: Weak Webhook Secret Generation
- **File:** `src/app/api/webhooks/route.ts:37`
- **Description:** Webhook secrets are generated using `Math.random()` which is NOT cryptographically secure:
  ```typescript
  secret: `whsec_${Math.random().toString(36).substring(2, 15)}`
  ```
- **Remediation:** Use `crypto.randomBytes()`:
  ```typescript
  import { randomBytes } from 'crypto';
  secret: `whsec_${randomBytes(24).toString('hex')}`
  ```

### H-5: Client-Supplied Shipping Cost Not Validated
- **File:** `src/app/api/orders/route.ts:302-308`
- **Description:** The order creation endpoint accepts `providedShippingCost` directly from the client:
  ```typescript
  if (typeof providedShippingCost === 'number') {
    shippingCost = providedShippingCost;
  }
  ```
  An attacker could set shipping cost to 0 or even negative values.
- **Impact:** Financial loss through free/reduced shipping manipulation.
- **Remediation:**
  1. ALWAYS recalculate shipping cost server-side based on cart weight, address, and selected carrier
  2. If accepting client-provided rates, validate against the shipping provider's API
  3. Set minimum shipping cost floor: `shippingCost = Math.max(0, providedShippingCost)`

### H-6: JWT Token Role Not Refreshed
- **File:** `src/lib/auth.ts:92-100`
- **Description:** JWT tokens store user role, accountType, and approvalStatus. These values are only set when the token is first created (during login). If an admin changes a user's role or deactivates their account, the JWT continues to carry the old permissions for up to 30 days (session maxAge).
- **Remediation:** In the JWT callback, periodically refresh user data from the database:
  ```typescript
  async jwt({ token, user, trigger }) {
    if (user) { /* set initial values */ }
    // Refresh every 5 minutes
    if (Date.now() - (token.lastRefresh || 0) > 5 * 60 * 1000) {
      const freshUser = await db.user.findUnique({ where: { id: token.id } });
      if (freshUser) {
        token.role = freshUser.role;
        token.isActive = freshUser.isActive;
      }
      token.lastRefresh = Date.now();
    }
    return token;
  }
  ```

### H-7: Session Max Age Too Long (30 Days)
- **File:** `src/lib/auth.ts:36`
- **Description:** `maxAge: 30 * 24 * 60 * 60` (30 days). For an e-commerce site handling financial transactions, this is excessive.
- **Remediation:**
  - Set maxAge to 24 hours for regular users
  - Set maxAge to 2 hours for admin users
  - Implement idle timeout (15-30 minutes of inactivity)

### H-8: Error Details Leaked to Clients
- **Files:**
  - `src/app/api/payments/checkout/route.ts:208` - `details: error.message`
  - `src/app/api/payments/stripe/create-payment/route.ts:85` - `details: error.message`
- **Description:** Internal error messages (including Stripe SDK errors, database errors) are returned directly to the client. This can leak server internals, database schema, or API keys.
- **Remediation:** Never expose `error.message` to clients. Log internally, return generic error:
  ```typescript
  console.error('Payment error:', error);
  return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  ```

### H-9: Upload Endpoint Missing Role Authorization
- **File:** `src/app/api/upload/route.ts:8-11`
- **Description:** The upload endpoint only checks if the user is authenticated (`session?.user?.id`). Any logged-in customer can upload images to the server. Combined with the file serving endpoint, this could be used for hosting malicious content.
- **Remediation:** Restrict uploads to admin/staff roles only, or create separate upload endpoints for different use cases with appropriate role checks.

### H-10: No CSRF Protection
- **Description:** The application has no CSRF tokens or SameSite cookie enforcement beyond NextAuth defaults. While Next.js API routes have some inherent CSRF protection through JSON content-type requirements, form-based endpoints remain vulnerable.
- **Remediation:**
  1. Ensure all cookies have `SameSite: Strict` or `Lax`
  2. Add CSRF token validation for state-changing operations
  3. Verify `Origin` and `Referer` headers in API routes

### H-11: No Account Lockout After Failed Login Attempts
- **File:** `src/lib/auth.ts:50-76`
- **Description:** The authentication flow has no tracking of failed login attempts and no account lockout mechanism. An attacker can attempt unlimited password guesses.
- **Remediation:**
  1. Track failed login attempts per email/IP in Redis
  2. Lock account after 5 failed attempts for 15 minutes
  3. Send notification email to user on lockout
  4. Implement progressive delays

### H-12: Wildcard Remote Image Pattern
- **File:** `next.config.js:44`
- **Description:** `hostname: '**'` in remotePatterns allows Next.js Image optimization for ANY external host. This could be abused for SSRF attacks through the `/_next/image` proxy.
- **Remediation:** Remove the wildcard pattern and explicitly list allowed image hosts.

### H-13: Stripe Secret Key Stored in Database
- **File:** `src/app/api/payments/stripe/create-payment/route.ts:34,42`
- **Description:** Stripe secret keys are stored in the `PaymentGatewaySettings` database table and read at runtime. If the database is compromised, the attacker gets the Stripe secret key.
- **Remediation:** Store Stripe keys ONLY in environment variables, never in the database. Use restricted API keys with minimum necessary permissions.

---

## MEDIUM Vulnerabilities (Recommended Before Launch)

### M-1: Weak Content Security Policy
- **File:** `next.config.js:104-105`
- **Description:** CSP includes `'unsafe-eval'` and `'unsafe-inline'` for scripts, which significantly weakens XSS protection:
  ```
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com
  ```
- **Remediation:**
  1. Remove `'unsafe-eval'` (may require Next.js config changes)
  2. Replace `'unsafe-inline'` with nonce-based CSP: `'nonce-{random}'`
  3. Use `next/script` with `strategy="afterInteractive"` for external scripts

### M-2: Weak Password Policy
- **File:** `src/app/api/auth/signup/route.ts:12`
- **Description:** Password validation only requires 8 characters minimum. No requirements for:
  - Uppercase letters
  - Lowercase letters
  - Numbers
  - Special characters
  - Common password check
- **Remediation:** Update Zod schema:
  ```typescript
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character')
  ```

### M-3: No Email Verification Before Login
- **File:** `src/app/api/auth/signup/route.ts:71`
- **Description:** New users are created with `emailVerified: null` and can immediately log in. No email verification flow exists.
- **Impact:** Fake account creation, potential for spam and abuse.
- **Remediation:**
  1. Send verification email on signup
  2. Block login until email is verified
  3. Add verification token and expiry to user model

### M-4: Predictable Order Number Generation
- **File:** `src/app/api/orders/route.ts:324`
- **Description:** Order numbers are generated using `Date.now()` and `Math.random()`:
  ```typescript
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  ```
  Both are predictable. An attacker could guess valid order numbers.
- **Remediation:** Use `crypto.randomUUID()` or a sequential counter with random suffix.

### M-5: No CORS Configuration
- **Description:** No explicit CORS headers are configured. While Next.js API routes default to same-origin, explicit CORS configuration would prevent misconfiguration.
- **Remediation:** Add CORS headers in `next.config.js` or use `next-cors` package.

### M-6: Path Traversal Protection Incomplete
- **File:** `src/app/api/uploads/[...path]/route.ts:26`
- **Description:** Directory traversal check only looks for literal `..`:
  ```typescript
  if (filePath.includes('..')) {
  ```
  URL-encoded variants (`%2e%2e`, `..%2f`) or double-encoding could bypass this.
- **Remediation:** Use `path.resolve()` and verify the resolved path is within the uploads directory:
  ```typescript
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  const fullPath = path.resolve(uploadsDir, filePath);
  if (!fullPath.startsWith(uploadsDir)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  ```

### M-7: No File Count Limit on Upload Endpoints
- **Files:** `src/app/api/upload/route.ts`, `src/app/api/admin/products/images/route.ts`
- **Description:** Upload endpoints accept unlimited number of files in a single request. An attacker could send thousands of files to exhaust server resources.
- **Remediation:** Limit to maximum 10-20 files per request.

### M-8: Contact Form Missing CAPTCHA/Bot Protection
- **File:** `src/app/api/contact/route.ts`
- **Description:** The contact form endpoint has no bot protection. Automated spam could flood the system.
- **Remediation:** Add reCAPTCHA v3 or hCaptcha validation.

### M-9: Track Order Endpoint Information Disclosure
- **File:** `src/app/api/track-order/route.ts:69-122`
- **Description:** The track order endpoint returns detailed order information including all items, pricing, and shipment details based only on order number + email. Without rate limiting, an attacker could enumerate orders.
- **Remediation:** Add rate limiting and consider requiring additional verification.

### M-10: Outdated Stripe API Version
- **File:** `src/app/api/payments/stripe/create-payment/route.ts:43`
- **Description:** Stripe API version is hardcoded as `'2023-10-16'` which is over 2 years old.
- **Remediation:** Update to the latest Stripe API version (2025.x) and test payment flows.

---

## LOW Vulnerabilities (Post-Launch Improvement)

### L-1: No Audit Logging for Admin Actions
- **Description:** Admin actions (product changes, user management, order status updates) are not logged to an audit trail.
- **Remediation:** Implement admin action logging to a separate audit table.

### L-2: No Password History Enforcement
- **File:** `src/app/api/user/password/route.ts`
- **Description:** Users can reuse previous passwords. The password change endpoint only verifies the current password.
- **Remediation:** Store hashed password history and check against last 5-10 passwords.

### L-3: No Multi-Factor Authentication (MFA/2FA)
- **Description:** No MFA support exists. For admin accounts handling financial data and PII, MFA should be mandatory.
- **Remediation:** Implement TOTP-based 2FA using packages like `otpauth` or `speakeasy`.

### L-4: Development Logging in Production
- **File:** `src/lib/db.ts:8`
- **Description:** Prisma logging includes query logging in development: `log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']`. This is correctly gated but should be verified in deployment.
- **Remediation:** Ensure `NODE_ENV=production` is set in all deployment environments.

### L-5: No Security Response Headers for API Routes
- **Description:** Security headers in `next.config.js` apply to page routes but may not apply to API routes due to the rewrite configuration.
- **Remediation:** Verify headers are applied to API responses or add them explicitly.

---

## Pre-Launch Security Checklist

### Must Do Before Go-Live (Day 1-2)

- [ ] **DELETE `/api/admin/make-admin` endpoint** or disable with env var check
- [ ] Set strong `ADMIN_SETUP_KEY` in production environment
- [ ] Set strong `NEXTAUTH_SECRET` (minimum 32 characters, random)
- [ ] Implement rate limiting on auth endpoints (login, signup)
- [ ] Add admin role check to webhook endpoints
- [ ] Fix `dangerouslySetInnerHTML` with DOMPurify sanitization
- [ ] Remove error.message from client-facing error responses
- [ ] Server-side shipping cost validation (don't trust client)
- [ ] Remove wildcard `hostname: '**'` from next.config.js remotePatterns
- [ ] Add CAPTCHA to contact and signup forms
- [ ] Move Stripe keys out of database, use only env vars

### Should Do Before Go-Live

- [ ] Add middleware-level auth for API routes
- [ ] Implement account lockout after failed logins
- [ ] Reduce session maxAge to 24 hours
- [ ] Add JWT token refresh to update roles
- [ ] Fix path traversal protection with `path.resolve()`
- [ ] Strengthen password policy (10+ chars, complexity rules)
- [ ] Replace Math.random() with crypto.randomBytes() for secrets
- [ ] Add email verification flow
- [ ] Add CSRF protection
- [ ] Update Stripe API version

### Post-Launch Priorities

- [ ] Implement MFA/2FA for admin accounts
- [ ] Add audit logging for admin actions
- [ ] Set up WAF (Web Application Firewall) - AWS WAF, Cloudflare
- [ ] Implement Content Security Policy nonces
- [ ] Add password history enforcement
- [ ] Set up security monitoring and alerting (Sentry, Datadog)
- [ ] Conduct penetration testing by a professional security firm
- [ ] Implement DDoS protection (Cloudflare, AWS Shield)
- [ ] Add subresource integrity (SRI) for external scripts
- [ ] Regular dependency vulnerability scanning (npm audit, Snyk)

---

## Environment Security Checklist

### Production Environment Variables (Verify All Are Set)

| Variable | Status | Notes |
|----------|--------|-------|
| `NODE_ENV` | Must be `production` | Controls logging, error display |
| `NEXTAUTH_SECRET` | Must be unique, 32+ chars | Use `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Must match production domain | Include https:// |
| `DATABASE_URL` | SSL connection required | Add `?sslmode=require` |
| `STRIPE_SECRET_KEY` | Must be live key (sk_live_*) | NOT test key |
| `STRIPE_WEBHOOK_SECRET` | Must be set | Verify webhook endpoints |
| `ADMIN_SETUP_KEY` | Remove or set complex key | Endpoint should be deleted |
| `REDIS_URL` | Password-protected connection | Enable AUTH |
| `REDIS_PASSWORD` | Must be set | Complex password |

### Infrastructure Recommendations

1. **Database:**
   - Enable SSL/TLS connections
   - Use connection pooling (PgBouncer)
   - Enable automated backups
   - Restrict database access to application servers only

2. **Redis:**
   - Enable AUTH (password)
   - Disable dangerous commands (FLUSHDB, FLUSHALL, KEYS)
   - Use TLS connections

3. **Hosting:**
   - Enable HTTPS only (redirect HTTP to HTTPS)
   - Use CDN (Cloudflare, AWS CloudFront) for static assets
   - Set up DDoS protection
   - Enable gzip/brotli compression

4. **DNS:**
   - Enable DNSSEC
   - Set up CAA records to restrict certificate issuers
   - Configure SPF, DKIM, DMARC for email sending domain

---

## Compliance Considerations (US Market)

### PCI-DSS 4.0 (Payment Processing)
- Stripe handles card data (reduces PCI scope to SAQ-A)
- Ensure no card numbers are logged or stored locally
- Verify Stripe.js is loaded from js.stripe.com (confirmed in CSP)
- Implement strong access control for admin panel

### CCPA/CPRA (California Consumer Privacy Act)
- Implement data export functionality (right to know)
- Implement account deletion (right to delete)
- Add privacy policy with CCPA disclosures
- Do not sell personal information without consent

### ADA Compliance (Americans with Disabilities Act)
- Ensure WCAG 2.1 AA compliance for the storefront
- Keyboard navigation support
- Screen reader compatibility
- Alt text for all product images

### FTC Act (Federal Trade Commission)
- Clear pricing (no hidden fees)
- Truthful advertising
- Clear return/refund policies
- Terms of service readily available

---

## Recommended Security Tools & Services

| Category | Tool | Purpose |
|----------|------|---------|
| Rate Limiting | Upstash Ratelimit | API endpoint protection |
| WAF | Cloudflare | DDoS, bot protection, edge rules |
| Monitoring | Sentry | Error tracking, security alerts |
| Scanning | Snyk / npm audit | Dependency vulnerability scanning |
| Secrets | Vault / AWS Secrets Manager | Secure secret storage |
| Logging | DataDog / AWS CloudWatch | Security event monitoring |
| CAPTCHA | hCaptcha / reCAPTCHA v3 | Bot protection |
| Pen Testing | HackerOne / Bugcrowd | Professional security testing |

---

*This report was generated on February 16, 2026. Security posture should be re-evaluated regularly, ideally quarterly, and after any major code changes.*
