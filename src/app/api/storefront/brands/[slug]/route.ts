export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import {
  SMART_FILTER_PATTERNS,
  buildSmartFilterWhere,
  computeCascadingSmartFilters,
} from '@/lib/smart-filters';

// Smart filter keywords - these are extracted from product names/descriptions
// Keywords map to their normalized display value

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const cacheKey = `brand:${params.slug}:${queryString}`;

    // Try cache first (5 min TTL)
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'newest';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    const smartFilters = searchParams.get('filters');
    const categorySlug = searchParams.get('category');
    const taaApproved = searchParams.get('taaApproved') === 'true';

    // Find the brand
    const brand = await db.brand.findUnique({
      where: {
        slug: params.slug,
        isActive: true,
      },
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Get categories that have products from this brand
    const categories = await db.category.findMany({
      where: {
        isActive: true,
        products: {
          some: {
            brandId: brand.id,
            status: 'ACTIVE',
            stockQuantity: { gt: 0 },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                brandId: brand.id,
                status: 'ACTIVE',
                stockQuantity: { gt: 0 },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Build product filter
    const where: any = {
      status: 'ACTIVE',
      stockQuantity: { gt: 0 },
      brandId: brand.id,
    };

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { vendorPartNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categorySlug) {
      const category = await db.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    // TAA/BAA compliant filter
    if (taaApproved) {
      where.taaApproved = true;
    }

    let parsedSmartFilters: Record<string, string[]> = {};
    if (smartFilters) {
      try {
        parsedSmartFilters = JSON.parse(smartFilters) as Record<string, string[]>;
        const filterConditions = buildSmartFilterWhere(parsedSmartFilters);
        if (filterConditions.length > 0) {
          where.AND = filterConditions;
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
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
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        select: {
          id: true,
          sku: true,
          vendorPartNumber: true,
          name: true,
          slug: true,
          description: true,
          basePrice: true,
          salePrice: true,
          images: true,
          isFeatured: true,
          stockQuantity: true,
          minimumOrderQty: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
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
      sku: product.vendorPartNumber || product.sku, // Display vendorPartNumber as SKU
      manufacturerPartNumber: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: Number(product.basePrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      images: product.images as string[],
      isFeatured: product.isFeatured,
      stockQuantity: product.stockQuantity,
      minimumOrderQty: product.minimumOrderQty,
      category: product.category,
      averageRating: ratingMap.get(product.id) || 0,
      reviewCount: product._count.reviews,
    }));

    // Get all products for cascading smart filter computation (no smart filters in base query)
    const allProductsForFilters = await db.product.findMany({
      where: {
        status: 'ACTIVE',
        stockQuantity: { gt: 0 },
        brandId: brand.id,
      },
      select: { name: true, description: true },
    });

    // Compute cascading smart filters: each facet reflects active filters in OTHER groups
    const availableSmartFilters = computeCascadingSmartFilters(
      allProductsForFilters,
      parsedSmartFilters,
      null,
    );

    const smartFilterLabels: Record<string, string> = {};
    for (const key of Object.keys(availableSmartFilters)) {
      if (SMART_FILTER_PATTERNS[key]) {
        smartFilterLabels[key] = SMART_FILTER_PATTERNS[key].label;
      }
    }

    const responseData = {
      brand,
      products: formattedProducts,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      categories,
      smartFilters: availableSmartFilters,
      smartFilterLabels,
    };

    // Cache for 5 minutes
    cache.set(cacheKey, responseData, 300).catch(() => {});

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Brand fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand' },
      { status: 500 }
    );
  }
}
