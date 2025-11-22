# Enterprise E-commerce Platform - Professional Edition

A production-ready, enterprise-grade B2B/B2C/GSA e-commerce platform with comprehensive DTOs, validation, and US-standard implementations.

## 🚀 What's New in Professional Edition

### ✅ Comprehensive DTO Layer with Zod Validation
- **Product DTOs**: Full CRUD with validation (`CreateProductDto`, `UpdateProductDto`, `ProductQueryDto`)
- **Order DTOs**: Complete order management (`CreateOrderDto`, `RefundOrderDto`, `CancelOrderDto`)
- **Cart DTOs**: Shopping cart operations with validation
- **User DTOs**: Authentication and profile management
- **Address DTOs**: US address format with state validation
- **Payment DTOs**: Stripe integration with proper validation
- **Shipping DTOs**: Multi-carrier support (USPS, FedEx, UPS)
- **Review DTOs**: Product review system
- **Discount DTOs**: Promotional codes and campaigns

### ✅ Enhanced Prisma Schema
- **Professional indexes** for optimal query performance
- **Proper cascade rules** for data integrity
- **Audit fields** (createdAt, updatedAt, lastLoginAt)
- **Better constraints** and unique keys
- **Table mappings** with proper naming conventions
- **Full-text search** support preparation

### ✅ Comprehensive Seed Data (US Standards)
- **10 User accounts** covering all roles
- **15 Products** with US pricing, weights (lbs), dimensions (inches)
- **3 Complete orders** with full lifecycle:
  - B2C order delivered via FedEx Ground
  - B2B wholesale order in-transit via UPS
  - GSA government order delivered via USPS Priority
- **Full shipping tracking** with real-time status updates
- **Invoice & payment records** for all orders
- **US addresses** with valid ZIP codes and state abbreviations
- **Loyalty transactions** and point management
- **Product reviews** from verified purchases
- **Inventory logs** tracking stock movements
- **Notifications** for order updates

## 📦 Complete File Structure

```
enterprise-ecommerce-platform/
├── src/
│   ├── dto/                          # DTO Layer with Zod Validation
│   │   ├── product.dto.ts            # Product CRUD DTOs
│   │   ├── order.dto.ts              # Order management DTOs
│   │   ├── cart.dto.ts               # Shopping cart DTOs
│   │   ├── user.dto.ts               # User & auth DTOs
│   │   ├── address.dto.ts            # US address DTOs
│   │   ├── payment.dto.ts            # Payment processing DTOs
│   │   ├── shipping.dto.ts           # Shipping carrier DTOs
│   │   ├── review.dto.ts             # Review system DTOs
│   │   └── discount.dto.ts           # Discount & promotion DTOs
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   ├── page.tsx                  # Homepage
│   │   └── layout.tsx                # Root layout
│   ├── components/                   # React Components
│   │   ├── ui/                       # UI Components
│   │   └── providers.tsx             # Client providers
│   ├── lib/                          # Core Libraries
│   │   ├── db.ts                     # Prisma client
│   │   ├── redis.ts                  # Redis caching
│   │   ├── elasticsearch.ts          # Search engine
│   │   ├── auth.ts                   # NextAuth + RBAC
│   │   ├── stripe.ts                 # Payment processing
│   │   └── utils.ts                  # Helper functions
│   └── types/                        # TypeScript types
├── prisma/
│   ├── schema.prisma                 # Enhanced schema with 30+ models
│   ├── seed.ts                       # Basic seed
│   └── seed-comprehensive.ts         # Full seed with orders/shipping/payments
├── docs/                             # Documentation
│   ├── API.md                        # API documentation
│   ├── DEPLOYMENT.md                 # Deployment guide
│   └── USER_GUIDE.md                 # User documentation
└── scripts/
    └── deploy.sh                     # One-click deployment
```

## 🎯 DTO Examples

### Product Creation with Validation

```typescript
import { CreateProductDto } from '@/dto/product.dto';

// Validate and create product
const productData = CreateProductDto.parse({
  sku: 'LAPTOP-001',
  name: 'Professional Laptop',
  slug: 'professional-laptop',
  basePrice: 1299.99,
  salePrice: 1199.99,
  wholesalePrice: 1050.00,
  gsaPrice: 1150.00,
  stockQuantity: 50,
  weight: 3.5, // lbs
  dimensions: '{"length": 14, "width": 9, "height": 0.7}', // inches
  categoryId: 'uuid-here',
  images: ['https://example.com/image.jpg'],
  isFeatured: true,
});
```

### Order Creation with Address Validation

```typescript
import { CreateOrderDto } from '@/dto/order.dto';
import { CreateAddressDto } from '@/dto/address.dto';

// Validate US address
const address = CreateAddressDto.parse({
  firstName: 'John',
  lastName: 'Doe',
  address1: '123 Main Street',
  city: 'San Francisco',
  state: 'CA', // Must be valid US state code
  zipCode: '94102', // US ZIP format
  country: 'USA',
  phone: '+14155551234',
});

// Create order
const order = CreateOrderDto.parse({
  billingAddressId: 'addr-uuid',
  shippingAddressId: 'addr-uuid',
  paymentMethod: 'STRIPE',
  shippingMethod: 'FEDEX_GROUND',
  discountCode: 'WELCOME10',
});
```

