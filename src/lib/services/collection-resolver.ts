import { db } from '@/lib/db';

/**
 * Resolves a Collection's effective product set: combines the filter rules
 * (auto-include), manual pins, and manual exclusions, then applies paging
 * and sort. Featured products bubble to the top.
 *
 * Designed to stay correct as the catalog evolves: filter changes (new
 * matching products / removed ones) reflect immediately because we run the
 * Prisma query at request time. Manual pins and exclusions are sticky.
 */

export type CollectionSort =
  | 'featured'        // default — featured first, then sortOrder, then newest
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'name-asc'
  | 'name-desc'
  | 'best-selling';

export interface ResolveOptions {
  page?: number;
  limit?: number;
  sort?: CollectionSort;
}

export async function resolveCollectionProducts(slug: string, opts: ResolveOptions = {}) {
  const collection = await db.collection.findUnique({
    where: { slug },
    include: { products: true },
  });
  if (!collection || !collection.isActive) return null;

  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const sort: CollectionSort = opts.sort ?? 'featured';

  // Manual lists
  const pinnedIds = new Set(
    collection.products.filter((p) => p.isPinned).map((p) => p.productId),
  );
  const excludedIds = new Set(
    collection.products.filter((p) => p.isExcluded).map((p) => p.productId),
  );
  const featuredIds = new Set(
    collection.products.filter((p) => p.isFeatured).map((p) => p.productId),
  );
  const sortOrderByProduct = new Map(
    collection.products.map((p) => [p.productId, p.sortOrder]),
  );

  // Filter rule WHERE
  const filterAnd: any[] = [{ status: 'ACTIVE' }];
  if (collection.filterCategoryIds.length > 0) {
    filterAnd.push({ categoryId: { in: collection.filterCategoryIds } });
  }
  if (collection.filterBrandIds.length > 0) {
    filterAnd.push({ brandId: { in: collection.filterBrandIds } });
  }
  if (collection.filterSupplierIds.length > 0) {
    filterAnd.push({ defaultSupplierId: { in: collection.filterSupplierIds } });
  }
  if (collection.filterMinPrice != null) {
    filterAnd.push({ basePrice: { gte: collection.filterMinPrice } });
  }
  if (collection.filterMaxPrice != null) {
    filterAnd.push({ basePrice: { lte: collection.filterMaxPrice } });
  }
  if (collection.filterTaaOnly) {
    filterAnd.push({ taaApproved: true });
  }
  if (collection.filterKeywords && collection.filterKeywords.trim()) {
    const kws = collection.filterKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (kws.length > 0) {
      filterAnd.push({
        OR: kws.flatMap((kw) => [
          { name: { contains: kw, mode: 'insensitive' as const } },
          { description: { contains: kw, mode: 'insensitive' as const } },
        ]),
      });
    }
  }

  const hasAnyFilter =
    collection.filterCategoryIds.length > 0 ||
    collection.filterBrandIds.length > 0 ||
    collection.filterSupplierIds.length > 0 ||
    collection.filterMinPrice != null ||
    collection.filterMaxPrice != null ||
    collection.filterTaaOnly ||
    !!collection.filterKeywords?.trim();

  // Resolve the auto-included product IDs (skip the query entirely if no filter)
  let autoIds: string[] = [];
  if (hasAnyFilter) {
    const autoMatches = await db.product.findMany({
      where: { AND: filterAnd },
      select: { id: true },
      // Reasonable upper bound — collection pages shouldn't ever show >5k items
      take: 5000,
    });
    autoIds = autoMatches.map((p) => p.id);
  }

  // Compose the final ID set: auto ∪ pinned, minus excluded
  const idSet = new Set<string>([...autoIds, ...Array.from(pinnedIds)]);
  for (const id of excludedIds) idSet.delete(id);
  const finalIds = Array.from(idSet);
  const total = finalIds.length;

  if (finalIds.length === 0) {
    return { collection, products: [], total, page, limit, totalPages: 0 };
  }

  // Sort
  let orderBy: any = [{ createdAt: 'desc' as const }];
  switch (sort) {
    case 'price-asc':  orderBy = [{ basePrice: 'asc' }]; break;
    case 'price-desc': orderBy = [{ basePrice: 'desc' }]; break;
    case 'newest':     orderBy = [{ createdAt: 'desc' }]; break;
    case 'name-asc':   orderBy = [{ name: 'asc' }]; break;
    case 'name-desc':  orderBy = [{ name: 'desc' }]; break;
    case 'best-selling':
    case 'featured':
    default:
      // For featured we'll re-order in JS so we can interleave manual sortOrder
      orderBy = [{ createdAt: 'desc' }];
      break;
  }

  const products = await db.product.findMany({
    where: { id: { in: finalIds } },
    orderBy,
    select: {
      id: true,
      sku: true,
      vendorPartNumber: true,
      name: true,
      slug: true,
      description: true,
      shortDescription: true,
      basePrice: true,
      salePrice: true,
      gsaPrice: true,
      images: true,
      isFeatured: true,
      stockQuantity: true,
      minimumOrderQty: true,
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true, slug: true } },
    },
  });

  // Featured-first re-sort happens in memory for the default sort. For
  // explicit sorts (price/name/newest) we keep the DB order.
  let ordered = products;
  if (sort === 'featured') {
    ordered = [...products].sort((a, b) => {
      const af = featuredIds.has(a.id) ? 0 : 1;
      const bf = featuredIds.has(b.id) ? 0 : 1;
      if (af !== bf) return af - bf;
      const ao = sortOrderByProduct.get(a.id) ?? 999999;
      const bo = sortOrderByProduct.get(b.id) ?? 999999;
      if (ao !== bo) return ao - bo;
      return 0;
    });
  }

  // Paginate after sort
  const start = (page - 1) * limit;
  const pageItems = ordered.slice(start, start + limit);

  return {
    collection,
    products: pageItems.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      gsaPrice: p.gsaPrice ? Number(p.gsaPrice) : null,
      isFeatured: featuredIds.has(p.id) || p.isFeatured,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
