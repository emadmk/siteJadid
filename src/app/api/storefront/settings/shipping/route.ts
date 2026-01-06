import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/storefront/settings/shipping - Get public shipping settings
export async function GET() {
  try {
    // Fetch shipping settings from database
    const settings = await prisma.setting.findMany({
      where: { category: 'shipping' },
    });

    // Default values
    const defaults = {
      freeShippingEnabled: false,
      freeThreshold: 100,
      standardRate: 9.99,
      expressRate: 24.99,
    };

    // Create settings object
    const shippingSettings = { ...defaults };

    for (const setting of settings) {
      const key = setting.key.replace('shipping.', '') as keyof typeof defaults;
      if (key in defaults) {
        if (setting.type === 'boolean') {
          (shippingSettings as any)[key] = setting.value === 'true';
        } else if (setting.type === 'number') {
          (shippingSettings as any)[key] = parseFloat(setting.value);
        } else {
          (shippingSettings as any)[key] = setting.value;
        }
      }
    }

    return NextResponse.json(shippingSettings);
  } catch (error: any) {
    console.error('Error fetching shipping settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping settings' },
      { status: 500 }
    );
  }
}
