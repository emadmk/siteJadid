import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/brands - List all active brands (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const brands = await db.brand.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
      take: limit,
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}
