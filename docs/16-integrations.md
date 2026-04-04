# 16. Third-party Integrations

## Stripe (Payments)

**Files**: `src/lib/stripe.ts`, `src/lib/services/stripe.ts`

| Feature | Endpoint |
|---------|----------|
| Create PaymentIntent | POST `/api/payments/create-intent` |
| Webhook handler | POST `/api/webhooks/stripe` |
| Config (admin) | `/admin/settings` → Payment Methods |

**Env vars**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

## Shippo (Shipping)

**File**: `src/lib/services/shippo.ts`

| Feature | Endpoint |
|---------|----------|
| Get rates | POST `/api/shipping/rates` |
| Config (admin) | `/admin/settings` → Shipping Options |

**Env var**: `SHIPPO_API_KEY`

## Elasticsearch (Search)

**File**: `src/lib/elasticsearch.ts`

| Feature | Details |
|---------|---------|
| Product search | Fuzzy, typo-tolerant, boosted fields |
| Autocomplete | Completion suggest on name field |
| Indexing | Auto on product CRUD, bulk via script |

**Env vars**: `ELASTICSEARCH_NODE`, `ELASTICSEARCH_PASSWORD`

## Redis (Cache)

**File**: `src/lib/redis.ts`

Used for:
- Rate limiting (sliding window)
- Account lockout tracking
- Session cache (optional)
- General caching

**Env var**: `REDIS_URL`

## Cloudflare Turnstile (Captcha)

**Files**: `src/components/Turnstile.tsx`, `src/lib/turnstile.ts`

Protected: Contact form, Quote request form.

**Env vars**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`

## Google Analytics

**File**: `src/components/GoogleAnalytics.tsx`

- GA4 measurement
- E-commerce event tracking

**Env var**: Hardcoded `G-P869KQB8K6`

## Sentry (Error Monitoring)

**Package**: `@sentry/nextjs`

Admin config: `/admin/settings/sentry`
**Env var**: `SENTRY_DSN`

## Gmail SMTP (Email)

**File**: `src/lib/email-notifications.ts`

All transactional emails via Gmail SMTP with app password.

**Env vars**: `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM`

## Product Data Integrations

| Brand | Importer | Input |
|-------|----------|-------|
| 3M | `src/lib/services/3m-import.ts` | Excel (Mar-26 format) |
| Carhartt | `src/lib/services/carhartt-import.ts` | Excel |
| OccuNomix | `src/lib/services/occunomix-import.ts` | Excel |
| PIP | `src/lib/services/pip-import.ts` | Excel |
| Wolverine/Bates/Keen | `src/lib/services/wolverine-import.ts` | Excel |
| Grainger | `scripts/grainger-download.js` | Image URLs from Excel |

---

*Next: [17 - Scripts & Utilities](./17-scripts.md)*
