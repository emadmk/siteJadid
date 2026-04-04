# 20. Glossary

## Business Terms

| Term | Definition |
|------|-----------|
| **B2B** | Business-to-Business. Wholesale customers with volume pricing. |
| **B2C** | Business-to-Consumer. Individual retail customers. |
| **GSA** | General Services Administration. US government procurement program. |
| **GSA Schedule** | Pre-negotiated government contract with fixed pricing. |
| **TAA** | Trade Agreements Act. Products compliant with government sourcing requirements. |
| **BAA** | Buy American Act. Requires products to be made in the USA. |
| **PO** | Purchase Order. A formal order document from a buyer to a seller. |
| **Net 30** | Payment terms allowing 30 days to pay after invoice. |
| **SmartPay** | US government purchase card program. |
| **MOQ** | Minimum Order Quantity. Smallest amount a customer can order. |
| **UOM** | Unit of Measure (ea=each, case, carton, roll, pack, etc.). |
| **SKU** | Stock Keeping Unit. Unique product identifier. |
| **RMA** | Return Merchandise Authorization. Process for product returns. |
| **NRR** | Noise Reduction Rating. Hearing protection effectiveness measure. |
| **ANSI** | American National Standards Institute. Safety standards body. |
| **OSHA** | Occupational Safety and Health Administration. |
| **PPE** | Personal Protective Equipment. |
| **ESD** | Electrostatic Discharge. Protection against static electricity. |

## Technical Terms

| Term | Definition |
|------|-----------|
| **SSR** | Server-Side Rendering. Page rendered on server before sending to browser. |
| **CSR** | Client-Side Rendering. Page rendered in browser via JavaScript. |
| **RSC** | React Server Components. Components that run only on the server. |
| **App Router** | Next.js 14 routing system using `src/app/` directory structure. |
| **Server Component** | Default in App Router. Runs on server, no client JS. |
| **Client Component** | Marked with `'use client'`. Runs in browser with interactivity. |
| **API Route** | Server-side endpoint in `src/app/api/`. Handles HTTP requests. |
| **Middleware** | Code that runs before route handlers (`src/middleware.ts`). |
| **ORM** | Object-Relational Mapping. Prisma maps DB tables to TypeScript objects. |
| **JWT** | JSON Web Token. Stateless authentication token stored in cookie. |
| **CSP** | Content Security Policy. Browser security header controlling resource loading. |
| **CSRF** | Cross-Site Request Forgery. Attack prevented by double-submit cookie. |
| **Debounce** | Delay execution until user stops typing (e.g., 300ms search delay). |
| **Fuzzy Search** | Matching with typo tolerance (e.g., "tpe" matches "tape"). |
| **Ngram** | Breaking text into small pieces for partial matching (e.g., "tap" in "tape"). |
| **Completion Suggest** | Elasticsearch autocomplete feature using prefix matching. |
| **Bulk Index** | Loading many documents into Elasticsearch at once. |
| **Upsert** | Create if not exists, update if exists (INSERT ... ON CONFLICT UPDATE). |

## Project-Specific Terms

| Term | Definition |
|------|-----------|
| **PreRelease** | Product status after import, not yet visible on storefront. Must be reviewed and released by admin. |
| **Smart Filters** | Auto-generated filters (Gender, Material, etc.) extracted from product names using keyword patterns. |
| **Keyword Filter Config** | Rules defining which smart filters to show per category (e.g., Abrasives → only Material). |
| **Impersonation** | SUPER_ADMIN viewing the storefront as a specific customer. |
| **Effective Session** | The session returned by `getEffectiveSession()` - either real user or impersonated user. |
| **Price Unit** | How a product is sold: ea (each), case, carton, roll, pack, etc. |
| **Original Category** | Category name from the import source (e.g., 3M's category), shown as orange badge in PreRelease. |
| **Assigned Category** | The site's own category assigned by admin, required for release. |
| **Bulk Release** | Admin action to change multiple products from PRERELEASE to ACTIVE with category assignment. |
| **Stock Source** | Where inventory comes from: OUR_WAREHOUSE, SUPPLIER_STOCK, or BACKORDER. |
| **Activity Log** | Audit trail of admin actions (create, update, delete, etc.). |
| **Phone Notice** | Temporary popup on homepage about office relocation and phone number. |
| **Grainger Dashboard** | Web panel (port 9876) for monitoring Grainger image downloads. |

## Role Abbreviations

| Abbreviation | Full Name |
|-------------|-----------|
| SA | SUPER_ADMIN |
| ADMIN | ADMIN |
| ACCT | ACCOUNTANT |
| CS | CUSTOMER_SERVICE |
| WH | WAREHOUSE_MANAGER |
| MKT | MARKETING_MANAGER |
| CM | CONTENT_MANAGER |

## Status Colors (UI Convention)

| Status | Color | CSS Class |
|--------|-------|-----------|
| PENDING | Yellow | `bg-yellow-100 text-yellow-800` |
| CONFIRMED / PROCESSING | Blue/Purple | `bg-blue-100` / `bg-purple-100` |
| ACTIVE / DELIVERED / APPROVED | Green | `bg-safety-green-100 text-safety-green-800` |
| CANCELLED / REJECTED / ERROR | Red | `bg-red-100 text-red-800` |
| ON_HOLD / WARNING | Orange | `bg-orange-100 text-orange-800` |
| PRERELEASE | Orange | `bg-orange-100 text-orange-800` |
| SHIPPED / IN_TRANSIT | Cyan | `bg-cyan-100 text-cyan-800` |

## File Naming Conventions

| Pattern | Meaning |
|---------|---------|
| `page.tsx` | Next.js page component (route) |
| `route.ts` | Next.js API route handler |
| `layout.tsx` | Layout wrapper for child pages |
| `error.tsx` | Error boundary component |
| `not-found.tsx` | 404 page |
| `loading.tsx` | Loading state component |
| `*.dto.ts` | Data Transfer Object (validation schema) |
| `*.test.ts` | Test file |

---

*End of documentation. See [ROADMAP.md](./ROADMAP.md) for the full index.*
