# Complete Frontend Documentation

**Comprehensive guide to all pages, components, routes, and frontend architecture.**

---

## 📋 Table of Contents

1. [Frontend Architecture](#frontend-architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [All Routes & Pages](#all-routes--pages)
5. [All Components](#all-components)
6. [State Management](#state-management)
7. [Styling System](#styling-system)
8. [Authentication Flow](#authentication-flow)
9. [API Integration](#api-integration)
10. [File Upload](#file-upload)

---

## 🏗️ Frontend Architecture

### Framework
- **Next.js 14** with App Router
- **React 18** Server & Client Components
- **TypeScript** for type safety

### Rendering Strategies
- **Server Components (RSC):** Default for all pages
- **Client Components:** Interactive components (forms, modals)
- **Static Generation:** Static pages (terms, privacy)
- **Server-Side Rendering:** Dynamic pages (products, orders)

### Data Fetching
- **Server Components:** Direct database queries
- **Client Components:** API routes with fetch/axios
- **Real-time:** Redis for cart/session

---

## 🛠️ Technology Stack

```json
{
  "framework": "Next.js 14.0.4",
  "language": "TypeScript 5.x",
  "styling": "Tailwind CSS 3.x",
  "ui-components": "Custom + Headless UI",
  "forms": "React Hook Form + Zod",
  "state": "React Context + Zustand",
  "authentication": "NextAuth.js v4",
  "http-client": "fetch API",
  "image-optimization": "next/image",
  "icons": "Heroicons / Lucide React"
}
```

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js 14 App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Homepage
│   ├── globals.css              # Global styles
│   │
│   ├── auth/                    # Authentication pages
│   │   ├── signin/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── products/                # Product pages
│   │   ├── page.tsx            # Product list
│   │   └── [slug]/page.tsx     # Product detail
│   │
│   ├── cart/page.tsx            # Shopping cart
│   ├── checkout/page.tsx        # Checkout
│   ├── dashboard/page.tsx       # User dashboard
│   ├── orders/page.tsx          # Order history
│   ├── profile/page.tsx         # User profile
│   │
│   ├── admin/                   # Admin panel
│   │   ├── layout.tsx          # Admin layout
│   │   ├── page.tsx            # Admin dashboard
│   │   │
│   │   ├── products/
│   │   │   ├── page.tsx        # Products list
│   │   │   ├── new/page.tsx    # Create product
│   │   │   └── [id]/edit/page.tsx
│   │   │
│   │   ├── orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   │
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── b2b/page.tsx
│   │   │   ├── gsa/page.tsx
│   │   │   ├── groups/page.tsx
│   │   │   └── gsa-approvals/page.tsx
│   │   │
│   │   ├── categories/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   │
│   │   ├── suppliers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   │
│   │   ├── inventory/page.tsx
│   │   ├── contracts/page.tsx
│   │   ├── backorders/page.tsx
│   │   ├── bundles/page.tsx
│   │   ├── subscriptions/page.tsx
│   │   ├── commissions/page.tsx
│   │   ├── tax-exemptions/page.tsx
│   │   ├── reviews/page.tsx
│   │   ├── wishlists/page.tsx
│   │   ├── coupons/page.tsx
│   │   ├── promotions/page.tsx
│   │   ├── product-attributes/page.tsx
│   │   ├── settings/page.tsx
│   │   │
│   │   ├── analytics/
│   │   │   ├── page.tsx
│   │   │   ├── sales/page.tsx
│   │   │   ├── customers/page.tsx
│   │   │   └── products/page.tsx
│   │   │
│   │   └── accounting/
│   │       ├── invoices/page.tsx
│   │       ├── payments/page.tsx
│   │       └── revenue/page.tsx
│   │
│   ├── api/                     # API Routes
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── signup/route.ts
│   │   │
│   │   ├── products/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   │
│   │   ├── cart/
│   │   │   ├── route.ts
│   │   │   └── count/route.ts
│   │   │
│   │   ├── search/route.ts
│   │   ├── payments/
│   │   │   └── create-intent/route.ts
│   │   │
│   │   └── admin/              # Admin API routes
│   │       ├── products/
│   │       ├── orders/
│   │       ├── customers/
│   │       ├── customer-groups/
│   │       ├── categories/
│   │       ├── suppliers/
│   │       ├── warehouses/
│   │       ├── quotes/
│   │       ├── contracts/
│   │       ├── tiered-prices/
│   │       ├── category-discounts/
│   │       ├── backorders/
│   │       ├── bundles/
│   │       ├── rma/
│   │       ├── subscriptions/
│   │       ├── commissions/
│   │       ├── tax-exemptions/
│   │       ├── reviews/
│   │       ├── wishlists/
│   │       ├── product-attributes/
│   │       └── purchase-orders/
│   │
│   ├── contact/page.tsx
│   ├── faq/page.tsx
│   ├── terms/page.tsx
│   ├── privacy/page.tsx
│   ├── shipping/page.tsx
│   ├── returns/page.tsx
│   ├── compliance/page.tsx
│   ├── gsa/page.tsx
│   └── setup-admin/page.tsx
│
├── components/                  # React Components
│   ├── Header.tsx
│   ├── providers.tsx
│   │
│   ├── ui/                     # UI Components
│   │   └── button.tsx
│   │
│   ├── product/
│   │   └── AddToCartButton.tsx
│   │
│   ├── search/
│   │   └── SearchBar.tsx
│   │
│   └── admin/                  # Admin Components
│       ├── AdminLayout.tsx
│       ├── AdminHeader.tsx
│       ├── AdminSidebar.tsx
│       ├── ProductForm.tsx
│       ├── CategoryForm.tsx
│       ├── OrderStatusUpdater.tsx
│       ├── GSAApprovalActions.tsx
│       ├── InventoryAdjustment.tsx
│       ├── CustomerGroupForm.tsx
│       ├── ProductSupplierManager.tsx
│       └── SupplierEditForm.tsx
│
├── lib/                        # Utilities
│   ├── auth.ts                # NextAuth configuration
│   ├── prisma.ts              # Prisma client
│   ├── redis.ts               # Redis client
│   ├── stripe.ts              # Stripe client
│   └── utils.ts               # Helper functions
│
├── types/                      # TypeScript types
│   ├── index.ts
│   └── next-auth.d.ts
│
└── middleware.ts               # Next.js middleware
```

---

## 🗺️ All Routes & Pages

### Public Pages

#### Homepage
**Route:** `/`
**File:** `src/app/page.tsx`
**Description:** Main landing page
**Features:**
- Hero section
- Featured products
- Category grid
- Best sellers
- New arrivals

#### Products List
**Route:** `/products`
**File:** `src/app/products/page.tsx`
**Description:** Product catalog with filters
**Query Params:**
- `?page=1` - Pagination
- `?category=slug` - Filter by category
- `?sort=price_asc` - Sorting
- `?minPrice=10&maxPrice=100` - Price range

**Features:**
- Grid/List view toggle
- Advanced filters
- Sorting options
- Pagination
- Quick view modal

#### Product Detail
**Route:** `/products/[slug]`
**File:** `src/app/products/[slug]/page.tsx`
**Description:** Single product page
**Features:**
- Image gallery with zoom
- Product details
- Pricing (account-type specific)
- Quantity selector
- Add to cart
- Reviews & ratings
- Related products
- Compliance certifications

#### Shopping Cart
**Route:** `/cart`
**File:** `src/app/cart/page.tsx`
**Description:** Shopping cart page
**Features:**
- Cart items list
- Quantity adjustment
- Remove items
- Price calculations
- Apply discount codes
- Proceed to checkout

#### Checkout
**Route:** `/checkout`
**File:** `src/app/checkout/page.tsx`
**Description:** Multi-step checkout
**Steps:**
1. Review cart
2. Shipping address
3. Billing address
4. Shipping method
5. Payment
6. Order confirmation

**Features:**
- Address autofill
- Stripe payment integration
- Order summary
- Tax calculation

---

### Authentication Pages

#### Sign In
**Route:** `/auth/signin`
**File:** `src/app/auth/signin/page.tsx`
**Features:**
- Email/password login
- Remember me
- Forgot password link
- OAuth providers (future)

#### Sign Up
**Route:** `/auth/signup`
**File:** `src/app/auth/signup/page.tsx`
**Features:**
- Account type selection (B2C/B2B/GSA)
- Email/password registration
- B2B company info
- GSA contract info
- Terms acceptance

---

### User Dashboard Pages

#### Dashboard
**Route:** `/dashboard`
**File:** `src/app/dashboard/page.tsx`
**Features:**
- Recent orders
- Account summary
- Quick actions
- Loyalty points (B2C)
- Credit status (B2B)

#### Order History
**Route:** `/orders`
**File:** `src/app/orders/page.tsx`
**Features:**
- Order list
- Filter by status/date
- Order tracking
- Reorder functionality
- Download invoices

#### User Profile
**Route:** `/profile`
**File:** `src/app/profile/page.tsx`
**Features:**
- Update personal info
- Change password
- Email preferences
- Address management
- Account settings

---

### Admin Panel Pages

#### Admin Dashboard
**Route:** `/admin`
**File:** `src/app/admin/page.tsx`
**Access:** ADMIN, SUPER_ADMIN
**Features:**
- Overview statistics
- Recent orders
- Low stock alerts
- Pending approvals
- Revenue charts

#### Products Management

##### Products List
**Route:** `/admin/products`
**File:** `src/app/admin/products/page.tsx`
**Features:**
- All products table
- Search & filters
- Bulk actions
- Export CSV
- Quick edit

##### Create Product
**Route:** `/admin/products/new`
**File:** `src/app/admin/products/new/page.tsx`
**Features:**
- Product form
- Image upload (multiple)
- Pricing (all types)
- Inventory
- SEO fields
- Compliance certs

##### Edit Product
**Route:** `/admin/products/[id]/edit`
**File:** `src/app/admin/products/[id]/edit/page.tsx`
**Features:**
- Same as create
- Delete product
- View analytics
- Supplier management

#### Orders Management

##### Orders List
**Route:** `/admin/orders`
**File:** `src/app/admin/orders/page.tsx`
**Features:**
- All orders table
- Filter by status
- Search by order#
- Export orders
- Bulk status update

##### Order Detail
**Route:** `/admin/orders/[id]`
**File:** `src/app/admin/orders/[id]/page.tsx`
**Features:**
- Full order details
- Status history
- Update status
- Add tracking
- Process refund
- Print invoice

#### Customers Management

##### All Customers
**Route:** `/admin/customers`
**File:** `src/app/admin/customers/page.tsx`
**Features:**
- Customer list
- Filter by account type
- Customer statistics
- Export list

##### Customer Detail
**Route:** `/admin/customers/[id]`
**File:** `src/app/admin/customers/[id]/page.tsx`
**Features:**
- Customer info
- Order history
- Addresses
- Credit status (B2B)
- Loyalty info (B2C)
- Activity log

##### B2B Customers
**Route:** `/admin/customers/b2b`
**File:** `src/app/admin/customers/b2b/page.tsx`
**Features:**
- B2B customer list
- Approval status
- Credit limits
- Company info

##### GSA Customers
**Route:** `/admin/customers/gsa`
**File:** `src/app/admin/customers/gsa/page.tsx`
**Features:**
- GSA customer list
- Contract numbers
- Verification status

##### GSA Approvals
**Route:** `/admin/customers/gsa-approvals`
**File:** `src/app/admin/customers/gsa-approvals/page.tsx`
**Features:**
- Pending approvals
- Approve/reject
- Verification checklist

##### Customer Groups
**Route:** `/admin/customers/groups`
**File:** `src/app/admin/customers/groups/page.tsx`
**Features:**
- Group management
- Assign members
- Set discounts
- Category pricing

#### Categories Management

##### Categories List
**Route:** `/admin/categories`
**File:** `src/app/admin/categories/page.tsx`
**Features:**
- Hierarchical tree view
- Create/edit/delete
- Drag & drop ordering
- SEO management

##### Create Category
**Route:** `/admin/categories/new`
**File:** `src/app/admin/categories/new/page.tsx`

##### Edit Category
**Route:** `/admin/categories/[id]/edit`
**File:** `src/app/admin/categories/[id]/edit/page.tsx`

#### Suppliers Management

##### Suppliers List
**Route:** `/admin/suppliers`
**File:** `src/app/admin/suppliers/page.tsx`
**Features:**
- Supplier list
- Performance metrics
- Rating system
- Create/edit supplier

##### Supplier Detail
**Route:** `/admin/suppliers/[id]`
**File:** `src/app/admin/suppliers/[id]/page.tsx`
**Features:**
- Supplier info
- Product assignments
- Purchase orders
- Performance history

#### Inventory Management

##### Inventory Overview
**Route:** `/admin/inventory`
**File:** `src/app/admin/inventory/page.tsx`
**Features:**
- Stock levels per warehouse
- Low stock alerts
- Stock adjustments
- Warehouse transfers
- Inventory logs

#### B2B Features

##### Contracts
**Route:** `/admin/contracts`
**File:** `src/app/admin/contracts/page.tsx`
**Features:**
- Active contracts
- Create contract
- Contract pricing
- Volume commitments
- Renewal management

#### Advanced Features

##### Backorders
**Route:** `/admin/backorders`
**File:** `src/app/admin/backorders/page.tsx`
**Features:**
- Backorder list
- Set expected dates
- Notify customers
- Auto-fulfill

##### Product Bundles
**Route:** `/admin/bundles`
**File:** `src/app/admin/bundles/page.tsx`
**Features:**
- Bundle list
- Create bundle
- Bundle pricing
- Component availability

##### Subscriptions
**Route:** `/admin/subscriptions`
**File:** `src/app/admin/subscriptions/page.tsx`
**Features:**
- Active subscriptions
- Create subscription
- Manage frequency
- Upcoming orders

##### Commissions
**Route:** `/admin/commissions`
**File:** `src/app/admin/commissions/page.tsx`
**Features:**
- Commission tracking
- Sales rep management
- Payout management
- Performance reports

##### Tax Exemptions
**Route:** `/admin/tax-exemptions`
**File:** `src/app/admin/tax-exemptions/page.tsx`
**Features:**
- Exemption requests
- Certificate verification
- Approve/reject
- Expiry tracking

##### Reviews
**Route:** `/admin/reviews`
**File:** `src/app/admin/reviews/page.tsx`
**Features:**
- Review moderation
- Approve/reject
- Delete inappropriate
- Response management

##### Wishlists
**Route:** `/admin/wishlists`
**File:** `src/app/admin/wishlists/page.tsx`
**Features:**
- View all wishlists
- Popular wishlist items
- Analytics

##### Product Attributes
**Route:** `/admin/product-attributes`
**File:** `src/app/admin/product-attributes/page.tsx`
**Features:**
- Attribute management
- Create attributes
- Set options
- Filter configuration

##### Coupons
**Route:** `/admin/coupons`
**File:** `src/app/admin/coupons/page.tsx`
**Features:**
- Coupon codes
- Discount rules
- Usage limits
- Validity periods

##### Promotions
**Route:** `/admin/promotions`
**File:** `src/app/admin/promotions/page.tsx`
**Features:**
- Promotional campaigns
- Banner management
- Featured products
- Time-limited offers

##### Settings
**Route:** `/admin/settings`
**File:** `src/app/admin/settings/page.tsx`
**Features:**
- Site settings
- Email templates
- Shipping methods
- Tax configuration
- Payment gateways

#### Analytics

##### Sales Analytics
**Route:** `/admin/analytics/sales`
**File:** `src/app/admin/analytics/sales/page.tsx`
**Features:**
- Revenue charts
- Sales by period
- Top products
- Growth trends

##### Customer Analytics
**Route:** `/admin/analytics/customers`
**File:** `src/app/admin/analytics/customers/page.tsx`
**Features:**
- New vs returning
- Customer lifetime value
- Acquisition sources
- Churn analysis

##### Product Analytics
**Route:** `/admin/analytics/products`
**File:** `src/app/admin/analytics/products/page.tsx`
**Features:**
- Best sellers
- Low performers
- Inventory turnover
- Category performance

#### Accounting

##### Invoices
**Route:** `/admin/accounting/invoices`
**File:** `src/app/admin/accounting/invoices/page.tsx`
**Features:**
- Invoice list
- Generate invoices
- Send to customers
- Payment tracking

##### Payments
**Route:** `/admin/accounting/payments`
**File:** `src/app/admin/accounting/payments/page.tsx`
**Features:**
- Payment history
- Reconciliation
- Refunds
- Reports

##### Revenue
**Route:** `/admin/accounting/revenue`
**File:** `src/app/admin/accounting/revenue/page.tsx`
**Features:**
- Revenue reports
- P&L statements
- Tax reports
- Export financial data

---

### Static Pages

#### Contact
**Route:** `/contact`
**File:** `src/app/contact/page.tsx`

#### FAQ
**Route:** `/faq`
**File:** `src/app/faq/page.tsx`

#### Terms of Service
**Route:** `/terms`
**File:** `src/app/terms/page.tsx`

#### Privacy Policy
**Route:** `/privacy`
**File:** `src/app/privacy/page.tsx`

#### Shipping Info
**Route:** `/shipping`
**File:** `src/app/shipping/page.tsx`

#### Returns Policy
**Route:** `/returns`
**File:** `src/app/returns/page.tsx`

#### Compliance
**Route:** `/compliance`
**File:** `src/app/compliance/page.tsx`

#### GSA Information
**Route:** `/gsa`
**File:** `src/app/gsa/page.tsx`

---

## 🧩 All Components

### Layout Components

#### Header
**File:** `src/components/Header.tsx`
**Type:** Client Component
**Features:**
- Logo
- Navigation menu
- Search bar
- Cart icon with count
- User menu
- Mobile menu

#### Admin Layout
**File:** `src/components/admin/AdminLayout.tsx`
**Type:** Server Component
**Features:**
- Sidebar navigation
- Header with user menu
- Breadcrumbs
- Content area

#### Admin Sidebar
**File:** `src/components/admin/AdminSidebar.tsx`
**Type:** Client Component
**Features:**
- Collapsible menu
- Active state
- Icon navigation
- Role-based visibility

#### Admin Header
**File:** `src/components/admin/AdminHeader.tsx`
**Type:** Client Component
**Features:**
- Notifications
- User dropdown
- Quick actions

---

### Form Components

#### Product Form
**File:** `src/components/admin/ProductForm.tsx`
**Type:** Client Component
**Props:**
```typescript
{
  product?: Product;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}
```
**Features:**
- Multi-step wizard
- Image upload
- Rich text editor
- Validation with Zod
- Price management

#### Category Form
**File:** `src/components/admin/CategoryForm.tsx`
**Type:** Client Component
**Props:**
```typescript
{
  category?: Category;
  parentCategories: Category[];
  onSubmit: (data: CategoryFormData) => Promise<void>;
}
```

#### Customer Group Form
**File:** `src/components/admin/CustomerGroupForm.tsx`
**Type:** Client Component
**Features:**
- Group settings
- Discount configuration
- Member assignment

#### Supplier Edit Form
**File:** `src/components/admin/SupplierEditForm.tsx`
**Type:** Client Component
**Features:**
- Supplier details
- Contact info
- Payment terms
- Rating system

---

### Action Components

#### Add to Cart Button
**File:** `src/components/product/AddToCartButton.tsx`
**Type:** Client Component
**Props:**
```typescript
{
  productId: string;
  quantity?: number;
  variant?: string;
}
```
**Features:**
- Loading state
- Success animation
- Error handling
- Cart count update

#### Order Status Updater
**File:** `src/components/admin/OrderStatusUpdater.tsx`
**Type:** Client Component
**Features:**
- Status dropdown
- Tracking number input
- Notes field
- Confirmation modal

#### GSA Approval Actions
**File:** `src/components/admin/GSAApprovalActions.tsx`
**Type:** Client Component
**Features:**
- Approve/reject buttons
- Verification checklist
- Notes field

#### Inventory Adjustment
**File:** `src/components/admin/InventoryAdjustment.tsx`
**Type:** Client Component
**Features:**
- Add/subtract/set quantity
- Warehouse selection
- Reason/notes field

#### Product Supplier Manager
**File:** `src/components/admin/ProductSupplierManager.tsx`
**Type:** Client Component
**Features:**
- Assign suppliers
- Set pricing
- Lead times
- Primary supplier

---

### Search Components

#### Search Bar
**File:** `src/components/search/SearchBar.tsx`
**Type:** Client Component
**Features:**
- Autocomplete
- Debounced search
- Category filter
- Search history
- Keyboard navigation

---

### UI Components

#### Button
**File:** `src/components/ui/button.tsx`
**Type:** Client Component
**Variants:**
```typescript
{
  variant: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}
```

---

## 🔐 Authentication Flow

### Sign In Flow
```
1. User enters email/password
2. POST /api/auth/signin
3. NextAuth validates credentials
4. Creates session (JWT)
5. Stores session in Redis
6. Redirects to dashboard
```

### Sign Up Flow
```
1. User selects account type (B2C/B2B/GSA)
2. Fills registration form
3. POST /api/auth/signup
4. Creates user + profile
5. Sends verification email
6. Auto sign-in
7. Redirects to dashboard
```

### Protected Routes
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token');

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Check admin role
  }
}
```

---

## 🎨 Styling System

### Tailwind CSS
```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700;
  }
}
```

### Custom Colors
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'safety-green': {
          50: '#f0fdf4',
          500: '#22c55e',
          900: '#14532d',
        },
        'safety-red': {
          500: '#ef4444',
        },
        'safety-yellow': {
          500: '#eab308',
        }
      }
    }
  }
}
```

---

## 📡 API Integration

### Fetching Data (Server Component)
```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: { category: true }
  });

  return <ProductsList products={products} />;
}
```

### Fetching Data (Client Component)
```typescript
'use client';

export function ProductsList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.products));
  }, []);

  return <div>{/* ... */}</div>;
}
```

### Mutations
```typescript
'use client';

async function addToCart(productId: string) {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      quantity: 1,
      action: 'add'
    })
  });

  if (!response.ok) {
    throw new Error('Failed to add to cart');
  }

  return response.json();
}
```

---

## 📤 File Upload

### Image Upload Component
```typescript
'use client';

export function ImageUpload({ onUpload }: { onUpload: (url: string) => void }) {
  async function handleUpload(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const { url } = await response.json();
    onUpload(url);
  }

  return (
    <input
      type="file"
      accept="image/*"
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
    />
  );
}
```

---

## 📊 State Management

### Session State (NextAuth)
```typescript
'use client';
import { useSession } from 'next-auth/react';

export function UserMenu() {
  const { data: session } = useSession();

  return (
    <div>
      {session?.user?.name}
    </div>
  );
}
```

### Cart State (Context)
```typescript
'use client';
import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [count, setCount] = useState(0);

  return (
    <CartContext.Provider value={{ count, setCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
```

---

**Last Updated:** November 2024
**Framework:** Next.js 14
**Total Pages:** 50+
**Total Components:** 15+
