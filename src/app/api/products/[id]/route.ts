export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { cache } from '@/lib/redis';
import { productSearch } from '@/lib/elasticsearch';

// GET /api/products/[id] - Get product by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Try cache
    const cacheKey = `product:${id}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Calculate average rating
    const reviews = await db.review.findMany({
      where: { productId: id, status: 'APPROVED' },
      select: { rating: true },
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
      : 0;

    const result = {
      ...product,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    };

    await cache.set(cacheKey, result, 600); // 10 minutes
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/products/[id] - Update product (Admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const product = await db.product.update({
      where: { id },
      data: {
        ...body,
        publishedAt: body.status === 'ACTIVE' && !body.publishedAt ? new Date() : body.publishedAt,
      },
      include: {
        category: true,
      },
    });

    // Update in Elasticsearch
    await productSearch.index(product);

    // Invalidate cache
    await cache.del(`product:${id}`);
    await cache.delPattern('products:*');

    return NextResponse.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete product (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await db.product.delete({
      where: { id },
    });

    // Remove from Elasticsearch
    await productSearch.delete(id);

    // Invalidate cache
    await cache.del(`product:${id}`);
    await cache.delPattern('products:*');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
