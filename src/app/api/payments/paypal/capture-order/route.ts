export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/payments/paypal/capture-order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.orderId) {
      return NextResponse.json(
        { error: 'Missing required field: orderId' },
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

    // Capture order
    const captureResponse = await fetch(
      `${baseUrl}/v2/checkout/orders/${data.orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      throw new Error(errorData.message || 'Failed to capture PayPal order');
    }

    const captureData = await captureResponse.json();

    // Update transaction
    await prisma.paymentTransaction.updateMany({
      where: { transactionId: data.orderId },
      data: {
        status: 'captured',
        capturedAt: new Date(),
        responseCode: captureData.status,
        metadata: JSON.stringify(captureData),
      },
    });

    // Get the transaction to find order ID
    const transaction = await prisma.paymentTransaction.findFirst({
      where: { transactionId: data.orderId },
    });

    if (transaction?.orderId) {
      // Update order payment status
      await prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          paymentStatus: 'PAID',
          paidAt: new Date(),
          paymentIntentId: data.orderId,
        },
      });
    }

    return NextResponse.json({
      status: captureData.status,
      captureId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    });
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to capture PayPal order', details: error.message },
      { status: 500 }
    );
  }
}
