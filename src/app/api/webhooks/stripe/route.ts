import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { constructWebhookEvent, logPaymentTransaction } from '@/lib/services/stripe';

// Disable body parsing - we need raw body for webhook signature
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Stripe webhook: No signature provided');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    const { success, event, error } = await constructWebhookEvent(body, signature);

    if (!success || !event) {
      console.error('Stripe webhook verification failed:', error);
      return NextResponse.json(
        { error: error || 'Webhook verification failed' },
        { status: 400 }
      );
    }

    console.log(`Stripe webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      // Payment Intent Events
      case 'payment_intent.created':
        await handlePaymentIntentCreated(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object as Stripe.PaymentIntent);
        break;

      // Charge Events
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge);
        break;

      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.dispute.updated':
        await handleDisputeUpdated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.dispute.closed':
        await handleDisputeClosed(event.data.object as Stripe.Dispute);
        break;

      // Refund Events
      case 'refund.created':
        await handleRefundCreated(event.data.object as Stripe.Refund);
        break;

      case 'refund.updated':
        await handleRefundUpdated(event.data.object as Stripe.Refund);
        break;

      // Customer Events (for saved cards)
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

// ============================================
// PAYMENT INTENT HANDLERS
// ============================================

async function handlePaymentIntentCreated(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment intent created: ${paymentIntent.id}`);

  await logPaymentTransaction({
    paymentIntentId: paymentIntent.id,
    orderId: paymentIntent.metadata?.orderId,
    userId: paymentIntent.metadata?.userId,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: 'pending',
    customerEmail: paymentIntent.receipt_email || undefined,
    metadata: paymentIntent.metadata,
  });
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment intent succeeded: ${paymentIntent.id}`);

  // Get charge details for card info
  const charge = paymentIntent.latest_charge as Stripe.Charge | undefined;
  const cardDetails = charge?.payment_method_details?.card;

  // Update transaction
  await logPaymentTransaction({
    paymentIntentId: paymentIntent.id,
    orderId: paymentIntent.metadata?.orderId,
    userId: paymentIntent.metadata?.userId,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    status: 'captured',
    paymentMethod: 'card',
    last4: cardDetails?.last4 || undefined,
    cardBrand: cardDetails?.brand || undefined,
    customerEmail: paymentIntent.receipt_email || undefined,
    metadata: {
      ...paymentIntent.metadata,
      receiptUrl: charge?.receipt_url,
    },
  });

  // Update order if exists
  const orderId = paymentIntent.metadata?.orderId;
  if (orderId) {
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          paymentIntentId: paymentIntent.id,
          status: 'PROCESSING', // Move from PENDING to PROCESSING
        },
      });

      // Create order status history log
      await prisma.orderStatusHistory.create({
        data: {
          orderId: orderId,
          status: 'PROCESSING',
          notes: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} received via Stripe (${cardDetails?.brand || 'card'} ****${cardDetails?.last4 || '****'})`,
          changedBy: 'system',
        },
      });
    } catch (error) {
      console.error('Error updating order for payment success:', error);
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment intent failed: ${paymentIntent.id}`);

  const errorMessage = paymentIntent.last_payment_error?.message;

  // Update transaction
  await prisma.paymentTransaction.updateMany({
    where: { transactionId: paymentIntent.id },
    data: {
      status: 'failed',
      failedAt: new Date(),
      responseCode: paymentIntent.status,
      responseMessage: errorMessage,
    },
  });

  // Update order if exists
  const orderId = paymentIntent.metadata?.orderId;
  if (orderId) {
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'FAILED',
        },
      });

      // Create order status history log
      await prisma.orderStatusHistory.create({
        data: {
          orderId: orderId,
          status: 'PENDING',
          notes: `Payment failed: ${errorMessage || 'Unknown error'}`,
          changedBy: 'system',
        },
      });
    } catch (error) {
      console.error('Error updating order for payment failure:', error);
    }
  }
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment intent canceled: ${paymentIntent.id}`);

  // Update transaction
  await prisma.paymentTransaction.updateMany({
    where: { transactionId: paymentIntent.id },
    data: {
      status: 'canceled',
      responseCode: 'canceled',
      responseMessage: paymentIntent.cancellation_reason || 'Payment canceled',
    },
  });

  // Update order if exists
  const orderId = paymentIntent.metadata?.orderId;
  if (orderId) {
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'CANCELLED',
        },
      });
    } catch (error) {
      console.error('Error updating order for payment cancellation:', error);
    }
  }
}

async function handlePaymentIntentProcessing(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment intent processing: ${paymentIntent.id}`);

  // Update transaction status
  await prisma.paymentTransaction.updateMany({
    where: { transactionId: paymentIntent.id },
    data: {
      status: 'processing',
      responseCode: 'processing',
    },
  });
}

async function handlePaymentIntentRequiresAction(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment intent requires action: ${paymentIntent.id}`);

  // Update transaction status
  await prisma.paymentTransaction.updateMany({
    where: { transactionId: paymentIntent.id },
    data: {
      status: 'requires_action',
      responseCode: 'requires_action',
    },
  });
}

// ============================================
// CHARGE HANDLERS
// ============================================

async function handleChargeSucceeded(charge: Stripe.Charge) {
  console.log(`Charge succeeded: ${charge.id}`);

  // Update transaction with receipt URL
  if (charge.payment_intent) {
    await prisma.paymentTransaction.updateMany({
      where: { transactionId: charge.payment_intent as string },
      data: {
        metadata: JSON.stringify({
          chargeId: charge.id,
          receiptUrl: charge.receipt_url,
        }),
      },
    });
  }
}

