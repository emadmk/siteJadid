export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/b2b/members - List all members of B2B account
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get B2B profile
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
      return NextResponse.json({ error: 'Only account admin can view members' }, { status: 403 });
    }

    // Get all members
    const members = await db.b2BAccountMember.findMany({
      where: {
        b2bProfileId: b2bProfile.id,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Get B2B members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/b2b/members - Invite new member to B2B account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      email,
      role,
      department,
      costCenterId,
      orderLimit,
      monthlyLimit,
      requiresApproval,
      approvalThreshold,
    } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Get B2B profile
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
      return NextResponse.json({ error: 'Only account admin can add members' }, { status: 403 });
    }

    // Check if user exists
    let invitedUser = await db.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create placeholder
    if (!invitedUser) {
      invitedUser = await db.user.create({
        data: {
          email,
          role: 'B2B_CUSTOMER',
          accountType: 'B2B',
          isActive: false, // Will be activated when they accept invite
        },
      });
    }

    // Check if already member
    const existingMember = await db.b2BAccountMember.findFirst({
      where: {
        b2bProfileId: b2bProfile.id,
        userId: invitedUser.id,
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Create member
    const member = await db.b2BAccountMember.create({
      data: {
        b2bProfileId: b2bProfile.id,
        userId: invitedUser.id,
        role,
        department,
        costCenterId,
        orderLimit: orderLimit ? parseFloat(orderLimit) : null,
        monthlyLimit: monthlyLimit ? parseFloat(monthlyLimit) : null,
        requiresApproval: requiresApproval || false,
        approvalThreshold: approvalThreshold ? parseFloat(approvalThreshold) : null,
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

    // TODO: Send invitation email

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Add B2B member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
