import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/b2b/members/[memberId] - Get member details
export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await db.b2BAccountMember.findUnique({
      where: { id: params.memberId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            isActive: true,
          },
        },
        costCenter: true,
        b2bProfile: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Verify access
    if (member.b2bProfile.userId !== session.user.id && member.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Get B2B member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/b2b/members/[memberId] - Update member
export async function PATCH(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      role,
      department,
      costCenterId,
      orderLimit,
      monthlyLimit,
      requiresApproval,
      approvalThreshold,
      isActive,
    } = await request.json();

    const member = await db.b2BAccountMember.findUnique({
      where: { id: params.memberId },
      include: {
        b2bProfile: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if user is ACCOUNT_ADMIN
    const userMember = await db.b2BAccountMember.findFirst({
      where: {
        b2bProfileId: member.b2bProfileId,
        userId: session.user.id,
      },
    });

    if (!userMember || userMember.role !== 'ACCOUNT_ADMIN') {
      return NextResponse.json({ error: 'Only account admin can update members' }, { status: 403 });
    }

    // Update member
    const updatedMember = await db.b2BAccountMember.update({
      where: { id: params.memberId },
      data: {
        ...(role && { role }),
        ...(department !== undefined && { department }),
        ...(costCenterId !== undefined && { costCenterId }),
        ...(orderLimit !== undefined && { orderLimit: orderLimit ? parseFloat(orderLimit) : null }),
        ...(monthlyLimit !== undefined && { monthlyLimit: monthlyLimit ? parseFloat(monthlyLimit) : null }),
        ...(requiresApproval !== undefined && { requiresApproval }),
        ...(approvalThreshold !== undefined && {
          approvalThreshold: approvalThreshold ? parseFloat(approvalThreshold) : null,
        }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            isActive: true,
          },
        },
        costCenter: true,
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Update B2B member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/b2b/members/[memberId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const member = await db.b2BAccountMember.findUnique({
      where: { id: params.memberId },
      include: {
        b2bProfile: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Check if user is ACCOUNT_ADMIN
    const userMember = await db.b2BAccountMember.findFirst({
      where: {
        b2bProfileId: member.b2bProfileId,
        userId: session.user.id,
      },
    });

    if (!userMember || userMember.role !== 'ACCOUNT_ADMIN') {
      return NextResponse.json({ error: 'Only account admin can remove members' }, { status: 403 });
    }

    // Cannot remove yourself if you're the only admin
    if (member.userId === session.user.id) {
      const adminCount = await db.b2BAccountMember.count({
        where: {
          b2bProfileId: member.b2bProfileId,
          role: 'ACCOUNT_ADMIN',
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin. Assign another admin first.' },
          { status: 400 }
        );
      }
    }

    await db.b2BAccountMember.delete({
      where: { id: params.memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete B2B member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
