import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/shopping-lists - Get user's shopping lists
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lists = await db.shoppingList.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                slug: true,
                basePrice: true,
                salePrice: true,
                images: true,
                stockQuantity: true,
              },
            },
          },
          orderBy: {
            priority: 'desc',
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        isDefault: 'desc',
      },
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Get shopping lists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/shopping-lists - Create shopping list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, isDefault } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db.shoppingList.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const list = await db.shoppingList.create({
      data: {
        userId: session.user.id,
        name,
        description,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch (error) {
    console.error('Create shopping list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
