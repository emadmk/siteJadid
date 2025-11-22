import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const discount = await prisma.categoryDiscount.findUnique({
      where: { id: params.id },
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

    if (!discount) {
      return NextResponse.json(
        { error: 'Category discount not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(discount);
  } catch (error) {
    console.error('Error fetching category discount:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category discount' },
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
      discountType,
      discountValue,
      accountTypes,
      loyaltyTiers,
      startsAt,
      endsAt,
      isActive,
    } = body;

    const existingDiscount = await prisma.categoryDiscount.findUnique({
      where: { id: params.id },
    });

    if (!existingDiscount) {
      return NextResponse.json(
        { error: 'Category discount not found' },
        { status: 404 }
      );
    }

    const discount = await prisma.categoryDiscount.update({
      where: { id: params.id },
      data: {
        name,
        discountType,
        discountValue,
        accountTypes,
        loyaltyTiers,
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive,
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

    return NextResponse.json(discount);
  } catch (error) {
    console.error('Error updating category discount:', error);
    return NextResponse.json(
      { error: 'Failed to update category discount' },
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

    const discount = await prisma.categoryDiscount.findUnique({
      where: { id: params.id },
    });

    if (!discount) {
      return NextResponse.json(
        { error: 'Category discount not found' },
        { status: 404 }
      );
    }

    await prisma.categoryDiscount.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category discount:', error);
    return NextResponse.json(
      { error: 'Failed to delete category discount' },
      { status: 500 }
    );
  }
}
