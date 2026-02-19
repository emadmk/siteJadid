export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const groupId = searchParams.get('groupId');

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (groupId) {
      where.customerGroupId = groupId;
    }

    const tieredPrices = await prisma.tieredPrice.findMany({
      where,
      orderBy: [{ productId: 'asc' }, { minQuantity: 'asc' }],
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

    return NextResponse.json(tieredPrices);
  } catch (error) {
    console.error('Error fetching tiered prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tiered prices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      productId,
      minQuantity,
      maxQuantity,
      price,
      customerGroupId,
      accountTypes,
    } = body;

    if (!productId || !minQuantity || price === undefined) {
      return NextResponse.json(
        { error: 'Product ID, minimum quantity, and price are required' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (customerGroupId) {
      const group = await prisma.customerGroup.findUnique({
        where: { id: customerGroupId },
      });

      if (!group) {
        return NextResponse.json(
          { error: 'Customer group not found' },
          { status: 404 }
        );
      }
    }

    const overlapping = await prisma.tieredPrice.findFirst({
      where: {
        productId,
        customerGroupId: customerGroupId || null,
        OR: [
          {
            AND: [
              { minQuantity: { lte: minQuantity } },
              {
                OR: [
                  { maxQuantity: { gte: minQuantity } },
                  { maxQuantity: null },
                ],
              },
            ],
          },
          {
            AND: [
              { minQuantity: { lte: maxQuantity || 999999 } },
              {
                OR: [
                  { maxQuantity: { gte: maxQuantity || 999999 } },
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

    const tieredPrice = await prisma.tieredPrice.create({
      data: {
        productId,
        minQuantity,
        maxQuantity,
        price,
        customerGroupId,
        accountTypes: accountTypes || [],
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

    return NextResponse.json(tieredPrice, { status: 201 });
  } catch (error) {
    console.error('Error creating tiered price:', error);
    return NextResponse.json(
      { error: 'Failed to create tiered price' },
      { status: 500 }
    );
  }
}
