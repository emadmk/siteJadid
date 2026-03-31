export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { productSearch } from '@/lib/elasticsearch';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

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

    // Fallback to PostgreSQL search with relevance ranking
    // Strategy: fetch name matches first (most relevant), then other matches
    const searchQuery = query.trim().toLowerCase();

    // 1. Products where name or SKU contains the search term (highest relevance)
    const nameMatches = await db.product.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { sku: { contains: searchQuery, mode: 'insensitive' } },
        ],
      },
      include: {
        category: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true } },
      },
      take: limit,
      orderBy: [
        { isFeatured: 'desc' },
        { isBestSeller: 'desc' },
        { name: 'asc' },
      ],
    });

    // 2. If not enough results, search in other fields (lower relevance)
    let otherMatches: typeof nameMatches = [];
    if (nameMatches.length < limit) {
      const nameMatchIds = nameMatches.map(p => p.id);
      otherMatches = await db.product.findMany({
        where: {
          status: 'ACTIVE',
          id: { notIn: nameMatchIds },
          OR: [
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { shortDescription: { contains: searchQuery, mode: 'insensitive' } },
            { brand: { name: { contains: searchQuery, mode: 'insensitive' } } },
            { category: { name: { contains: searchQuery, mode: 'insensitive' } } },
            { metaKeywords: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
        },
        take: limit - nameMatches.length,
        orderBy: [
          { isFeatured: 'desc' },
          { name: 'asc' },
        ],
      });
    }

    const products = [...nameMatches, ...otherMatches];

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
        slug: product.category.slug,
      } : undefined,
      brand: product.brand ? {
        name: product.brand.name,
        slug: product.brand.slug,
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
