export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createPaymentIntent,
  updatePaymentIntent,
  getOrCreateCustomer,
  logPaymentTransaction,
  getPublicConfig,
} from '@/lib/services/stripe';

/**
 * POST /api/payments/checkout
 * Create a payment intent for checkout
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { orderId, amount, currency = 'usd', saveCard = false, metadata = {} } = data;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a Stripe customer ID saved in settings
    const customerSetting = await prisma.setting.findUnique({
      where: { key: `stripe.customer.${user.id}` },
    });
    let stripeCustomerId = customerSetting?.value || null;

    // Get or create Stripe customer if saving card
    if (!stripeCustomerId && saveCard) {
      const customerResult = await getOrCreateCustomer(user.email!, {
        name: user.name || undefined,
        metadata: { userId: user.id },
      });

      if (!customerResult.success) {
        console.error('Failed to create Stripe customer:', customerResult.error);
        // Continue without customer - payment will still work
      } else {
        stripeCustomerId = customerResult.customerId!;
        // Save Stripe customer ID
        await prisma.setting.upsert({
          where: { key: `stripe.customer.${user.id}` },
          create: {
            key: `stripe.customer.${user.id}`,
            value: stripeCustomerId,
            type: 'string',
            category: 'stripe',
          },
          update: { value: stripeCustomerId },
        });
      }
    }

    // Verify order if provided
    let order: {
      id: string;
      orderNumber: string;
      userId: string;
      total: any;
      paymentStatus: string;
      paymentIntentId: string | null;
    } | null = null;

    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          userId: true,
          total: true,
          paymentStatus: true,
          paymentIntentId: true,
        },
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (order.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Fix #1: Validate payment amount matches order total (prevent amount tampering)
      const orderTotalCents = Math.round(Number(order.total) * 100);
      const requestAmountCents = Math.round(amount * 100);
      if (orderTotalCents !== requestAmountCents) {
        return NextResponse.json(
          { error: 'Payment amount does not match order total' },
          { status: 400 }
        );
      }

      // If order already has a payment intent, update it instead
      if (order.paymentIntentId) {
        const updateResult = await updatePaymentIntent(order.paymentIntentId, {
          amount,
          metadata: {
            ...metadata,
            orderId: order.id,
            orderNumber: order.orderNumber,
            userId: session.user.id,
          },
        });

        if (!updateResult.success) {
          // If update fails (e.g., already captured), create a new one
          console.warn('Failed to update payment intent, creating new one');
        } else {
          return NextResponse.json({
            clientSecret: (await prisma.order.findUnique({
              where: { id: orderId },
              select: { paymentIntentId: true },
            }))?.paymentIntentId
              ? updateResult.clientSecret
              : null,
            paymentIntentId: updateResult.paymentIntentId,
            amount: updateResult.amount,
          });
        }
      }
    }

    // Create payment intent
    const result = await createPaymentIntent({
      amount,
      currency,
      customerId: stripeCustomerId || undefined,
      orderId: order?.id,
      description: order ? `Order ${order.orderNumber}` : metadata?.orderNumber ? `Order ${metadata.orderNumber}` : 'Checkout payment',
      receiptEmail: user.email!,
      setupFutureUsage: saveCard ? 'off_session' : undefined,
      metadata: {
        ...metadata,
        userId: session.user.id,
        userEmail: user.email!,
        ...(order && {
          orderId: order.id,
          orderNumber: order.orderNumber,
        }),
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Update order with payment intent ID
    if (order && result.paymentIntentId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentIntentId: result.paymentIntentId },
      });
    }

    // Log transaction
    await logPaymentTransaction({
      paymentIntentId: result.paymentIntentId!,
      orderId: order?.id,
      userId: session.user.id,
      amount,
      currency,
      status: 'pending',
      customerEmail: user.email!,
      metadata: { ...metadata, saveCard },
    });

    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      amount: result.amount,
    });
  } catch (error: any) {
    console.error('Error creating checkout payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/payments/checkout
 * Update payment intent with order details
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { paymentIntentId, orderId, metadata = {} } = data;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Verify the transaction belongs to this user
    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        transactionId: paymentIntentId,
        userId: session.user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment intent metadata
    const updateResult = await updatePaymentIntent(paymentIntentId, {
      metadata: {
        ...metadata,
        ...(orderId && { orderId }),
      },
    });

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error || 'Failed to update payment' },
        { status: 500 }
      );
    }

    // Update transaction with order ID
    if (orderId) {
      await prisma.paymentTransaction.update({
        where: { transactionId: paymentIntentId },
        data: { orderId },
      });

      // Update order with payment intent ID
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentIntentId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/checkout/config
 * Get Stripe publishable key for frontend
 */
export async function GET() {
  try {
    const config = await getPublicConfig();

    if (!config.publishableKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publishableKey: config.publishableKey,
      testMode: config.testMode,
    });
  } catch (error: any) {
    console.error('Error getting Stripe config:', error);
    return NextResponse.json(
      { error: 'Failed to get payment configuration' },
      { status: 500 }
    );
  }
}
