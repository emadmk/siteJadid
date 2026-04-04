# 5. Admin Panel - Pages & Features

## Layout Structure

```
AdminLayout (src/components/admin/AdminLayout.tsx)
├── AdminSidebar (collapsible, permission-filtered)
├── AdminHeader (search, notifications, user menu)
└── {children} (page content)
```

## Dashboard (`/admin`)
- Revenue chart (30 days), order stats, pending orders
- Server component with real-time data

## Products (`/admin/products`)

| Page | Path | Features |
|------|------|----------|
| All Products | `/admin/products` | List, search, filter by status/category/brand |
| Add Product | `/admin/products/new` | Full product form with variants |
| Edit Product | `/admin/products/[id]/edit` | Edit all fields, images, variants |
| PreRelease | `/admin/products/prerelease` | Review imports, bulk release, category assign |
| PreRelease Edit | `/admin/products/prerelease/[id]/edit` | Edit & release single product |
| Bulk Import | `/admin/products/import` | Excel upload, field mapping |
| Bulk Edit | `/admin/products/bulk-edit` | Mass update prices, categories |
| Delete Products | `/admin/products/delete` | Bulk delete with confirmation |
| Product Review | `/admin/products/review` | Review product data quality |
| Categories | `/admin/categories` | Tree structure, create/edit |
| Brands | `/admin/products/brands` | Brand management with logos |
| Attributes | `/admin/attributes` | Custom product attributes |
| Bundles | `/admin/bundles` | Product bundle deals |
| Inventory | `/admin/inventory` | Stock levels, adjustments |

## Orders (`/admin/orders`)

| Page | Path | Features |
|------|------|----------|
| All Orders | `/admin/orders` | List with filters, stats |
| Order Detail | `/admin/orders/[id]` | Full order view, status update, print, email, notes |
| Backorders | `/admin/backorders-list` | Backorder tracking |
| RMAs | `/admin/rmas` | Return management |

### Order Detail Features
- **Status Updater**: Change order status with notes
- **Print Buttons**: Invoice, Packing Slip, Shipping Label
- **Admin Notes**: Editable notes (auto-save)
- **Email Composer**: Send branded email to customer with 20 templates
- **Delete**: SUPER_ADMIN only

## Customers (`/admin/customers`)

| Page | Path |
|------|------|
| All Customers | `/admin/customers` |
| Customer Detail | `/admin/customers/[id]` |
| Personal Buyers | `/admin/customers/personal` |
| Volume Buyers | `/admin/customers/volume-buyer` |
| Government | `/admin/customers/government` |
| Groups | `/admin/customers/groups` |
| Approvals | `/admin/customers/approvals` |
| GSA Approvals | `/admin/gsa-approvals` |

## Accounting (`/admin/accounting`)
- Revenue dashboard, Payments, Invoices (with PDF)

## Analytics (`/admin/analytics`)
- Overview, Sales analytics, Product analytics

## Marketing (`/admin/marketing`)
- Discounts, Coupons, Banners, Email Templates, Newsletter

## Settings (`/admin/settings`)
- Store info, Email, Payment (Stripe/PayPal), Shipping (Shippo), Tax (per customer type), Security
- Activity Logs (`/admin/activity-logs`)

## Key Admin Components

| Component | File | Purpose |
|-----------|------|---------|
| `AdminSidebar` | `AdminSidebar.tsx` | Permission-filtered navigation |
| `AdminHeader` | `AdminHeader.tsx` | Notifications (30s poll), search, user menu |
| `OrderStatusUpdater` | `OrderStatusUpdater.tsx` | Status change with email notification |
| `OrderPrintButtons` | `OrderPrintButtons.tsx` | 3 print types (Invoice, Packing, Label) |
| `AdminNotesEditor` | `AdminNotesEditor.tsx` | Auto-save notes on orders |
| `EmailComposer` | `EmailComposer.tsx` | Customer email with 20 templates |
| `ProductVariantsManager` | `ProductVariantsManager.tsx` | Variant CRUD |
| `ColorImageMapper` | `ColorImageMapper.tsx` | Map images to color variants |
| `CommandPalette` | `ui/CommandPalette.tsx` | Cmd+K quick navigation |

---

*Next: [06 - Storefront](./06-storefront.md)*
