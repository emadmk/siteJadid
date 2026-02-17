export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Default shipping settings
const DEFAULT_SHIPPING = {
  freeThreshold: 100,
  standardRate: 9.99,
  expressRate: 24.99,
  international: true,
};

// GET /api/settings/shipping - Get shipping settings (public)
export async function GET() {
  try {
    // Fetch shipping settings from database
    const dbSettings = await prisma.setting.findMany({
      where: { category: 'shipping' },
    });

    // Start with defaults
    const settings = { ...DEFAULT_SHIPPING };

    // Override with database values
    for (const setting of dbSettings) {
      const key = setting.key.replace('shipping.', '') as keyof typeof DEFAULT_SHIPPING;
      if (key in settings) {
        if (setting.type === 'boolean') {
          (settings as any)[key] = setting.value === 'true';
        } else if (setting.type === 'number') {
          (settings as any)[key] = parseFloat(setting.value);
        } else {
          (settings as any)[key] = setting.value;
        }
      }
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching shipping settings:', error);
    // Return defaults on error
    return NextResponse.json(DEFAULT_SHIPPING);
  }
}
