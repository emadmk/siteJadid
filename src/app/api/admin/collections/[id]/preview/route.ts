export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { resolveCollectionProducts } from '@/lib/services/collection-resolver';

// Returns the live storefront-ready product list the admin will see on this
// collection's public page. Used by the admin editor to confirm "did my filter
// + pins/excludes do what I expected?" without leaving the page.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const c = await db.collection.findUnique({ where: { id: params.id }, select: { slug: true } });
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const result = await resolveCollectionProducts(c.slug, {
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '24', 10),
    sort: (searchParams.get('sort') as any) || 'featured',
  });
  if (!result) return NextResponse.json({ products: [], total: 0 });
  return NextResponse.json({
    products: result.products,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}
