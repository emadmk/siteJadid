export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public API - no auth required
// Returns company contact info from settings for footer, contact page, etc.
export async function GET() {
  try {
    const keys = [
      'store.name',
      'store.email',
      'store.phone',
      'store.address',
      'shipping.originName',
      'shipping.originStreet',
      'shipping.originCity',
      'shipping.originState',
      'shipping.originZip',
      'shipping.originCountry',
      'shipping.originPhone',
    ];

    const settings = await prisma.setting.findMany({
      where: { key: { in: keys } },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    // Build address from shipping origin fields
    const street = map['shipping.originStreet'] || '';
    const city = map['shipping.originCity'] || '';
    const state = map['shipping.originState'] || '';
    const zip = map['shipping.originZip'] || '';
    const country = map['shipping.originCountry'] || 'US';

    const addressParts = [street, city, state, zip].filter(Boolean);
    const fullAddress = addressParts.length > 0
      ? addressParts.join(', ')
      : (map['store.address'] || '');

    const response = {
      name: map['store.name'] || 'ADA Supplies',
      email: map['store.email'] || 'info@adasupply.com',
      phone: map['shipping.originPhone'] || map['store.phone'] || '',
      address: fullAddress,
      street,
      city,
      state,
      zip,
      country,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching company info:', error);
    return NextResponse.json({
      name: 'ADA Supplies',
      email: 'info@adasupply.com',
      phone: '',
      address: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
    });
  }
}
