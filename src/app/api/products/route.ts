export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { productSearch } from '@/lib/elasticsearch';

// GET /api/products - List products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sku = searchParams.get('sku') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const brandId = searchParams.get('brandId') || '';
    const brandSlug = searchParams.get('brandSlug') || '';
    const featured = searchParams.get('featured') === 'true';
    const bestSeller = searchParams.get('bestSeller') === 'true';
    const newArrival = searchParams.get('newArrival') === 'true';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const sort = searchParams.get('sort') || 'createdAt_desc';

    // If brandSlug provided, get brandId first
    let resolvedBrandId = brandId;
    if (brandSlug && !brandId) {
      const brand = await db.brand.findUnique({
        where: { slug: brandSlug },
        select: { id: true },
      });
      if (brand) {
        resolvedBrandId = brand.id;
      }
    }

    // SKU search - direct database lookup
    if (sku) {
      const products = await db.product.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { sku: { equals: sku, mode: 'insensitive' } },
            { sku: { contains: sku, mode: 'insensitive' } },
          ],
        },
        include: {
          category: true,
          brand: true,
          _count: {
            select: { reviews: true, variants: true },
          },
        },
        take: limit,
      });

      // Add hasVariants flag to each product
      const productsWithVariantFlag = products.map(p => ({
        ...p,
        hasVariants: p._count.variants > 0,
      }));

      return NextResponse.json({
        products: productsWithVariantFlag,
        total: products.length,
        page: 1,
        limit,
        totalPages: 1,
      });
    }

    // Build cache key
    const cacheKey = `products:${page}:${limit}:${search}:${categoryId}:${resolvedBrandId}:${featured}:${bestSeller}:${newArrival}:${minPrice}:${maxPrice}:${sort}`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // If search query, use Elasticsearch
    if (search) {
      const result = await productSearch.search(
        search,
        {
          categoryId,
          minPrice,
          maxPrice,
          isFeatured: featured || undefined,
        },
        page,
        limit
      );

      await cache.set(cacheKey, result, 300); // 5 minutes
      return NextResponse.json(result);
    }

    // Build Prisma query
    const where: any = {
      status: 'ACTIVE',
      ...(categoryId && { categoryId }),
      ...(resolvedBrandId && { brandId: resolvedBrandId }),
      ...(featured && { isFeatured: true }),
      ...(bestSeller && { isBestSeller: true }),
      ...(newArrival && { isNewArrival: true }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            basePrice: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          }
        : {}),
    };

    const [sortField, sortOrder] = sort.split('_');
    const orderBy: any = {
      [sortField]: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          _count: {
            select: { reviews: true, variants: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    // Add hasVariants flag to each product
    const productsWithVariantFlag = products.map(p => ({
      ...p,
      hasVariants: p._count.variants > 0,
    }));

    const result = {
      products: productsWithVariantFlag,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cache.set(cacheKey, result, 300);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products - Create product (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const product = await db.product.create({
      data: {
        ...body,
        publishedAt: body.status === 'ACTIVE' ? new Date() : null,
      },
      include: {
        category: true,
      },
    });

    // Index in Elasticsearch
    await productSearch.index(product);

    // Invalidate cache
    await cache.delPattern('products:*');

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
