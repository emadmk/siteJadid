import { NextRequest, NextResponse } from 'next/server';
import { productSearch } from '@/lib/elasticsearch';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim()) {
      return NextResponse.json({ results: [], total: 0 });
    }

    // Try Elasticsearch first
    try {
      const esResults = await productSearch.search(query, {}, 1, limit);

      if (esResults.hits && esResults.hits.length > 0) {
        return NextResponse.json({
          results: esResults.hits,
          total: esResults.total,
          source: 'elasticsearch',
        });
      }
    } catch (esError) {
      console.warn('Elasticsearch search failed, falling back to database:', esError);
    }

    // Fallback to PostgreSQL full-text search
    const searchQuery = query.trim().toLowerCase();
    const products = await db.product.findMany({
      where: {
        AND: [
          { status: 'ACTIVE' },
          {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { sku: { contains: searchQuery, mode: 'insensitive' } },
              { description: { contains: searchQuery, mode: 'insensitive' } },
              { shortDescription: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
        ],
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { isFeatured: 'desc' },
        { isBestSeller: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Transform to match Elasticsearch format
    const results = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      basePrice: Number(product.basePrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      images: product.images as string[],
      category: product.category ? {
        name: product.category.name,
      } : undefined,
    }));

    return NextResponse.json({
      results,
      total: results.length,
      source: 'database',
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', results: [], total: 0 },
      { status: 500 }
    );
  }
}
