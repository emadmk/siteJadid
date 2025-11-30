import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'newest';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // Find the category
    const category = await db.category.findUnique({
      where: {
        slug: params.slug,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
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
            displayOrder: 'asc',
          },
        },
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
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get all child category IDs for product search
    const childCategoryIds = category.children.map((c) => c.id);
    const categoryIds = [category.id, ...childCategoryIds];

    // Build product filter
    const where: any = {
      status: 'ACTIVE',
      stockQuantity: { gt: 0 },
      categoryId: { in: categoryIds },
    };

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
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
      case 'rating':
        orderBy = { averageRating: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const skip = (page - 1) * limit;

    // Fetch products with reviews aggregation
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
          _count: {
            select: {
              reviews: {
                where: { status: 'APPROVED' },
              },
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

    // Format products with ratings
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
      averageRating: ratingMap.get(product.id) || 0,
      reviewCount: product._count.reviews,
    }));

    return NextResponse.json({
      category,
      products: formattedProducts,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error: any) {
    console.error('Category fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}
