# Complete Developer Cheat Sheet

**Quick reference for all commands, enums, statuses, workflows, and common operations.**

---

## 📋 Table of Contents

1. [Quick Start Commands](#quick-start-commands)
2. [Database Commands](#database-commands)
3. [PM2 Production Commands](#pm2-production-commands)
4. [Git Commands](#git-commands)
5. [All Enums Reference](#all-enums-reference)
6. [Status Workflows](#status-workflows)
7. [Pricing Priority](#pricing-priority)
8. [All API Endpoints](#all-api-endpoints)
9. [Database Models Quick Reference](#database-models-quick-reference)
10. [Common Code Snippets](#common-code-snippets)
11. [Environment Variables](#environment-variables)
12. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start Commands

```bash
# Clone repository
git clone https://github.com/your-repo/siteJadid.git
cd siteJadid

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env  # Edit with your values

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# OR run migrations
npx prisma migrate dev
npx prisma migrate deploy  # Production

# Development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 💾 Database Commands

### Prisma Commands
```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes (development)
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Seed database
npx prisma db seed

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Pull schema from database
npx prisma db pull
```

### PostgreSQL Commands
```bash
# Connect to PostgreSQL
psql -U username -d sitejadid

# List databases
\l

# Connect to database
\c sitejadid

# List tables
\dt

# Describe table
\d table_name

# Show table size
SELECT pg_size_pretty(pg_total_relation_size('table_name'));

# Backup database
pg_dump -U siteuser sitejadid > backup.sql
pg_dump -U siteuser sitejadid | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore database
psql -U siteuser sitejadid < backup.sql
gunzip < backup_20241122.sql.gz | psql -U siteuser sitejadid

# Check database size
SELECT pg_size_pretty(pg_database_size('sitejadid'));

# Show active connections
SELECT * FROM pg_stat_activity WHERE datname = 'sitejadid';

# Kill connection
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'sitejadid' AND pid <> pg_backend_pid();
```

---

## 🔧 PM2 Production Commands

### Basic Operations
```bash
# Start application
pm2 start npm --name "siteJadid" -- start
pm2 start ecosystem.config.js

# Stop application
pm2 stop siteJadid
pm2 stop all

# Restart application
pm2 restart siteJadid
pm2 restart all

# Reload (zero-downtime restart)
pm2 reload siteJadid

# Delete from PM2
pm2 delete siteJadid
pm2 delete all

# List all processes
pm2 list
pm2 ls

# Show detailed info
pm2 show siteJadid
pm2 info siteJadid

# Monitor in real-time
pm2 monit

# View logs
pm2 logs siteJadid
pm2 logs siteJadid --lines 100
pm2 logs siteJadid --err  # Error logs only
pm2 logs siteJadid --out  # Output logs only

# Flush logs
pm2 flush

# Save process list
pm2 save

# Resurrect saved processes
pm2 resurrect

# Setup startup script
pm2 startup
pm2 save

# Update PM2
pm2 update

# Kill PM2 daemon
pm2 kill
```

### Advanced PM2
```bash
# Scale to N instances
pm2 scale siteJadid 4

# Set environment
pm2 restart siteJadid --update-env

# Memory management
pm2 restart siteJadid --max-memory-restart 500M

# CPU monitoring
pm2 monit

# Generate startup script
pm2 startup systemd

# Ecosystem file example
module.exports = {
  apps: [{
    name: 'siteJadid',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '500M',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

---

## 📦 Git Commands

```bash
# Clone repository
git clone https://github.com/your-repo/siteJadid.git

# Check status
git status

# Add files
git add .
git add filename

# Commit
git commit -m "commit message"
git commit -m "$(cat <<'EOF'
Multi-line commit message
with details
EOF
)"

# Push
git push origin main
git push -u origin feature-branch

# Pull
git pull origin main

# Branch operations
git branch                    # List branches
git branch feature-name       # Create branch
git checkout feature-name     # Switch branch
git checkout -b feature-name  # Create and switch
git branch -d feature-name    # Delete branch

# Merge
git merge feature-name

# Stash
git stash
git stash list
git stash apply
git stash pop
git stash drop

# View logs
git log
git log --oneline
git log --graph --oneline --all

# Diff
git diff
git diff --staged

# Reset
git reset HEAD~1              # Undo last commit (keep changes)
git reset --hard HEAD~1       # Undo last commit (discard changes)

# Tag
git tag v1.0.0
git push origin v1.0.0
```

---

## 📊 All Enums Reference

### UserRole
```typescript
enum UserRole {
  SUPER_ADMIN       // Full system access
  ADMIN             // Admin panel access
  ACCOUNTANT        // Financial reports only
  CUSTOMER_SERVICE  // Orders & customers
  WAREHOUSE_MANAGER // Inventory management
  MARKETING_MANAGER // Marketing & analytics
  CUSTOMER          // Regular customer
  B2B_CUSTOMER      // B2B customer
  GSA_CUSTOMER      // Government customer
}
```

### AccountType
```typescript
enum AccountType {
  B2C  // Business to Consumer (retail)
  B2B  // Business to Business (wholesale)
  GSA  // Government Services Administration
}
```

### LoyaltyTier
```typescript
enum LoyaltyTier {
  BRONZE    // 0-999 points
  SILVER    // 1,000-4,999 points
  GOLD      // 5,000-14,999 points
  PLATINUM  // 15,000-49,999 points
  DIAMOND   // 50,000+ points
}
```

### ProductStatus
```typescript
enum ProductStatus {
  DRAFT         // Not published
  ACTIVE        // Available for sale
  INACTIVE      // Temporarily unavailable
  OUT_OF_STOCK  // No inventory
  DISCONTINUED  // No longer available
}
```

### OrderStatus
```typescript
enum OrderStatus {
  PENDING      // Order created, payment pending
  CONFIRMED    // Payment confirmed
  PROCESSING   // Being prepared
  SHIPPED      // Shipped to customer
  DELIVERED    // Delivered
  CANCELLED    // Cancelled
  REFUNDED     // Refunded
  ON_HOLD      // On hold for review
}
```

### PaymentStatus
```typescript
enum PaymentStatus {
  PENDING             // Not processed
  AUTHORIZED          // Authorized
  PAID                // Completed
  FAILED              // Failed
  REFUNDED            // Full refund
  PARTIALLY_REFUNDED  // Partial refund
}
```

### PaymentMethod
```typescript
enum PaymentMethod {
  CREDIT_CARD      // Credit/Debit card
  PAYPAL           // PayPal
  STRIPE           // Stripe
  BANK_TRANSFER    // Bank transfer
  NET_TERMS        // B2B net terms
  PURCHASE_ORDER   // B2B purchase order
  GSA_SMARTPAY     // GSA SmartPay card
}
```

### B2BStatus
```typescript
enum B2BStatus {
  PENDING    // Application submitted
  APPROVED   // Approved and active
  SUSPENDED  // Temporarily suspended
  REJECTED   // Application rejected
}
```

### GSAApprovalStatus
```typescript
enum GSAApprovalStatus {
  PENDING   // Awaiting approval
  APPROVED  // Approved
  REJECTED  // Rejected
}
```

### ShipmentStatus
```typescript
enum ShipmentStatus {
  PENDING           // Not shipped
  PROCESSING        // Being processed
  SHIPPED           // Shipped
  IN_TRANSIT        // In transit
  OUT_FOR_DELIVERY  // Out for delivery
  DELIVERED         // Delivered
  FAILED            // Delivery failed
  RETURNED          // Returned
}
```

### InvoiceStatus
```typescript
enum InvoiceStatus {
  DRAFT     // Not sent
  SENT      // Sent to customer
  PAID      // Paid
  OVERDUE   // Past due date
  CANCELLED // Cancelled
}
```

### DiscountType
```typescript
enum DiscountType {
  PERCENTAGE     // Percentage discount (e.g., 10%)
  FIXED_AMOUNT   // Fixed amount (e.g., $5)
  FREE_SHIPPING  // Free shipping
  BUY_X_GET_Y    // Buy X get Y free
}
```

### ReviewStatus
```typescript
enum ReviewStatus {
  PENDING   // Awaiting moderation
  APPROVED  // Approved and visible
  REJECTED  // Rejected
}
```

### SupplierStatus
```typescript
enum SupplierStatus {
  ACTIVE            // Active supplier
  INACTIVE          // Inactive
  SUSPENDED         // Suspended
  PENDING_APPROVAL  // Awaiting approval
}
```

### QuoteStatus
```typescript
enum QuoteStatus {
  DRAFT      // Being created
  SENT       // Sent to customer
  VIEWED     // Customer viewed
  ACCEPTED   // Customer accepted
  REJECTED   // Customer rejected
  EXPIRED    // Quote expired
  CONVERTED  // Converted to order
}
```

### ContractStatus
```typescript
enum ContractStatus {
  DRAFT      // Being created
  ACTIVE     // Active contract
  EXPIRED    // Expired
  RENEWED    // Renewed
  CANCELLED  // Cancelled
  SUSPENDED  // Suspended
}
```

### POStatus (Purchase Order)
```typescript
enum POStatus {
  DRAFT               // Being created
  SENT                // Sent to supplier
  ACKNOWLEDGED        // Supplier acknowledged
  PARTIALLY_RECEIVED  // Partially received
  RECEIVED            // Fully received
  CANCELLED           // Cancelled
}
```

### BackOrderStatus
```typescript
enum BackOrderStatus {
  PENDING    // Waiting for stock
  NOTIFIED   // Customer notified
  FULFILLED  // Order fulfilled
  CANCELLED  // Cancelled
}
```

### RMAStatus
```typescript
enum RMAStatus {
  REQUESTED       // Customer requested
  APPROVED        // Approved
  REJECTED        // Rejected
  ITEMS_RECEIVED  // Items received
  INSPECTION      // Being inspected
  REFUNDED        // Refund issued
  REPLACED        // Replacement sent
  CLOSED          // RMA closed
}
```

### RMAType
```typescript
enum RMAType {
  REFUND        // Money refund
  EXCHANGE      // Product exchange
  REPAIR        // Repair product
  STORE_CREDIT  // Store credit
}
```

### ReturnReason
```typescript
enum ReturnReason {
  DEFECTIVE           // Defective product
  WRONG_ITEM          // Wrong item sent
  NOT_AS_DESCRIBED    // Not as described
  DAMAGED_SHIPPING    // Damaged in shipping
  CHANGED_MIND        // Customer changed mind
  ORDERED_BY_MISTAKE  // Ordered by mistake
  BETTER_PRICE        // Found better price
  NO_LONGER_NEEDED    // No longer needed
  OTHER               // Other reason
}
```

### CommissionStatus
```typescript
enum CommissionStatus {
  PENDING    // Not yet approved
  APPROVED   // Approved for payment
  PAID       // Paid
  CANCELLED  // Cancelled
}
```

### SubscriptionStatus
```typescript
enum SubscriptionStatus {
  ACTIVE    // Active subscription
  PAUSED    // Paused by customer
  CANCELLED // Cancelled
  EXPIRED   // Expired
  PAST_DUE  // Payment past due
}
```

### SubscriptionFrequency
```typescript
enum SubscriptionFrequency {
  WEEKLY     // Every week
  BIWEEKLY   // Every 2 weeks
  MONTHLY    // Every month
  QUARTERLY  // Every 3 months
  YEARLY     // Every year
}
```

### CreditStatus
```typescript
enum CreditStatus {
  ACTIVE     // Active credit account
  SUSPENDED  // Suspended
  FROZEN     // Frozen (no new purchases)
  DEFAULTED  // Defaulted
}
```

### TaxExemptionStatus
```typescript
enum TaxExemptionStatus {
  PENDING   // Awaiting approval
  APPROVED  // Approved
  REJECTED  // Rejected
  EXPIRED   // Certificate expired
}
```

---

## 🔄 Status Workflows

### Order Workflow
```
PENDING
  ↓ (payment confirmed)
CONFIRMED
  ↓ (warehouse processing)
PROCESSING
  ↓ (shipped)
SHIPPED
  ↓ (delivered)
DELIVERED

Alternative paths:
PENDING → CANCELLED
CONFIRMED → CANCELLED
CONFIRMED → ON_HOLD → PROCESSING
DELIVERED → REFUNDED (with RMA)
```

### Payment Workflow
```
PENDING
  ↓ (stripe authorization)
AUTHORIZED
  ↓ (charge captured)
PAID
  ↓ (refund requested)
REFUNDED / PARTIALLY_REFUNDED

Alternative path:
PENDING → FAILED
```

### Quote Workflow
```
DRAFT
  ↓ (sent to customer)
SENT
  ↓ (customer opened)
VIEWED
  ↓
ACCEPTED / REJECTED / EXPIRED
  ↓ (if accepted)
CONVERTED (to Order)
```

### RMA Workflow
```
REQUESTED
  ↓
APPROVED / REJECTED
  ↓ (if approved)
ITEMS_RECEIVED
  ↓
INSPECTION
  ↓
REFUNDED / REPLACED
  ↓
CLOSED
```

### B2B Application Workflow
```
PENDING
  ↓ (admin review)
APPROVED / REJECTED / SUSPENDED
```

### Purchase Order Workflow
```
DRAFT
  ↓
SENT (to supplier)
  ↓
ACKNOWLEDGED (by supplier)
  ↓
PARTIALLY_RECEIVED / RECEIVED
  ↓ (stock updated)
COMPLETED

Alternative path:
Any status → CANCELLED
```

---

## 💰 Pricing Priority

**For any product, the system applies prices in this order (lowest to highest):**

1. **GSA Price** (lowest) - Government customers
2. **Contract Price** - Customer-specific contract
3. **Tiered Price** - Quantity-based pricing
4. **Wholesale Price** - B2B customers
5. **Sale Price** - Active sale/promotion
6. **Base Price** (highest) - Regular retail price

**Example:**
```
Product: Hard Hat - Class E
- Base Price: $45.99
- Sale Price: $39.99
- Wholesale Price: $35.99
- Tiered Price (50+ qty): $32.99
- Contract Price (Customer A): $30.99
- GSA Price: $28.50

B2C Customer: Gets $39.99 (sale price)
B2B Customer: Gets $35.99 (wholesale price)
B2B Customer (50 qty): Gets $32.99 (tiered price)
Contract Customer: Gets $30.99 (contract price)
GSA Customer: Gets $28.50 (GSA price)
```

---

## 🌐 All API Endpoints

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/[...nextauth]
GET    /api/auth/session
POST   /api/auth/signout
```

### Public Products
```
GET    /api/products
GET    /api/products/[id]
GET    /api/search
```

### Cart & Checkout
```
GET    /api/cart
POST   /api/cart
GET    /api/cart/count
POST   /api/payments/create-intent
```

### Admin - Products
```
GET    /api/admin/products
POST   /api/admin/products
GET    /api/admin/products/[id]
PUT    /api/admin/products/[id]
DELETE /api/admin/products/[id]
PUT    /api/admin/products/[id]/inventory
POST   /api/admin/products/[id]/suppliers
GET    /api/admin/product-suppliers/[id]
PUT    /api/admin/product-suppliers/[id]
DELETE /api/admin/product-suppliers/[id]
```

### Admin - Categories
```
GET    /api/admin/categories
POST   /api/admin/categories
GET    /api/admin/categories/[id]
PUT    /api/admin/categories/[id]
DELETE /api/admin/categories/[id]
```

### Admin - Orders
```
GET    /api/admin/orders
GET    /api/admin/orders/[id]
PUT    /api/admin/orders/[id]/status
```

### Admin - Customers
```
GET    /api/admin/customers
GET    /api/admin/customers/[id]
POST   /api/admin/customers/[id]/credit
POST   /api/admin/customers/[id]/gsa-approval
```

### Admin - B2B Features
```
GET    /api/admin/customer-groups
POST   /api/admin/customer-groups
GET    /api/admin/customer-groups/[id]
PUT    /api/admin/customer-groups/[id]
DELETE /api/admin/customer-groups/[id]
POST   /api/admin/customer-groups/[id]/members

GET    /api/admin/quotes
POST   /api/admin/quotes

GET    /api/admin/contracts
POST   /api/admin/contracts

GET    /api/admin/tiered-prices
POST   /api/admin/tiered-prices
GET    /api/admin/tiered-prices/[id]
PUT    /api/admin/tiered-prices/[id]
DELETE /api/admin/tiered-prices/[id]

GET    /api/admin/category-discounts
POST   /api/admin/category-discounts
GET    /api/admin/category-discounts/[id]
PUT    /api/admin/category-discounts/[id]
DELETE /api/admin/category-discounts/[id]
```

### Admin - Inventory
```
GET    /api/admin/warehouses
POST   /api/admin/warehouses

GET    /api/admin/inventory
POST   /api/admin/warehouse-transfers
```

### Admin - Suppliers
```
GET    /api/admin/suppliers
POST   /api/admin/suppliers
GET    /api/admin/suppliers/[id]
PUT    /api/admin/suppliers/[id]
DELETE /api/admin/suppliers/[id]

GET    /api/admin/purchase-orders
POST   /api/admin/purchase-orders
```

### Admin - Advanced
```
GET    /api/admin/bundles
POST   /api/admin/bundles

GET    /api/admin/backorders
GET    /api/admin/rma
POST   /api/admin/rma

GET    /api/admin/subscriptions
POST   /api/admin/subscriptions

GET    /api/admin/commissions
GET    /api/admin/tax-exemptions

GET    /api/admin/reviews
GET    /api/admin/wishlists
GET    /api/admin/product-attributes

POST   /api/admin/make-admin
```

---

## 📚 Database Models Quick Reference

**Total: 67 Models**

### User Management (5)
- User
- Account
- Session
- VerificationToken
- Address

### Profiles (3)
- B2BProfile
- GSAProfile
- LoyaltyProfile, LoyaltyTransaction

### Products (5)
- Category
- Product
- ProductVariant
- ProductAttribute
- ProductAttributeValue

### Inventory (4)
- InventoryLog
- Warehouse
- WarehouseStock
- WarehouseTransfer

### Shopping (4)
- Cart, CartItem
- Wishlist, WishlistItem

### Orders (5)
- Order
- OrderItem
- OrderStatusHistory
- Shipment
- ShipmentTracking

### Payments (3)
- Invoice
- Payment
- CustomerCredit, CreditTransaction

### Discounts (4)
- Discount
- ProductDiscount
- CategoryDiscount
- TieredPrice

### Reviews & Social (2)
- Review
- Notification

### B2B Features (6)
- CustomerGroup
- CustomerGroupMember
- Quote, QuoteItem
- Contract, ContractItem

### Suppliers (4)
- Supplier
- ProductSupplier
- PurchaseOrder, PurchaseOrderItem
- POReceipt, POReceiptItem

### Advanced (7)
- ProductBundle, BundleItem
- BackOrder
- RMA, RMAItem
- Subscription, SubscriptionItem, SubscriptionOrder
- SalesRep, Commission

### Settings (4)
- Setting
- ShippingMethod
- TaxExemption
- ActivityLog

---

## 💻 Common Code Snippets

### Create New Product
```typescript
const product = await prisma.product.create({
  data: {
    sku: "PPE-HH-001",
    name: "Hard Hat - Class E",
    slug: "hard-hat-class-e",
    description: "ANSI Z89.1 certified hard hat",
    status: "ACTIVE",
    basePrice: new Decimal(45.99),
    salePrice: new Decimal(39.99),
    stockQuantity: 150,
    lowStockThreshold: 20,
    categoryId: "clxc1...",
    images: ["/uploads/hardhat-001.jpg"],
    isFeatured: true
  }
});
```

### Create Order
```typescript
const order = await prisma.order.create({
  data: {
    orderNumber: `ORD-${new Date().getFullYear()}-${String(nextNumber).padStart(6, '0')}`,
    userId: "clxu1...",
    accountType: "B2C",
    status: "PENDING",
    paymentStatus: "PENDING",
    subtotal: new Decimal(125.00),
    tax: new Decimal(10.00),
    shipping: new Decimal(15.00),
    total: new Decimal(150.00),
    billingAddressId: "clxaddr1...",
    shippingAddressId: "clxaddr2...",
    items: {
      create: [
        {
          productId: "clxp1...",
          sku: "PPE-HH-001",
          name: "Hard Hat - Class E",
          quantity: 2,
          price: new Decimal(39.99),
          total: new Decimal(79.98)
        }
      ]
    }
  },
  include: {
    items: true,
    user: true,
    billingAddress: true,
    shippingAddress: true
  }
});
```

### Get Product with Price for User
```typescript
async function getProductPrice(productId: string, userId: string, quantity: number = 1) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      b2bProfile: true,
      gsaProfile: true,
      contracts: {
        where: {
          status: 'ACTIVE',
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        },
        include: {
          items: {
            where: { productId, isActive: true }
          }
        }
      },
      customerGroups: {
        include: {
          group: {
            include: {
              tieredPrices: {
                where: {
                  productId,
                  isActive: true,
                  minQuantity: { lte: quantity },
                  OR: [
                    { maxQuantity: null },
                    { maxQuantity: { gte: quantity } }
                  ]
                }
              }
            }
          }
        }
      }
    }
  });

  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  // Priority: GSA > Contract > Tiered > Wholesale > Sale > Base
  if (user?.accountType === 'GSA' && product?.gsaPrice) {
    return product.gsaPrice;
  }

  const contractPrice = user?.contracts[0]?.items[0]?.contractPrice;
  if (contractPrice) {
    return contractPrice;
  }

  const tieredPrice = user?.customerGroups[0]?.group.tieredPrices[0]?.price;
  if (tieredPrice) {
    return tieredPrice;
  }

  if (user?.accountType === 'B2B' && product?.wholesalePrice) {
    return product.wholesalePrice;
  }

  return product?.salePrice || product?.basePrice;
}
```

### Update Inventory
```typescript
async function updateInventory(
  productId: string,
  warehouseId: string,
  quantity: number,
  action: 'add' | 'subtract' | 'set',
  notes?: string
) {
  const stock = await prisma.warehouseStock.findUnique({
    where: {
      warehouseId_productId: {
        warehouseId,
        productId
      }
    }
  });

  const previousQty = stock?.quantity || 0;
  let newQty = previousQty;

  if (action === 'add') {
    newQty = previousQty + quantity;
  } else if (action === 'subtract') {
    newQty = Math.max(0, previousQty - quantity);
  } else {
    newQty = quantity;
  }

  const updated = await prisma.warehouseStock.upsert({
    where: {
      warehouseId_productId: {
        warehouseId,
        productId
      }
    },
    update: {
      quantity: newQty,
      available: newQty - (stock?.reserved || 0)
    },
    create: {
      warehouseId,
      productId,
      quantity: newQty,
      available: newQty
    }
  });

  // Log the change
  await prisma.inventoryLog.create({
    data: {
      productId,
      action: action === 'add' ? 'PURCHASE' : action === 'subtract' ? 'SALE' : 'ADJUSTMENT',
      quantity,
      previousQty,
      newQty,
      notes
    }
  });

  return updated;
}
```

---

## 🔐 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/sitejadid"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_URL_INTERNAL="http://localhost:3000"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yoursite.com"

# AWS S3 (Optional for file uploads)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
AWS_REGION="us-east-1"

# App Settings
NODE_ENV="development"
PORT="3000"
BASE_URL="http://localhost:3000"

# Security
SESSION_SECRET="generate-with-openssl-rand-base64-32"
ENCRYPTION_KEY="generate-with-openssl-rand-base64-32"
```

**Generate Secrets:**
```bash
# Generate random secret
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U siteuser -d sitejadid -h localhost

# Check if PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check DATABASE_URL format
# postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

### Prisma Issues
```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Check schema for errors
npx prisma validate
```

### PM2 Issues
```bash
# Check PM2 logs
pm2 logs siteJadid --err

# Restart with environment update
pm2 restart siteJadid --update-env

# Clear PM2 logs
pm2 flush

# Check memory usage
pm2 monit

# Kill and restart PM2
pm2 kill
pm2 resurrect
```

### Next.js Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check for TypeScript errors
npm run type-check

# Run linter
npm run lint
```

### Redis Issues
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
sudo systemctl start redis

# Check Redis status
sudo systemctl status redis

# View Redis logs
sudo journalctl -u redis -f
```

### Build Errors
```bash
# Clear all caches and rebuild
rm -rf .next node_modules
npm install
npx prisma generate
npm run build
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Or
netstat -tulpn | grep :3000

# Kill process
kill -9 PID
```

---

## 📖 Common Queries

### Find Orders by Status
```typescript
const orders = await prisma.order.findMany({
  where: {
    status: 'PROCESSING',
    paymentStatus: 'PAID'
  },
  include: {
    user: true,
    items: {
      include: {
        product: true
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  }
});
```

### Low Stock Products
```typescript
const lowStockProducts = await prisma.product.findMany({
  where: {
    stockQuantity: {
      lte: prisma.product.fields.lowStockThreshold
    },
    status: 'ACTIVE'
  },
  orderBy: {
    stockQuantity: 'asc'
  }
});
```

### Customer Lifetime Value
```typescript
const customerValue = await prisma.order.aggregate({
  where: {
    userId: 'clxu1...',
    status: 'DELIVERED'
  },
  _sum: {
    total: true
  },
  _count: true
});
```

### Best Selling Products
```typescript
const bestSellers = await prisma.orderItem.groupBy({
  by: ['productId'],
  _sum: {
    quantity: true
  },
  orderBy: {
    _sum: {
      quantity: 'desc'
    }
  },
  take: 10
});
```

---

**Last Updated:** November 2024
**Version:** 1.0.0
