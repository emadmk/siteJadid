export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await prisma.customerGroup.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                accountType: true,
                loyaltyProfile: {
                  select: {
                    tier: true,
                    points: true,
                  },
                },
              },
            },
          },
        },
        categoryDiscounts: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        tieredPrices: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            categoryDiscounts: true,
            tieredPrices: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Customer group not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching customer group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer group' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existingGroup = await prisma.customerGroup.findUnique({
      where: { id: params.id },
    });

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Customer group not found' },
        { status: 404 }
      );
    }

    if (name && name !== existingGroup.name) {
      const nameExists = await prisma.customerGroup.findUnique({
        where: { name },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Customer group with this name already exists' },
          { status: 400 }
        );
      }
    }

    const group = await prisma.customerGroup.update({
      where: { id: params.id },
      data: {
        name,
        description,
        defaultDiscount,
        accountTypes,
        loyaltyTiers,
        isActive,
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

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error updating customer group:', error);
    return NextResponse.json(
      { error: 'Failed to update customer group' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await prisma.customerGroup.findUnique({
      where: { id: params.id },
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

    if (!group) {
      return NextResponse.json(
        { error: 'Customer group not found' },
        { status: 404 }
      );
    }

    if (
      group._count.members > 0 ||
      group._count.categoryDiscounts > 0 ||
      group._count.tieredPrices > 0
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot delete customer group with associated members, discounts, or prices',
        },
        { status: 400 }
      );
    }

    await prisma.customerGroup.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer group:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer group' },
      { status: 500 }
    );
  }
}
