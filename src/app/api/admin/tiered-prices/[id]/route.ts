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

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tieredPrice = await prisma.tieredPrice.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: true,
            basePrice: true,
          },
        },
        customerGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!tieredPrice) {
      return NextResponse.json(
        { error: 'Tiered price not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tieredPrice);
  } catch (error) {
    console.error('Error fetching tiered price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tiered price' },
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

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { minQuantity, maxQuantity, price, accountTypes } = body;

    const existingTier = await prisma.tieredPrice.findUnique({
      where: { id: params.id },
    });

    if (!existingTier) {
      return NextResponse.json(
        { error: 'Tiered price not found' },
        { status: 404 }
      );
    }

    if (minQuantity || maxQuantity) {
      const overlapping = await prisma.tieredPrice.findFirst({
        where: {
          id: { not: params.id },
          productId: existingTier.productId,
          customerGroupId: existingTier.customerGroupId,
          OR: [
            {
              AND: [
                { minQuantity: { lte: minQuantity || existingTier.minQuantity } },
                {
                  OR: [
                    { maxQuantity: { gte: minQuantity || existingTier.minQuantity } },
                    { maxQuantity: null },
                  ],
                },
              ],
            },
            {
              AND: [
                {
                  minQuantity: {
                    lte: maxQuantity || existingTier.maxQuantity || 999999,
                  },
                },
                {
                  OR: [
                    {
                      maxQuantity: {
                        gte: maxQuantity || existingTier.maxQuantity || 999999,
                      },
                    },
                    { maxQuantity: null },
                  ],
                },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        return NextResponse.json(
          { error: 'Quantity range overlaps with existing tier' },
          { status: 400 }
        );
      }
    }

    const tieredPrice = await prisma.tieredPrice.update({
      where: { id: params.id },
      data: {
        minQuantity,
        maxQuantity,
        price,
        accountTypes,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: true,
            basePrice: true,
          },
        },
        customerGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(tieredPrice);
  } catch (error) {
    console.error('Error updating tiered price:', error);
    return NextResponse.json(
      { error: 'Failed to update tiered price' },
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

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tieredPrice = await prisma.tieredPrice.findUnique({
      where: { id: params.id },
    });

    if (!tieredPrice) {
      return NextResponse.json(
        { error: 'Tiered price not found' },
        { status: 404 }
      );
    }

    await prisma.tieredPrice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tiered price:', error);
    return NextResponse.json(
      { error: 'Failed to delete tiered price' },
      { status: 500 }
    );
  }
}
