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
  return {
    name: String(body.name || '').trim(),
    slug: body.slug ? slugify(body.slug) : slugify(body.name || ''),
    description: body.description ? String(body.description).trim() : null,
    image: body.image ? String(body.image).trim() : null,
    metaTitle: body.metaTitle ? String(body.metaTitle).trim() : null,
    metaDescription: body.metaDescription ? String(body.metaDescription).trim() : null,
    isActive: body.isActive !== false,
    displayOrder: parseInt(String(body.displayOrder ?? 0), 10) || 0,
    filterCategoryIds: Array.isArray(body.filterCategoryIds)
      ? body.filterCategoryIds.filter((x: any) => typeof x === 'string')
      : [],
    filterBrandIds: Array.isArray(body.filterBrandIds)
      ? body.filterBrandIds.filter((x: any) => typeof x === 'string')
      : [],
    filterSupplierIds: Array.isArray(body.filterSupplierIds)
      ? body.filterSupplierIds.filter((x: any) => typeof x === 'string')
      : [],
    filterMinPrice:
      body.filterMinPrice == null || body.filterMinPrice === ''
        ? null
        : parseFloat(String(body.filterMinPrice)) || null,
    filterMaxPrice:
      body.filterMaxPrice == null || body.filterMaxPrice === ''
        ? null
        : parseFloat(String(body.filterMaxPrice)) || null,
    filterTaaOnly: !!body.filterTaaOnly,
    filterKeywords: body.filterKeywords ? String(body.filterKeywords).trim() : null,
  };
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const collections = await db.collection.findMany({
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ collections });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const data = sanitize(body);
    const created = await db.collection.create({ data });
    return NextResponse.json({ collection: created });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A collection with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
