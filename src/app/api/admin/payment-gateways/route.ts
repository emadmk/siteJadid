import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/payment-gateways
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const gateways = await prisma.paymentGatewaySettings.findMany({
      orderBy: {
        isDefault: 'desc',
      },
    });

    // Mask sensitive data
    const maskedGateways = gateways.map((gw) => ({
      ...gw,
      publishableKey: gw.publishableKey ? maskKey(gw.publishableKey) : null,
      secretKey: gw.secretKey ? '***masked***' : null,
      clientSecret: gw.clientSecret ? '***masked***' : null,
      webhookSecret: gw.webhookSecret ? '***masked***' : null,
    }));

    return NextResponse.json(maskedGateways);
  } catch (error: any) {
    console.error('Error fetching payment gateways:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment gateways', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/payment-gateways
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.provider || !data.name) {
      return NextResponse.json(
        { error: 'Missing required fields: provider and name' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.paymentGatewaySettings.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const gateway = await prisma.paymentGatewaySettings.create({
      data: {
        provider: data.provider,
        name: data.name,
        publishableKey: data.publishableKey,
        secretKey: data.secretKey,
        merchantId: data.merchantId,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        webhookSecret: data.webhookSecret,
        webhookUrl: data.webhookUrl,
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        testMode: data.testMode ?? true,
        saveCards: data.saveCards ?? true,
        autoCapture: data.autoCapture ?? true,
        creditCard: data.creditCard ?? true,
        debitCard: data.debitCard ?? true,
        applePay: data.applePay ?? false,
        googlePay: data.googlePay ?? false,
        require3DS: data.require3DS ?? false,
        defaultCurrency: data.defaultCurrency || 'USD',
        statementDescriptor: data.statementDescriptor,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(gateway);
  } catch (error: any) {
    console.error('Error creating payment gateway:', error);
    return NextResponse.json(
      { error: 'Failed to create payment gateway', details: error.message },
      { status: 500 }
    );
  }
}

function maskKey(key: string): string {
  if (key.length <= 8) return '***';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}
