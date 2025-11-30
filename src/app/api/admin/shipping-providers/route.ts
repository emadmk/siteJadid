import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/shipping-providers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const providers = await prisma.shippingProviderSettings.findMany({
      include: {
        services: true,
      },
      orderBy: {
        isDefault: 'desc',
      },
    });

    return NextResponse.json(providers);
  } catch (error: any) {
    console.error('Error fetching shipping providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping providers', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/shipping-providers
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
      await prisma.shippingProviderSettings.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const provider = await prisma.shippingProviderSettings.create({
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
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        testMode: data.testMode ?? true,
        defaultService: data.defaultService,
        defaultPackaging: data.defaultPackaging,
        includeInsurance: data.includeInsurance ?? false,
        insuranceProvider: data.insuranceProvider,
        requireSignature: data.requireSignature ?? false,
        useNegotiatedRates: data.useNegotiatedRates ?? false,
        labelFormat: data.labelFormat || 'PNG',
        labelSize: data.labelSize || '4x6',
        updatedBy: session.user.id,
      },
      include: {
        services: true,
      },
    });

    return NextResponse.json(provider);
  } catch (error: any) {
    console.error('Error creating shipping provider:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping provider', details: error.message },
      { status: 500 }
    );
  }
}
