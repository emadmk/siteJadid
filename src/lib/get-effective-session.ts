import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from './auth';
import { db } from './db';

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

  // Check impersonation cookies
  const cookieStore = cookies();
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value;
  const impersonateAdminId = cookieStore.get('impersonate_admin_id')?.value;

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
