import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
import { authOptions } from './auth';
import { db } from './db';

/**
 * Parse a specific cookie value from a raw Cookie header string.
 */
function parseCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Get the effective session, considering impersonation.
 * When a SUPER_ADMIN is impersonating a customer, this returns
 * a session that looks like the customer's session.
 */
export async function getEffectiveSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  // Check impersonation cookies from request headers
  // Using headers() instead of cookies() for better compatibility
  let impersonateUserId: string | undefined;
  let impersonateAdminId: string | undefined;

  try {
    const headersList = headers();
    const cookieHeader = headersList.get('cookie');
    impersonateUserId = parseCookie(cookieHeader, 'impersonate_user_id');
    impersonateAdminId = parseCookie(cookieHeader, 'impersonate_admin_id');
  } catch {
    // headers() not available in this context
    return session;
  }

  // Only allow impersonation if the actual session belongs to the admin who started it
  if (!impersonateUserId || !impersonateAdminId || impersonateAdminId !== session.user.id) {
    return session;
  }

  // Verify the actual user is a SUPER_ADMIN
  if (session.user.role !== 'SUPER_ADMIN') {
    return session;
  }

  // Fetch the impersonated user's data
  try {
    const targetUser = await db.user.findUnique({
      where: { id: impersonateUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accountType: true,
        gsaApprovalStatus: true,
        approvalStatus: true,
        image: true,
        emailVerified: true,
      },
    });

    if (!targetUser) {
      return session;
    }

    // Return a session that looks like the target user
    return {
      ...session,
      user: {
        ...session.user,
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        accountType: targetUser.accountType,
        gsaApprovalStatus: targetUser.gsaApprovalStatus,
        approvalStatus: targetUser.approvalStatus,
        image: targetUser.image,
        emailVerified: !!targetUser.emailVerified,
      },
      impersonating: true,
      originalAdminId: impersonateAdminId,
    };
  } catch (error) {
    console.error('[IMPERSONATE] Error fetching target user:', error);
    return session;
  }
}
