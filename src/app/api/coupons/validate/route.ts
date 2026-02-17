import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await rateLimit(`coupon:${ip}`, 10, 60 * 1000);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { code, subtotal, accountType } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      );
    }

    // Find the coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return NextResponse.json(
        { error: 'This coupon is no longer active' },
        { status: 400 }
      );
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.startsAt) {
      return NextResponse.json(
        { error: 'This coupon is not yet active' },
        { status: 400 }
      );
    }

    if (coupon.endsAt && now > coupon.endsAt) {
      return NextResponse.json(
        { error: 'This coupon has expired' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: 'This coupon has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check minimum purchase requirement
    if (coupon.minPurchase && subtotal < Number(coupon.minPurchase)) {
      return NextResponse.json(
        { 
          error: `Minimum purchase of $${coupon.minPurchase} required for this coupon`,
          minPurchase: Number(coupon.minPurchase)
        },
        { status: 400 }
      );
    }

    // Check account type restriction
    if (coupon.accountTypes.length > 0 && accountType) {
      if (!coupon.accountTypes.includes(accountType)) {
        return NextResponse.json(
          { error: 'This coupon is not valid for your account type' },
          { status: 400 }
        );
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    
    switch (coupon.type) {
      case 'PERCENTAGE':
        discountAmount = (subtotal * Number(coupon.value)) / 100;
        if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
          discountAmount = Number(coupon.maxDiscount);
        }
        break;
      
      case 'FIXED_AMOUNT':
        discountAmount = Number(coupon.value);
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
        break;
      
      case 'FREE_SHIPPING':
        // Free shipping - discount handled separately
        discountAmount = 0;
        break;
      
      default:
        discountAmount = 0;
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: Number(coupon.value),
        discountAmount: Math.round(discountAmount * 100) / 100,
      },
    });

  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
