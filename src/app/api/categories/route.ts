import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tree = searchParams.get('tree') === 'true';

    if (tree) {
      // Get full category tree for mega menu
      const categories = await db.category.findMany({
        where: {
          isActive: true,
          parentId: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          displayOrder: true,
          children: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              displayOrder: true,
              children: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  displayOrder: true,
                },
                orderBy: { displayOrder: 'asc' },
              },
              _count: {
                select: {
                  products: {
                    where: { status: 'ACTIVE', stockQuantity: { gt: 0 } },
                  },
                },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
          _count: {
            select: {
              products: {
                where: { status: 'ACTIVE', stockQuantity: { gt: 0 } },
              },
            },
          },
        },
        orderBy: { displayOrder: 'asc' },
      });

      return NextResponse.json({ categories });
    }

    // Simple list of categories
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE', stockQuantity: { gt: 0 } },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