### Shipping Rate Calculation

```typescript
import { CalculateShippingRateDto } from '@/dto/shipping.dto';

const rateRequest = CalculateShippingRateDto.parse({
  carrier: 'FEDEX',
  service: 'FEDEX_GROUND',
  fromZipCode: '94102',
  toZipCode: '10003',
  weight: 5.5, // pounds
  length: 12, // inches
  width: 10,
  height: 8,
  declaredValue: 500.00, // for insurance
});
```

## 🗄️ Database Schema Highlights

### Enhanced User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  role          UserRole  @default(CUSTOMER)
  accountType   AccountType @default(B2C)
  lastLoginAt   DateTime? // New audit field

  // Enhanced indexes
  @@index([email])
  @@index([role])
  @@index([accountType])
  @@index([isActive])
  @@map("users") // Professional table naming
}
```

### Order Model with Full Tracking
```prisma
model Order {
  orderNumber       String   @unique
  status            OrderStatus
  paymentStatus     PaymentStatus

  // Tax details
  taxRate           Decimal  @db.Decimal(5, 2)
  taxableAmount     Decimal  @db.Decimal(12, 2)

  // Shipping
  trackingNumber    String?
  estimatedDelivery DateTime?

  // B2B
  purchaseOrderNumber String?
  paymentDueDate    DateTime?

  // GSA
  gsaContractNumber String?

  // Multiple status tracking
  statusHistory     OrderStatusHistory[]
  shipments         Shipment[]
  invoices          Invoice[]

  @@index([trackingNumber])
  @@map("orders")
}
```

### Shipment Tracking Model
```prisma
model ShipmentTracking {
  status      String
  location    String?
  city        String?
  state       String?
  zipCode     String?
  country     String?
  message     String?
  timestamp   DateTime

  @@index([shipmentId])
  @@index([timestamp])
  @@map("shipment_tracking")
}
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Docker Services
```bash
npm run docker:up
```

### 4. Run Database Setup
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed with comprehensive data (recommended)
npm run prisma:seed-full
```

### 5. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## 📊 Seed Data Summary

The comprehensive seed (`prisma:seed-full`) creates:

### Users (10 accounts)
- **Super Admin**: superadmin@ecommerce.com
- **Admin**: admin@ecommerce.com
- **Accountant**: accountant@ecommerce.com
- **Warehouse Manager**: warehouse@ecommerce.com
- **Customer Service**: support@ecommerce.com
- **Marketing Manager**: marketing@ecommerce.com
- **B2C Customer 1**: john.doe@gmail.com
- **B2C Customer 2**: jane.smith@gmail.com
- **B2B Customer**: purchasing@techcorp.com
- **GSA Customer**: procurement@gsa.gov

**Password for all**: `password123`

### Products (15 items)
1. Professional Business Laptop Pro 15 - $1,199.99
2. Ultrabook Elite 14 - $899.99
3. Executive Standing Desk - $699.99
4. Ergonomic Office Chair - $399.99
5. 27" 4K UHD Monitor - $549.99
6. Mechanical Keyboard RGB - $129.99
7. Wireless Ergonomic Mouse - $69.99
8. Multifunction Laser Printer - $499.99
9. 1080p HD Webcam - $79.99
10. Wireless Noise-Canceling Headset - $219.99
11. USB-C Docking Station - $299.99
12. Professional Business Tablet - $799.99
13. Business Laptop Backpack - $79.99
14. 100W GaN USB-C Charger - $69.99
15. Surge Protector 12-Outlet - $49.99

### Orders (3 complete orders)

#### Order 1: B2C Delivered (FedEx)
- **Customer**: john.doe@gmail.com
- **Order Number**: ORD-2024-00001
- **Total**: $2,318.95
- **Status**: Delivered
- **Carrier**: FedEx Ground
- **Tracking**: 7961234567890
- **Items**: Laptop Pro, 4K Monitor, 2x Docking Stations
- **Payment**: Stripe (Paid)
- **Shipping**: San Francisco → San Jose, CA
- **Tracking Events**: 6 events from label creation to delivery

#### Order 2: B2B In Transit (UPS)
- **Customer**: purchasing@techcorp.com (TechCorp Solutions Inc.)
- **Order Number**: ORD-2024-00002
- **Total**: $12,725.00
- **Status**: Shipped (In Transit)
- **Carrier**: UPS Ground
- **Tracking**: 1Z999AA10123456784
- **Items**: 10x Laptops, 5x Standing Desks, 10x Chairs
- **Payment**: Net 30 Terms (Due Dec 25, 2024)
- **PO Number**: PO-TECH-2024-1156
- **Shipping**: Austin, TX (in transit)
- **Discount**: 20% B2B wholesale pricing

#### Order 3: GSA Delivered (USPS)
- **Customer**: procurement@gsa.gov
- **Order Number**: ORD-2024-00003
- **Total**: $9,200.00
- **Status**: Delivered
- **Carrier**: USPS Priority Mail
- **Tracking**: 9400111899563824718956
- **Items**: 5x Laptops, 5x Monitors, 4x Docking Stations
- **Payment**: GSA SmartPay (Paid)
- **Contract**: GS-00F-0001X
- **Shipping**: San Francisco → Washington, DC
- **Tracking Events**: 6 events with full location tracking

### Addresses (US Format)
- San Francisco, CA 94102
- San Jose, CA 95110
- New York, NY 10003
- Austin, TX 78701
- Washington, DC 20405

All with valid US ZIP codes and state abbreviations.

### Shipments (3 with full tracking)
Each shipment includes:
- Carrier details (USPS, FedEx, UPS)
- Service type (Ground, Priority, etc.)
- Weight (pounds) and dimensions (inches)
- Shipping cost and insurance
- Estimated delivery date
- 4-6 tracking events with timestamps, locations, and status

### Invoices & Payments
- 3 invoices generated
- 2 paid (Stripe, GSA SmartPay)
- 1 pending (Net 30 terms for B2B)

## 🎨 Professional Features

### Type Safety
- ✅ Full TypeScript strict mode
- ✅ Zod validation on all inputs
- ✅ Type inference from DTOs
- ✅ No implicit any types

### Data Validation
- ✅ US address format validation
- ✅ US state code validation (50 states + DC)
- ✅ ZIP code format (12345 or 12345-6789)
- ✅ Phone number validation (US format)
- ✅ Email validation
- ✅ Currency validation

### Business Logic
- ✅ Multi-tier pricing (B2C, B2B, GSA)
- ✅ Tax calculation by state
- ✅ Loyalty points calculation
- ✅ Discount validation and application
- ✅ Inventory tracking
- ✅ Credit limit management (B2B)

### Shipping Integration Ready
- ✅ USPS services (Priority, Express, First Class, etc.)
- ✅ FedEx services (Ground, 2Day, Overnight, etc.)
- ✅ UPS services (Ground, 3-Day, Next Day, etc.)
- ✅ Weight in pounds
- ✅ Dimensions in inches
- ✅ Address validation
- ✅ Tracking number formats

### Payment Processing
- ✅ Stripe integration
- ✅ Multiple payment methods
- ✅ B2B Net terms (Net 30/60)
- ✅ GSA SmartPay support
- ✅ Invoice generation
- ✅ Payment recording

## 📚 API Routes with DTOs

All API routes now support DTO validation:

### Products API
```typescript
// POST /api/products
import { CreateProductDto } from '@/dto/product.dto';

