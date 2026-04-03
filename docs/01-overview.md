# 1. Project Overview & Architecture

## What is ADA Supply?

ADA Supply (adasupply.com) is a full-stack B2B/B2C e-commerce platform for industrial safety equipment and supplies. Built with Next.js 14 (App Router), it serves personal buyers, volume buyers, and government agencies (GSA).

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 14.2.25 |
| **Language** | TypeScript | 5.x |
| **UI** | React | 18.2 |
| **Styling** | Tailwind CSS | 3.4 |
| **Animation** | Framer Motion | 12.x |
| **Icons** | Lucide React | 0.294 |
| **Database** | PostgreSQL | 16 (Docker) |
| **ORM** | Prisma | 5.22 |
| **Cache** | Redis | 7 (Docker) |
| **Search** | Elasticsearch | 8.11 |
| **Auth** | NextAuth.js | 4.24 |
| **Payments** | Stripe | 14.9 |
| **Shipping** | Shippo | API |
| **Email** | Nodemailer (SMTP) | 8.0 |
| **Monitoring** | Sentry | 7.99 |
| **Process Manager** | PM2 | Latest |
| **Server** | Hetzner VPS | Ubuntu 22.04 |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                  │
│                    Port 80/443 → 3000                     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                 Next.js App (PM2)                         │
│                    Port 3000                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Storefront   │  │  Admin Panel  │  │  API Routes   │   │
│  │  (SSR + CSR)  │  │  (CSR)        │  │  (REST)       │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└───┬──────────┬──────────┬──────────┬────────────────────┘
    │          │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│Postgres│ │ Redis │ │  ES   │ │Stripe │
│ :5432  │ │ :6379 │ │ :9200 │ │ (API) │
│Docker  │ │Docker │ │Docker │ │       │
└────────┘ └───────┘ └───────┘ └───────┘
```

## Directory Structure

```
siteJadid/
├── prisma/                    # Database schema & migrations
│   ├── schema.prisma          # ~4300 lines, 60+ models
│   └── seed.ts                # Database seeding
│
├── public/                    # Static assets
│   └── uploads/               # Uploaded images (products, brands)
│
├── scripts/                   # Utility scripts
│   ├── es-index-products.js   # Elasticsearch indexer
│   ├── fix-3m-prices.js       # Price correction
│   ├── grainger-download.js   # Image downloader
│   └── grainger-dashboard.js  # Download monitor (port 9876)
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/             # Admin panel pages (70+ pages)
│   │   ├── api/               # API routes (200+ endpoints)
│   │   ├── products/          # Product listing page
│   │   ├── categories/        # Category pages
│   │   ├── brands/            # Brand pages
│   │   ├── auth/              # Auth pages (signin, signup)
│   │   ├── contact/           # Contact page
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout flow
│   │   └── ...                # Other storefront pages
│   │
│   ├── components/
│   │   ├── admin/             # Admin components (36 files)
│   │   ├── storefront/        # Store components (33 files)
│   │   ├── search/            # Search components
│   │   ├── ui/                # Shared UI components
│   │   └── Turnstile.tsx      # Cloudflare captcha
│   │
│   ├── contexts/              # React contexts
│   │   ├── CartContext.tsx     # Shopping cart state
│   │   ├── SearchContext.tsx   # Search state
│   │   ├── AuthModalContext.tsx
│   │   └── HomeStyleContext.tsx
│   │
│   ├── lib/                   # Core utilities (35 files)
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Prisma client
│   │   ├── elasticsearch.ts   # ES client & search
│   │   ├── email-notifications.ts  # Email sending
│   │   ├── email-templates.ts      # HTML email templates
│   │   ├── permissions.ts     # Role-based access
│   │   ├── stripe.ts          # Payment processing
│   │   ├── redis.ts           # Cache client
│   │   └── services/          # Import services (10 files)
│   │
│   ├── middleware.ts          # Auth, CSP, CSRF middleware
│   └── types/                 # TypeScript type definitions
│
├── docker-compose.yml         # Dev: PostgreSQL, Redis, ES
├── docker-compose.prod.yml    # Prod: same services
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
└── package.json               # Dependencies (50+ packages)
```

## Key Concepts

### User Roles (13 roles)

| Role | Access | Description |
|------|--------|-------------|
| `SUPER_ADMIN` | Everything | Full system access |
| `ADMIN` | Almost everything | No system settings |
| `ACCOUNTANT` | Financial data | Revenue, invoices, payments |
| `CUSTOMER_SERVICE` | Orders & customers | Support operations |
| `WAREHOUSE_MANAGER` | Inventory | Stock, suppliers, shipping |
| `MARKETING_MANAGER` | Marketing | Discounts, banners, emails |
| `CONTENT_MANAGER` | Products & content | Product editing, marketing |
| `CUSTOMER` | Storefront | Default customer |
| `B2B_CUSTOMER` | Storefront + B2B | Business accounts |
| `GSA_CUSTOMER` | Storefront + GSA | Government accounts |
| `PERSONAL_CUSTOMER` | Storefront | Personal buyers |
| `VOLUME_BUYER_CUSTOMER` | Storefront + Volume | High-volume buyers |
| `GOVERNMENT_CUSTOMER` | Storefront + Gov | Government agencies |

### Account Types (6 types)

| Type | Pricing | Tax | Approval |
|------|---------|-----|----------|
| `B2C` | Base price | Standard rate | Auto |
| `PERSONAL` | Base price | Standard rate | Auto |
| `B2B` | Wholesale price | Standard rate | Manual |
| `VOLUME_BUYER` | Wholesale price | Exempt (configurable) | Manual |
| `GSA` | GSA price | Standard rate | Manual |
| `GOVERNMENT` | GSA price | Exempt (configurable) | Manual |

### Product Lifecycle

```
Import → PRERELEASE → Review & Edit → ACTIVE → (visible on store)
                                    → INACTIVE / DISCONTINUED
```

### Order Flow

```
Cart → Checkout → PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                         → ON_HOLD
                         → CANCELLED → REFUNDED
```

## File Count Summary

| Area | Files | Description |
|------|-------|-------------|
| **Total .ts/.tsx** | 474 | All source files |
| **Admin pages** | 70+ | Management UI |
| **Storefront pages** | 40+ | Customer-facing |
| **API endpoints** | 200+ | REST APIs |
| **Components** | 70+ | Reusable UI |
| **Lib utilities** | 35 | Business logic |
| **Prisma models** | 60+ | Database tables |
| **Scripts** | 9 | Maintenance tools |

## External Services

| Service | Purpose | Config |
|---------|---------|--------|
| **Stripe** | Payment processing | `STRIPE_SECRET_KEY` |
| **Shippo** | Shipping rates & labels | `SHIPPO_API_KEY` |
| **Cloudflare Turnstile** | Captcha (contact/quote forms) | `TURNSTILE_SECRET_KEY` |
| **Gmail SMTP** | Transactional emails | `EMAIL_SERVER_*` |
| **Google Analytics** | Site analytics | `GA_MEASUREMENT_ID` |
| **Sentry** | Error monitoring | `SENTRY_DSN` |

## Running Services (Production)

| Service | Port | Manager |
|---------|------|---------|
| Next.js App | 3000 | PM2 (`adasupply`) |
| PostgreSQL | 5432 | Docker |
| Redis | 6379 | Docker |
| Elasticsearch | 9200 | Docker |
| Grainger Dashboard | 9876 | PM2 (`grainger-dashboard`) |

---

*Next section: [02 - Getting Started & Setup](./02-setup.md)*
