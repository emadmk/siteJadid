export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  if (!s?.user || !['ADMIN', 'SUPER_ADMIN'].includes(s.user.role)) return null;
  return s.user;
}

// Add or update a CollectionProduct entry (pin / exclude / feature / sort).
// Idempotent — upserts so the admin can flip flags without duplicate rows.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const productId = String(body.productId || '');
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

    const data = {
      isPinned: body.isPinned !== undefined ? !!body.isPinned : false,
      isExcluded: body.isExcluded !== undefined ? !!body.isExcluded : false,
      isFeatured: body.isFeatured !== undefined ? !!body.isFeatured : false,
      sortOrder: parseInt(String(body.sortOrder ?? 0), 10) || 0,
    };

    const upserted = await db.collectionProduct.upsert({
      where: { collectionId_productId: { collectionId: params.id, productId } },
      create: { collectionId: params.id, productId, ...data },
      update: data,
    });

    return NextResponse.json({ item: upserted });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Remove a CollectionProduct entry — back to "purely filter-driven" for that
// product within this collection.
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || '';
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });
    await db.collectionProduct.deleteMany({
      where: { collectionId: params.id, productId },
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
