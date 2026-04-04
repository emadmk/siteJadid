# 12. Search System (Elasticsearch)

## Architecture

```
User types query → 300ms debounce → min 2 chars →
  SearchContext → /api/search → Try ES → Fallback to PostgreSQL
```

## Elasticsearch Setup

- **Version**: 8.11 (Docker)
- **Port**: 9200 (localhost only)
- **Auth**: elastic / password from .env
- **Index**: `products` (5,325 documents)
- **Client**: `src/lib/elasticsearch.ts`

## Index Mapping

```
products index:
  name:              text (+ keyword + completion + ngram)
  sku:               text + keyword
  vendorPartNumber:  text + keyword
  description:       text
  shortDescription:  text
  brandName:         text + keyword
  categoryName:      text + keyword
  basePrice:         double
  stockQuantity:     integer
  status:            keyword (filtered to ACTIVE)
  images:            keyword[]
  isFeatured:        boolean
  taaApproved:       boolean
```

## Search Query

```typescript
multi_match {
  query: "tape",
  fields: ['name^3', 'description', 'shortDescription', 'sku^2'],
  fuzziness: 'AUTO'  // Handles typos: "tpe" → "tape"
}
filter: [
  { term: { status: 'ACTIVE' } },
  { range: { stockQuantity: { gt: 0 } } }
]
sort: [{ _score: 'desc' }]
```

## Three Search Paths (Unified)

| Path | Trigger | API | Engine |
|------|---------|-----|--------|
| Search Modal (Cmd+K) | Header search bar | `/api/search` | ES → DB |
| Products Page (server) | URL `?search=tape` | Direct ES call | ES → DB |
| Products API (client) | Filter sidebar | `/api/storefront/products` | ES → DB |

All three try Elasticsearch first, fall back to PostgreSQL.

## Smart Filters (Category Pages)

Category-specific filters extracted from product names/descriptions:

```typescript
SMART_FILTER_PATTERNS = {
  gender:     { "men's" → "Male", "women's" → "Female" },
  toeType:    { "steel toe" → "Steel Toe", "soft toe" → "Soft Toe" },
  material:   { "leather" → "Leather", "nylon" → "Nylon" },
  size:       { "small" → "Small", "large" → "Large" },
  color:      { "black" → "Black", "yellow" → "Yellow" },
  protection: { "ansi" → "ANSI", "osha" → "OSHA" },
  // ... etc
}
```

### Category Filter Config

```typescript
// Keyword-based: slug contains keyword → use config
KEYWORD_FILTER_CONFIG = [
  { keywords: ['abrasiv'],  config: { include: ['material'] } },
  { keywords: ['nozzle', 'adhesive'], config: { include: [] } },
  { keywords: ['tape', 'masking'],    config: { include: ['color'] } },
]

// Exact slug match
CATEGORY_FILTER_CONFIG = {
  'footwear': { include: ['gender', 'toeType', 'material', 'footwearSize', ...] },
  'gloves':   { include: ['material', 'size', 'color', 'protection'] },
  'ear-protection': { include: ['nrr', 'color'] },
  // ... etc
}
```

## Indexing

### Initial Index
```bash
ELASTICSEARCH_NODE=http://127.0.0.1:9200 node scripts/es-index-products.js
```

### Auto-indexing on Product Changes
Product create/update/delete in API routes calls:
- `productSearch.index(product)` on create/update
- `productSearch.delete(productId)` on delete

## Autocomplete (Suggest)

```typescript
productSearch.suggest(query, limit) // Uses completion field
// Returns: ["Aluminum Foil Tape", "Masking Tape", ...]
```

---

*Next: [13 - Email & Notifications](./13-notifications.md)*
