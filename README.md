# Enterprise E-commerce Platform

A comprehensive, production-ready B2B/B2C/GSA e-commerce platform built with Next.js 14, PostgreSQL, Redis, and Elasticsearch.

## Features

### 🛒 E-commerce Core
- **Product Catalog**: Full-featured product management with categories, variants, and attributes
- **Shopping Cart**: Real-time cart management with Redis caching
- **Checkout**: Multi-step checkout process with address management
- **Order Management**: Complete order lifecycle from placement to delivery
- **Inventory Management**: Real-time stock tracking and low-stock alerts
- **Product Reviews**: Customer reviews and ratings system

### 👥 Multi-Account Types
- **B2C (Consumer)**: Standard e-commerce experience with loyalty rewards
- **B2B (Business)**: Wholesale pricing, bulk orders, credit terms, purchase orders
- **GSA (Government)**: GSA Advantage compliance, contract pricing, GSA SmartPay

### 💎 Loyalty Program
- **Multi-Tier System**: Bronze, Silver, Gold, Platinum, Diamond tiers
- **Points Rewards**: Earn points on purchases, redeem for discounts
- **Tier Benefits**: Exclusive pricing and perks based on tier level
- **Lifetime Tracking**: Track lifetime points and spending

### 💰 Pricing & Discounts
- **Dynamic Pricing**: Different prices for B2C, B2B, and GSA customers
- **Discount Engine**: Percentage, fixed amount, free shipping, buy-x-get-y
- **Promotional Codes**: Time-limited, usage-limited discount codes
- **Tier-based Discounts**: Automatic discounts based on loyalty tier

### 🔐 Authentication & Authorization
- **NextAuth.js**: Secure authentication with JWT sessions
- **Role-Based Access Control (RBAC)**: 9 distinct user roles
  - Super Admin
  - Admin
  - Accountant
  - Customer Service
  - Warehouse Manager
  - Marketing Manager
  - Customer
  - B2B Customer
  - GSA Customer

### 📊 Admin Dashboard
- **Analytics**: Sales, revenue, and customer metrics
- **Product Management**: CRUD operations for products and categories
- **Order Management**: View, update, and process orders
- **User Management**: Manage users and their roles
- **Inventory Control**: Track stock levels and movements
- **Financial Reports**: Revenue, profit, and tax reports

### 📦 Shipping & Fulfillment
- **Multi-Carrier Support**: USPS, FedEx, UPS integration ready
- **Shipment Tracking**: Real-time tracking updates
- **Shipping Rules**: Free shipping thresholds, rate calculation
- **Address Validation**: Validate shipping and billing addresses

### 💳 Payments
- **Stripe Integration**: Secure payment processing (development mode ready)
- **Multiple Payment Methods**: Credit card, PayPal, Bank Transfer
- **B2B Net Terms**: Credit terms (Net 30, Net 60)
- **GSA SmartPay**: Government purchase card support
- **Invoice Generation**: Automatic invoice creation and management

### 🔍 Search & Discovery
- **Elasticsearch**: Fast, relevant product search
- **Filters**: Category, price range, ratings, features
- **Autocomplete**: Real-time search suggestions
- **Faceted Search**: Multi-dimensional filtering

### 📧 Notifications
- **Email Notifications**: Order confirmations, shipping updates
- **In-App Notifications**: Real-time notification center
- **Activity Logs**: Complete audit trail of user actions

### ⚡ Performance
- **Redis Caching**: Fast data retrieval and session management
- **Elasticsearch Indexing**: Instant search results
- **Optimized Database**: Indexed queries and efficient relationships
- **Image Optimization**: Next.js image optimization

## Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **React Query**: Data fetching and caching
- **Zustand**: State management

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Type-safe database client
- **NextAuth.js**: Authentication solution
- **Stripe**: Payment processing

### Database & Infrastructure
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **Elasticsearch**: Search engine
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd siteJadid

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Start Docker services
docker-compose up -d

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npm run prisma:seed

