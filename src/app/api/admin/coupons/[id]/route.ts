import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return NextResponse.json({ error: 'Failed to fetch coupon' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      name,
      description,
      type,
      value,
      minPurchase,
      maxDiscount,
      usageLimit,
      perUserLimit,
      startsAt,
      endsAt,
      isActive,
      autoApply,
    } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = value;
    if (minPurchase !== undefined) updateData.minPurchase = minPurchase;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (perUserLimit !== undefined) updateData.perUserLimit = perUserLimit;
    if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);
    if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (autoApply !== undefined) updateData.autoApply = autoApply;

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(coupon);
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
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

    await prisma.coupon.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}
