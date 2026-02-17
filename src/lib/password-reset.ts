// Password reset email builder and sender

import { getBaseUrl } from './email-templates';
import { sendPasswordResetNotification } from './email-notifications';

export async function sendResetEmail(
  email: string,
  token: string,
  userName?: string,
  requestUrl?: string
): Promise<boolean> {
  try {
    // Build reset URL using correct base URL
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;

    if (!baseUrl && requestUrl) {
      try {
        const url = new URL(requestUrl);
        baseUrl = url.origin;
      } catch {
        // ignore
      }
    }

    if (!baseUrl) {
      baseUrl = getBaseUrl();
    }

    baseUrl = baseUrl.replace(/\/$/, '');
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    return await sendPasswordResetNotification({
      email,
      userName,
      resetUrl,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

// Keep backward compatibility - re-export the old function name
export { sendResetEmail as sendPasswordResetEmail };
