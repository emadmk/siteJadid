# 2. Getting Started & Setup

## Prerequisites

- Node.js 18+ (v22 recommended)
- Docker & Docker Compose
- Git

## Quick Start

```bash
# 1. Clone
git clone https://github.com/emadmk/siteJadid.git
cd siteJadid

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env
# Edit .env with your values

# 4. Start Docker services
docker-compose up -d

# 5. Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# 6. Seed database (optional)
npx prisma db seed

# 7. Start dev server
npm run dev
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/ecommerce_db?schema=public` |
| `NEXTAUTH_SECRET` | JWT signing secret | Random 32+ char string |
| `NEXTAUTH_URL` | App base URL | `http://localhost:3000` |

### Email (SMTP)

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_SERVER_HOST` | SMTP host | `smtp.gmail.com` |
| `EMAIL_SERVER_PORT` | SMTP port | `587` |
| `EMAIL_SERVER_USER` | SMTP username | `your@gmail.com` |
| `EMAIL_SERVER_PASSWORD` | SMTP password/app password | `xxxx xxxx xxxx xxxx` |
| `EMAIL_FROM` | Sender address | `noreply@adasupply.com` |

### Payments

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

### Search & Cache

| Variable | Description | Default |
|----------|-------------|---------|
| `ELASTICSEARCH_NODE` | ES URL | `http://127.0.0.1:9200` |
| `ELASTICSEARCH_PASSWORD` | ES password | Required |
| `REDIS_URL` | Redis URL | `redis://localhost:6379` |

### Security

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile public key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |

### Shipping

| Variable | Description |
|----------|-------------|
| `SHIPPO_API_KEY` | Shippo API key for shipping rates |

## Docker Services

```yaml
# docker-compose.yml
services:
  postgres:    # Port 5432
  redis:       # Port 6379
  elasticsearch: # Port 9200
```

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npx prisma studio` | Open database GUI |
| `npx prisma db push` | Sync schema to DB |
| `npx prisma generate` | Regenerate Prisma client |

## Production Deployment

```bash
# On server
cd /var/www/siteJadid
git pull origin main
npx prisma db push
npm run build
pm2 restart adasupply
```

---

*Next: [03 - Database Schema](./03-database.md)*
