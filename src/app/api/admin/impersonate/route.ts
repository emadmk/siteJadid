export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/admin/impersonate - Start impersonating a user (SUPER_ADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can impersonate users' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Cannot impersonate yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 });
    }

    // Get target user
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accountType: true,
        gsaApprovalStatus: true,
        approvalStatus: true,
        image: true,
        isActive: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cannot impersonate other admins
    if (['SUPER_ADMIN', 'ADMIN'].includes(targetUser.role)) {
      return NextResponse.json({ error: 'Cannot impersonate admin users' }, { status: 403 });
    }

    // Log the impersonation for audit trail
    console.log(`[IMPERSONATE] SUPER_ADMIN ${session.user.email} (${session.user.id}) started impersonating ${targetUser.email} (${targetUser.id})`);

    // Return impersonation token data
    // The client will store this in a cookie/localStorage to indicate impersonation mode
    const response = NextResponse.json({
      success: true,
      impersonating: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        accountType: targetUser.accountType,
      },
      originalAdmin: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });

    // Set impersonation cookies
    response.cookies.set('impersonate_user_id', targetUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour max
    });

    response.cookies.set('impersonate_admin_id', session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    // Non-httpOnly cookie for the UI banner
    response.cookies.set('impersonate_user_name', targetUser.name || targetUser.email || '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Impersonation error:', error);
    return NextResponse.json({ error: 'Failed to impersonate user' }, { status: 500 });
  }
}

// DELETE /api/admin/impersonate - Stop impersonating
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = request.cookies.get('impersonate_admin_id')?.value;

    if (adminId) {
      console.log(`[IMPERSONATE] Admin ${adminId} stopped impersonation`);
    }

    const response = NextResponse.json({ success: true });

    // Clear impersonation cookies
    response.cookies.set('impersonate_user_id', '', { maxAge: 0, path: '/' });
    response.cookies.set('impersonate_admin_id', '', { maxAge: 0, path: '/' });
    response.cookies.set('impersonate_user_name', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to stop impersonation' }, { status: 500 });
  }
}
