export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import algoliasearch from 'algoliasearch';

// POST /api/search/algolia
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Get Algolia settings
    const settings = await prisma.algoliaSettings.findFirst({
      where: { isActive: true },
    });

    if (!settings) {
      // Fallback to basic search
      return fallbackSearch(data.query);
    }

    // Initialize Algolia
    const client = algoliasearch(settings.applicationId, settings.searchApiKey);
    const index = client.initIndex(settings.productIndexName);

    // Perform search
    const results = await index.search(data.query, {
      filters: data.filters,
      facets: data.facets || ['category', 'price', 'brand'],
      hitsPerPage: data.limit || 20,
      page: data.page || 0,
    });

    // Log search query
    await prisma.searchQuery.create({
      data: {
        query: data.query,
        userId: data.userId,
        sessionId: data.sessionId,
        resultsCount: results.nbHits,
        filters: JSON.stringify(data.filters),
        facets: JSON.stringify(results.facets),
        responseTime: results.processingTimeMS,
      },
    });

    return NextResponse.json({
      hits: results.hits,
      nbHits: results.nbHits,
      page: results.page,
      nbPages: results.nbPages,
      facets: results.facets,
    });
  } catch (error: any) {
    console.error('Error searching with Algolia:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    );
  }
}

async function fallbackSearch(query: string) {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ],
      status: 'ACTIVE',
    },
    take: 20,
  });

  return NextResponse.json({
    hits: products,
    nbHits: products.length,
    page: 0,
    nbPages: 1,
  });
}
