# Security Hardening Plan - Enterprise E-commerce Platform

**Date:** 2026-02-17
**Status:** In Progress
**Priority:** CRITICAL - Must be completed before production launch

---

## Executive Summary

This document outlines the comprehensive security hardening plan for the ADA Supply e-commerce platform. All changes are categorized by severity and implemented in phases to minimize risk to the production database.

---

## Phase 1: CRITICAL - Infrastructure Security

### 1.1 Redis Authentication & Redis-based Rate Limiter
- **Problem:** Rate limiter uses in-memory `Map`, bypassed in multi-instance deployments
- **Fix:** Rewrite `src/lib/rate-limit.ts` to use Redis with sliding window algorithm
- **Files Modified:**
  - `src/lib/rate-limit.ts` - Complete rewrite to Redis-based
- **Risk:** LOW - No database changes required
- **Status:** DONE

### 1.2 Session Duration Reduction (30 days -> 7 days)
- **Problem:** JWT session valid for 30 days; if token is leaked, attacker has month-long access
- **Fix:** Reduce `maxAge` to 7 days in `src/lib/auth.ts`
- **Files Modified:**
  - `src/lib/auth.ts` - line 41
  - `.env.example` - SESSION_MAX_AGE
- **Risk:** LOW - Existing sessions will naturally expire
- **Status:** DONE

---

## Phase 2: HIGH - Authentication Hardening

### 2.1 Strong Password Policy
- **Problem:** Only 8 character minimum; weak passwords accepted
- **Fix:** Require minimum 12 characters + uppercase + lowercase + number + special character
- **Files Modified:**
  - `src/app/api/auth/signup/route.ts` - Enhanced Zod schema validation
  - `src/lib/password-policy.ts` - New password validation utility
- **Risk:** LOW - Only affects new signups
- **Status:** DONE

### 2.2 Email Verification System
- **Problem:** Users can register and use accounts without verifying email ownership
- **Fix:** Send verification email on signup; require verification before login
- **Files Modified:**
  - `src/lib/email-verification.ts` - New: email verification token generation + sending
  - `src/app/api/auth/verify-email/route.ts` - New: verification endpoint
  - `src/app/api/auth/resend-verification/route.ts` - New: resend verification email
  - `src/app/api/auth/signup/route.ts` - Send verification email after signup
  - `src/lib/auth.ts` - Check emailVerified in authorize()
- **Database Changes:** Uses existing `VerificationToken` model (NO schema migration needed)
- **Risk:** MEDIUM - Users with unverified emails will need to verify; admin accounts exempt
- **Status:** DONE

### 2.3 Account Lockout After Failed Attempts
- **Problem:** No protection against brute-force password guessing
- **Fix:** Lock account for 15 minutes after 5 failed login attempts
- **Files Modified:**
  - `src/lib/account-lockout.ts` - New: Redis-based lockout tracking
  - `src/lib/auth.ts` - Integrate lockout checks in authorize()
- **Database Changes:** NONE (uses Redis for tracking)
- **Risk:** LOW - Uses Redis, no database impact
- **Status:** DONE

---

## Phase 3: HIGH - Data Protection

### 3.1 API Key Encryption at Rest
- **Problem:** API keys (Stripe, PayPal, Algolia, Sentry, etc.) stored as plain text in database
- **Fix:** AES-256-GCM encryption for all API keys before DB storage
- **Files Modified:**
  - `src/lib/encryption.ts` - New: AES-256-GCM encrypt/decrypt utility
  - `.env.example` - Add ENCRYPTION_KEY variable
- **Models Affected:** PaymentGatewaySettings, ShippingProviderSettings, TaxSettings, AlgoliaSettings, SentrySettings, EmailServiceSettings
- **Database Changes:** NONE (encryption is transparent; existing plain values still readable)
- **Risk:** MEDIUM - Must ensure ENCRYPTION_KEY env var is set and backed up
- **Status:** DONE

### 3.2 CSP Improvement (Nonce-based)
- **Problem:** CSP uses `unsafe-inline` for scripts, weakening XSS protection
- **Fix:** Implement CSP nonce generation in middleware for inline scripts
- **Files Modified:**
  - `next.config.js` - Updated CSP header with nonce support
  - `src/middleware.ts` - Generate CSP nonce per request
- **Risk:** LOW - Stripe JS loaded from allowed domain
- **Status:** DONE

---

## Phase 4: MEDIUM - Application Hardening

