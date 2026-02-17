export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PATCH /api/b2b/approvals/[approvalId] - Approve or reject
export async function PATCH(
  request: NextRequest,
  { params }: { params: { approvalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, approverNotes } = await request.json();

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const approval = await db.orderApproval.findUnique({
      where: { id: params.approvalId },
      include: {
        approver: {
          include: {
            user: true,
          },
        },
        order: true,
      },
    });

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }

    // Verify approver
    if (approval.approver.userId !== session.user.id) {
      return NextResponse.json({ error: 'Only assigned approver can approve/reject' }, { status: 403 });
    }

    if (approval.status !== 'PENDING') {
      return NextResponse.json({ error: 'Approval already processed' }, { status: 400 });
    }

    // Update approval
    const updated = await db.orderApproval.update({
      where: { id: params.approvalId },
      data: {
        status,
        approvedAt: new Date(),
        approverNotes,
      },
    });

    // If approved, update order status
    if (status === 'APPROVED') {
      await db.order.update({
        where: { id: approval.orderId },
        data: {
          status: 'PROCESSING',
        },
      });
    }

    // If rejected, cancel order
    if (status === 'REJECTED') {
      await db.order.update({
        where: { id: approval.orderId },
        data: {
          status: 'CANCELLED',
        },
      });
    }

    // TODO: Send notification email

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
