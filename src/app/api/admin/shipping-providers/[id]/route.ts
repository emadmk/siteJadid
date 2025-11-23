import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// PUT /api/admin/shipping-providers/[id]
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
      await prisma.shippingProviderSettings.updateMany({
        where: {
          isDefault: true,
          NOT: { id: params.id }
        },
        data: { isDefault: false },
      });
    }

    const provider = await prisma.shippingProviderSettings.update({
      where: { id: params.id },
      data: {
        provider: data.provider,
        name: data.name,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        accountNumber: data.accountNumber,
        meterNumber: data.meterNumber,
        username: data.username,
        password: data.password,
        apiEndpoint: data.apiEndpoint,
        isActive: data.isActive,
        isDefault: data.isDefault,
        testMode: data.testMode,
        defaultService: data.defaultService,
        defaultPackaging: data.defaultPackaging,
        includeInsurance: data.includeInsurance,
        insuranceProvider: data.insuranceProvider,
        requireSignature: data.requireSignature,
        useNegotiatedRates: data.useNegotiatedRates,
        labelFormat: data.labelFormat,
        labelSize: data.labelSize,
        updatedBy: session.user.id,
      },
      include: {
        services: true,
      },
    });

    return NextResponse.json(provider);
  } catch (error: any) {
    console.error('Error updating shipping provider:', error);
    return NextResponse.json(
      { error: 'Failed to update shipping provider', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/shipping-providers/[id]
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

    await prisma.shippingProviderSettings.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting shipping provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete shipping provider', details: error.message },
      { status: 500 }
    );
  }
}
