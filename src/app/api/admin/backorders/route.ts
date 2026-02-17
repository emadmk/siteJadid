export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = status ? { status } : {};

    const backorders = await prisma.backOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    return NextResponse.json(backorders);
  } catch (error) {
    console.error('Error fetching backorders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch backorders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      userId,
      productId,
      orderId,
      quantity,
      pricePerUnit,
      expectedDate,
      notes,
    } = body;

    if (!userId || !productId || !quantity || !pricePerUnit) {
      return NextResponse.json(
        { error: 'User, product, quantity, and price per unit are required' },
        { status: 400 }
      );
    }

    const backorder = await prisma.backOrder.create({
      data: {
        userId,
        productId,
        orderId,
        quantity,
        pricePerUnit,
        status: 'PENDING',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json(backorder, { status: 201 });
  } catch (error) {
    console.error('Error creating backorder:', error);
    return NextResponse.json(
      { error: 'Failed to create backorder' },
      { status: 500 }
    );
  }
}