export async function POST(request: Request) {
  const body = await request.json();
  const validated = CreateProductDto.parse(body); // Auto validation
  // ... create product
}
```

### Orders API
```typescript
// POST /api/orders
import { CreateOrderDto } from '@/dto/order.dto';

export async function POST(request: Request) {
  const body = await request.json();
  const validated = CreateOrderDto.parse(body);
  // ... create order
}
```

## 🔧 Scripts

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server
npm run type-check             # TypeScript validation

# Database
npm run prisma:generate        # Generate Prisma Client
npm run prisma:migrate         # Run migrations
npm run prisma:studio          # Open Prisma Studio
npm run prisma:seed            # Basic seed
npm run prisma:seed-full       # Comprehensive seed (recommended)

# Docker
npm run docker:up              # Start all services
npm run docker:down            # Stop all services
npm run docker:build           # Build images

# Deployment
npm run setup                  # Complete setup (uses seed-full)
npm run deploy                 # One-click deployment
```

## 🏗️ Architecture

### DTO Layer
- Input validation with Zod
- Type-safe request/response handling
- Automatic error messages
- Reusable validation schemas

### Service Layer (Coming Soon)
- Business logic separation
- Reusable services
- Transaction management
- Error handling

### Repository Layer (Coming Soon)
- Data access abstraction
- Query optimization
- Caching strategies
- Connection pooling

## 🌍 US Standards Implementation

### Measurements
- **Weight**: Pounds (lbs)
- **Dimensions**: Inches (length × width × height)
- **Currency**: USD ($)

### Addresses
- **Format**: Street, City, State ZIP
- **States**: 2-letter codes (CA, NY, TX, etc.)
- **ZIP**: 5-digit or ZIP+4 format

### Phone Numbers
- **Format**: +1-XXX-XXX-XXXX or variations
- **Validation**: US phone patterns

### Shipping Carriers
- **USPS**: United States Postal Service
- **FedEx**: Federal Express
- **UPS**: United Parcel Service

### Tax Calculation
- State-based sales tax
- Tax-exempt for B2B and GSA
- Configurable tax rates

## 📝 License

MIT License

## 🤝 Support

For questions or issues, please contact support@ecommerce.com

---

**Built with**: Next.js 14, TypeScript, Prisma, PostgreSQL, Redis, Elasticsearch, Stripe

**Professional Edition includes**:
- ✅ Comprehensive DTOs with Zod
- ✅ Enhanced Prisma schema
- ✅ Full seed with orders, shipping, payments
- ✅ US standards implementation
- ✅ Type safety throughout
- ✅ Production-ready code
