import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/orders/[orderNumber] - Get single order details
export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderNumber } = params;

    const order = await db.order.findFirst({
      where: {
        orderNumber,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: true,
                description: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        shipments: {
          include: {
            items: {
              include: {
                orderItem: {
                  include: {
                    product: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            requester: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        costCenter: true,
        createdByMember: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[orderNumber] - Update order (e.g., cancel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { orderNumber } = params;
    const body = await request.json();
    const { action } = body;

    const order = await db.order.findFirst({
      where: {
        orderNumber,
        userId: session.user.id,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Handle cancel action
    if (action === 'cancel') {
      if (order.status !== 'PENDING' && order.status !== 'PENDING_APPROVAL' && order.status !== 'PROCESSING') {
        return NextResponse.json(
          { error: 'Order cannot be cancelled' },
          { status: 400 }
        );
      }

      const updatedOrder = await db.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      });

      // Restore inventory
      for (const item of updatedOrder.items) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
          },
        });
      }

      // Cancel any pending approvals
      await db.orderApproval.updateMany({
        where: {
          orderId: order.id,
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
        },
      });

      return NextResponse.json(updatedOrder);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
