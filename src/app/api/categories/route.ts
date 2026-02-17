export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to get all descendant category IDs
async function getAllDescendantIds(categoryId: string): Promise<string[]> {
  const children = await db.category.findMany({
    where: { parentId: categoryId, isActive: true },
    select: { id: true },
  });

  const childIds = children.map(c => c.id);
  const grandchildIds: string[] = [];

  for (const childId of childIds) {
    const descendants = await getAllDescendantIds(childId);
    grandchildIds.push(...descendants);
  }

  return [...childIds, ...grandchildIds];
}

// Helper function to count products including descendants
async function getTotalProductCount(categoryId: string): Promise<number> {
  const descendantIds = await getAllDescendantIds(categoryId);
  const allCategoryIds = [categoryId, ...descendantIds];

  return db.product.count({
    where: {
      status: 'ACTIVE',
      stockQuantity: { gt: 0 },
      categoryId: { in: allCategoryIds },
    },
  });
}

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

    // Check for homepage filter
    const homepage = searchParams.get('homepage') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const includeTotal = searchParams.get('includeTotal') === 'true';

    // Build where clause
    const where: any = { isActive: true };
    if (homepage) {
      where.showOnHomepage = true;
    }

    // Simple list of categories
    const categories = await db.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        parentId: true,
        showOnHomepage: true,
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE', stockQuantity: { gt: 0 } },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
      ...(limit ? { take: limit } : {}),
    });

    // If homepage, calculate total products including subcategories
    if (homepage || includeTotal) {
      const categoriesWithTotals = await Promise.all(
        categories.map(async (cat) => {
          const totalProducts = await getTotalProductCount(cat.id);
          return {
            ...cat,
            _count: {
              products: totalProducts,
            },
          };
        })
      );
      return NextResponse.json({ categories: categoriesWithTotals });
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
