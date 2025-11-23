import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/b2b/cost-centers - List all cost centers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const b2bProfile = await db.b2BProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!b2bProfile) {
      return NextResponse.json({ error: 'B2B profile not found' }, { status: 404 });
    }

    const costCenters = await db.costCenter.findMany({
      where: {
        b2bProfileId: b2bProfile.id,
      },
      include: {
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
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(costCenters);
  } catch (error) {
    console.error('Get cost centers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/b2b/cost-centers - Create cost center
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      code,
      name,
      description,
      budgetAmount,
      budgetPeriod,
      budgetStartDate,
      budgetEndDate,
      managerId,
    } = await request.json();

    if (!code || !name || !budgetAmount || !budgetStartDate) {
      return NextResponse.json(
        { error: 'Code, name, budget amount, and start date are required' },
        { status: 400 }
      );
    }

    const b2bProfile = await db.b2BProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!b2bProfile) {
      return NextResponse.json({ error: 'B2B profile not found' }, { status: 404 });
    }

    // Check if user is ACCOUNT_ADMIN
    const userMember = await db.b2BAccountMember.findFirst({
      where: {
        b2bProfileId: b2bProfile.id,
        userId: session.user.id,
      },
    });

    if (!userMember || userMember.role !== 'ACCOUNT_ADMIN') {
      return NextResponse.json(
        { error: 'Only account admin can create cost centers' },
        { status: 403 }
      );
    }

    // Check if code already exists
    const existing = await db.costCenter.findFirst({
      where: {
        b2bProfileId: b2bProfile.id,
        code,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Cost center code already exists' }, { status: 400 });
    }

    const costCenter = await db.costCenter.create({
      data: {
        b2bProfileId: b2bProfile.id,
        code,
        name,
        description,
        budgetAmount: parseFloat(budgetAmount),
        budgetPeriod: budgetPeriod || 'MONTHLY',
        budgetStartDate: new Date(budgetStartDate),
        budgetEndDate: budgetEndDate ? new Date(budgetEndDate) : null,
        managerId,
      },
    });

    return NextResponse.json(costCenter, { status: 201 });
  } catch (error) {
    console.error('Create cost center error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
