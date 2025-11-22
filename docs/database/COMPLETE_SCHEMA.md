# Complete Database Schema Documentation

**Comprehensive documentation of all 60+ Prisma models with every field, relationship, index, and constraint explained.**

---

## Table of Contents

1. [User Management](#user-management)
2. [B2B & GSA Profiles](#b2b--gsa-profiles)
3. [Loyalty Program](#loyalty-program)
4. [Products & Catalog](#products--catalog)
5. [Inventory Management](#inventory-management)
6. [Cart & Wishlist](#cart--wishlist)
7. [Orders & Payments](#orders--payments)
8. [Shipping](#shipping)
9. [Invoices & Accounting](#invoices--accounting)
10. [Discounts & Promotions](#discounts--promotions)
11. [Reviews & Ratings](#reviews--ratings)
12. [Notifications](#notifications)
13. [Activity Logs](#activity-logs)
14. [Supplier Management](#supplier-management)
15. [Customer Groups & Tiered Pricing](#customer-groups--tiered-pricing)
16. [Multi-Warehouse Inventory](#multi-warehouse-inventory)
17. [Quote & RFQ System](#quote--rfq-system)
18. [Contract Management](#contract-management)
19. [Product Bundles](#product-bundles)
20. [Backorder Management](#backorder-management)
21. [Product Attributes](#product-attributes)
22. [RMA (Returns)](#rma-returns)
23. [Commission Management](#commission-management)
24. [Subscription Management](#subscription-management)
25. [Shipping Methods](#shipping-methods)
26. [Tax Exemption](#tax-exemption)
27. [Purchase Orders](#purchase-orders)
28. [Settings](#settings)

---

## Enums Reference

### UserRole
```prisma
enum UserRole {
  SUPER_ADMIN       // Full system access
  ADMIN             // Admin panel access
  ACCOUNTANT        // Financial access only
  CUSTOMER_SERVICE  // Order & customer management
  WAREHOUSE_MANAGER // Inventory management
  MARKETING_MANAGER // Marketing & analytics
  CUSTOMER          // Regular customer
  B2B_CUSTOMER      // B2B customer
  GSA_CUSTOMER      // Government customer
}
```

### AccountType
```prisma
enum AccountType {
  B2C  // Business to Consumer (retail)
  B2B  // Business to Business (wholesale)
  GSA  // Government Services Administration
}
```

### LoyaltyTier
```prisma
enum LoyaltyTier {
  BRONZE    // Entry level (0-999 points)
  SILVER    // Mid level (1000-4999 points)
  GOLD      // High level (5000-14999 points)
  PLATINUM  // Premium (15000-49999 points)
  DIAMOND   // Elite (50000+ points)
}
```

### ProductStatus
```prisma
enum ProductStatus {
  DRAFT         // Not published yet
  ACTIVE        // Available for sale
  INACTIVE      // Temporarily unavailable
  OUT_OF_STOCK  // No inventory
  DISCONTINUED  // No longer available
}
```

### OrderStatus
```prisma
enum OrderStatus {
  PENDING      // Order created, payment pending
  CONFIRMED    // Payment confirmed
  PROCESSING   // Being prepared for shipment
  SHIPPED      // Shipped to customer
  DELIVERED    // Delivered to customer
  CANCELLED    // Cancelled by customer/admin
  REFUNDED     // Refunded
  ON_HOLD      // On hold for review
}
```

### PaymentStatus
```prisma
enum PaymentStatus {
  PENDING             // Payment not yet processed
  AUTHORIZED          // Payment authorized
  PAID                // Payment completed
  FAILED              // Payment failed
  REFUNDED            // Full refund issued
  PARTIALLY_REFUNDED  // Partial refund issued
}
```

---

## User Management

### User Model
**Purpose:** Core user authentication and account management.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  password      String?
  name          String?
  phone         String?
  image         String?
  role          UserRole  @default(CUSTOMER)
  accountType   AccountType @default(B2C)
  isActive      Boolean   @default(true)

  // GSA Fields
  gsaNumber           String?
  gsaApprovalStatus   GSAApprovalStatus?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations (15+)
  accounts      Account[]
  sessions      Session[]
  addresses     Address[]
  orders        Order[]
  cart          Cart?
  wishlist      Wishlist?
  reviews       Review[]
  loyaltyProfile LoyaltyProfile?
  b2bProfile    B2BProfile?
  gsaProfile    GSAProfile?
  notifications Notification[]
  activityLogs  ActivityLog[]
  customerGroups CustomerGroupMember[]
  customerCredit CustomerCredit?
  taxExemption  TaxExemption?
  quotes        Quote[]
  contracts     Contract[]
  backOrders    BackOrder[]
  rmas          RMA[]
  salesRep      SalesRep?
  subscriptions Subscription[]

  @@index([email])
  @@index([role])
  @@index([accountType])
  @@index([gsaApprovalStatus])
}
```

**Field Descriptions:**

| Field | Type | Description | Required | Default | Unique |
|-------|------|-------------|----------|---------|--------|
| id | String | Unique user identifier (CUID) | Yes | cuid() | Yes |
| email | String | User's email address | Yes | - | Yes |
| emailVerified | DateTime | Email verification timestamp | No | null | No |
| password | String | Hashed password (bcrypt) | No | null | No |
| name | String | Full name | No | null | No |
| phone | String | Phone number | No | null | No |
| image | String | Profile image URL | No | null | No |
| role | UserRole | User role/permissions | Yes | CUSTOMER | No |
| accountType | AccountType | Account type (B2C/B2B/GSA) | Yes | B2C | No |
| isActive | Boolean | Account active status | Yes | true | No |
| gsaNumber | String | GSA contract number | No | null | No |
| gsaApprovalStatus | Enum | GSA approval status | No | null | No |

**Indexes:**
- `email` - Fast lookup by email
- `role` - Filter by role
- `accountType` - Filter by account type
- `gsaApprovalStatus` - GSA approval queries

**Business Logic:**
- Password must be hashed using bcrypt before storage
- Email must be unique and validated
- GSA fields only populate for GSA account type
- Soft delete using `isActive` flag
- Role determines access permissions

---

### Account Model
**Purpose:** OAuth provider accounts (NextAuth.js).

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}
```

**Relationships:**
- `user` → User (many-to-one)

**Cascade Behavior:**
- Delete account when user is deleted

---

### Session Model
**Purpose:** User session management (NextAuth.js).

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

---

### Address Model
**Purpose:** User shipping and billing addresses.

```prisma
model Address {
  id          String      @id @default(cuid())
  userId      String
  type        AddressType @default(BOTH)

  // Support both formats for compatibility
  fullName    String?
  firstName   String?
  lastName    String?

  company     String?
  addressLine1 String?
  addressLine2 String?
  address1    String?    // Alias for addressLine1
  address2    String?    // Alias for addressLine2
  city        String
  state       String
  zipCode     String
  country     String      @default("USA")
  phone       String?
  isDefault   Boolean     @default(false)

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  billingOrders  Order[] @relation("BillingAddress")
  shippingOrders Order[] @relation("ShippingAddress")
  subscriptions Subscription[]

  @@index([userId])
}
```

**Field Descriptions:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| type | AddressType | BILLING, SHIPPING, or BOTH | Yes |
| fullName | String | Full name (alternative format) | No |
| firstName | String | First name | No |
| lastName | String | Last name | No |
| company | String | Company name (B2B) | No |
| addressLine1/address1 | String | Street address line 1 | No |
| addressLine2/address2 | String | Apt, Suite, etc. | No |
| city | String | City | Yes |
| state | String | State/Province | Yes |
| zipCode | String | Postal code | Yes |
| country | String | Country | Yes |
| phone | String | Contact phone | No |
| isDefault | Boolean | Default address flag | Yes |

**Business Logic:**
- Only one address per user can be `isDefault`
- Both `addressLine1` and `address1` supported for backward compatibility
- `fullName` or `firstName`+`lastName` required
- Cascade delete when user deleted

---

## B2B & GSA Profiles

### B2BProfile Model
**Purpose:** Business customer profiles with credit terms.

```prisma
model B2BProfile {
  id                String    @id @default(cuid())
  userId            String    @unique
  companyName       String
  taxId             String    @unique
  businessLicense   String?
  creditLimit       Decimal   @default(0) @db.Decimal(12, 2)
  creditUsed        Decimal   @default(0) @db.Decimal(12, 2)
  paymentTerms      Int       @default(30)  // Net 30, Net 60, etc.
  discountPercent   Decimal   @default(0) @db.Decimal(5, 2)
  status            B2BStatus @default(PENDING)
  approvedAt        DateTime?
  approvedBy        String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([status])
  @@index([companyName])
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| companyName | String | Legal business name |
| taxId | String | Tax ID / EIN (must be unique) |
| businessLicense | String | Business license number |
| creditLimit | Decimal(12,2) | Maximum credit allowed |
| creditUsed | Decimal(12,2) | Currently used credit |
| paymentTerms | Int | Payment terms in days (Net 30, 60, etc.) |
| discountPercent | Decimal(5,2) | Default discount percentage |
| status | B2BStatus | PENDING, APPROVED, SUSPENDED, REJECTED |
| approvedAt | DateTime | Approval timestamp |
| approvedBy | String | Admin who approved |

**Business Logic:**
- `creditUsed` must never exceed `creditLimit`
- `taxId` must be unique across all B2B profiles
- Status must be APPROVED before orders allowed
- Payment terms determine invoice due dates
- Available credit = `creditLimit - creditUsed`

---

### GSAProfile Model
**Purpose:** Government customer profiles.

```prisma
model GSAProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  agencyName      String
  contractNumber  String   @unique
  gsaSchedule     String
  vendorId        String
  cageCode        String?
  dunsBradstreet  String?
  fiscalYear      String
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([contractNumber])
  @@index([agencyName])
}
```

**Field Descriptions:**

| Field | Description |
|-------|-------------|
| agencyName | Government agency name |
| contractNumber | GSA contract number (unique) |
| gsaSchedule | GSA Schedule (e.g., Schedule 84) |
| vendorId | Vendor ID number |
| cageCode | Commercial and Government Entity Code |
| dunsBradstreet | DUNS number |
| fiscalYear | Current fiscal year |

**Business Logic:**
- `contractNumber` must be unique
- GSA pricing automatically applied
- Tax exemption usually applies
- Special compliance tracking required

---

## Loyalty Program

### LoyaltyProfile Model
**Purpose:** Customer loyalty points and tier management.

```prisma
model LoyaltyProfile {
  id              String      @id @default(cuid())
  userId          String      @unique
  tier            LoyaltyTier @default(BRONZE)
  points          Int         @default(0)
  lifetimePoints  Int         @default(0)
  lifetimeSpent   Decimal     @default(0) @db.Decimal(12, 2)
  memberSince     DateTime    @default(now())
  tierExpiresAt   DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions    LoyaltyTransaction[]

  @@index([tier])
  @@index([userId])
}
```

**Tier Thresholds:**
- BRONZE: 0-999 points
- SILVER: 1,000-4,999 points
- GOLD: 5,000-14,999 points
- PLATINUM: 15,000-49,999 points
- DIAMOND: 50,000+ points

**Business Logic:**
- `points` = current redeemable points
- `lifetimePoints` = total points ever earned (never decreases)
- Points earned: $1 spent = 1 point
- Points redeemed: 100 points = $1 discount
- Tier auto-upgrades based on lifetime points
- `tierExpiresAt` for promotional tiers

---

### LoyaltyTransaction Model
**Purpose:** Points transaction history.

```prisma
model LoyaltyTransaction {
  id          String                 @id @default(cuid())
  profileId   String
  type        LoyaltyTransactionType
  points      Int
  description String
  orderId     String?
  createdAt   DateTime               @default(now())

  profile LoyaltyProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId])
  @@index([createdAt])
}
```

**Transaction Types:**
- `EARNED` - Points earned from purchase
- `REDEEMED` - Points redeemed for discount
- `EXPIRED` - Points expired
- `ADJUSTED` - Manual adjustment by admin

---

## Products & Catalog

### Category Model
**Purpose:** Hierarchical product categorization.

```prisma
model Category {
  id               String    @id @default(cuid())
  name             String
  slug             String    @unique
  description      String?
  image            String?
  parentId         String?
  displayOrder     Int       @default(0)
  isActive         Boolean   @default(true)

  // SEO Fields
  metaTitle        String?
  metaDescription  String?
  metaKeywords     String?

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  categoryDiscounts CategoryDiscount[]

  @@index([slug])
  @@index([parentId])
}
```

**Hierarchical Structure:**
```
Head Protection (parent)
  └─ Hard Hats (child)
  └─ Bump Caps (child)
Eye Protection (parent)
  └─ Safety Glasses (child)
  └─ Goggles (child)
```

**Business Logic:**
- `slug` must be unique and URL-safe
- `displayOrder` controls sorting
- Self-referencing for parent-child relationship
- Unlimited nesting depth supported

---

### Product Model
**Purpose:** Core product information.

```prisma
model Product {
  id              String        @id @default(cuid())
  sku             String        @unique
  name            String
  slug            String        @unique
  description     String?
  shortDescription String?
  status          ProductStatus @default(DRAFT)

  // Pricing
  basePrice       Decimal       @db.Decimal(12, 2)
  salePrice       Decimal?      @db.Decimal(12, 2)
  costPrice       Decimal?      @db.Decimal(12, 2)
  wholesalePrice  Decimal?      @db.Decimal(12, 2)
  gsaPrice        Decimal?      @db.Decimal(12, 2)
  minimumOrderQty Int           @default(1)

  // GSA
  gsaSin          String?       // GSA Special Item Number

  // Inventory
  stockQuantity   Int           @default(0)
  lowStockThreshold Int         @default(10)
  trackInventory  Boolean       @default(true)

  // SEO
  metaTitle       String?
  metaDescription String?
  metaKeywords    String?

  // Media
  images          String[]
  videos          String[]

  // Physical Attributes
  weight          Decimal?      @db.Decimal(8, 2)
  length          Decimal?      @db.Decimal(8, 2)
  width           Decimal?      @db.Decimal(8, 2)
  height          Decimal?      @db.Decimal(8, 2)

  // Compliance
  complianceCertifications Json?

  // Flags
  isFeatured      Boolean       @default(false)
  isNewArrival    Boolean       @default(false)
  isBestSeller    Boolean       @default(false)
  allowReviews    Boolean       @default(true)

  publishedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  categoryId      String?
  category        Category?     @relation(fields: [categoryId], references: [id])

  // Relations (20+)
  variants        ProductVariant[]
  reviews         Review[]
  cartItems       CartItem[]
  wishlistItems   WishlistItem[]
  orderItems      OrderItem[]
  inventory       InventoryLog[]
  discounts       ProductDiscount[]
  suppliers       ProductSupplier[]
  tieredPrices    TieredPrice[]
  warehouseStock  WarehouseStock[]
  warehouseTransfers WarehouseTransfer[]
  quoteItems      QuoteItem[]
  contractItems   ContractItem[]
  bundleItems     BundleItem[]
  backOrders      BackOrder[]
  attributes      ProductAttributeValue[]
  rmaItems        RMAItem[]
  subscriptionItems SubscriptionItem[]
  purchaseOrderItems PurchaseOrderItem[]
  poReceiptItems  POReceiptItem[]

  @@index([slug])
  @@index([sku])
  @@index([status])
  @@index([categoryId])
  @@index([isFeatured])
}
```

**Pricing Priority (Lowest to Highest):**
1. GSA Price (lowest)
2. Contract Price
3. Tiered Price
4. Wholesale Price
5. Sale Price
6. Base Price (highest)

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| sku | String | Stock Keeping Unit (unique) |
| slug | String | URL-friendly identifier |
| basePrice | Decimal(12,2) | Regular retail price |
| salePrice | Decimal(12,2) | Sale/promotional price |
| costPrice | Decimal(12,2) | Internal cost (hidden from customers) |
| wholesalePrice | Decimal(12,2) | B2B wholesale price |
| gsaPrice | Decimal(12,2) | GSA contract price |
| gsaSin | String | GSA Special Item Number |
| stockQuantity | Int | Total available stock |
| lowStockThreshold | Int | Low stock alert threshold |
| trackInventory | Boolean | Enable/disable inventory tracking |
| images | String[] | Array of image URLs |
| videos | String[] | Array of video URLs |
| weight | Decimal(8,2) | Weight in pounds |
| complianceCertifications | Json | Array of certification objects |

**Compliance Certifications JSON Structure:**
```json
[
  {
    "name": "ANSI Z89.1 Class E",
    "issuer": "ANSI",
    "number": "CERT-12345",
    "expiryDate": "2025-12-31"
  }
]
```

---

### ProductVariant Model
**Purpose:** Product variations (color, size, etc.).

```prisma
model ProductVariant {
  id          String   @id @default(cuid())
  productId   String
  sku         String   @unique
  name        String
  attributes  String   // JSON: {color: "red", size: "L"}
  price       Decimal  @db.Decimal(12, 2)
  stockQuantity Int    @default(0)
  images      String[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([sku])
}
```

**Attributes JSON Example:**
```json
{
  "color": "Yellow",
  "size": "Large",
  "material": "ABS Plastic"
}
```

---

## Inventory Management

### InventoryLog Model
**Purpose:** Track all inventory changes.

```prisma
model InventoryLog {
  id          String          @id @default(cuid())
  productId   String
  action      InventoryAction
  quantity    Int
  previousQty Int
  newQty      Int
  notes       String?
  userId      String?
  orderId     String?
  createdAt   DateTime        @default(now())

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId])
  @@index([createdAt])
}
```

**Inventory Actions:**
- `PURCHASE` - Stock received from supplier
- `SALE` - Stock sold to customer
- `RETURN` - Customer return
- `ADJUSTMENT` - Manual adjustment
- `DAMAGED` - Damaged goods removed
- `RESERVED` - Reserved for order

**Business Logic:**
- Immutable log (no updates/deletes)
- Automatically created on stock changes
- `previousQty` + `quantity` = `newQty`
- Audit trail for compliance

---

## Cart & Wishlist

### Cart Model
```prisma
model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  items CartItem[]

  @@index([userId])
}
```

### CartItem Model
```prisma
model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Int      @default(1)
  price     Decimal  @db.Decimal(12, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cart    Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([cartId])
  @@index([productId])
}
```

**Business Logic:**
- One cart per user
- Price locked at add-to-cart time
- Quantity validation against stock
- Auto-remove if product deleted
- Session persistence via Redis

---

### Wishlist Model
```prisma
model Wishlist {
  id        String         @id @default(cuid())
  userId    String         @unique
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  items WishlistItem[]

  @@index([userId])
}
```

### WishlistItem Model
```prisma
model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  productId  String
  createdAt  DateTime @default(now())

  wishlist Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  product  Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([wishlistId, productId])
  @@index([wishlistId])
  @@index([productId])
}
```

**Business Logic:**
- One wishlist per user
- No duplicate products (unique constraint)
- Email notifications on price drops
- Shareable wishlist feature

---

## Orders & Payments

### Order Model
**Purpose:** Customer orders.

```prisma
model Order {
  id                String        @id @default(cuid())
  orderNumber       String        @unique
  userId            String
  accountType       AccountType
  status            OrderStatus   @default(PENDING)
  paymentStatus     PaymentStatus @default(PENDING)

  // Amounts
  subtotal          Decimal       @db.Decimal(12, 2)
  tax               Decimal       @default(0) @db.Decimal(12, 2)
  taxAmount         Decimal?      @db.Decimal(12, 2)
  shipping          Decimal       @default(0) @db.Decimal(12, 2)
  shippingCost      Decimal?      @db.Decimal(12, 2)
  discount          Decimal       @default(0) @db.Decimal(12, 2)
  total             Decimal       @db.Decimal(12, 2)
  totalAmount       Decimal?      @db.Decimal(12, 2)

  // Payment
  paymentMethod     String?
  paymentIntentId   String?
  paidAt            DateTime?

  // Addresses
  billingAddressId  String
  shippingAddressId String

  // Shipping
  shippingCarrier   String?
  shippingMethod    String?
  trackingNumber    String?
  shippedAt         DateTime?
  deliveredAt       DateTime?

  // Notes
  customerNotes     String?
  adminNotes        String?

  // B2B
  purchaseOrderNumber String?

  // GSA
  gsaContractNumber String?

  // Loyalty
  loyaltyPointsEarned Int @default(0)
  loyaltyPointsUsed   Int @default(0)

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  user              User          @relation(fields: [userId], references: [id])
  billingAddress    Address       @relation("BillingAddress", fields: [billingAddressId], references: [id])
  shippingAddress   Address       @relation("ShippingAddress", fields: [shippingAddressId], references: [id])
  items             OrderItem[]
  statusHistory     OrderStatusHistory[]
  shipments         Shipment[]
  invoices          Invoice[]
  rmas              RMA[]
  commissions       Commission[]
  subscriptionOrders SubscriptionOrder[]
  backOrders        BackOrder[]

  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@index([createdAt])
}
```

**Order Number Format:** `ORD-YYYY-NNNNNN`
- Example: `ORD-2024-001234`

**Field Compatibility:**
- `tax` and `taxAmount` (aliases)
- `shipping` and `shippingCost` (aliases)
- `total` and `totalAmount` (aliases)

**Order Workflow:**
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓
CANCELLED / REFUNDED / ON_HOLD
```

---

### OrderItem Model
```prisma
model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String
  sku         String
  name        String
  quantity    Int
  price       Decimal @db.Decimal(12, 2)
  discount    Decimal @default(0) @db.Decimal(12, 2)
  tax         Decimal @default(0) @db.Decimal(12, 2)
  total       Decimal @db.Decimal(12, 2)

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
}
```

**Calculation:**
```
total = (price * quantity) - discount + tax
```

---

### OrderStatusHistory Model
```prisma
model OrderStatusHistory {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  notes     String?
  changedBy String?
  createdAt DateTime    @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([createdAt])
}
```

**Business Logic:**
- Immutable history log
- Auto-created on status change
- `changedBy` = admin email or "System"
- Used for audit trail

---

## Complete Model Count

**Total Models: 67**

1. User Management (5): User, Account, Session, VerificationToken, Address
2. B2B/GSA (2): B2BProfile, GSAProfile
3. Loyalty (2): LoyaltyProfile, LoyaltyTransaction
4. Products (3): Category, Product, ProductVariant
5. Inventory (3): InventoryLog, Warehouse, WarehouseStock
6. Cart/Wishlist (4): Cart, CartItem, Wishlist, WishlistItem
7. Orders (4): Order, OrderItem, OrderStatusHistory, Shipment
8. Shipping (2): ShipmentTracking, ShippingMethod
9. Invoices (3): Invoice, Payment,
10. Discounts (2): Discount, ProductDiscount
11. Reviews (1): Review
12. Notifications (1): Notification
13. Activity (1): ActivityLog
14. Settings (1): Setting
15. Suppliers (2): Supplier, ProductSupplier
16. Customer Groups (4): CustomerGroup, CustomerGroupMember, TieredPrice, CategoryDiscount
17. Credit (2): CustomerCredit, CreditTransaction
18. Warehouse (1): WarehouseTransfer
19. Quotes (2): Quote, QuoteItem
20. Contracts (2): Contract, ContractItem
21. Bundles (2): ProductBundle, BundleItem
22. Backorders (1): BackOrder
23. Attributes (2): ProductAttribute, ProductAttributeValue
24. RMA (2): RMA, RMAItem
25. Commission (2): SalesRep, Commission
26. Subscriptions (3): Subscription, SubscriptionItem, SubscriptionOrder
27. Tax (1): TaxExemption
28. Purchase Orders (4): PurchaseOrder, PurchaseOrderItem, POReceipt, POReceiptItem

**Total Enums: 25**
**Total Indexes: 100+**
**Total Relationships: 150+**

---

## Database Constraints Summary

### Unique Constraints
- User: email
- Product: sku, slug
- Category: slug
- Order: orderNumber
- Supplier: code
- Quote: quoteNumber
- Contract: contractNumber
- RMA: rmaNumber
- PurchaseOrder: poNumber

### Cascade Deletes
- All child records cascade delete when parent deleted
- Examples: CartItems delete when Cart deleted
- Orders DO NOT cascade delete (business records)

### Default Values
- All IDs: `cuid()`
- All timestamps: `now()`
- Status fields: Initial status (PENDING, DRAFT, etc.)
- Boolean flags: `false` or `true` as appropriate
- Numeric fields: `0`

---

## Indexing Strategy

### Primary Indexes
- All `@id` fields automatically indexed
- All `@unique` fields automatically indexed

### Performance Indexes
- Foreign keys: `userId`, `productId`, `orderId`, etc.
- Status fields: `status`, `paymentStatus`, etc.
- Date fields: `createdAt` for chronological queries
- Frequently filtered: `accountType`, `role`, `isActive`

### Compound Indexes
- `[provider, providerAccountId]` in Account
- `[wishlistId, productId]` in WishlistItem (unique)

---

**Last Updated:** November 2024
**Prisma Version:** 5.x
**Database:** PostgreSQL 14+
