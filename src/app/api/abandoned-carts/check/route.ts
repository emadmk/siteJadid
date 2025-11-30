import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/abandoned-carts/check
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ abandoned: false });
    }

    // Calculate cart age
    const cartAge = Date.now() - cart.updatedAt.getTime();
    const thirtyMinutes = 30 * 60 * 1000;

    if (cartAge < thirtyMinutes) {
      return NextResponse.json({ abandoned: false });
    }

    // Check if already tracked
    const existing = await prisma.abandonedCart.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['ABANDONED', 'FIRST_EMAIL_SENT', 'SECOND_EMAIL_SENT'] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (existing) {
      return NextResponse.json({ abandoned: true, tracked: true });
    }

    // Calculate subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    // Create abandoned cart record
    await prisma.abandonedCart.create({
      data: {
        userId: session.user.id,
        cartData: JSON.stringify(cart.items),
        subtotal,
        status: 'ABANDONED',
        abandonedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return NextResponse.json({ abandoned: true, tracked: true });
  } catch (error: any) {
    console.error('Error checking abandoned cart:', error);
    return NextResponse.json(
      { error: 'Failed to check abandoned cart', details: error.message },
      { status: 500 }
    );
  }
}
