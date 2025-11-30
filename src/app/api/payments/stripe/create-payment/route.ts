import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// POST /api/payments/stripe/create-payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.amount || !data.currency) {
      return NextResponse.json(
        { error: 'Missing required fields: amount and currency' },
        { status: 400 }
      );
    }

    // Get Stripe settings
    const stripeSettings = await prisma.paymentGatewaySettings.findFirst({
      where: {
        provider: 'STRIPE',
        isActive: true,
      },
    });

    if (!stripeSettings || !stripeSettings.secretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSettings.secretKey, {
      apiVersion: '2023-10-16',
    });

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: session.user.id,
        orderId: data.orderId || '',
      },
      description: data.description || 'Order payment',
    });

    // Log transaction
    await prisma.paymentTransaction.create({
      data: {
        gatewayProvider: 'stripe',
        transactionId: paymentIntent.id,
        orderId: data.orderId,
        userId: session.user.id,
        amount: data.amount,
        currency: data.currency,
        status: 'pending',
        paymentMethod: 'card',
        customerEmail: session.user.email || '',
        metadata: JSON.stringify({
          paymentIntentId: paymentIntent.id,
        }),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating Stripe payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    );
  }
}
