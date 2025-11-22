import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeMembers = searchParams.get('includeMembers') === 'true';

    const groups = await prisma.customerGroup.findMany({
      orderBy: { name: 'asc' },
      include: {
        members: includeMembers
          ? {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    accountType: true,
                  },
                },
              },
            }
          : false,
        _count: {
          select: {
            members: true,
            categoryDiscounts: true,
            tieredPrices: true,
          },
        },
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching customer groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer groups' },
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
      name,
      description,
      defaultDiscount,
      accountTypes,
      loyaltyTiers,
      isActive,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const existingGroup = await prisma.customerGroup.findUnique({
      where: { name },
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Customer group with this name already exists' },
        { status: 400 }
      );
    }

    const group = await prisma.customerGroup.create({
      data: {
        name,
        description,
        defaultDiscount: defaultDiscount || 0,
        accountTypes: accountTypes || [],
        loyaltyTiers: loyaltyTiers || [],
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        _count: {
          select: {
            members: true,
            categoryDiscounts: true,
            tieredPrices: true,
          },
        },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating customer group:', error);
    return NextResponse.json(
      { error: 'Failed to create customer group' },
      { status: 500 }
    );
  }
}
