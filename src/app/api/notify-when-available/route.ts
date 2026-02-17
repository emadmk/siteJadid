export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { productId, email, name, requestedStock } = body;

    // Validate required fields
    if (!productId || !email) {
      return NextResponse.json(
        { error: 'Product ID and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is actually out of stock
    if (product.stockQuantity > 0) {
      return NextResponse.json(
        { error: 'Product is currently in stock' },
        { status: 400 }
      );
    }

    // Check if notification already exists
    const existingNotification = await prisma.stockNotification.findFirst({
      where: {
        productId,
        email,
        status: 'PENDING',
      },
    });

    if (existingNotification) {
      return NextResponse.json(
        { error: 'You are already subscribed to notifications for this product' },
        { status: 400 }
      );
    }

    // Create stock notification
    const notification = await prisma.stockNotification.create({
      data: {
        productId,
        userId: session?.user?.id || null,
        email,
        name: name || session?.user?.name || null,
        requestedStock: requestedStock || 1,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      message: 'Successfully subscribed to stock notifications',
      notification: {
        id: notification.id,
        productId: notification.productId,
        email: notification.email,
      },
    });

  } catch (error) {
    console.error('Stock notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create stock notification' },
      { status: 500 }
    );
  }
}

// Get all notifications for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notifications = await prisma.stockNotification.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            basePrice: true,
            stockQuantity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
