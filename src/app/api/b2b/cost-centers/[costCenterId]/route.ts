export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/b2b/cost-centers/[costCenterId]
export async function GET(
  request: NextRequest,
  { params }: { params: { costCenterId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const costCenter = await db.costCenter.findUnique({
      where: { id: params.costCenterId },
      include: {
        b2bProfile: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!costCenter) {
      return NextResponse.json({ error: 'Cost center not found' }, { status: 404 });
    }

    // Verify access
    if (costCenter.b2bProfile.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(costCenter);
  } catch (error) {
    console.error('Get cost center error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/b2b/cost-centers/[costCenterId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { costCenterId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const costCenter = await db.costCenter.findUnique({
      where: { id: params.costCenterId },
      include: {
        b2bProfile: true,
      },
    });

    if (!costCenter) {
      return NextResponse.json({ error: 'Cost center not found' }, { status: 404 });
    }

    // Check if user is ACCOUNT_ADMIN
    const userMember = await db.b2BAccountMember.findFirst({
      where: {
        b2bProfileId: costCenter.b2bProfileId,
        userId: session.user.id,
      },
    });

    if (!userMember || userMember.role !== 'ACCOUNT_ADMIN') {
      return NextResponse.json(
        { error: 'Only account admin can update cost centers' },
        { status: 403 }
      );
    }

    const updated = await db.costCenter.update({
      where: { id: params.costCenterId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.budgetAmount && { budgetAmount: parseFloat(data.budgetAmount) }),
        ...(data.budgetPeriod && { budgetPeriod: data.budgetPeriod }),
        ...(data.budgetStartDate && { budgetStartDate: new Date(data.budgetStartDate) }),
        ...(data.budgetEndDate !== undefined && {
          budgetEndDate: data.budgetEndDate ? new Date(data.budgetEndDate) : null,
        }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update cost center error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/b2b/cost-centers/[costCenterId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { costCenterId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const costCenter = await db.costCenter.findUnique({
      where: { id: params.costCenterId },
      include: {
        b2bProfile: true,
      },
    });

    if (!costCenter) {
      return NextResponse.json({ error: 'Cost center not found' }, { status: 404 });
    }

    // Check if user is ACCOUNT_ADMIN
    const userMember = await db.b2BAccountMember.findFirst({
      where: {
        b2bProfileId: costCenter.b2bProfileId,
        userId: session.user.id,
      },
    });

    if (!userMember || userMember.role !== 'ACCOUNT_ADMIN') {
      return NextResponse.json(
        { error: 'Only account admin can delete cost centers' },
        { status: 403 }
      );
    }

    await db.costCenter.delete({
      where: { id: params.costCenterId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete cost center error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
