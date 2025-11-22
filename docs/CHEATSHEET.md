# SafetyPro E-commerce - Cheat Sheet

Quick reference for common tasks and commands.

## 🚀 Quick Start

```bash
# One-command deployment
bash scripts/deploy.sh

# Access app
http://localhost:3000
```

---

## 📦 Installation

```bash
# Clone
git clone <repo-url> && cd siteJadid

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start Docker services
docker-compose up -d

# Database setup
npx prisma generate
npx prisma migrate deploy
npm run seed

# Start development
npm run dev
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Rebuild images
docker-compose build

# Remove all (including volumes)
docker-compose down -v

# Service status
docker-compose ps

# Execute command in container
docker-compose exec app [command]
```

---

## 🗄️ Database (Prisma)

```bash
# Generate Prisma Client
npx prisma generate

# Create migration (dev)
npx prisma migrate dev --name [name]

# Run migrations (prod)
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Seed database
npm run seed

# Open Prisma Studio
npx prisma studio

# Check migration status
npx prisma migrate status

# Format schema
npx prisma format

# Pull schema from DB
npx prisma db pull

# Push schema to DB (dev)
npx prisma db push
```

---

## 🔨 Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Fix lint errors
npm run lint:fix

# Type check
npm run type-check

# Format code
npm run format
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## 📊 Default Accounts

After seeding:

| Type | Email | Password |
|------|-------|----------|
| Super Admin | admin@safetypro.com | Admin123! |
| B2C Customer | customer@example.com | Customer123! |
| B2B Customer | b2b@company.com | B2B123! |
| GSA Customer | gsa@agency.gov | GSA123! |

---

## 🔍 API Quick Reference

### Products
```bash
# List products
GET /api/products?page=1&limit=20&search=helmet

# Get product
GET /api/products/[id]

# Create product (admin)
POST /api/products
Body: { sku, name, basePrice, ... }

# Update product (admin)
PUT /api/products/[id]

# Delete product (admin)
DELETE /api/products/[id]
```

### Cart
```bash
# Get cart
GET /api/cart

# Add to cart
POST /api/cart
Body: { productId, quantity }

# Update cart item
PUT /api/cart/[itemId]
Body: { quantity }

# Remove from cart
DELETE /api/cart/[itemId]

# Clear cart
DELETE /api/cart
```

### Orders
```bash
# List orders
GET /api/orders

# Get order
GET /api/orders/[orderNumber]

# Create order
POST /api/orders
Body: { billingAddressId, shippingAddressId, paymentMethod, ... }

# Update order status (admin)
PUT /api/orders/[id]/status
Body: { status, notes }
```

### Reviews
```bash
# Get reviews
GET /api/reviews?productId=[id]

# Create review
POST /api/reviews
Body: { productId, rating, title, comment }

# Update review
PUT /api/reviews/[id]

# Delete review
DELETE /api/reviews/[id]
```

---

## 🔐 Environment Variables

### Required

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="<random-32-char-string>"
NEXTAUTH_URL="http://localhost:3000"
```

### Optional

```env
# Elasticsearch
ELASTICSEARCH_NODE="http://localhost:9200"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="user@gmail.com"
SMTP_PASSWORD="app-password"

# Cloudinary
CLOUDINARY_CLOUD_NAME="cloud-name"
CLOUDINARY_API_KEY="key"
CLOUDINARY_API_SECRET="secret"
```

---

## 🔧 Troubleshooting

### Build Errors

```bash
# Clear cache
rm -rf .next node_modules package-lock.json

# Reinstall
npm install

# Build again
npm run build
```

### Database Connection

```bash
# Test connection
npx prisma db execute --stdin <<< "SELECT 1"

# Reset (dev only)
npx prisma migrate reset --force

# Generate client
npx prisma generate
```

### Redis Connection

```bash
# Test connection
docker-compose exec redis redis-cli ping

# Clear cache
docker-compose exec redis redis-cli FLUSHALL
```

### Port in Use

```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 [PID]
```

### Docker Issues

```bash
# Remove all containers
docker-compose down -v

# Clean Docker system
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

---

## 📝 Git Workflow

```bash
# Create branch
git checkout -b feature/name

# Stage changes
git add .

# Commit
git commit -m "feat: description"

# Push
git push origin feature/name

# Pull latest
git pull origin main

# Merge main into branch
git checkout main
git pull
git checkout feature/name
git merge main
```

