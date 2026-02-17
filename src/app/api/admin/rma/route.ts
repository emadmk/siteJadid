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

    const rmas = await prisma.rMA.findMany({
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
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(rmas);
  } catch (error) {
    console.error('Error fetching RMAs:', error);
    return NextResponse.json({ error: 'Failed to fetch RMAs' }, { status: 500 });
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
      orderId,
      items,
      reason,
      requestType,
      description,
      customerNotes,
    } = body;

    if (!userId || !orderId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'User, order, and items are required' },
        { status: 400 }
      );
    }

    const lastRMA = await prisma.rMA.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const nextNumber = lastRMA
      ? parseInt(lastRMA.rmaNumber.replace('RMA-', '')) + 1
      : 1;
    const rmaNumber = `RMA-${String(nextNumber).padStart(6, '0')}`;

    let refundAmount = 0;

    const rma = await prisma.rMA.create({
      data: {
        rmaNumber,
        userId,
        orderId,
        status: 'REQUESTED',
        reason: reason || 'OTHER',
        type: requestType || 'REFUND',
        description,
        customerNotes,
        images: [],
        items: {
          create: items.map((item: any) => {
            const itemTotal = item.quantity * item.unitPrice;
            refundAmount += itemTotal;

            return {
              orderItemId: item.orderItemId || item.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            };
          }),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
      },
    });

    await prisma.rMA.update({
      where: { id: rma.id },
      data: { refundAmount },
    });

    return NextResponse.json({ ...rma, refundAmount }, { status: 201 });
  } catch (error) {
    console.error('Error creating RMA:', error);
    return NextResponse.json({ error: 'Failed to create RMA' }, { status: 500 });
  }
}
