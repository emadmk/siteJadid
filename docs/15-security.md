# 15. Security & Middleware

## Middleware (`src/middleware.ts`)

Runs on every non-API page request.

### Content Security Policy (CSP)

```
default-src 'self'
script-src  'self' 'unsafe-inline' 'unsafe-eval' stripe.com googletagmanager.com challenges.cloudflare.com
style-src   'self' 'unsafe-inline'
img-src     'self' data: https:
connect-src 'self' https: challenges.cloudflare.com
frame-src   'self' stripe.com challenges.cloudflare.com
```

### Security Headers

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | max-age=63072000; includeSubDomains; preload |
| `X-Frame-Options` | SAMEORIGIN |
| `X-Content-Type-Options` | nosniff |
| `X-XSS-Protection` | 1; mode=block |
| `Referrer-Policy` | strict-origin-when-cross-origin |
| `Permissions-Policy` | camera=(), microphone=(), geolocation=() |

### CSRF Protection

Double-submit cookie pattern:
1. Middleware sets `__csrf` cookie on page loads
2. Client reads cookie, sends in request header
3. Server validates match

### Route Protection

```
/admin/* → Requires admin role (7 roles) → Redirect to /account if not
/account/* → Requires authentication → Redirect to /auth/signin
/api/* → Not handled by middleware (per-route auth)
```

## Rate Limiting (`src/lib/rate-limit.ts`)

Redis-based sliding window:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Contact form | 3 requests | 60 seconds |
| Quote request | 5 requests | 15 minutes |
| Login attempts | 5 attempts | 15 minutes (lockout) |
| Email verification resend | 3 requests | 60 seconds |
| Forgot password | 3 requests | 60 seconds |

Fallback: In-memory Map when Redis unavailable.

## Captcha (Cloudflare Turnstile)

**Component**: `src/components/Turnstile.tsx`
**Verification**: `src/lib/turnstile.ts`

Protected forms:
- Contact form (`/contact`)
- Quote request (`/b2b/request-quote`)

**Graceful fallback**: If no Turnstile keys in .env, forms work without captcha.

## Password Security (`src/lib/password-policy.ts`)

- Minimum 8 characters
- Hashed with bcrypt (salt rounds = 10)
- Account lockout after 5 failed attempts (15 min)

## Audit Trail (`src/lib/audit-log.ts`)

Logs admin actions to `ActivityLog` table:

| Logged Actions | Entity |
|---------------|--------|
| Order status change | Order |
| Order deletion | Order |
| Order notes update | Order |
| Product update/delete | Product |
| Bulk product release | Product |
| Settings change | Settings |
| User creation | User |
| Account approval | User |

**View**: `/admin/activity-logs` (SUPER_ADMIN, ADMIN only)

## Encryption (`src/lib/encryption.ts`)

Used for sensitive data:
- Payment gateway API keys
- Email service credentials
- Shipping provider keys

---

*Next: [16 - Integrations](./16-integrations.md)*
