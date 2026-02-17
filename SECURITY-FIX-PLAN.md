# Security Fix Plan - 50 Issues

## Phase 1: CRITICAL Fixes (5 issues)
- [ ] CRIT-1: Delete `/api/admin/make-admin/` backdoor
- [ ] CRIT-2: Add auth to `/api/email/send/`
- [ ] CRIT-3: Upgrade Next.js 14.0.4 -> 14.2.35
- [ ] CRIT-4: Fix XSS in ProductDetail (DOMPurify)
- [ ] CRIT-5: Replace `xlsx` with `exceljs` (12+ files) -- DEFERRED (large migration)

## Phase 2: HIGH - Auth Fixes (7 issues)
- [ ] AUTH-H1: Add admin role check to bulk export
- [ ] AUTH-H2: Add admin role check to bulk import
- [ ] AUTH-H3: Add admin role check to webhooks
- [ ] AUTH-H4: Remove email from public reviews API
- [ ] AUTH-H5: Remove JWT secret fallback
- [ ] AUTH-H6: Add role check in middleware for admin routes
- [ ] AUTH-H7: Add role refresh in session callback

## Phase 3: HIGH - Payment Fixes (4 issues)
- [ ] PAY-H1: Validate amount in create-intent
- [ ] PAY-H2: Validate amount in stripe/create-payment
- [ ] PAY-H3: Validate amount in paypal/create-order
- [ ] PAY-H4: Remove client shipping cost trust

## Phase 4: HIGH - XSS Fixes (3 issues)
- [ ] XSS-H1: Fix document.write() in invoices
- [ ] XSS-H2: Sandbox email template preview
- [ ] XSS-H3: Escape HTML in pip-import.ts

## Phase 5: HIGH - Data Exposure Fixes (2 issues)
- [ ] DATA-H1: Mask secret keys in admin settings API
- [ ] DATA-H2: Fix bulk export data leaking (covered by AUTH-H1)

## Phase 6: HIGH - Dependency Upgrades (3 issues)
- [ ] DEP-H1: Upgrade nodemailer to v8
- [ ] DEP-H2: Upgrade axios
- [ ] DEP-H3: Upgrade resend (fixes 16 aws-sdk CVEs)

## Phase 7: HIGH - Rate Limiting (1 issue)
- [ ] RATE-H1: Add rate limiting to sensitive endpoints

## Phase 8: MEDIUM Fixes (18 issues)
- [ ] MED-1: Fix chat messages auth
- [ ] MED-2: Fix chat conversations auth
- [ ] MED-3: Add rating bounds validation (reviews POST)
- [ ] MED-4: Add rating bounds validation (reviews PATCH)
- [ ] MED-5: Add address ownership check in orders
- [ ] MED-6: Fix B2B member data leakage
- [ ] MED-7: Add CSV parsing limits (bulk-orders)
- [ ] MED-8: Add encodeURIComponent on callbackUrl
- [ ] MED-9: Strengthen CSP headers
- [ ] MED-10: Mask Redis password in response
- [ ] MED-11: Limit track-order response data
- [ ] MED-12: Remove error.message from responses
- [ ] MED-13: Fix path traversal check
- [ ] MED-14: Use crypto.randomBytes for webhook secret
- [ ] MED-15: Add client-side file size validation
- [ ] MED-16: Fix accept="image/*" to specific types
- [ ] MED-17: Add CSV upload validation
- [ ] MED-18: Run npm audit fix (transitive deps)

## Phase 9: LOW Fixes (7 issues)
- [ ] LOW-1: Sanitize file extension in banners
- [ ] LOW-2: Restrict HTML mode to SUPER_ADMIN
- [ ] LOW-3: Add server-side review sanitization
- [ ] LOW-4: Note: @next-auth/prisma-adapter replacement (skip - breaking)
- [ ] LOW-5: Note: @sentry/nextjs upgrade (skip - breaking)
- [ ] LOW-6: npm audit fix covers this
- [ ] LOW-7: npm audit fix covers this
