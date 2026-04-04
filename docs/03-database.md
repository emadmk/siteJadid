# 3. Database Schema & Models

## Overview

- **ORM**: Prisma 5.22
- **Database**: PostgreSQL 16 (Docker)
- **Total Models**: 113
- **Total Enums**: 62
- **Schema File**: `prisma/schema.prisma` (~4,300 lines)

## Core Models by Domain

### User Management (8 models)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `User` | All users (customers + staff) | email, role, accountType, isActive |
| `Account` | OAuth accounts (NextAuth) | provider, providerAccountId |
| `Session` | Active sessions | sessionToken, expires |
| `VerificationToken` | Email verification | token, expires |
| `Address` | User addresses | firstName, lastName, address1, city, state, zipCode |
| `B2BProfile` | Business account details | companyName, taxId, creditLimit |
| `GSAProfile` | Government account details | gsaNumber, department, contractNumber |
| `LoyaltyProfile` | Loyalty program | tier, pointsBalance, lifetimePoints |

### Product Catalog (12 models)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Product` | Main product | sku, name, slug, basePrice, status, images[] |
| `ProductVariant` | Size/color variants | sku, name, color, size, price, stockQuantity |
| `ProductImage` | Optimized images | originalUrl, largeUrl, mediumUrl, thumbUrl |
| `Category` | Product categories | name, slug, parentId (hierarchy) |
| `ProductCategory` | Many-to-many | productId, categoryId, isPrimary |
| `Brand` | Product brands | name, slug, logo |
| `ProductAttribute` | Custom attributes | name, type (TEXT/SELECT/etc.) |
| `ProductAttributeValue` | Attribute values | attributeId, productId, value |
| `ProductBundle` | Bundle deals | name, products[], discountPercent |
| `ProductDiscount` | Product-level discounts | productId, discountId |
| `TieredPrice` | Volume pricing | productId, minQuantity, price |
| `FrequentlyBoughtTogether` | Product recommendations | productId, relatedProductId |

### Orders & Payments (12 models)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Order` | Customer orders | orderNumber, status, total, userId |
| `OrderItem` | Order line items | orderId, productId, quantity, price, variantId |
| `OrderStatusHistory` | Status audit trail | orderId, status, notes, changedBy |
| `OrderApproval` | B2B approval workflow | orderId, approverId, status |
| `Shipment` | Shipping records | orderId, carrier, trackingNumber, status |
| `ShipmentItem` | Shipped items | shipmentId, orderItemId, quantity |
| `ShipmentTracking` | Tracking events | shipmentId, status, location, timestamp |
| `Invoice` | Order invoices | orderId, invoiceNumber, amount, status |
| `Payment` | Payment records | orderId, amount, method, transactionId |
| `PaymentTransaction` | Transaction details | paymentId, type, amount, status |
| `PaymentRefund` | Refund records | paymentId, amount, reason |
| `RMA` | Returns | orderId, type (REFUND/EXCHANGE), status |

### Shopping (6 models)

| Model | Purpose |
|-------|---------|
| `Cart` | User's shopping cart |
| `CartItem` | Cart line items |
| `Wishlist` | Saved items |
| `WishlistItem` | Wishlist entries |
| `ShoppingList` | Named lists (B2B) |
| `ShoppingListItem` | List entries |

### Inventory & Supply (10 models)

| Model | Purpose |
|-------|---------|
| `Supplier` | Product suppliers |
| `ProductSupplier` | Product-supplier mapping |
| `Warehouse` | Warehouse locations |
| `WarehouseStock` | Stock per warehouse |
| `VariantWarehouseStock` | Variant stock per warehouse |
| `WarehouseTransfer` | Inter-warehouse transfers |
| `InventoryLog` | Stock change history |
| `BackOrder` | Backorder tracking |
| `PurchaseOrder` | Supplier orders |
| `PurchaseOrderItem` | PO line items |

### Marketing & Promotions (10 models)

| Model | Purpose |
|-------|---------|
| `Discount` | Discount rules |
| `Coupon` | Coupon codes |
| `CategoryDiscount` | Category-level discounts |
| `FlashSale` | Time-limited sales |
| `FlashSaleItem` | Flash sale products |
| `GiftCard` | Gift cards |
| `GiftCardTransaction` | Gift card usage |
| `EmailTemplate` | Email templates |
| `EmailLog` | Sent email records |
| `NewsletterSubscriber` | Newsletter signups |

