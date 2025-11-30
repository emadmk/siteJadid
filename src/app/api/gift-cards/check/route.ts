import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/gift-cards/check
export async function POST(request: NextRequest) {
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
    if (giftCard.currentBalance <= 0) {
      return NextResponse.json({
        valid: false,
        error: 'Gift card has no remaining balance',
      });
    }

    return NextResponse.json({
      valid: true,
      code: giftCard.code,
      balance: giftCard.currentBalance,
      initialAmount: giftCard.initialAmount,
      expiresAt: giftCard.expiresAt,
      minPurchase: giftCard.minPurchase,
    });
  } catch (error: any) {
    console.error('Error checking gift card:', error);
    return NextResponse.json(
      { error: 'Failed to check gift card', details: error.message },
      { status: 500 }
    );
  }
}
