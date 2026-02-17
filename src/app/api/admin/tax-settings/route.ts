export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/tax-settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Super admin access required.' },
        { status: 403 }
      );
    }

    const settings = await prisma.taxSettings.findFirst();

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        provider: 'manual',
        enableTax: true,
        enableNexus: false,
        defaultTaxRate: 0,
        nexusStates: [],
        exemptCategories: [],
        taxShipping: true,
        roundAtSubtotal: false,
        testMode: true,
        cacheTaxRates: true,
        cacheDuration: 3600,
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching tax settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tax settings', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/tax-settings
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
    if (data.provider === 'taxjar' && !data.apiKey) {
      return NextResponse.json(
        { error: 'TaxJar API key is required when provider is TaxJar' },
        { status: 400 }
      );
    }

    // Upsert settings (create or update)
    const settings = await prisma.taxSettings.upsert({
      where: { id: data.id || 'default' },
      update: {
        provider: data.provider,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        enableTax: data.enableTax,
        enableNexus: data.enableNexus,
        defaultTaxRate: data.defaultTaxRate,
        nexusStates: data.nexusStates || [],
        exemptCategories: data.exemptCategories || [],
        taxShipping: data.taxShipping,
        roundAtSubtotal: data.roundAtSubtotal,
        testMode: data.testMode,
        cacheTaxRates: data.cacheTaxRates,
        cacheDuration: data.cacheDuration,
        updatedBy: session.user.id,
      },
      create: {
        id: 'default',
        provider: data.provider,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        enableTax: data.enableTax,
        enableNexus: data.enableNexus,
        defaultTaxRate: data.defaultTaxRate,
        nexusStates: data.nexusStates || [],
        exemptCategories: data.exemptCategories || [],
        taxShipping: data.taxShipping,
        roundAtSubtotal: data.roundAtSubtotal,
        testMode: data.testMode,
        cacheTaxRates: data.cacheTaxRates,
        cacheDuration: data.cacheDuration,
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error saving tax settings:', error);
    return NextResponse.json(
      { error: 'Failed to save tax settings', details: error.message },
      { status: 500 }
    );
  }
}
