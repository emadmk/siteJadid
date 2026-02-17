import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`track:${ip}`, 10, 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { orderNumber, email } = body;

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: 'Order number and email are required' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.toUpperCase(),
        user: {
          email: email.toLowerCase(),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
          },
        },
        shippingAddress: true,
        shipments: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            tracking: {
              orderBy: {
                timestamp: 'desc',
              },
            },
          },
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found. Please check your order number and email.' },
        { status: 404 }
      );
    }

    // Return sanitized order data
    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        
        // Amounts
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        shipping: Number(order.shipping),
        discount: Number(order.discount),
        total: Number(order.total),

        // Items
        items: order.items.map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
          product: item.product,
        })),

        // Shipping - only city/state for privacy
        shippingAddress: order.shippingAddress ? {
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: order.shippingAddress.country,
        } : null,
        shippingCarrier: order.shippingCarrier,
        shippingMethod: order.shippingMethod,
        trackingNumber: order.trackingNumber,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,

        // Shipments
        shipments: order.shipments.map(shipment => ({
          id: shipment.id,
          carrier: shipment.carrier,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          shippedAt: shipment.shippedAt,
          deliveredAt: shipment.deliveredAt,
          estimatedDelivery: shipment.estimatedDelivery,
          tracking: shipment.tracking,
        })),

        // Status History
        statusHistory: order.statusHistory.map((sh: any) => ({
          status: sh.status,
          createdAt: sh.createdAt,
        })),
      },
    });

  } catch (error) {
    console.error('Track order error:', error);
    return NextResponse.json(
      { error: 'Failed to track order' },
      { status: 500 }
    );
  }
}
