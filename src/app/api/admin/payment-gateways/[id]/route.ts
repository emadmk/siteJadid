import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/payment-gateways/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.paymentGatewaySettings.updateMany({
        where: {
          isDefault: true,
          NOT: { id: params.id }
        },
        data: { isDefault: false },
      });
    }

    const gateway = await prisma.paymentGatewaySettings.update({
      where: { id: params.id },
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
        isActive: data.isActive,
        isDefault: data.isDefault,
        testMode: data.testMode,
        saveCards: data.saveCards,
        autoCapture: data.autoCapture,
        creditCard: data.creditCard,
        debitCard: data.debitCard,
        applePay: data.applePay,
        googlePay: data.googlePay,
        require3DS: data.require3DS,
        defaultCurrency: data.defaultCurrency,
        statementDescriptor: data.statementDescriptor,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(gateway);
  } catch (error: any) {
    console.error('Error updating payment gateway:', error);
    return NextResponse.json(
      { error: 'Failed to update payment gateway', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payment-gateways/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    await prisma.paymentGatewaySettings.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting payment gateway:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment gateway', details: error.message },
      { status: 500 }
    );
  }
}
