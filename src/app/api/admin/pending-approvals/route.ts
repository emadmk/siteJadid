export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/pending-approvals - Get all pending approvals
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all users with pending approval (both new and legacy fields)
    const users = await db.user.findMany({
      where: {
        OR: [
          // New approval status
          { approvalStatus: 'PENDING' },
          // Legacy GSA approval status
          { gsaApprovalStatus: 'PENDING' },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        accountType: true,
        governmentDepartment: true,
        gsaDepartment: true,
        approvalStatus: true,
        gsaApprovalStatus: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
