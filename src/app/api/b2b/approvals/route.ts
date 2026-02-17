export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/b2b/approvals - Get pending approvals for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type'); // 'pending' or 'my-requests'

    // Get user's B2B membership
    const membership = await db.b2BAccountMember.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a B2B member' }, { status: 404 });
    }

    let approvals;

    if (type === 'my-requests') {
      // Get approvals requested by this user
      approvals = await db.orderApproval.findMany({
        where: {
          requestedById: membership.id,
          ...(status && { status: status as any }),
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              createdAt: true,
            },
          },
          approver: {
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
        },
        orderBy: {
          requestedAt: 'desc',
        },
      });
    } else {
      // Get approvals pending for this user to approve
      approvals = await db.orderApproval.findMany({
        where: {
          approverId: membership.id,
          ...(status && { status: status as any }),
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              createdAt: true,
              items: {
                select: {
                  id: true,
                  productId: true,
                  quantity: true,
                  price: true,
                },
              },
            },
          },
          requester: {
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
        },
        orderBy: {
          requestedAt: 'desc',
        },
      });
    }

    return NextResponse.json(approvals);
  } catch (error) {
    console.error('Get approvals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
