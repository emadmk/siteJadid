import { db } from '@/lib/db';
import { ProductsListing } from '@/components/storefront/products/ProductsListing';

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

  const where: any = {
    status: 'ACTIVE',
    stockQuantity: { gt: 0 },
  };

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { description: { contains: searchParams.search, mode: 'insensitive' } },
      { sku: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

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
      orderBy = { createdAt: 'desc' };
  }

  const [products, total, categories, brands] = await Promise.all([
    db.product.findMany({
      where,
      select: {
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
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        _count: {
          select: {
            reviews: {
              where: { status: 'APPROVED' },
            },
            variants: true,
          },
        },
      },
      orderBy,
      take: limit,
    }),
    db.product.count({ where }),
    db.category.findMany({
      where: {
        isActive: true,
        parentId: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                status: 'ACTIVE',
                stockQuantity: { gt: 0 },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
    db.brand.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                status: 'ACTIVE',
                stockQuantity: { gt: 0 },
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  // Get average ratings
  const productIds = products.map((p) => p.id);
  const reviewAggregates = await db.review.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
      status: 'APPROVED',
    },
    _avg: {
      rating: true,
    },
  });

  const ratingMap = new Map(
    reviewAggregates.map((r) => [r.productId, r._avg.rating || 0])
  );

  const formattedProducts = products.map((product) => ({
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
    category: product.category || undefined,
    brand: product.brand || undefined,
    averageRating: ratingMap.get(product.id) || 0,
    reviewCount: product._count.reviews,
    hasVariants: product._count.variants > 0,
    _count: {
      variants: product._count.variants,
    },
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
  title: 'All Products | AdaSupply',
  description: 'Browse our complete catalog of professional safety equipment and industrial supplies.',
};
