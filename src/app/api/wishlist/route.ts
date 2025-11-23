import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const wishlist = await db.wishlist.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            slug: true,
            description: true,
            basePrice: true,
            salePrice: true,
            wholesalePrice: true,
            gsaPrice: true,
            images: true,
            stockQuantity: true,
            rating: true,
            isActive: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add product to wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if already in wishlist
    const existing = await db.wishlist.findFirst({
      where: {
        userId: session.user.id,
        productId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    // Add to wishlist
    const wishlistItem = await db.wishlist.create({
      data: {
        userId: session.user.id,
        productId,
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
            wholesalePrice: true,
            gsaPrice: true,
            images: true,
            stockQuantity: true,
          },
        },
      },
    });

    return NextResponse.json(wishlistItem, { status: 201 });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist - Remove product from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Delete from wishlist
    await db.wishlist.deleteMany({
      where: {
        userId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
