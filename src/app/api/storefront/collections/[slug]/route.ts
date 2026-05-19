export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { resolveCollectionProducts } from '@/lib/services/collection-resolver';

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const { searchParams } = new URL(request.url);
  const result = await resolveCollectionProducts(params.slug, {
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '20', 10),
    sort: (searchParams.get('sort') as any) || 'featured',
  });
  if (!result) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  return NextResponse.json({
    collection: {
      id: result.collection.id,
      name: result.collection.name,
      slug: result.collection.slug,
      description: result.collection.description,
      image: result.collection.image,
      metaTitle: result.collection.metaTitle,
      metaDescription: result.collection.metaDescription,
    },
    products: result.products,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}
