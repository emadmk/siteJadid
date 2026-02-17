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

    if (orderId) {
      const order = await db.order.findUnique({ where: { id: orderId } });
      if (!order || order.userId !== session.user.id) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      // Use order total from DB, not client amount
      const validatedAmount = Number(order.total);
      const paymentIntent = await createPaymentIntent(validatedAmount, 'usd', {
        userId: session.user.id,
        orderId,
      });
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    // For non-order payments, still validate amount is reasonable
    if (!amount || amount <= 0 || amount > 100000) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const paymentIntent = await createPaymentIntent(amount, 'usd', {
      userId: session.user.id,
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