# Start development server
npm run dev
```

Visit http://localhost:3000

## Environment Variables

Copy `.env.example` to `.env` and fill in your own credentials:

```bash
cp .env.example .env
```

See `.env.example` for the full list of required variables.

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeder
├── public/                # Static files
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── auth/          # Auth pages
│   │   ├── dashboard/     # User dashboard
│   │   ├── admin/         # Admin panel
│   │   └── products/      # Product pages
│   ├── components/        # React components
│   │   ├── ui/            # UI components
│   │   └── ...
│   ├── lib/               # Utilities
│   │   ├── db.ts          # Prisma client
│   │   ├── redis.ts       # Redis client
│   │   ├── elasticsearch.ts # Elasticsearch client
│   │   ├── auth.ts        # NextAuth config
│   │   ├── stripe.ts      # Stripe config
│   │   └── utils.ts       # Helper functions
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript types
├── docker-compose.yml     # Docker services
├── Dockerfile             # Production Dockerfile
└── package.json           # Dependencies
```

## API Documentation

### Products API

#### GET /api/products
List products with filters and pagination

Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search query
- `categoryId` (string): Filter by category
- `featured` (boolean): Featured products only
- `minPrice`, `maxPrice` (number): Price range
- `sort` (string): Sort field and order (e.g., "price_asc")

#### GET /api/products/[id]
Get product by ID with reviews and ratings

#### POST /api/products
Create product (Admin only)

#### PATCH /api/products/[id]
Update product (Admin only)

#### DELETE /api/products/[id]
Delete product (Admin only)

### Cart API

#### GET /api/cart
Get user's cart with items

#### POST /api/cart
Add item to cart

Body:
```json
{
  "productId": "string",
  "quantity": 1
}
```

#### DELETE /api/cart
Clear cart

### Orders API

#### GET /api/orders
List user's orders

#### POST /api/orders
Create order from cart

#### GET /api/orders/[id]
Get order details

See full API documentation in `docs/API.md`

## Database Schema

The platform uses a comprehensive Prisma schema with 30+ models including:

- **Users & Auth**: User, Account, Session, Addresses
- **Products**: Product, Category, ProductVariant, Inventory
- **Orders**: Order, OrderItem, OrderStatusHistory
- **Payments**: Invoice, Payment
- **Shipping**: Shipment, ShipmentTracking
- **Loyalty**: LoyaltyProfile, LoyaltyTransaction
- **B2B**: B2BProfile
- **GSA**: GSAProfile
- **Reviews**: Review
- **Discounts**: Discount, ProductDiscount
- **Cart**: Cart, CartItem
- **Wishlist**: Wishlist, WishlistItem
- **Notifications**: Notification
- **Logs**: ActivityLog
- **Settings**: Setting

## Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.yml up -d
```

Services:
- **app**: Next.js application (port 3000)
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)
- **elasticsearch**: Search engine (port 9200)

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database

# Docker
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:build     # Build Docker images

```

## Features Roadmap

- [x] Product catalog and search
- [x] Shopping cart and checkout
- [x] Multi-account types (B2C, B2B, GSA)
- [x] Loyalty program
- [x] Discount engine
- [x] Order management
- [x] Inventory tracking
- [x] Payment integration (Stripe)
- [x] Product reviews
- [x] Admin dashboard
- [ ] Real-time chat support
- [ ] Advanced analytics
- [ ] Email marketing integration
- [ ] Mobile app API
- [ ] Multi-language support
- [ ] Multi-currency support

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection protection (Prisma)
- XSS protection
- CSRF protection
- Rate limiting ready
- Secure session management

## Performance Optimization

- Redis caching for frequently accessed data
- Elasticsearch for fast search
- Database query optimization with indexes
- Image optimization with Next.js
- API response caching
- Lazy loading and code splitting

## License

MIT License
