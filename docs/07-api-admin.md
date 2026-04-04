# 7. API Reference - Admin Endpoints

All admin endpoints require authentication and appropriate role.
Base path: `/api/admin/`

## Products

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/products` | All admin | List products (paginated, filterable) |
| POST | `/products` | ADMIN+ | Create product |
| GET | `/products/[id]` | All admin | Get single product |
| PUT | `/products/[id]` | ADMIN+ | Full update product |
| PATCH | `/products/[id]` | ADMIN+ | Partial update |
| DELETE | `/products/[id]` | ADMIN+ | Delete product |
| GET | `/products/[id]/variants` | All admin | List variants |
| POST | `/products/[id]/variants` | ADMIN+ | Create variant |
| PUT | `/products/[id]/variants` | ADMIN+ | Update variants |
| DELETE | `/products/[id]/variants` | ADMIN+ | Delete variant |
| POST | `/products/[id]/color-images` | ADMIN+ | Map colors to images |
| PUT | `/products/[id]/inventory` | ADMIN+ | Adjust stock |
| GET | `/products/[id]/suppliers` | ADMIN+ | Product suppliers |
| POST | `/products/bulk` | ADMIN+ | Bulk actions (delete/status/discount) |
| POST | `/products/bulk-release` | ADMIN+ | Bulk release prerelease products |
| POST | `/products/bulk-delete` | ADMIN+ | Bulk delete products |
| POST | `/products/images` | ADMIN+ | Upload images |

## Orders

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| PUT | `/orders/[id]` | ADMIN, CS | Update admin notes |
| DELETE | `/orders/[id]` | SUPER_ADMIN | Delete order (cascading) |
| PUT | `/orders/[id]/status` | ADMIN, CS | Change status + email |

## Users & Customers

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/users` | SUPER_ADMIN | List staff users |
| POST | `/users` | SUPER_ADMIN | Create staff user |
| PUT | `/users/[id]` | SUPER_ADMIN | Update user role/status |
| GET | `/customers/search` | ADMIN, CS | Search customers |
| GET | `/customers/[id]/credit` | ADMIN | Customer credit |
| PATCH | `/gsa-approvals` | ADMIN, CS | Approve/reject GSA |
| PATCH | `/user-approval` | ADMIN, CS | Approve/reject accounts |
| PATCH | `/pending-approvals` | ADMIN, CS | Pending approvals |
| POST | `/impersonate` | SUPER_ADMIN | Impersonate customer |

## Categories & Brands

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET/POST | `/categories` | ADMIN+ |
| GET/PUT/DELETE | `/categories/[id]` | ADMIN+ |
| GET/POST | `/brands` | ADMIN+ |
| GET/PUT/DELETE | `/brands/[id]` | ADMIN+ |

## Inventory & Supply Chain

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET/POST | `/warehouses` | ADMIN, WAREHOUSE |
| GET/PUT/DELETE | `/warehouses/[id]` | ADMIN, WAREHOUSE |
| GET/POST | `/suppliers` | ADMIN, WAREHOUSE |
| GET/PUT | `/suppliers/[id]` | ADMIN, WAREHOUSE |
| GET/PATCH | `/backorders` | ADMIN, CS, WAREHOUSE |
| GET/POST | `/purchase-orders` | ADMIN+ |

## Marketing & Promotions

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET/POST | `/coupons` | ADMIN+ |
| GET/PUT/DELETE | `/coupons/[id]` | ADMIN+ |
| GET/POST | `/banners` | ADMIN+ |
| PATCH/DELETE | `/banners/[id]` | ADMIN+ |
| GET/POST | `/email-templates` | ADMIN+ |
| GET/POST | `/flash-sales` | ADMIN+ |
| GET/POST | `/discount-settings` | ADMIN+ |
| GET/DELETE | `/newsletter` | ADMIN, MARKETING |
| GET | `/newsletter/export` | ADMIN, MARKETING |

## Financial

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET | `/invoices` | ADMIN, ACCOUNTANT |
| GET | `/invoices/[id]/pdf` | ADMIN, ACCOUNTANT |
| GET | `/commissions` | ADMIN, ACCOUNTANT |

## Notifications & Logs

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET/POST/PUT/DELETE | `/notifications` | All authenticated |
| GET | `/activity-logs` | ADMIN+ |
| POST | `/send-customer-email` | ADMIN, CS |

## Settings

| Method | Endpoint | Roles |
|--------|----------|-------|
| GET/POST | `/settings` | ADMIN+ |
| GET/POST | `/tax-settings` | ADMIN+ |
| GET/POST | `/email-service` | SUPER_ADMIN |
| GET/POST | `/algolia-settings` | SUPER_ADMIN |
| GET/POST | `/sentry-settings` | SUPER_ADMIN |
| GET/POST | `/redis-settings` | SUPER_ADMIN |
| GET/POST | `/payment-gateways` | ADMIN+ |

## Import Routes

| Endpoint | Brand |
|----------|-------|
| `/threem-import` | 3M products |
| `/carhartt-import` | Carhartt products |
| `/occunomix-import` | OccuNomix products |
| `/pip-import` | PIP products |
| `/wolverine-import` | Wolverine/Bates/Keen products |
| `/bulk-import` | Generic Excel import |

---

*Next: [08 - API Public Endpoints](./08-api-public.md)*
