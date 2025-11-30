import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
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
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
          shipments: {
            select: {
              id: true,
              trackingNumber: true,
              carrier: true,
              status: true,
              shippedAt: true,
              deliveredAt: true,
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
            },
          },
          costCenter: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
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
    const {
      shippingAddressId,
      billingAddressId,
      shippingMethod,
      paymentMethod,
      costCenterId,
      notes,
    } = body;

    // Get cart
    const cart = await db.cart.findFirst({
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
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Get user account type and B2B membership
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { accountType: true },
    });

    const b2bMembership = await db.b2BAccountMember.findFirst({
      where: { userId: session.user.id },
      include: {
        b2bProfile: {
          select: {
            members: {
              where: {
                isActive: true,
                role: { in: ['ACCOUNT_ADMIN', 'APPROVER'] }
              },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    // Calculate totals
    let subtotal = 0;
    const orderItems = cart.items.map((item: any) => {
      let price = Number(item.product.salePrice || item.product.basePrice);

      // Apply B2B/GSA pricing
      if (user?.accountType === 'B2B' && item.product.wholesalePrice) {
        price = Number(item.product.wholesalePrice);
      } else if (user?.accountType === 'GSA' && item.product.gsaPrice) {
        price = Number(item.product.gsaPrice);
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      return {
        productId: item.productId,
        sku: item.product.sku,
        name: item.product.name,
        quantity: item.quantity,
        price,
        total: itemTotal,
      };
    });

    const totalWeight = cart.items.reduce((sum: number, item: any) => {
      return sum + (item.product.weight || 0) * item.quantity;
    }, 0);

    const shippingCost = subtotal >= 99 ? 0 : totalWeight > 20 ? 35 : 15;
    const tax = user?.accountType === 'B2B' || user?.accountType === 'GSA' ? 0 : subtotal * 0.08;
    const total = subtotal + shippingCost + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Determine if approval is needed
    const requiresApproval =
      b2bMembership &&
      b2bMembership.requiresApproval &&
      b2bMembership.approvalThreshold &&
      total > Number(b2bMembership.approvalThreshold);

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        accountType: user?.accountType || 'RETAIL',
        ...(b2bMembership && { createdByMemberId: b2bMembership.id }),
        status: requiresApproval ? 'ON_HOLD' : 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod || 'CREDIT_CARD',
        shippingMethod: shippingMethod || 'GROUND',
        subtotal,
        shipping: shippingCost,
        tax,
        total,
        shippingAddressId,
        billingAddressId,
        costCenterId: costCenterId || b2bMembership?.costCenterId,
        customerNotes: notes,
        items: {
          create: orderItems,
        },
      },
      include: {
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
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // Create approval request if needed
    if (requiresApproval && b2bMembership?.b2bProfile.members[0]) {
      await db.orderApproval.create({
        data: {
          orderId: order.id,
          requestedById: b2bMembership.id,
          approverId: b2bMembership.b2bProfile.members[0].id,
          orderTotal: total,
          status: 'PENDING',
        },
      });
    }

    // Clear cart
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Update inventory
    for (const item of cart.items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
