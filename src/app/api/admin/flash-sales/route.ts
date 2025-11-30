import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/flash-sales
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const flashSales = await prisma.flashSale.findMany({
      include: {
        items: {
          take: 10,
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { startsAt: 'desc' },
    });

    return NextResponse.json(flashSales);
  } catch (error: any) {
    console.error('Error fetching flash sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flash sales', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/flash-sales
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();

    const flashSale = await prisma.flashSale.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description,
        status: data.status || 'SCHEDULED',
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        bannerImage: data.bannerImage,
        badgeText: data.badgeText || 'Flash Sale',
        priority: data.priority || 0,
        maxQuantity: data.maxQuantity,
        maxPerUser: data.maxPerUser,
        accountTypes: data.accountTypes || [],
        loyaltyTiers: data.loyaltyTiers || [],
        isFeatured: data.isFeatured ?? true,
        isActive: data.isActive ?? true,
        notifyUsers: data.notifyUsers ?? true,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(flashSale);
  } catch (error: any) {
    console.error('Error creating flash sale:', error);
    return NextResponse.json(
      { error: 'Failed to create flash sale', details: error.message },
      { status: 500 }
    );
  }
}
