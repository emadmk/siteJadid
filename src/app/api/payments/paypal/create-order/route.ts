import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/payments/paypal/create-order
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

    // Get PayPal settings
    const paypalSettings = await prisma.paymentGatewaySettings.findFirst({
      where: {
        provider: 'PAYPAL',
        isActive: true,
      },
    });

    if (!paypalSettings || !paypalSettings.clientId || !paypalSettings.clientSecret) {
      return NextResponse.json(
        { error: 'PayPal is not configured' },
        { status: 500 }
      );
    }

    // Get access token
    const baseUrl = paypalSettings.testMode
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${paypalSettings.clientId}:${paypalSettings.clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      throw new Error('Failed to authenticate with PayPal');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Create order
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: data.currency,
              value: data.amount.toFixed(2),
            },
            description: data.description || 'Order payment',
            reference_id: data.orderId || '',
          },
        ],
        application_context: {
          return_url: data.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          cancel_url: data.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
        },
      }),
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      throw new Error(errorData.message || 'Failed to create PayPal order');
    }

    const orderData = await orderResponse.json();

    // Log transaction
    await prisma.paymentTransaction.create({
      data: {
        gatewayProvider: 'paypal',
        transactionId: orderData.id,
        orderId: data.orderId,
        userId: session.user.id,
        amount: data.amount,
        currency: data.currency,
        status: 'pending',
        paymentMethod: 'paypal',
        customerEmail: session.user.email || '',
        metadata: JSON.stringify({
          paypalOrderId: orderData.id,
        }),
      },
    });

    return NextResponse.json({
      orderId: orderData.id,
      approveLink: orderData.links.find((link: any) => link.rel === 'approve')?.href,
    });
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to create PayPal order', details: error.message },
      { status: 500 }
    );
  }
}