async function handleChargeFailed(charge: Stripe.Charge) {
  console.log(`Charge failed: ${charge.id}`);

  if (charge.payment_intent) {
    await prisma.paymentTransaction.updateMany({
      where: { transactionId: charge.payment_intent as string },
      data: {
        status: 'failed',
        responseMessage: charge.failure_message || 'Charge failed',
      },
    });
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`Charge refunded: ${charge.id}`);

  const refund = charge.refunds?.data?.[0];
  const paymentIntentId = charge.payment_intent as string;

  // Create refund record
  if (refund) {
    await prisma.paymentRefund.upsert({
      where: { refundId: refund.id },
      create: {
        transactionId: paymentIntentId,
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency.toUpperCase(),
        reason: refund.reason || null,
        status: refund.status || 'completed',
      },
      update: {
        amount: refund.amount / 100,
        status: refund.status || 'completed',
      },
    });
  }

  // Update transaction
  const isFullRefund = charge.amount_refunded >= charge.amount;

  await prisma.paymentTransaction.updateMany({
    where: { transactionId: paymentIntentId },
    data: {
      status: isFullRefund ? 'refunded' : 'partially_refunded',
      refundedAt: new Date(),
    },
  });

  // Update order if exists
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { transactionId: paymentIntentId },
    select: { orderId: true },
  });

  if (transaction?.orderId) {
    try {
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
      });

      await prisma.orderStatusHistory.create({
        data: {
          orderId: transaction.orderId,
          status: isFullRefund ? 'REFUNDED' : 'PROCESSING',
          notes: `Refund of $${((refund?.amount || 0) / 100).toFixed(2)} processed. Reason: ${refund?.reason || 'Not specified'}`,
          changedBy: 'system',
        },
      });
    } catch (error) {
      console.error('Error updating order for refund:', error);
    }
  }
}

// ============================================
// DISPUTE HANDLERS
// ============================================

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  console.log(`Dispute created: ${dispute.id}`);

  const paymentIntentId = (dispute.payment_intent as string) || '';

  // Update transaction status
  await prisma.paymentTransaction.updateMany({
    where: { transactionId: paymentIntentId },
    data: {
      status: 'disputed',
      responseMessage: `Dispute: ${dispute.reason}`,
    },
  });

  // Find order and create activity
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { transactionId: paymentIntentId },
    select: { orderId: true },
  });

  if (transaction?.orderId) {
    await prisma.orderStatusHistory.create({
      data: {
        orderId: transaction.orderId,
        status: 'ON_HOLD',
        notes: `Payment dispute opened: ${dispute.reason} (Amount: $${(dispute.amount / 100).toFixed(2)})`,
        changedBy: 'system',
      },
    });
  }
}

async function handleDisputeUpdated(dispute: Stripe.Dispute) {
  console.log(`Dispute updated: ${dispute.id}, status: ${dispute.status}`);
}

async function handleDisputeClosed(dispute: Stripe.Dispute) {
  console.log(`Dispute closed: ${dispute.id}, status: ${dispute.status}`);

  const paymentIntentId = (dispute.payment_intent as string) || '';

  // Determine new status based on dispute outcome
  let newStatus = 'captured';
  if (dispute.status === 'lost') {
    newStatus = 'disputed_lost';
  } else if (dispute.status === 'won') {
    newStatus = 'captured';
  }

  await prisma.paymentTransaction.updateMany({
    where: { transactionId: paymentIntentId },
    data: {
      status: newStatus,
      responseMessage: `Dispute ${dispute.status}`,
    },
  });
}

// ============================================
// REFUND HANDLERS
// ============================================

async function handleRefundCreated(refund: Stripe.Refund) {
  console.log(`Refund created: ${refund.id}`);

  const paymentIntentId = refund.payment_intent as string;

  await prisma.paymentRefund.upsert({
    where: { refundId: refund.id },
    create: {
      transactionId: paymentIntentId,
      refundId: refund.id,
      amount: refund.amount / 100,
      currency: refund.currency.toUpperCase(),
      reason: refund.reason || null,
      status: refund.status || 'pending',
    },
    update: {
      amount: refund.amount / 100,
      status: refund.status || 'pending',
    },
  });
}

async function handleRefundUpdated(refund: Stripe.Refund) {
  console.log(`Refund updated: ${refund.id}, status: ${refund.status}`);

  await prisma.paymentRefund.updateMany({
    where: { refundId: refund.id },
    data: {
      status: refund.status || 'pending',
    },
  });
}

// ============================================
// CUSTOMER HANDLERS
// ============================================

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log(`Customer created: ${customer.id}`);

  // Link customer to user if metadata has userId
  const userId = customer.metadata?.userId;
  if (userId) {
    await prisma.setting.upsert({
      where: { key: `stripe.customer.${userId}` },
      create: {
        key: `stripe.customer.${userId}`,
        value: customer.id,
        type: 'string',
        category: 'stripe',
      },
      update: { value: customer.id },
    });
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log(`Payment method attached: ${paymentMethod.id}`);
  // Can be used to notify user about saved card
}

async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  console.log(`Payment method detached: ${paymentMethod.id}`);
  // Can be used to notify user about removed card
}
