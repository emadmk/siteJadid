export const dynamic = 'force-dynamic';
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
    const categoryId = searchParams.get('categoryId');
    const groupId = searchParams.get('groupId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (groupId) {
      where.customerGroupId = groupId;
    }

    if (activeOnly) {
      where.isActive = true;
      where.startsAt = { lte: new Date() };
      where.OR = [{ endsAt: null }, { endsAt: { gte: new Date() } }];
    }

    const discounts = await prisma.categoryDiscount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
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

    return NextResponse.json(discounts);
  } catch (error) {
    console.error('Error fetching category discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category discounts' },
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
      categoryId,
      customerGroupId,
      discountType,
      discountValue,
      accountTypes,
      loyaltyTiers,
      startsAt,
      endsAt,
      isActive,
    } = body;

    if (!name || !categoryId || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: 'Name, category, discount type, and value are required' },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
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

    const discount = await prisma.categoryDiscount.create({
      data: {
        name,
        categoryId,
        customerGroupId,
        discountType,
        discountValue,
        accountTypes: accountTypes || [],
        loyaltyTiers: loyaltyTiers || [],
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
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

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error('Error creating category discount:', error);
    return NextResponse.json(
      { error: 'Failed to create category discount' },
      { status: 500 }
    );
  }
}
