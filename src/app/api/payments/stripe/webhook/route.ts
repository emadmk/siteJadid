import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// POST /api/payments/stripe/webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Get Stripe settings
    const stripeSettings = await prisma.paymentGatewaySettings.findFirst({
      where: {
        provider: 'STRIPE',
        isActive: true,
      },
    });

    if (!stripeSettings || !stripeSettings.secretKey || !stripeSettings.webhookSecret) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSettings.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeSettings.webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Update transaction
  await prisma.paymentTransaction.updateMany({
    where: { transactionId: paymentIntent.id },
    data: {
      status: 'captured',
      capturedAt: new Date(),
      responseCode: paymentIntent.status,
      last4: (paymentIntent.latest_charge as any)?.payment_method_details?.card?.last4,
      cardBrand: (paymentIntent.latest_charge as any)?.payment_method_details?.card?.brand,
    },
  });

  // Get the transaction to find order ID
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { transactionId: paymentIntent.id },
  });

  if (transaction?.orderId) {
    // Update order payment status
    await prisma.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        paymentIntentId: paymentIntent.id,
      },
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Update transaction
  await prisma.paymentTransaction.updateMany({
    where: { transactionId: paymentIntent.id },
    data: {
      status: 'failed',
      failedAt: new Date(),
      responseCode: paymentIntent.status,
      responseMessage: paymentIntent.last_payment_error?.message,
    },
  });

  // Get the transaction to find order ID
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { transactionId: paymentIntent.id },
  });

  if (transaction?.orderId) {
    // Update order payment status
    await prisma.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: 'FAILED',
      },
    });
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // Create refund record
  await prisma.paymentRefund.create({
    data: {
      transactionId: charge.payment_intent as string,
      refundId: charge.refunds?.data?.[0]?.id || '',
      amount: (charge.amount_refunded || 0) / 100,
      currency: charge.currency.toUpperCase(),
      reason: charge.refunds?.data?.[0]?.reason || null,
      status: 'completed',
    },
  });

  // Update transaction
  await prisma.paymentTransaction.updateMany({
    where: { transactionId: charge.payment_intent as string },
    data: {
      status: 'refunded',
      refundedAt: new Date(),
    },
  });
}
