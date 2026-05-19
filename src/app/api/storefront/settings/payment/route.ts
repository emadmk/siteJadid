export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Public payment-method visibility for the checkout UI. Only exposes the
 * "is this payment method enabled?" booleans — never any keys/secrets.
 *
 * Defaults match the admin defaults so a fresh install behaves the same as
 * before this endpoint existed.
 */
export async function GET() {
  const defaults = {
    stripe: true,
    paypal: false,
    gsaSmartpay: true,
    net30: false,
  };

  try {
    const settings = await prisma.setting.findMany({
      where: {
        category: 'payment',
        key: {
          in: ['payment.stripe', 'payment.paypal', 'payment.gsaSmartpay', 'payment.net30'],
        },
      },
    });

    const result = { ...defaults };
    for (const s of settings) {
      const key = s.key.replace('payment.', '') as keyof typeof defaults;
      if (key in defaults && s.type === 'boolean') {
        (result as any)[key] = s.value === 'true';
      }
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(defaults);
  }
}
