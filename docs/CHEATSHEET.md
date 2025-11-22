# Quick Reference Cheat Sheet

## 🚀 Quick Start Commands

```bash
# Development
npm run dev                # Start development server
npm run build             # Build for production
npm start                 # Start production server

# Database
npx prisma generate       # Generate Prisma Client
npx prisma db push        # Push schema to database
npx prisma studio         # Open Prisma Studio

# PM2 Production
pm2 start npm --name "siteJadid" -- start
pm2 restart siteJadid
pm2 logs siteJadid
```

## 🔑 User Roles
- SUPER_ADMIN - Full access
- ADMIN - Admin panel
- CUSTOMER - Customer facing
- B2B_CUSTOMER - B2B features
- GSA_CUSTOMER - GSA features

## 💰 Pricing Order (Low to High)
1. GSA Price
2. Contract Price
3. Tiered Price
4. Wholesale Price
5. Sale Price
6. Base Price

## 📦 Common Statuses

**Order:**
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED

**Payment:**
PENDING → AUTHORIZED → PAID

**Product:**
DRAFT, ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED

## 🌐 Key API Endpoints

**Public:**
- GET /api/products
- GET /api/cart
- POST /api/orders

**Admin:**
- /api/admin/products
- /api/admin/orders
- /api/admin/customers
- /api/admin/inventory
- /api/admin/suppliers

**Last Updated:** November 2024
