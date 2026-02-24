export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendAccountApprovalNotification } from '@/lib/email-notifications';

// POST /api/admin/user-approval - Approve or reject a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, action } = await request.json();

    if (!userId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Update both new and legacy approval status fields
    const user = await db.user.update({
      where: { id: userId },
      data: {
        approvalStatus: status,
        gsaApprovalStatus: status, // Also update legacy field for compatibility
      },
      select: {
        id: true,
        name: true,
        email: true,
        accountType: true,
        approvalStatus: true,
        gsaApprovalStatus: true,
      },
    });

    // Send email notification to customer about approval/rejection (non-blocking)
    if (user.email) {
      sendAccountApprovalNotification({
        email: user.email,
        userName: user.name || 'Customer',
        accountType: user.accountType,
        status: status as 'APPROVED' | 'REJECTED',
        userId: user.id,
      }).catch(err => console.error('Failed to send account approval email:', err));
    }

    return NextResponse.json({
      success: true,
      user,
      message: action === 'approve'
        ? 'User has been approved successfully'
        : 'User has been rejected',
    });
  } catch (error) {
    console.error('Error processing user approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
