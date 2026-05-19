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

function slugify(s: string) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function sanitize(body: any) {
  const data: any = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.slug !== undefined) data.slug = slugify(body.slug);
  if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body.image !== undefined) data.image = body.image ? String(body.image).trim() : null;
  if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle ? String(body.metaTitle).trim() : null;
  if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription ? String(body.metaDescription).trim() : null;
  if (body.isActive !== undefined) data.isActive = !!body.isActive;
  if (body.displayOrder !== undefined) data.displayOrder = parseInt(String(body.displayOrder), 10) || 0;
  if (Array.isArray(body.filterCategoryIds)) data.filterCategoryIds = body.filterCategoryIds.filter((x: any) => typeof x === 'string');
  if (Array.isArray(body.filterBrandIds)) data.filterBrandIds = body.filterBrandIds.filter((x: any) => typeof x === 'string');
  if (Array.isArray(body.filterSupplierIds)) data.filterSupplierIds = body.filterSupplierIds.filter((x: any) => typeof x === 'string');
  if (body.filterMinPrice !== undefined) {
    data.filterMinPrice = body.filterMinPrice == null || body.filterMinPrice === '' ? null : parseFloat(String(body.filterMinPrice)) || null;
  }
  if (body.filterMaxPrice !== undefined) {
    data.filterMaxPrice = body.filterMaxPrice == null || body.filterMaxPrice === '' ? null : parseFloat(String(body.filterMaxPrice)) || null;
  }
  if (body.filterTaaOnly !== undefined) data.filterTaaOnly = !!body.filterTaaOnly;
  if (body.filterKeywords !== undefined) data.filterKeywords = body.filterKeywords ? String(body.filterKeywords).trim() : null;
  return data;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const collection = await db.collection.findUnique({
    where: { id: params.id },
    include: {
      products: {
        include: {
          product: {
            select: { id: true, sku: true, name: true, slug: true, basePrice: true, images: true, status: true },
          },
        },
      },
    },
  });
  if (!collection) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ collection });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const data = sanitize(body);
    const updated = await db.collection.update({ where: { id: params.id }, data });
    return NextResponse.json({ collection: updated });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A collection with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await db.collection.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
