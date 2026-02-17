import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

// POST /api/gift-cards/check
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = rateLimit(`giftcard:${ip}`, 10, 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const data = await request.json();

    if (!data.code) {
      return NextResponse.json(
        { error: 'Gift card code is required' },
        { status: 400 }
      );
    }

    const giftCard = await prisma.giftCard.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (giftCard.expiresAt && new Date(giftCard.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Gift card has expired',
      });
    }

    // Check if inactive
    if (!giftCard.isActive || giftCard.status !== 'ACTIVE') {
      return NextResponse.json({
        valid: false,
        error: 'Gift card is not active',
      });
    }

    // Check if balance
    if (Number(giftCard.currentBalance) <= 0) {
      return NextResponse.json({
        valid: false,
        error: 'Gift card has no remaining balance',
      });
    }

    return NextResponse.json({
      valid: true,
      code: giftCard.code,
      balance: Number(giftCard.currentBalance),
      initialAmount: Number(giftCard.initialAmount),
      expiresAt: giftCard.expiresAt,
      minPurchase: giftCard.minPurchase ? Number(giftCard.minPurchase) : null,
    });
  } catch (error: any) {
    console.error('Error checking gift card:', error);
    return NextResponse.json(
      { error: 'Failed to check gift card', details: error.message },
      { status: 500 }
    );
  }
}
