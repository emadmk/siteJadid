# 8. API Reference - Public & Storefront Endpoints

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Register (rate limited: 5/min) |
| POST | `/api/auth/[...nextauth]` | No | NextAuth login/callback |
| POST | `/api/auth/forgot-password` | No | Send reset email (3/min) |
| POST | `/api/auth/reset-password` | No | Reset with token |
| POST | `/api/auth/verify-email` | No | Verify email token |
| POST | `/api/auth/resend-verification` | No | Resend verification (3/min) |

## Search

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/search?q=tape&limit=20` | No | Product search (ES → DB fallback) |

**Response**: `{ results: Product[], total: number, source: 'elasticsearch' | 'database' }`

## Storefront

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/storefront/products` | Product listing (paginated, filterable) |
| GET | `/api/storefront/categories/[slug]` | Category page data + smart filters |
| GET | `/api/storefront/brands/[slug]` | Brand page data + smart filters |
| GET | `/api/storefront/brands` | All brands list |
| GET | `/api/storefront/banners` | Active banners |
| GET | `/api/storefront/settings` | Public store settings |
| GET | `/api/storefront/company-info` | Company contact info |
| GET | `/api/storefront/discount-tiers` | Volume discount tiers |
| GET | `/api/storefront/quote-request` | Quote request form config |

## Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products/[slug]` | No | Single product detail |
| GET | `/api/products/[id]/reviews` | No | Product reviews |
| POST | `/api/products/[id]/reviews` | Yes | Submit review |
| POST | `/api/products/compare` | No | Compare products |
| POST | `/api/notify-when-available` | Yes | Back-in-stock alert |

## Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | Yes | Get cart |
| POST | `/api/cart` | Yes | Add item |
| PUT | `/api/cart` | Yes | Update quantity |
| DELETE | `/api/cart` | Yes | Remove item |

## Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders` | Yes | User's orders (paginated) |
| POST | `/api/orders` | Yes | Create order (checkout) |
| GET | `/api/orders/[orderNumber]` | Yes | Order detail |

## Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/create-intent` | Yes | Create Stripe PaymentIntent |
| POST | `/api/payments/confirm` | Yes | Confirm payment |
| POST | `/api/webhooks/stripe` | No | Stripe webhook handler |

## Shipping

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/shipping/rates` | Yes | Get Shippo shipping rates |
| GET | `/api/track-order` | No | Track by order number |

## Tax

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tax/rate` | No | Tax rate for current user type |
| POST | `/api/tax/calculate` | No | Calculate tax (TaxJar/manual) |

## User

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/user` | Yes | Current user profile |
| PUT | `/api/user` | Yes | Update profile |
| GET | `/api/addresses` | Yes | User addresses |
| POST | `/api/addresses` | Yes | Add address |
| PUT/DELETE | `/api/addresses/[id]` | Yes | Update/delete address |
| GET | `/api/wishlist` | Yes | User wishlist |
| POST/DELETE | `/api/wishlist` | Yes | Add/remove wishlist item |

## Forms & Communication

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| POST | `/api/contact` | No | 3/min + Turnstile | Contact form |
| POST | `/api/quote-request` | No | 5/15min + Turnstile | Quote request |
| POST | `/api/newsletter/subscribe` | No | None | Newsletter signup |

## Coupons

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/coupons/validate` | Yes | Validate coupon code |

---

*Next: [09 - Product Management](./09-products.md)*
