export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/orders/[orderNumber]/payment-failed
 * Mark order payment as failed (called when Stripe payment fails)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { error: errorMessage } = body;

    // Find and verify order belongs to user
    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        userId: session.user.id,
      },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        paymentStatus: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order payment status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED',
        adminNotes: errorMessage
          ? `Payment failed: ${errorMessage}`
          : 'Payment failed',
      },
    });

    // Log the status change
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        notes: `Payment failed: ${errorMessage || 'Unknown error'}. Please retry payment.`,
        changedBy: 'system',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking payment failed:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    );
  }
}
