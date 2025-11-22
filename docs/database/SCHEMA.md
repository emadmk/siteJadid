# Database Schema Documentation

Complete documentation of all database models, relationships, and business logic.

## 📋 Table of Contents

1. [User Management](#user-management)
2. [Products & Catalog](#products--catalog)
3. [Orders & Checkout](#orders--checkout)
4. [B2B Features](#b2b-features)
5. [GSA Features](#gsa-features)
6. [Inventory Management](#inventory-management)
7. [Supplier Management](#supplier-management)
8. [Advanced Features](#advanced-features)

---

## User Management

### User Model
Core user account information supporting B2C, B2B, and GSA customers.

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
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
}
```

**Enums:**
- `UserRole`: SUPER_ADMIN, ADMIN, ACCOUNTANT, CUSTOMER_SERVICE, WAREHOUSE_MANAGER, MARKETING_MANAGER, CUSTOMER, B2B_CUSTOMER, GSA_CUSTOMER
- `AccountType`: B2C, B2B, GSA
- `GSAApprovalStatus`: PENDING, APPROVED, REJECTED

**Relations:**
- `addresses` → Address[]
- `orders` → Order[]
- `cart` → Cart?
- `wishlist` → Wishlist?
- `reviews` → Review[]
- `loyaltyProfile` → LoyaltyProfile?
- `b2bProfile` → B2BProfile?
- `gsaProfile` → GSAProfile?
- `customerGroups` → CustomerGroupMember[]
- `customerCredit` → CustomerCredit?
- `taxExemption` → TaxExemption?
- `quotes` → Quote[]
- `contracts` → Contract[]
- `backOrders` → BackOrder[]
- `rmas` → RMA[]
- `subscriptions` → Subscription[]

**Indexes:**
- email (unique)
- role
- accountType
- gsaApprovalStatus

---

### Address Model
Shipping and billing addresses for users.

```prisma
model Address {
  id          String      @id @default(cuid())
  userId      String
  type        AddressType @default(BOTH)

  // Support both formats
  fullName    String?
  firstName   String?
  lastName    String?

  company     String?
  addressLine1 String?
  addressLine2 String?
  address1    String?    // Alias
  address2    String?    // Alias
  city        String
  state       String
  zipCode     String
  country     String      @default("USA")
  phone       String?
  isDefault   Boolean     @default(false)
}
```

**Enums:**
- `AddressType`: BILLING, SHIPPING, BOTH

---

### B2BProfile Model
Extended profile for B2B customers.

```prisma
model B2BProfile {
  id                String    @id @default(cuid())
  userId            String    @unique
  companyName       String
  taxId             String    @unique
  businessLicense   String?
  creditLimit       Decimal   @default(0) @db.Decimal(12, 2)
  creditUsed        Decimal   @default(0) @db.Decimal(12, 2)
  paymentTerms      Int       @default(30) // Net 30, Net 60
  discountPercent   Decimal   @default(0) @db.Decimal(5, 2)
  status            B2BStatus @default(PENDING)
  approvedAt        DateTime?
  approvedBy        String?
}
```

**Enums:**
- `B2BStatus`: PENDING, APPROVED, SUSPENDED, REJECTED

**Business Logic:**
- Credit limit management
- Net terms payment (30/60/90 days)
- Custom discount percentage
- Approval workflow required

---

### GSAProfile Model
Extended profile for Government/GSA customers.

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
}
```

**Business Logic:**
- Contract number validation required
- GSA-specific pricing applies
- Annual fiscal year tracking
- CAGE code for federal procurement

---

### LoyaltyProfile Model
Loyalty points and tier management.

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
}
```

**Enums:**
- `LoyaltyTier`: BRONZE, SILVER, GOLD, PLATINUM, DIAMOND

**Business Logic:**
- Earn 1 point per $1 spent (configurable)
- Tier upgrades based on lifetime spend
- Points can be redeemed for discounts
- Tier benefits:
  - BRONZE: 0-5% discount
  - SILVER: 5-10% discount
  - GOLD: 10-15% discount
  - PLATINUM: 15-20% discount
  - DIAMOND: 20%+ discount

---

## Products & Catalog

### Product Model
Main product catalog with multi-tier pricing support.

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
  gsaSin          String?       // GSA Special Item Number

  // Tier Pricing JSON
  tierPricing     Json?         // [{minQty, maxQty, price, accountType}]

  // Inventory
  stockQuantity   Int           @default(0)
  lowStockThreshold Int         @default(10)
  trackInventory  Boolean       @default(true)
  minimumOrderQty Int           @default(1)

  // Physical
  weight          Decimal?      @db.Decimal(8, 2)
  length          Decimal?      @db.Decimal(8, 2)
  width           Decimal?      @db.Decimal(8, 2)
  height          Decimal?      @db.Decimal(8, 2)

  // Media
  images          String[]
  videos          String[]

  // Compliance
  complianceCertifications Json?

  // SEO
  metaTitle       String?
  metaDescription String?
  metaKeywords    String?

  // Flags
  isFeatured      Boolean       @default(false)
  isNewArrival    Boolean       @default(false)
  isBestSeller    Boolean       @default(false)
  allowReviews    Boolean       @default(true)

  publishedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

**Enums:**
- `ProductStatus`: DRAFT, ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED

**Relations:**
- `category` → Category
- `variants` → ProductVariant[]
- `reviews` → Review[]
- `suppliers` → ProductSupplier[]
- `tieredPrices` → TieredPrice[]
- `warehouseStock` → WarehouseStock[]
- `attributes` → ProductAttributeValue[]
- `bundleItems` → BundleItem[]

**Business Logic:**
- Multi-tier pricing based on quantity and account type
- Dynamic pricing: GSA < Wholesale < Sale < Base
- Inventory tracking across multiple warehouses
- Compliance certification tracking
- SEO optimization per product

---

### Category Model
Hierarchical category structure.

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

  // SEO
  metaTitle        String?
  metaDescription  String?
  metaKeywords     String?

  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  categoryDiscounts CategoryDiscount[]
}
```

**Business Logic:**
- Unlimited hierarchy depth
- Category-specific discounts for customer groups
- SEO per category
- Display order for custom sorting

---

### ProductAttribute & ProductAttributeValue
Dynamic product attributes system.

```prisma
model ProductAttribute {
  id          String        @id @default(cuid())
  name        String
  code        String        @unique
  type        AttributeType
  options     String[]      // For SELECT/MULTISELECT
  displayOrder Int          @default(0)
  isFilterable Boolean      @default(true)
  isRequired   Boolean      @default(false)
  isVariant    Boolean      @default(false)
  unit         String?       // e.g., "inches", "kg"
  minValue     Decimal?      @db.Decimal(12, 2)
  maxValue     Decimal?      @db.Decimal(12, 2)
  isActive     Boolean      @default(true)
}

model ProductAttributeValue {
  id          String           @id @default(cuid())
  productId   String
  attributeId String
  value       String           // Stored as string, parsed based on type
}
```

**Enums:**
- `AttributeType`: TEXT, NUMBER, SELECT, MULTISELECT, BOOLEAN, DATE, COLOR

**Use Cases:**
- Size, Color, Material
- Technical specifications
- Certifications
- Custom product properties
- Variant generation

---

## Orders & Checkout

### Order Model
Main order with support for B2C, B2B, and GSA.

```prisma
model Order {
  id                String        @id @default(cuid())
  orderNumber       String        @unique
  userId            String
  accountType       AccountType

  // Status
  status            OrderStatus   @default(PENDING)
  paymentStatus     PaymentStatus @default(PENDING)

  // Amounts
  subtotal          Decimal       @db.Decimal(12, 2)
  tax               Decimal       @default(0) @db.Decimal(12, 2)
  shipping          Decimal       @default(0) @db.Decimal(12, 2)
  discount          Decimal       @default(0) @db.Decimal(12, 2)
  total             Decimal       @db.Decimal(12, 2)

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

  // B2B
  purchaseOrderNumber String?

  // GSA
  gsaContractNumber String?

  // Loyalty
  loyaltyPointsEarned Int       @default(0)
  loyaltyPointsUsed   Int       @default(0)

  customerNotes     String?
  adminNotes        String?

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}
```

**Enums:**
- `OrderStatus`: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED, ON_HOLD
- `PaymentStatus`: PENDING, AUTHORIZED, PAID, FAILED, REFUNDED, PARTIALLY_REFUNDED
- `PaymentMethod`: CREDIT_CARD, PAYPAL, STRIPE, BANK_TRANSFER, NET_TERMS, PURCHASE_ORDER, GSA_SMARTPAY

**Relations:**
- `user` → User
- `items` → OrderItem[]
- `billingAddress` → Address
- `shippingAddress` → Address
- `statusHistory` → OrderStatusHistory[]
- `shipments` → Shipment[]
- `invoices` → Invoice[]
- `rmas` → RMA[]
- `commissions` → Commission[]

**Business Logic:**
- Net terms payment for B2B (30/60/90 days)
- GSA SmartPay support
- Loyalty points earn/redeem
- Multi-status tracking
- Commission calculation for sales reps

---

### OrderItem Model
Individual items within an order.

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
}
```

**Business Logic:**
- Snapshot of product at order time
- Price locked at order creation
- Tax calculated per item
- Individual discounts support

---

### Cart & Wishlist Models
Shopping cart and wishlist functionality.

```prisma
model Cart {
  id        String     @id @default(cuid())
  userId    String     @unique
  items     CartItem[]
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  productId String
  quantity  Int      @default(1)
  price     Decimal  @db.Decimal(12, 2)
}

model Wishlist {
  id        String         @id @default(cuid())
  userId    String         @unique
  items     WishlistItem[]
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  productId  String
}
```

**Business Logic:**
- Redis caching for cart (performance)
- Price refresh on checkout
- Wishlist email notifications
- Move to cart functionality

---

## B2B Features

### CustomerGroup Model
Customer groups for bulk pricing and discounts.

```prisma
model CustomerGroup {
  id              String   @id @default(cuid())
  name            String   @unique
  description     String?
  defaultDiscount Decimal  @default(0) @db.Decimal(5, 2)
  accountTypes    AccountType[]
  loyaltyTiers    LoyaltyTier[]
  isActive        Boolean  @default(true)
  priority        Int      @default(0)

  members         CustomerGroupMember[]
  categoryDiscounts CategoryDiscount[]
  tieredPrices    TieredPrice[]
}
```

**Business Logic:**
- Group-level discount percentage
- Account type restrictions
- Loyalty tier restrictions
- Category-specific discounts
- Product-specific tiered pricing

---

### TieredPrice Model
Quantity-based pricing for customer groups.

```prisma
model TieredPrice {
  id              String         @id @default(cuid())
  productId       String
  minQuantity     Int
  maxQuantity     Int?           // null = unlimited
  price           Decimal        @db.Decimal(12, 2)
  customerGroupId String?
  accountTypes    AccountType[]
  isActive        Boolean        @default(true)
  priority        Int            @default(0)
}
```

**Example:**
```
Product: Safety Helmet
- 1-9 units: $50.00
- 10-49 units: $45.00
- 50-99 units: $40.00
- 100+ units: $35.00
```

---

### Quote Model (RFQ - Request for Quote)
B2B quote system.

```prisma
model Quote {
  id              String      @id @default(cuid())
  quoteNumber     String      @unique
  userId          String
  status          QuoteStatus @default(DRAFT)

  // Amounts
  subtotal        Decimal     @db.Decimal(12, 2)
  tax             Decimal     @default(0) @db.Decimal(12, 2)
  shipping        Decimal     @default(0) @db.Decimal(12, 2)
  discount        Decimal     @default(0) @db.Decimal(12, 2)
  total           Decimal     @db.Decimal(12, 2)

  validUntil      DateTime
  customerNotes   String?
  internalNotes   String?
  termsConditions String?

  convertedToOrderId String?
  convertedAt     DateTime?

  createdBy       String      // Admin who created
  sentAt          DateTime?
  viewedAt        DateTime?
}
```

**Enums:**
- `QuoteStatus`: DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED, CONVERTED

**Workflow:**
1. Customer requests quote
2. Admin creates quote with pricing
3. Quote sent to customer
4. Customer reviews and accepts/rejects
5. If accepted, convert to order

---

### Contract Model
Long-term B2B contracts with committed pricing.

```prisma
model Contract {
  id                String         @id @default(cuid())
  contractNumber    String         @unique
  userId            String
  name              String
  description       String?
  status            ContractStatus @default(DRAFT)

  // Dates
  startDate         DateTime
  endDate           DateTime
  autoRenew         Boolean        @default(false)
  renewalPeriod     Int?           // Months
  noticePeriod      Int?           // Days before expiry

  // Pricing
  discountPercent   Decimal        @default(0) @db.Decimal(5, 2)
  minimumSpend      Decimal?       @db.Decimal(12, 2)
  volumeCommitment  Int?           // Minimum units
  paymentTerms      Int            @default(30)

  // Document
  documentUrl       String?
  signedDocumentUrl String?

  approvedBy        String?
  approvedAt        DateTime?
  createdBy         String

  items             ContractItem[]
}
```

**Enums:**
- `ContractStatus`: DRAFT, ACTIVE, EXPIRED, RENEWED, CANCELLED, SUSPENDED

**Business Logic:**
- Contract-specific pricing locked for duration
- Minimum spend requirements
- Volume commitments
- Auto-renewal option
- Digital signature support

---

### CustomerCredit Model
Credit line management for B2B customers.

```prisma
model CustomerCredit {
  id              String        @id @default(cuid())
  userId          String        @unique
  creditLimit     Decimal       @db.Decimal(12, 2)
  availableCredit Decimal       @db.Decimal(12, 2)
  usedCredit      Decimal       @default(0) @db.Decimal(12, 2)
  paymentTerms    Int           @default(30)
  status          CreditStatus  @default(ACTIVE)
  totalPurchased  Decimal       @default(0) @db.Decimal(12, 2)
  totalPaid       Decimal       @default(0) @db.Decimal(12, 2)
  totalOutstanding Decimal      @default(0) @db.Decimal(12, 2)
  creditScore     Int?          // 0-100
  approvedBy      String?
  approvedAt      DateTime?
}
```

**Enums:**
- `CreditStatus`: ACTIVE, SUSPENDED, FROZEN, DEFAULTED

**Business Logic:**
- Credit limit vs available credit tracking
- Payment terms (Net 30/60/90)
- Credit score calculation
- Auto-suspend on default
- Transaction history

---

## GSA Features

### TaxExemption Model
Tax exemption certificate management.

```prisma
model TaxExemption {
  id              String             @id @default(cuid())
  userId          String             @unique
  certificateNumber String           @unique
  certificateUrl  String?
  exemptionType   String             // "Resale", "Government", "Non-Profit"
  states          String[]           // States where exempt
  status          TaxExemptionStatus @default(PENDING)
  issueDate       DateTime
  expiryDate      DateTime?
  approvedBy      String?
  approvedAt      DateTime?
  rejectionReason String?
}
```

**Enums:**
- `TaxExemptionStatus`: PENDING, APPROVED, REJECTED, EXPIRED

**Business Logic:**
- Certificate upload required
- State-specific exemptions
- Expiry date tracking
- Annual renewal reminders
- Auto-expire on expiry date

---

## Inventory Management

### Warehouse Model
Multi-warehouse support.

```prisma
model Warehouse {
  id              String   @id @default(cuid())
  code            String   @unique
  name            String
  address         String
  city            String
  state           String
  zipCode         String
  country         String   @default("USA")
  phone           String?
  email           String?
  managerName     String?
  isActive        Boolean  @default(true)
  isPrimary       Boolean  @default(false)
  priority        Int      @default(0)
  latitude        Decimal? @db.Decimal(10, 8)
  longitude       Decimal? @db.Decimal(11, 8)

  stock           WarehouseStock[]
  transfers       WarehouseTransfer[] @relation("SourceWarehouse")
  receivedTransfers WarehouseTransfer[] @relation("DestinationWarehouse")
  purchaseOrders  PurchaseOrder[]
}
```

**Business Logic:**
- Multi-warehouse inventory tracking
- Warehouse priority for allocation
- Location-based shipping optimization
- Stock transfers between warehouses

---

### WarehouseStock Model
Product inventory per warehouse.

```prisma
model WarehouseStock {
  id              String   @id @default(cuid())
  warehouseId     String
  productId       String
  quantity        Int      @default(0)
  reserved        Int      @default(0) // Reserved for orders
  available       Int      @default(0) // quantity - reserved
  reorderPoint    Int      @default(10)
  reorderQuantity Int      @default(50)

  // Warehouse location
  aisle           String?
  rack            String?
  shelf           String?
  bin             String?

  lastRestocked   DateTime?
  lastCounted     DateTime?
}
```

**Business Logic:**
- Real-time inventory tracking
- Reserved inventory for pending orders
- Reorder point alerts
- Warehouse location tracking (aisle/rack/shelf/bin)
- Inventory count tracking

---

### WarehouseTransfer Model
Inter-warehouse stock transfers.

```prisma
model WarehouseTransfer {
  id                    String         @id @default(cuid())
  transferNumber        String         @unique
  sourceWarehouseId     String
  destinationWarehouseId String
  productId             String
  quantity              Int
  status                TransferStatus @default(PENDING)
  shippedAt             DateTime?
  receivedAt            DateTime?
  estimatedArrival      DateTime?
  trackingNumber        String?
  carrier               String?
  requestedBy           String
  approvedBy            String?
  notes                 String?
}
```

**Enums:**
- `TransferStatus`: PENDING, IN_TRANSIT, COMPLETED, CANCELLED

**Workflow:**
1. Warehouse manager requests transfer
2. Approval required
3. Stock deducted from source
4. Shipment created with tracking
5. Stock added to destination on receipt

---

## Supplier Management

### Supplier Model
Supplier/vendor management.

```prisma
model Supplier {
  id              String         @id @default(cuid())
  name            String
  code            String         @unique
  email           String?
  phone           String?
  website         String?
  address         String?
  city            String?
  state           String?
  zipCode         String?
  country         String         @default("USA")
  taxId           String?
  businessLicense String?

  // Performance Metrics
  rating            Decimal?       @db.Decimal(3, 2) // 0.00-5.00
  onTimeDeliveryRate Decimal?      @db.Decimal(5, 2) // 0-100%
  qualityRating     Decimal?       @db.Decimal(3, 2)
  totalPurchases    Decimal        @default(0) @db.Decimal(12, 2)

  paymentTerms      Int            @default(30)
  currency          String         @default("USD")
  status            SupplierStatus @default(PENDING_APPROVAL)
  isActive          Boolean        @default(true)
  notes             String?

  products          ProductSupplier[]
  purchaseOrders    PurchaseOrder[]
}
```

**Enums:**
- `SupplierStatus`: ACTIVE, INACTIVE, SUSPENDED, PENDING_APPROVAL

**Business Logic:**
- Supplier performance tracking
- On-time delivery metrics
- Quality rating system
- Multi-supplier per product
- Preferred supplier selection

---

### ProductSupplier Model
Product-supplier relationships with pricing.

```prisma
model ProductSupplier {
  id              String   @id @default(cuid())
  productId       String
  supplierId      String
  supplierSku     String?
  costPrice       Decimal  @db.Decimal(12, 2)
  minimumOrderQty Int      @default(1)
  leadTimeDays    Int      @default(7)
  isPrimary       Boolean  @default(false)
  priority        Int      @default(0)
  isActive        Boolean  @default(true)
  lastOrderDate   DateTime?
}
```

**Business Logic:**
- Multiple suppliers per product
- Primary supplier designation
- Lead time tracking
- Cost price management
- Automatic PO generation

---

### PurchaseOrder Model (To Suppliers)
Purchase orders for restocking.

```prisma
model PurchaseOrder {
  id              String    @id @default(cuid())
  poNumber        String    @unique
  supplierId      String
  status          POStatus  @default(DRAFT)

  // Amounts
  subtotal        Decimal   @db.Decimal(12, 2)
  tax             Decimal   @default(0) @db.Decimal(12, 2)
  shipping        Decimal   @default(0) @db.Decimal(12, 2)
  total           Decimal   @db.Decimal(12, 2)

  orderDate       DateTime  @default(now())
  expectedDelivery DateTime?
  receivedDate    DateTime?
  warehouseId     String?
  paymentTerms    Int       @default(30)
  paidAt          DateTime?
  notes           String?
  createdBy       String
  approvedBy      String?
  approvedAt      DateTime?

  items           PurchaseOrderItem[]
  receipts        POReceipt[]
}
```

**Enums:**
- `POStatus`: DRAFT, SENT, ACKNOWLEDGED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED

**Workflow:**
1. Create PO based on reorder points
2. Send to supplier
3. Supplier acknowledges
4. Shipment tracking
5. Receipt creation on delivery
6. Stock updated automatically

---

## Advanced Features

### ProductBundle Model
Product bundles/kits.

```prisma
model ProductBundle {
  id              String   @id @default(cuid())
  sku             String   @unique
  name            String
  slug            String   @unique
  description     String?
  bundlePrice     Decimal  @db.Decimal(12, 2)
  retailValue     Decimal  @db.Decimal(12, 2) // Sum of individual prices
  savings         Decimal  @db.Decimal(12, 2) // Calculated savings
  image           String?
  isActive        Boolean  @default(true)
  isFeatured      Boolean  @default(false)
  trackInventory  Boolean  @default(true)

  items           BundleItem[]
}

model BundleItem {
  id        String        @id @default(cuid())
  bundleId  String
  productId String
  quantity  Int           @default(1)
  sortOrder Int           @default(0)
  isOptional Boolean      @default(false)
}
```

**Business Logic:**
- Bundle pricing (discount on kit)
- Component availability tracking
- Optional items support
- Inventory sync with components

---

### BackOrder Model
Backorder management for out-of-stock items.

```prisma
model BackOrder {
  id              String          @id @default(cuid())
  userId          String
  productId       String
  quantity        Int
  status          BackOrderStatus @default(PENDING)
  pricePerUnit    Decimal         @db.Decimal(12, 2)
  expectedDate    DateTime?
  notifiedAt      DateTime?
  fulfilledAt     DateTime?
  orderId         String?
  notes           String?
}
```

**Enums:**
- `BackOrderStatus`: PENDING, NOTIFIED, FULFILLED, CANCELLED

**Workflow:**
1. Customer requests out-of-stock item
2. Backorder created with locked price
3. Stock arrives
4. Customer notified
5. Order auto-created if customer confirms

---

### RMA Model (Return Merchandise Authorization)
Product return management.

```prisma
model RMA {
  id              String       @id @default(cuid())
  rmaNumber       String       @unique
  userId          String
  orderId         String
  type            RMAType
  status          RMAStatus    @default(REQUESTED)
  reason          ReturnReason
  description     String?
  images          String[]

  // Amount
  refundAmount    Decimal?     @db.Decimal(12, 2)
  restockingFee   Decimal      @default(0) @db.Decimal(12, 2)
  shippingRefund  Decimal      @default(0) @db.Decimal(12, 2)

  // Shipping
  returnTrackingNumber String?
  returnCarrier   String?
  returnLabel     String?

  // Processing
  approvedBy      String?
  approvedAt      DateTime?
  receivedAt      DateTime?
  inspectedAt     DateTime?
  processedAt     DateTime?
  replacementOrderId String?
  refundedAt      DateTime?

  internalNotes   String?
  customerNotes   String?

  items           RMAItem[]
}
```

**Enums:**
- `RMAStatus`: REQUESTED, APPROVED, REJECTED, ITEMS_RECEIVED, INSPECTION, REFUNDED, REPLACED, CLOSED
- `RMAType`: REFUND, EXCHANGE, REPAIR, STORE_CREDIT
- `ReturnReason`: DEFECTIVE, WRONG_ITEM, NOT_AS_DESCRIBED, DAMAGED_SHIPPING, CHANGED_MIND, ORDERED_BY_MISTAKE, BETTER_PRICE, NO_LONGER_NEEDED, OTHER

**Workflow:**
1. Customer requests RMA
2. Admin approves/rejects
3. Return shipping label generated
4. Items received and inspected
5. Refund/exchange processed
6. Inventory restocked if applicable

---

### Subscription Model
Recurring orders/subscriptions.

```prisma
model Subscription {
  id              String                @id @default(cuid())
  userId          String
  status          SubscriptionStatus    @default(ACTIVE)
  frequency       SubscriptionFrequency
  nextOrderDate   DateTime
  lastOrderDate   DateTime?
  shippingAddressId String
  paymentMethod   String
  discountPercent Decimal               @default(0) @db.Decimal(5, 2)
  pausedUntil     DateTime?
  cancelledAt     DateTime?
  cancellationReason String?

  items           SubscriptionItem[]
  orders          SubscriptionOrder[]
}
```

**Enums:**
- `SubscriptionStatus`: ACTIVE, PAUSED, CANCELLED, EXPIRED, PAST_DUE
- `SubscriptionFrequency`: WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY

**Business Logic:**
- Auto-order generation based on frequency
- Subscription discount
- Pause/resume functionality
- Email notifications before order
- Failed payment handling

---

### Commission Model
Sales rep commission tracking.

```prisma
model SalesRep {
  id              String   @id @default(cuid())
  userId          String   @unique
  code            String   @unique
  monthlySalesTarget Decimal? @db.Decimal(12, 2)
  yearlySalesTarget  Decimal? @db.Decimal(12, 2)
  defaultCommissionRate Decimal @default(5) @db.Decimal(5, 2)
  isActive        Boolean  @default(true)
  hireDate        DateTime?
  terminationDate DateTime?
}

model Commission {
  id              String           @id @default(cuid())
  salesRepId      String
  orderId         String
  orderTotal      Decimal          @db.Decimal(12, 2)
  commissionRate  Decimal          @db.Decimal(5, 2)
  commissionAmount Decimal         @db.Decimal(12, 2)
  status          CommissionStatus @default(PENDING)
  paidAt          DateTime?
  paymentMethod   String?
  paymentReference String?
}
```

**Enums:**
- `CommissionStatus`: PENDING, APPROVED, PAID, CANCELLED

**Business Logic:**
- Commission rate per sales rep
- Order-level commission tracking
- Target tracking (monthly/yearly)
- Commission payout management
- Performance reporting

---

## Summary Statistics

| Category | Models | Relations |
|----------|--------|-----------|
| Users & Auth | 7 | 15+ |
| Products & Catalog | 8 | 12+ |
| Orders & Payments | 10 | 18+ |
| B2B Features | 12 | 20+ |
| Inventory | 6 | 10+ |
| Suppliers | 5 | 8+ |
| Advanced Features | 12 | 15+ |
| **TOTAL** | **60+** | **100+** |

---

**Last Updated:** November 2024
