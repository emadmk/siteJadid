export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/shopping-lists/[listId]/items - Add item to list
export async function POST(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, quantity, notes, priority } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Verify list ownership
    const list = await db.shoppingList.findUnique({
      where: { id: params.listId },
    });

    if (!list) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    if (list.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if already in list
    const existing = await db.shoppingListItem.findFirst({
      where: {
        listId: params.listId,
        productId,
      },
    });

    if (existing) {
      // Update quantity
      const updated = await db.shoppingListItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + (quantity || 1),
          ...(notes !== undefined && { notes }),
          ...(priority !== undefined && { priority }),
        },
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
      });

      return NextResponse.json(updated);
    }

    // Add new item
    const item = await db.shoppingListItem.create({
      data: {
        listId: params.listId,
        productId,
        quantity: quantity || 1,
        notes,
        priority: priority || 0,
      },
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
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Add shopping list item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/shopping-lists/[listId]/items?productId=xxx - Remove item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Verify list ownership
    const list = await db.shoppingList.findUnique({
      where: { id: params.listId },
    });

    if (!list) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    if (list.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.shoppingListItem.deleteMany({
      where: {
        listId: params.listId,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove shopping list item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
