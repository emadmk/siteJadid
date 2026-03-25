export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/tax/rate - Get tax rate for current user's account type
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const accountType = session?.user?.accountType || 'B2C';

    const taxSettings = await db.taxSettings.findFirst();

    if (!taxSettings || !taxSettings.enableTax) {
      return NextResponse.json({
        enabled: false,
        rate: 0,
        taxShipping: false,
        accountType,
      });
    }

    // Map account type to the corresponding tax fields
    const taxFieldMap: Record<string, { enabled: boolean; rate: number }> = {
      B2C: { enabled: taxSettings.taxEnabledB2C, rate: Number(taxSettings.taxRateB2C) },
      B2B: { enabled: taxSettings.taxEnabledB2B, rate: Number(taxSettings.taxRateB2B) },
      GSA: { enabled: taxSettings.taxEnabledGSA, rate: Number(taxSettings.taxRateGSA) },
      PERSONAL: { enabled: taxSettings.taxEnabledPersonal, rate: Number(taxSettings.taxRatePersonal) },
      VOLUME_BUYER: { enabled: taxSettings.taxEnabledVolumeBuyer, rate: Number(taxSettings.taxRateVolumeBuyer) },
      GOVERNMENT: { enabled: taxSettings.taxEnabledGovernment, rate: Number(taxSettings.taxRateGovernment) },
    };

    const customerTax = taxFieldMap[accountType] || { enabled: true, rate: Number(taxSettings.defaultTaxRate) };

    return NextResponse.json({
      enabled: customerTax.enabled,
      rate: customerTax.rate,
      taxShipping: taxSettings.taxShipping,
      accountType,
    });
  } catch (error: any) {
    console.error('Error fetching tax rate:', error);
    // Fallback to default
    return NextResponse.json({
      enabled: true,
      rate: 8,
      taxShipping: false,
      accountType: 'B2C',
    });
  }
}
