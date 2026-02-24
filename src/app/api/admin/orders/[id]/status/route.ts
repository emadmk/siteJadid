export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { sendOrderStatusUpdate } from '@/lib/email-notifications';

const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
    'ON_HOLD',
  ]),
  notes: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (!['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate request body
    const body = await req.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { status, notes } = validation.data;

    // Check if order exists
    const order = await db.order.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if status is different
    if (order.status === status) {
      return NextResponse.json(
        { error: 'Order already has this status' },
        { status: 400 }
      );
    }

    // Update order status and create status history in a transaction
    const updatedOrder = await db.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: params.id },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              accountType: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  sku: true,
                },
              },
            },
          },
        },
      });

      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: params.id,
          status,
          notes: notes || `Status changed from ${order.status} to ${status}`,
          changedBy: session.user.id,
        },
      });

      return updated;
    });

    // Send status update email to customer (non-blocking)
    if (updatedOrder.user?.email) {
      // Get tracking info if shipped
      let trackingNumber: string | undefined;
      let carrier: string | undefined;
      if (status === 'SHIPPED') {
        const shipment = await db.shipment.findFirst({
          where: { orderId: params.id },
          orderBy: { createdAt: 'desc' },
          select: { trackingNumber: true, carrier: true },
        });
        trackingNumber = shipment?.trackingNumber || undefined;
        carrier = shipment?.carrier || undefined;
      }

      sendOrderStatusUpdate({
        email: updatedOrder.user.email,
        userName: updatedOrder.user.name || 'Customer',
        orderNumber: order.orderNumber,
        status,
        trackingNumber,
        carrier,
        notes,
        userId: updatedOrder.user.id,
        orderId: params.id,
      }).catch(err => console.error('Failed to send order status email:', err));
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order status updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
