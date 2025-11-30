# AdaSupply Professional Storefront Specification

## Project Overview

Building a professional, modern e-commerce storefront for **AdaSupply** - a B2B/B2C/GSA safety equipment supplier. The storefront will connect to all existing admin panel APIs and provide a seamless shopping experience.

**Theme Colors:** White + Safety Green (#22c55e) + Black

---

## 1. Existing Infrastructure Analysis

### 1.1 Database Models (Prisma Schema)

| Category | Models |
|----------|--------|
| **Users** | User, Account, Session, Address, B2BProfile, GSAProfile, LoyaltyProfile |
| **Products** | Product, Category, ProductVariant, ProductAttribute, ProductBundle |
| **Commerce** | Cart, CartItem, Wishlist, WishlistItem, Order, OrderItem, Invoice, Payment |
| **B2B/Enterprise** | CustomerGroup, CustomerCredit, TieredPrice, Contract, Quote |
| **Fulfillment** | Warehouse, WarehouseStock, Shipment, BackOrder, PurchaseOrder |
| **Marketing** | Discount, Banner, EmailTemplate, GiftCard, FlashSale |
| **Customer Service** | RMA, Review, Subscription, Notification |

### 1.2 Existing API Endpoints

#### Customer-Facing APIs
```
GET/POST   /api/cart                     - Cart management
PATCH/DEL  /api/cart/[itemId]           - Cart item operations
GET        /api/cart/count              - Cart item count
GET/POST   /api/wishlist                - Wishlist management
GET/POST   /api/reviews                 - Product reviews
GET        /api/products                - Product listing
GET        /api/products/[id]           - Product details
GET        /api/products/frequently-bought - Recommendations
GET/POST   /api/orders                  - Order management
GET        /api/orders/[orderNumber]    - Order details
GET        /api/track-order             - Order tracking
GET        /api/search                  - Product search
GET        /api/search/algolia          - Advanced search
POST       /api/coupons/validate        - Coupon validation
GET        /api/gift-cards/check        - Gift card balance
POST       /api/shipping/rates          - Shipping calculation
POST       /api/tax/calculate           - Tax calculation
GET        /api/flash-sales/active      - Active promotions
POST       /api/notify-when-available   - Stock notifications
GET/POST   /api/addresses               - User addresses
GET/POST   /api/shopping-lists          - Shopping lists
GET        /api/product-comparison      - Compare products
GET/POST   /api/bulk-orders             - Bulk ordering
```

#### B2B APIs
```
GET/POST   /api/b2b/members            - Team management
GET/POST   /api/b2b/approvals          - Order approvals
GET/POST   /api/b2b/cost-centers       - Budget tracking
```

#### Payment APIs
```
POST       /api/payments/stripe/create-payment
POST       /api/payments/stripe/webhook
POST       /api/payments/paypal/create-order
POST       /api/payments/paypal/capture-order
```

---

## 2. Storefront Architecture

### 2.1 Page Structure

```
/                           - Homepage
/products                   - Product Catalog (with filters)
/products/[slug]            - Product Detail Page
/categories/[slug]          - Category Page (hierarchical)
/search                     - Advanced Search Results
/cart                       - Shopping Cart (AJAX-based)
/checkout                   - Checkout Flow
/auth/signin                - Login (AJAX Modal)
/auth/signup                - Register (AJAX Modal)
/account                    - Account Dashboard
/account/orders             - Order History
/account/orders/[id]        - Order Details
/account/addresses          - Saved Addresses
/account/profile            - Profile Settings
/account/wishlist           - Wishlist
/account/lists              - Shopping Lists
/b2b/dashboard              - B2B Account Dashboard
/b2b/team                   - Team Management
/b2b/approvals              - Order Approvals
/b2b/cost-centers           - Budget Management
/gsa/dashboard              - GSA Dashboard
/compare                    - Product Comparison
/quick-order                - Quick Order Form
/bulk-order                 - Bulk Order Upload
/track-order                - Order Tracking
/flash-sales                - Flash Sales Page
/gift-cards                 - Gift Cards
/about                      - About Us
/contact                    - Contact (with form)
/shipping-policy            - Shipping Info
/returns                    - Returns Policy
/privacy                    - Privacy Policy
/terms                      - Terms of Service
/faq                        - FAQ
```

### 2.2 Component Structure

```
src/components/storefront/
├── layout/
│   ├── Header.tsx              - Main header with mega menu
│   ├── Footer.tsx              - Professional footer
│   ├── MobileNav.tsx           - Mobile navigation
│   ├── Breadcrumb.tsx          - Breadcrumb navigation
│   └── AnnouncementBar.tsx     - Top announcement bar
├── auth/
│   ├── AuthModal.tsx           - AJAX login/register modal
│   ├── LoginForm.tsx           - Login form
│   ├── RegisterForm.tsx        - Registration form
│   └── ForgotPassword.tsx      - Password reset
├── cart/
│   ├── CartDrawer.tsx          - Slide-out cart (AJAX)
│   ├── CartItem.tsx            - Cart item component
│   ├── CartSummary.tsx         - Order summary
│   └── MiniCart.tsx            - Header mini cart
├── product/
│   ├── ProductCard.tsx         - Product card
│   ├── ProductGrid.tsx         - Product grid
│   ├── ProductGallery.tsx      - Image gallery with zoom
│   ├── ProductInfo.tsx         - Product details
│   ├── ProductTabs.tsx         - Description/specs/reviews
│   ├── AddToCartButton.tsx     - AJAX add to cart
│   ├── QuantitySelector.tsx    - Quantity input
│   ├── PriceDisplay.tsx        - Multi-tier pricing
│   ├── StockBadge.tsx          - Stock status
│   └── ReviewSection.tsx       - Reviews & ratings
├── category/
│   ├── CategoryNav.tsx         - Category navigation
│   ├── CategoryTree.tsx        - Hierarchical categories
│   ├── FilterSidebar.tsx       - Product filters
│   └── SortDropdown.tsx        - Sorting options
├── search/
│   ├── SearchModal.tsx         - Full search modal
│   ├── SearchResults.tsx       - Results display
│   ├── SearchSuggestions.tsx   - Auto-complete
│   └── RecentSearches.tsx      - Search history
├── checkout/
│   ├── CheckoutSteps.tsx       - Step indicator
│   ├── AddressForm.tsx         - Address input
│   ├── ShippingMethods.tsx     - Shipping selection
│   ├── PaymentForm.tsx         - Payment input
│   ├── OrderReview.tsx         - Order review
│   └── CouponInput.tsx         - Coupon/gift card
├── account/
│   ├── AccountNav.tsx          - Account navigation
│   ├── OrderCard.tsx           - Order summary card
│   ├── AddressCard.tsx         - Address display
│   └── ProfileForm.tsx         - Profile editing
├── b2b/
│   ├── B2BDashboard.tsx        - B2B overview
│   ├── TeamMembers.tsx         - Team management
│   ├── ApprovalQueue.tsx       - Pending approvals
│   ├── CostCenterWidget.tsx    - Budget tracking
│   └── QuoteRequest.tsx        - Quote form
└── common/
    ├── Button.tsx              - Button component
    ├── Modal.tsx               - Modal wrapper
    ├── Toast.tsx               - Toast notifications
    ├── Skeleton.tsx            - Loading skeleton
    ├── Badge.tsx               - Status badges
    ├── Pagination.tsx          - Pagination
    ├── InfiniteScroll.tsx      - Infinite scroll
    └── LoadingSpinner.tsx      - Loading indicator
```

---

## 3. Feature Specifications

### 3.1 Header & Navigation

**Desktop Header:**
- Logo (AdaSupply) - left
- Mega menu categories (hierarchical) - center
- Search bar with instant results - center/right
- Account dropdown (AJAX login) - right
- Cart icon with count (opens drawer) - right
- Wishlist icon with count - right

**Mega Menu Features:**
- Parent categories with images
- Child categories list
- Featured products
- Special offers banner
- "View All" links

**Mobile Header:**
- Hamburger menu
- Logo - center
- Search icon
- Cart icon

### 3.2 Product Catalog

**Category Page Features:**
- Hierarchical breadcrumb
- Category description & image
- Subcategory navigation
- Filter sidebar:
  - Price range slider
  - Brand filter
  - Attributes (size, color, material)
  - Stock availability
  - Rating filter
  - B2B/GSA filters (for logged-in users)
- Sort options: Newest, Price (Low/High), Name, Popularity, Rating
- Grid/List view toggle
- Products per page selector

**Pagination Strategy:**
- Pages 1-5: Infinite scroll with "Load More"
- Page 6+: Traditional pagination
- URL updates on scroll for bookmarking

### 3.3 Product Detail Page

**Layout:**
- Image gallery (main + thumbnails, zoom on hover)
- Product info:
  - Name, SKU, Brand
  - Rating stars with review count
  - Price display (with multi-tier for B2B)
  - Stock status with quantity
  - Size/variant selector
  - Quantity input
  - Add to Cart button (AJAX)
  - Add to Wishlist
  - Request Quote (B2B)
- Tabs:
  - Description
  - Specifications
  - Reviews
  - Q&A
  - Shipping info

**Additional Sections:**
- Related products
- Frequently bought together
- Recently viewed products
- Customer reviews with photos

### 3.4 Shopping Cart (AJAX-Based)

**Cart Drawer:**
- Slides in from right
- No page reload
- Real-time quantity updates
- Remove items instantly
- Shows subtotal
- "Continue Shopping" or "Checkout" buttons
- Coupon input
- Free shipping progress bar

**Cart Page:**
- Full cart view
- Edit quantities
- Save for later
- Estimated shipping
- Tax calculation (real-time)
- Order summary

### 3.5 Checkout Flow

**Steps:**
1. **Information** - Email, shipping address (saved addresses for logged-in)
2. **Shipping** - Method selection with real-time rates
3. **Payment** - Card (Stripe), PayPal, Net Terms (B2B)
4. **Review** - Order summary, place order

**B2B-Specific:**
- Cost center selection
- PO number input
- Approval workflow trigger
- Net terms payment option

**GSA-Specific:**
- Contract number validation
- GSA pricing display
- Government payment methods

### 3.6 User Authentication (AJAX)

**Login Modal:**
- Email/password login
- Social login (Google, etc.)
- "Remember me" option
- Forgot password link
- Register link
- No page redirect

**Registration Modal:**
- Account type selection (B2C, B2B, GSA)
- Form fields based on type
- Email verification
- B2B: Company info, Tax ID
- GSA: Contract number, Agency info

### 3.7 Search Experience

**Search Bar:**
- Instant suggestions (debounced)
- Product results with images
- Category suggestions
- Recent searches
- Popular searches

**Search Results Page:**
- Same filters as catalog
- Relevance sorting
- Highlighted search terms
- "Did you mean?" suggestions
- No results fallback

### 3.8 User Account Dashboard

**Dashboard Overview:**
- Recent orders
- Wishlist preview
- Saved addresses
- Account type badge
- Quick actions

**Orders:**
- Order history with status
- Order details with tracking
- Reorder functionality
- Invoice download (PDF)
- Return request (RMA)

**B2B Dashboard:**
- Company info
- Team members
- Pending approvals
- Cost center budgets
- Contract pricing
- Quote history

### 3.9 Advanced Features

**Recently Viewed Products:**
- Stored in localStorage
- API sync for logged-in users
- Display on homepage and product pages

**Wishlist:**
- AJAX add/remove
- Share wishlist
- Move to cart
- Stock notifications

**Product Comparison:**
- Compare up to 4 products
- Side-by-side specs
- Add to cart from compare

**Quick Order:**
- SKU input form
- CSV upload
- Bulk add to cart

**Stock Notifications:**
- "Notify when available" for out-of-stock
- Email notification on restock

---

## 4. API Integrations Needed

### 4.1 New Storefront APIs

```typescript
// Recently Viewed Products
GET  /api/storefront/recently-viewed
POST /api/storefront/recently-viewed    // Track view

// Product Recommendations
GET  /api/storefront/recommendations/[productId]

// Category Navigation
GET  /api/storefront/categories/tree    // Full hierarchy
GET  /api/storefront/categories/[slug]  // Category with products

// User Preferences
GET  /api/storefront/preferences
PUT  /api/storefront/preferences

// Abandoned Cart Recovery
POST /api/storefront/cart/recovery      // Email reminder

// Newsletter
POST /api/storefront/newsletter/subscribe
```

### 4.2 Existing API Enhancements

```typescript
// Enhanced Search
GET /api/search?
  q=query&
  category=slug&
  minPrice=0&
  maxPrice=100&
  brands[]=brand1&
  attributes[color][]=red&
  inStock=true&
  rating=4&
  sort=price-asc&
  page=1&
  limit=20

// Product with all relations
GET /api/products/[slug]?
  include=reviews,questions,related,variants

// Cart with pricing tiers
GET /api/cart?
  include=pricing&
  accountType=B2B
```

---

## 5. Technical Implementation

### 5.1 State Management

```typescript
// Cart Context
interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isLoading: boolean;
  isOpen: boolean;
}

// Auth Context
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accountType: 'B2C' | 'B2B' | 'GSA';
}

// Search Context
interface SearchState {
  query: string;
  results: Product[];
  suggestions: string[];
  isLoading: boolean;
  recentSearches: string[];
}
```

### 5.2 AJAX Patterns

```typescript
// Cart Operations
async function addToCart(productId: string, quantity: number) {
  const res = await fetch('/api/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });

  if (res.ok) {
    const cart = await res.json();
    updateCartState(cart);
    showToast('Added to cart');
    openCartDrawer();
  }
}

// Auth Operations
async function login(email: string, password: string) {
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  });

  if (result?.ok) {
    closeAuthModal();
    refreshSession();
  }
}
```

### 5.3 Infinite Scroll Implementation

```typescript
function useInfiniteProducts(filters: Filters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (page <= 5) {
      // Infinite scroll for first 5 pages
      const more = await fetchProducts({ ...filters, page });
      setProducts([...products, ...more.products]);
      setPage(page + 1);
      setHasMore(more.hasMore);
    }
  };

  // After page 5, switch to pagination
  const goToPage = async (pageNum: number) => {
    const data = await fetchProducts({ ...filters, page: pageNum });
    setProducts(data.products);
    setPage(pageNum);
  };

  return { products, loadMore, goToPage, hasMore, page };
}
```

---

## 6. Design System

### 6.1 Color Palette

```css
:root {
  /* Primary - Safety Green */
  --primary-50: #f0fdf4;
  --primary-100: #dcfce7;
  --primary-200: #bbf7d0;
  --primary-300: #86efac;
  --primary-400: #4ade80;
  --primary-500: #22c55e;  /* Main */
  --primary-600: #16a34a;
  --primary-700: #15803d;
  --primary-800: #166534;
  --primary-900: #14532d;

  /* Neutral */
  --black: #000000;
  --white: #ffffff;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Semantic */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

### 6.2 Typography

```css
/* Headings */
h1 { font-size: 2.5rem; font-weight: 700; }
h2 { font-size: 2rem; font-weight: 700; }
h3 { font-size: 1.5rem; font-weight: 600; }
h4 { font-size: 1.25rem; font-weight: 600; }

/* Body */
.text-lg { font-size: 1.125rem; }
.text-base { font-size: 1rem; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
```

### 6.3 Component Styling

```css
/* Buttons */
.btn-primary {
  background: var(--primary-500);
  color: white;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--primary-600);
}

.btn-outline {
  border: 2px solid var(--black);
  color: var(--black);
  background: transparent;
}

.btn-outline:hover {
  background: var(--black);
  color: var(--white);
}

/* Cards */
.product-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.3s;
}

