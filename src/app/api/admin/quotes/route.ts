import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      userId,
      items,
      validUntil,
      notes,
      termsAndConditions,
    } = body;

    if (!userId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'User and items are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const lastQuote = await prisma.quote.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const nextNumber = lastQuote
      ? parseInt(lastQuote.quoteNumber.replace('QT-', '')) + 1
      : 1;
    const quoteNumber = `QT-${String(nextNumber).padStart(6, '0')}`;

    let subtotal = 0;
    let totalTax = 0;
    let totalAmount = 0;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        userId,
        status: 'DRAFT',
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
        validUntil: validUntil
          ? new Date(validUntil)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes,
        termsAndConditions,
        items: {
          create: items.map((item: any) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemTax = itemSubtotal * (item.taxRate || 0);
            const itemTotal = itemSubtotal + itemTax;

            subtotal += itemSubtotal;
            totalTax += itemTax;
            totalAmount += itemTotal;

            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              taxRate: item.taxRate || 0,
              notes: item.notes,
            };
          }),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                price: true,
              },
            },
          },
        },
      },
    });

    await prisma.quote.update({
      where: { id: quote.id },
      data: { subtotal, taxAmount: totalTax, totalAmount },
    });

    return NextResponse.json(
      { ...quote, subtotal, taxAmount: totalTax, totalAmount },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}
