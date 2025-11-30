import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/flash-sales/active
export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    const flashSales = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        items: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        priority: 'desc',
      },
    });

    return NextResponse.json(flashSales);
  } catch (error: any) {
    console.error('Error fetching active flash sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active flash sales', details: error.message },
      { status: 500 }
    );
  }
}
