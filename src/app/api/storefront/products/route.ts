import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'newest';
    const featured = searchParams.get('featured');
    const taaApproved = searchParams.get('taaApproved') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      stockQuantity: { gt: 0 },
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      // Get category and its children
      const categoryData = await db.category.findUnique({
        where: { slug: category },
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

    if (brand) {
      const brandData = await db.brand.findUnique({
        where: { slug: brand },
        select: { id: true },
      });
      if (brandData) {
        where.brandId = brandData.id;
      }
    }

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    // TAA/BAA Approved filter (products with GSA price)
    if (taaApproved) {
      where.gsaPrice = { not: null };
    }

    // Build order by
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
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

    // Fetch products
    const [products, total] = await Promise.all([
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
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    // Get average ratings for products
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

    // Format products
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
      category: product.category,
      brand: product.brand,
      averageRating: ratingMap.get(product.id) || 0,
      reviewCount: product._count.reviews,
      hasVariants: product._count.variants > 0,
      _count: {
        variants: product._count.variants,
      },
    }));

    return NextResponse.json({
      products: formattedProducts,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error: any) {
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
