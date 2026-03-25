export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/tax-settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const settings = await db.taxSettings.findFirst();

    if (!settings) {
      return NextResponse.json({
        provider: 'manual',
        enableTax: true,
        enableNexus: false,
        defaultTaxRate: 8,
        nexusStates: [],
        exemptCategories: [],
        taxShipping: true,
        roundAtSubtotal: false,
        testMode: true,
        cacheTaxRates: true,
        cacheDuration: 3600,
        customerTypeTax: {
          B2C: { enabled: true, rate: 8 },
          B2B: { enabled: true, rate: 8 },
          GSA: { enabled: true, rate: 8 },
          PERSONAL: { enabled: true, rate: 8 },
          VOLUME_BUYER: { enabled: false, rate: 0 },
          GOVERNMENT: { enabled: false, rate: 0 },
        },
      });
    }

    // Build customer type tax from DB fields
    const customerTypeTax = {
      B2C: { enabled: settings.taxEnabledB2C, rate: Number(settings.taxRateB2C) },
      B2B: { enabled: settings.taxEnabledB2B, rate: Number(settings.taxRateB2B) },
      GSA: { enabled: settings.taxEnabledGSA, rate: Number(settings.taxRateGSA) },
      PERSONAL: { enabled: settings.taxEnabledPersonal, rate: Number(settings.taxRatePersonal) },
      VOLUME_BUYER: { enabled: settings.taxEnabledVolumeBuyer, rate: Number(settings.taxRateVolumeBuyer) },
      GOVERNMENT: { enabled: settings.taxEnabledGovernment, rate: Number(settings.taxRateGovernment) },
    };

    return NextResponse.json({
      ...settings,
      defaultTaxRate: Number(settings.defaultTaxRate),
      customerTypeTax,
    });
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

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (data.provider === 'taxjar' && !data.apiKey && !data.taxJarApiKey) {
      return NextResponse.json(
        { error: 'TaxJar API key is required when provider is TaxJar' },
        { status: 400 }
      );
    }

    // Extract per-customer-type tax settings
    const ct = data.customerTypeTax || {};

    const taxData = {
      provider: data.provider || 'manual',
      apiKey: data.apiKey || data.taxJarApiKey || null,
      apiSecret: data.apiSecret || null,
      enableTax: data.enableTax ?? true,
      enableNexus: data.enableNexus ?? false,
      defaultTaxRate: data.defaultTaxRate ?? 8,
      nexusStates: data.nexusStates || [],
      exemptCategories: data.exemptCategories || [],
      taxShipping: data.taxShipping ?? data.calculateTaxOnShipping ?? true,
      roundAtSubtotal: data.roundAtSubtotal ?? false,
      testMode: data.testMode ?? true,
      cacheTaxRates: data.cacheTaxRates ?? true,
      cacheDuration: data.cacheDuration ?? 3600,
      // Per-customer-type tax
      taxEnabledB2C: ct.B2C?.enabled ?? true,
      taxRateB2C: ct.B2C?.rate ?? 8,
      taxEnabledB2B: ct.B2B?.enabled ?? true,
      taxRateB2B: ct.B2B?.rate ?? 8,
      taxEnabledGSA: ct.GSA?.enabled ?? true,
      taxRateGSA: ct.GSA?.rate ?? 8,
      taxEnabledPersonal: ct.PERSONAL?.enabled ?? true,
      taxRatePersonal: ct.PERSONAL?.rate ?? 8,
      taxEnabledVolumeBuyer: ct.VOLUME_BUYER?.enabled ?? false,
      taxRateVolumeBuyer: ct.VOLUME_BUYER?.rate ?? 0,
      taxEnabledGovernment: ct.GOVERNMENT?.enabled ?? false,
      taxRateGovernment: ct.GOVERNMENT?.rate ?? 0,
      updatedBy: session.user.id,
    };

    // Find existing settings
    const existing = await db.taxSettings.findFirst();

    let settings;
    if (existing) {
      settings = await db.taxSettings.update({
        where: { id: existing.id },
        data: taxData,
      });
    } else {
      settings = await db.taxSettings.create({
        data: {
          id: 'default',
          ...taxData,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tax settings saved successfully',
      settings,
    });
  } catch (error: any) {
    console.error('Error saving tax settings:', error);
    return NextResponse.json(
      { error: 'Failed to save tax settings', details: error.message },
      { status: 500 }
    );
  }
}
