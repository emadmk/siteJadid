export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate request body
    const body = await req.json();
    const validation = updateApprovalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { status, notes } = validation.data;

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        gsaApprovalStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user approval status and account type
    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: {
        gsaApprovalStatus: status,
        accountType: status === 'APPROVED' ? 'GSA' : 'B2C',
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        accountType: true,
        gsaApprovalStatus: true,
        gsaNumber: true,
      },
    });

    // TODO: Send email notification to user about the decision
    // This would be implemented with an email service like SendGrid or AWS SES

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `GSA approval ${status.toLowerCase()} successfully`,
    });
  } catch (error: any) {
    console.error('Error updating GSA approval status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