---

## 🚢 Deployment

### Quick Deploy

```bash
# Production build
npm run build

# Start production
npm run start

# Or use PM2
pm2 start npm --name "ecommerce" -- start
pm2 save
```

### Docker Production

```bash
# Build production image
docker build -t safetypro:latest .

# Run production container
docker run -d \
  --name safetypro \
  -p 3000:3000 \
  --env-file .env \
  safetypro:latest

# With docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔄 Database Backup & Restore

### Backup

```bash
# PostgreSQL backup
docker-compose exec -T postgres pg_dump \
  -U user database > backup-$(date +%Y%m%d).sql

# Compressed backup
docker-compose exec -T postgres pg_dump \
  -U user database | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# Restore from backup
cat backup.sql | docker-compose exec -T postgres \
  psql -U user database

# From compressed
gunzip < backup.sql.gz | docker-compose exec -T postgres \
  psql -U user database
```

---

## 📊 Monitoring

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# Since timestamp
docker-compose logs --since="2024-01-01T00:00:00"
```

### Health Checks

```bash
# App health
curl http://localhost:3000/api/health

# Database
docker-compose exec postgres pg_isready

# Redis
docker-compose exec redis redis-cli ping

# Elasticsearch
curl http://localhost:9200/_cluster/health
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Detailed volume info
docker system df -v
```

---

## 🔑 Prisma Schema Enums

### Order Status
```
PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
```

### Payment Status
```
PENDING, AUTHORIZED, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED
```

### Payment Methods
```
CREDIT_CARD, PAYPAL, STRIPE, BANK_TRANSFER, NET_TERMS, PURCHASE_ORDER, GSA_SMARTPAY
```

### Product Status
```
DRAFT, ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED
```

### User Roles
```
SUPER_ADMIN, ADMIN, ACCOUNTANT, CUSTOMER_SERVICE,
WAREHOUSE_MANAGER, MARKETING_MANAGER, CUSTOMER, B2B_CUSTOMER, GSA_CUSTOMER
```

### Account Types
```
B2C, B2B, GSA
```

### Loyalty Tiers
```
BRONZE, SILVER, GOLD, PLATINUM, DIAMOND
```

---

## 🎯 Common Tasks

### Create Admin User

```typescript
// Using Prisma Studio
npx prisma studio
// Create user with role: SUPER_ADMIN

// Or via script
npx ts-node scripts/create-admin.ts
```

### Reindex Elasticsearch

```bash
curl -X POST http://localhost:3000/api/admin/reindex
```

### Clear Cache

```bash
# Redis
docker-compose exec redis redis-cli FLUSHALL

# Next.js
rm -rf .next
```

### Update Dependencies

```bash
# Check outdated
npm outdated

# Update all
npm update

# Update specific package
npm update [package-name]
```

---

## 🔍 Useful SQL Queries

```sql
-- Total revenue
SELECT SUM(total_amount) FROM orders WHERE payment_status = 'PAID';

-- Top products
SELECT p.name, COUNT(oi.id) as order_count
FROM products p
JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id
ORDER BY order_count DESC
LIMIT 10;

-- User order history
SELECT * FROM orders
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Low stock products
SELECT * FROM products
WHERE stock_quantity < low_stock_threshold
AND is_active = true;
```

---

## 📞 Quick Links

- **Documentation**: `docs/`
- **API Docs**: `docs/API_DOCUMENTATION.md`
- **Deployment**: `docs/DEPLOYMENT.md`
- **Prisma Studio**: `http://localhost:5555`
- **Elasticsearch**: `http://localhost:9200`
- **Redis**: `localhost:6379`

---

## ⌨️ VS Code Tips

### Recommended Extensions

- Prisma
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Docker
- GitLens

### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  }
}
```

---

## 🎨 Color Palette

```css
/* Safety Green (Primary) */
--safety-green-50: #f0fdf4
--safety-green-600: #16a34a
--safety-green-700: #15803d

/* Black (Text) */
--black: #000000

/* Gray (Backgrounds) */
--gray-50: #f9fafb
--gray-100: #f3f4f6
```

---

**Quick Access**: Bookmark this page for fast reference!
