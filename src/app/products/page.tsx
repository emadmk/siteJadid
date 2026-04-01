import { db } from '@/lib/db';
import { ProductsListing } from '@/components/storefront/products/ProductsListing';

// Disable caching - always fetch fresh data
export const revalidate = 0;

interface ProductsPageProps {
  searchParams: {
    category?: string;
    brand?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
    featured?: string;
  };
}

async function getInitialData(searchParams: ProductsPageProps['searchParams']) {
  const page = 1;
  const limit = 20;
  const isSearchMode = !!searchParams.search;

  const where: any = {
    status: 'ACTIVE',
    stockQuantity: { gt: 0 },
  };

  if (searchParams.category) {
    const categoryData = await db.category.findUnique({
      where: { slug: searchParams.category },
      select: {
        id: true,
        children: { select: { id: true } },
      },
    });

    if (categoryData) {
      const categoryIds = [categoryData.id, ...categoryData.children.map(c => c.id)];
      where.categoryId = { in: categoryIds };
    }
  }

  if (searchParams.brand) {
    const brandData = await db.brand.findUnique({
      where: { slug: searchParams.brand },
      select: { id: true },
    });
    if (brandData) {
      where.brandId = brandData.id;
    }
  }

  if (searchParams.minPrice || searchParams.maxPrice) {
    where.basePrice = {};
    if (searchParams.minPrice) where.basePrice.gte = parseFloat(searchParams.minPrice);
    if (searchParams.maxPrice) where.basePrice.lte = parseFloat(searchParams.maxPrice);
  }

  if (searchParams.featured === 'true') {
    where.isFeatured = true;
  }

  let orderBy: any = { createdAt: 'desc' };
  switch (searchParams.sort) {
    case 'price-asc':
      orderBy = { basePrice: 'asc' };
      break;
    case 'price-desc':
      orderBy = { basePrice: 'desc' };
      break;
    case 'name-asc':
      orderBy = { name: 'asc' };
      break;
    case 'name-desc':
      orderBy = { name: 'desc' };
      break;
    case 'newest':
    default:
      orderBy = isSearchMode ? { name: 'asc' } : { createdAt: 'desc' };
  }

  const productSelect: any = {
    id: true,
    sku: true,
    name: true,
    slug: true,
    description: true,
    basePrice: true,
    salePrice: true,
    images: true,
    isFeatured: true,
    stockQuantity: true,
    minimumOrderQty: true,
    category: { select: { name: true, slug: true } },
    brand: { select: { id: true, name: true, slug: true, logo: true } },
    _count: { select: { reviews: { where: { status: 'APPROVED' } }, variants: true } },
  };

  // Two-tier search: name/SKU matches first, then description
  let products: any[];
  let total: number;

  if (isSearchMode) {
    const search = searchParams.search!;
    const nameWhere = { ...where, OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ]};
    const allSearchWhere = { ...where, OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]};

    total = await db.product.count({ where: allSearchWhere });

    const nameMatches = await db.product.findMany({
      where: nameWhere,
      select: productSelect,
      orderBy,
      take: limit,
    });

    if (nameMatches.length >= limit) {
      products = nameMatches;
    } else {
      const nameIds = nameMatches.map((p: any) => p.id);
      const descMatches = await db.product.findMany({
        where: {
          ...where,
          id: { notIn: nameIds },
          description: { contains: search, mode: 'insensitive' },
        },
        select: productSelect,
        orderBy,
        take: limit - nameMatches.length,
      });
      products = [...nameMatches, ...descMatches];
    }
  } else {
    [products, total] = await Promise.all([
      db.product.findMany({
        where,
        select: productSelect,
        orderBy,
        take: limit,
      }),
      db.product.count({ where }),
    ]);
  }

  const [categories, brands] = await Promise.all([
    db.category.findMany({
      where: { isActive: true, parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: { where: { status: 'ACTIVE', stockQuantity: { gt: 0 } } },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    db.brand.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: { where: { status: 'ACTIVE', stockQuantity: { gt: 0 } } },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Get average ratings
  const productIds = products.map((p: any) => p.id);
  const reviewAggregates = await db.review.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
      status: 'APPROVED',
    },
    _avg: { rating: true },
  });

  const ratingMap = new Map(
    reviewAggregates.map((r) => [r.productId, r._avg.rating || 0])
  );

  const formattedProducts = products.map((product: any) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: Number(product.basePrice),
    salePrice: product.salePrice ? Number(product.salePrice) : null,
    images: product.images as string[],
    isFeatured: product.isFeatured,
    stockQuantity: product.stockQuantity,
    minimumOrderQty: product.minimumOrderQty,
    category: product.category || undefined,
    brand: product.brand || undefined,
    averageRating: ratingMap.get(product.id) || 0,
    reviewCount: product._count.reviews,
    hasVariants: product._count.variants > 0,
    _count: { variants: product._count.variants },
  }));

  return {
    products: formattedProducts,
    total,
    pages: Math.ceil(total / limit),
    categories,
    brands,
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { products, total, pages, categories, brands } = await getInitialData(searchParams);

  return (
    <ProductsListing
      initialProducts={products}
      initialTotal={total}
      initialPages={pages}
      categories={categories}
      brands={brands}
      initialFilters={searchParams}
    />
  );
}

export const metadata = {
  title: 'All Products | ADA Supplies',
  description: 'Browse our complete catalog of professional safety equipment and industrial supplies.',
};
