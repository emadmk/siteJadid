import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPaymentIntent } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, orderId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Verify order belongs to user
    if (orderId) {
      const order = await db.order.findUnique({
        where: { id: orderId },
      });

      if (!order || order.userId !== session.user.id) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
    }

    const paymentIntent = await createPaymentIntent(amount, 'usd', {
      userId: session.user.id,
      ...(orderId && { orderId }),
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
