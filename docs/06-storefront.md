# 6. Storefront - Pages & Components

## Layout

```
RootLayout (src/app/layout.tsx)
├── Providers (SessionProvider, QueryClient, ThemeProvider, CartProvider, SearchProvider)
├── ImpersonationBanner (shown when admin impersonates customer)
├── ConditionalHeader (hidden on /admin)
│   └── StorefrontHeader (top bar, logo, search, nav, cart, user menu)
├── {children}
├── ConditionalFooter (hidden on /admin)
│   └── StorefrontFooter (links, newsletter subscribe, contact info)
└── GlobalModals (auth modal, search modal, cart drawer)
```

## Pages

### Home (`/`)
- `HeroSection` - Banner slider (admin-managed)
- `BenefitsSection` - Key selling points
- `ProudlySupplyBanner` - Brand showcase
- `BrandsSection` - Brand logos carousel
- `PromoSection` - Featured promotions
- `RecentlyViewedSection` - Recently viewed products (localStorage)
- `PhoneNotice` - Temporary phone number popup (session-based)

### Products (`/products`)
- `ProductsListing` - Grid/list view, infinite scroll (5 pages), filters sidebar
- Filters: Search, Brand, Category, Price Range, TAA, Smart Filters
- Sort: Newest, Price asc/desc, Name asc/desc
- Search uses Elasticsearch with fuzzy matching

### Product Detail (`/products/[slug]`)
- `ProductDetail` - Full product page
- Image gallery with zoom, variant selector, pricing tiers
- Add to cart, wishlist, quick order
- Product Q&A, Reviews
- `ProductInlineEditor` - Admin edit overlay (when logged in as admin)

### Categories (`/categories/[slug]`)
- Server component with client-side filtering
- Subcategory cards + checkbox filter in sidebar
- Smart filters (Gender, Material, Color, etc.) - category-specific
- Brand filter with product counts
- Price range, TAA/BAA approved filter

### Brands (`/brands/[slug]`)
- Similar to categories but filtered by brand
- Smart filters, pagination

### Cart (`/cart`)
- Server component, shows cart items with images
- Quantity adjustment, remove items
- Tax calculation from DB settings (per account type)
- Free shipping threshold progress bar

### Checkout (`/checkout`)
- `CheckoutForm` - Multi-step: Address → Shipping → Payment → Review
- Stripe Elements for card payment
- Net 30 / Invoice for B2B
- Shippo live shipping rates
- Tax from per-customer-type settings

### Account Pages
- `/account` - Dashboard
- `/account/orders` - Order history
- `/account/orders/[orderNumber]` - Order detail
- `/account/addresses` - Address book
- `/account/wishlist` - Saved items
- `/account/profile` - Edit profile

### Other Pages
- `/contact` - Contact form (Turnstile captcha)
- `/b2b/request-quote` - Quote request (Turnstile captcha)
- `/about` - Company info
- `/faq` - FAQ page
- `/gsa` - Government buyer info

## Key Components

| Component | Purpose |
|-----------|---------|
| `StorefrontHeader` | Main nav, search trigger, cart icon, user menu |
| `SearchModal` | Cmd+K search with recent/popular, ES-powered |
| `CartDrawer` | Slide-out cart preview |
| `ProductsListing` | Filterable product grid with infinite scroll |
| `ProductDetail` | Full product page with variants |
| `VariantSelector` | Size/color/type selector |
| `CheckoutForm` | Multi-step checkout with Stripe |
| `HeroSection` | Dynamic banner slider |
| `PhoneNotice` | Temporary announcement popup |
| `Turnstile` | Cloudflare captcha component |

## Contexts

| Context | State | Used By |
|---------|-------|---------|
| `CartContext` | Cart items, add/remove/update | Header, Cart, Checkout |
| `SearchContext` | Query, results, recent searches | SearchModal, SearchBar |
| `AuthModalContext` | Login/signup modal state | Header, protected pages |
| `HomeStyleContext` | Home page layout preferences | Home components |

---

*Next: [07 - API Admin Endpoints](./07-api-admin.md)*
