export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/gift-cards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const [giftCards, total] = await Promise.all([
      prisma.giftCard.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.giftCard.count({ where }),
    ]);

    return NextResponse.json({
      giftCards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching gift cards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gift cards', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/gift-cards
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    // Generate unique code
    const code = data.code || generateGiftCardCode();

    // Check if code already exists
    const existing = await prisma.giftCard.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Gift card code already exists' },
        { status: 400 }
      );
    }

    const giftCard = await prisma.giftCard.create({
      data: {
        code,
        initialAmount: data.initialAmount,
        currentBalance: data.initialAmount,
        status: 'ACTIVE',
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        message: data.message,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        minPurchase: data.minPurchase,
        accountTypes: data.accountTypes || [],
      },
      include: {
        transactions: true,
      },
    });

    // Create initial transaction
    await prisma.giftCardTransaction.create({
      data: {
        giftCardId: giftCard.id,
        type: 'PURCHASE',
        amount: data.initialAmount,
        balanceBefore: 0,
        balanceAfter: data.initialAmount,
        description: 'Gift card created',
      },
    });

    return NextResponse.json(giftCard);
  } catch (error: any) {
    console.error('Error creating gift card:', error);
    return NextResponse.json(
      { error: 'Failed to create gift card', details: error.message },
      { status: 500 }
    );
  }
}

function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