### Customer Relations (8 models)

| Model | Purpose |
|-------|---------|
| `CustomerGroup` | Customer segments |
| `CustomerGroupMember` | Group membership |
| `CustomerCredit` | Credit accounts (Net 30) |
| `CreditTransaction` | Credit usage history |
| `Review` | Product reviews |
| `ProductQuestion` | Q&A on products |
| `StockNotification` | Back-in-stock alerts |
| `TaxExemption` | Tax exemption certs |

### B2B Features (5 models)

| Model | Purpose |
|-------|---------|
| `B2BAccountMember` | Team members in B2B account |
| `B2BProfileExtension` | Extended B2B settings |
| `CostCenter` | Department budgets |
| `QuoteRequest` | Quote requests |
| `Quote` / `QuoteItem` | Formal quotes |

### System & Settings (15 models)

| Model | Purpose |
|-------|---------|
| `Setting` | Key-value settings |
| `Notification` | In-app notifications |
| `ActivityLog` | Admin audit trail |
| `TaxSettings` | Tax configuration (per customer type) |
| `TaxNexus` | State tax nexus |
| `ShippingProviderSettings` | Shipping provider config |
| `PaymentGatewaySettings` | Payment gateway config |
| `EmailServiceSettings` | Email provider config |
| `AlgoliaSettings` | Search settings |
| `RedisCacheSettings` | Cache settings |
| `SentrySettings` | Error monitoring |
| `ErrorLog` | Application errors |
| `SearchQuery` | Search analytics |
| `Webhook` | Webhook endpoints |
| `ChatConversation` / `ChatMessage` | Live chat |

## Key Enums

### Business Logic Enums

```
UserRole (13 values): SUPER_ADMIN → GOVERNMENT_CUSTOMER
AccountType (6): B2C, B2B, GSA, PERSONAL, VOLUME_BUYER, GOVERNMENT
ProductStatus (6): DRAFT, PRERELEASE, ACTIVE, INACTIVE, OUT_OF_STOCK, DISCONTINUED
OrderStatus (8): PENDING → DELIVERED, CANCELLED, REFUNDED, ON_HOLD
PaymentStatus (6): PENDING → PAID, FAILED, REFUNDED
PaymentMethod (7): CREDIT_CARD, PAYPAL, STRIPE, BANK_TRANSFER, NET_TERMS, PURCHASE_ORDER, GSA_SMARTPAY
```

### Status Enums

```
ShipmentStatus (8): PENDING → DELIVERED, FAILED, RETURNED
InvoiceStatus (5): DRAFT, SENT, PAID, OVERDUE, CANCELLED
RMAStatus (8): REQUESTED → REFUNDED, REPLACED, CLOSED
BackOrderStatus (4): PENDING, NOTIFIED, FULFILLED, CANCELLED
QuoteStatus (7): DRAFT → ACCEPTED, REJECTED, EXPIRED, CONVERTED
SubscriptionStatus (5): ACTIVE, PAUSED, CANCELLED, EXPIRED, PAST_DUE
```

## Key Relationships

```
User ──< Order ──< OrderItem >── Product
  │                    │              │
  │                    ├── Shipment   ├── ProductVariant
  │                    ├── Invoice    ├── ProductImage
  │                    └── RMA       ├── Category (via ProductCategory)
  │                                   └── Brand
  ├── Cart ──< CartItem >── Product
  ├── Wishlist ──< WishlistItem
  ├── Address[]
  ├── Review[]
  ├── Notification[]
  └── B2BProfile / GSAProfile / LoyaltyProfile
```

## Indexes

Key performance indexes:
- `User`: email (unique), role, accountType
- `Product`: sku (unique), slug (unique), status, categoryId, brandId
- `Order`: orderNumber (unique), userId, status, createdAt
- `ActivityLog`: userId, entity, createdAt
- `Notification`: userId, isRead, createdAt

---

*Next: [04 - Authentication & Authorization](./04-auth.md)*
