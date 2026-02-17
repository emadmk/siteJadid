export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/gsa-approvals - Get all GSA users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await db.user.findMany({
      where: {
        accountType: 'GSA',
      },
      select: {
        id: true,
        name: true,
        email: true,
        gsaDepartment: true,
        gsaApprovalStatus: true,
        accountType: true,
        createdAt: true,
      },
      orderBy: [
        { gsaApprovalStatus: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching GSA users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/gsa-approvals - Update GSA approval status
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, status } = await request.json();

    if (!userId || !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { gsaApprovalStatus: status },
      select: {
        id: true,
        name: true,
        email: true,
        gsaDepartment: true,
        gsaApprovalStatus: true,
        accountType: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating GSA approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