.product-card:hover {
  border-color: var(--primary-400);
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}
```

---

## 7. Implementation Phases

### Phase 1: Core Foundation (Week 1-2)
- [ ] Layout components (Header, Footer, Navigation)
- [ ] Auth system (AJAX login/register modals)
- [ ] Cart system (AJAX drawer, operations)
- [ ] Basic product listing

### Phase 2: Product Experience (Week 3-4)
- [ ] Category pages with hierarchy
- [ ] Product detail page
- [ ] Search with suggestions
- [ ] Filter system
- [ ] Infinite scroll + pagination

### Phase 3: Checkout & Account (Week 5-6)
- [ ] Complete checkout flow
- [ ] Payment integrations
- [ ] Account dashboard
- [ ] Order history

### Phase 4: B2B Features (Week 7)
- [ ] B2B dashboard
- [ ] Team management
- [ ] Approval workflows
- [ ] Cost centers

### Phase 5: Advanced Features (Week 8)
- [ ] Recently viewed
- [ ] Wishlist
- [ ] Product comparison
- [ ] Quick order
- [ ] Notifications

### Phase 6: Polish & Testing (Week 9-10)
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Accessibility (WCAG)
- [ ] TypeScript fixes
- [ ] E2E testing

---

## 8. File Structure

```
src/
├── app/
│   ├── (storefront)/
│   │   ├── layout.tsx              - Storefront layout
│   │   ├── page.tsx                - Homepage
│   │   ├── products/
│   │   │   ├── page.tsx            - Catalog
│   │   │   └── [slug]/
│   │   │       └── page.tsx        - Product detail
│   │   ├── categories/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        - Category page
│   │   ├── cart/
│   │   │   └── page.tsx            - Cart page
│   │   ├── checkout/
│   │   │   └── page.tsx            - Checkout
│   │   ├── account/
│   │   │   ├── page.tsx            - Dashboard
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx        - Order list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    - Order detail
│   │   │   ├── addresses/
│   │   │   │   └── page.tsx        - Addresses
│   │   │   ├── wishlist/
│   │   │   │   └── page.tsx        - Wishlist
│   │   │   └── profile/
│   │   │       └── page.tsx        - Profile
│   │   ├── b2b/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── team/
│   │   │   │   └── page.tsx
│   │   │   └── approvals/
│   │   │       └── page.tsx
│   │   ├── search/
│   │   │   └── page.tsx            - Search results
│   │   └── [static pages...]
│   ├── api/
│   │   └── storefront/
│   │       ├── recently-viewed/
│   │       ├── recommendations/
│   │       ├── categories/
│   │       └── preferences/
│   └── (admin)/                    - Existing admin
├── components/
│   └── storefront/                 - All storefront components
├── hooks/
│   ├── useCart.ts
│   ├── useAuth.ts
│   ├── useSearch.ts
│   ├── useRecentlyViewed.ts
│   └── useInfiniteProducts.ts
├── contexts/
│   ├── CartContext.tsx
│   ├── AuthContext.tsx
│   └── SearchContext.tsx
├── lib/
│   ├── storefront/
│   │   ├── pricing.ts              - Price calculations
│   │   ├── filters.ts              - Filter utilities
│   │   └── tracking.ts             - Analytics
│   └── [existing libs...]
└── styles/
    └── storefront.css              - Storefront-specific styles
```

---

## 9. Success Criteria

1. **No TypeScript Errors** - All components properly typed
2. **No Mock Data** - Everything connected to real APIs
3. **English Only** - All text in English
4. **AJAX Operations** - Cart, Auth, Search without page reloads
5. **Responsive Design** - Mobile-first approach
6. **Performance** - Lighthouse score > 90
7. **Accessibility** - WCAG 2.1 AA compliant
8. **B2B/GSA Ready** - All enterprise features functional

---

## 10. Notes

- All existing admin APIs remain unchanged
- Storefront uses same Prisma schema
- Session shared between admin and storefront
- Theme colors align with safety equipment industry
- Focus on professional, clean design
- Prioritize user experience and conversion

---

*Document Created: 2025*
*Project: AdaSupply Professional E-commerce Storefront*