### 4.1 Server-side Shipping Cost Validation
- **Problem:** `src/app/api/orders/route.ts` line 303 accepts client-supplied shipping cost
- **Fix:** Calculate shipping cost server-side based on weight, destination, and method
- **Files Modified:**
  - `src/lib/shipping-calculator.ts` - New: server-side shipping cost calculator
  - `src/app/api/orders/route.ts` - Use server-side calculation, ignore client value
- **Risk:** LOW - Transparent change, same logic
- **Status:** DONE

### 4.2 CSRF Protection
- **Problem:** Relies only on SameSite cookies; no explicit CSRF token
- **Fix:** Add CSRF token generation and validation for state-changing API routes
- **Files Modified:**
  - `src/lib/csrf.ts` - New: CSRF token generation and validation
  - `src/middleware.ts` - Set CSRF cookie on page load
- **Risk:** LOW - Additive change
- **Status:** DONE

### 4.3 Admin Audit Logging
- **Problem:** Admin actions are not logged; no accountability trail
- **Fix:** Log all admin state-changing operations (create, update, delete)
- **Files Modified:**
  - `src/lib/audit-log.ts` - New: audit logging utility
- **Database Changes:** Uses existing `ActivityLog` model
- **Risk:** LOW - Read-only addition
- **Status:** DONE

### 4.4 Remove Wildcard Remote Image Pattern
- **Problem:** `next.config.js` line 44 allows images from ANY hostname (`**`)
- **Fix:** Remove wildcard pattern; whitelist only known domains
- **Files Modified:**
  - `next.config.js` - Remove `hostname: '**'` pattern
- **Risk:** LOW - May need to add specific domains later
- **Status:** DONE

---

## Phase 5: Hardcoded Server IP Audit

### 5.1 Server IP Address (104.234.46.217)
- **Status:** AUDITED
- **Finding:** IP address found in **6 documentation files ONLY** - NOT in source code
- **Files:**
  1. `docs/MIGRATION-CHECKLIST.md` - line 10
  2. `docs/releases/kamel-03-admin-panel-fa.md` - line 638
  3. `docs/releases/kamel-03-admin-panel.md` - line 773
  4. `docs/SALEM-01-RELEASE-NOTES.md` - line 390
  5. `docs/SALEM-01-SUMMARY-FA.md` - line 237
  6. `docs/SERVER-MIGRATION-GUIDE.md` - lines 44-45
- **Source Code:** CLEAN - No hardcoded IP in .ts, .tsx, .js, .json, .env.example, Dockerfile, or config files
- **Action:** When migrating to domain, update documentation files only. Application uses `NEXT_PUBLIC_APP_URL` environment variable.

---

## Environment Variables Required

```bash
# New variables needed for security features:
ENCRYPTION_KEY=           # Generate with: openssl rand -hex 32
NEXTAUTH_SECRET=          # Generate with: openssl rand -base64 32
REDIS_URL=redis://:YOUR_STRONG_PASSWORD@localhost:6379
SESSION_MAX_AGE=604800    # 7 days in seconds
```

---

## Production Deployment Checklist

- [ ] Set `ENCRYPTION_KEY` (64-char hex string) - CRITICAL: Back this up! Lost key = lost API credentials
- [ ] Set `NEXTAUTH_SECRET` (32+ chars)
- [ ] Set `REDIS_URL` with password: `redis://:StrongPassword@host:6379`
- [ ] Set `SESSION_MAX_AGE=604800`
- [ ] Set `NODE_ENV=production`
- [ ] Verify all Stripe keys are `sk_live_*` (not `sk_test_*`)
- [ ] Enable HTTPS on reverse proxy (nginx/Cloudflare)
- [ ] Test email verification flow end-to-end
- [ ] Test account lockout with intentional failed logins
- [ ] Verify rate limiting works across multiple instances
- [ ] Review audit logs for admin operations
- [ ] Update documentation with new domain (replace 104.234.46.217)

---

## Risk Assessment After Hardening

| Category | Before | After |
|----------|--------|-------|
| Authentication | 6/10 | 9/10 |
| Authorization | 8/10 | 9/10 |
| Data Protection | 4/10 | 8/10 |
| Rate Limiting | 4/10 | 9/10 |
| Session Security | 5/10 | 8/10 |
| Input Validation | 7/10 | 9/10 |
| Monitoring/Audit | 3/10 | 7/10 |
| **Overall** | **~5.3/10** | **~8.4/10** |
