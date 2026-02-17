// Email verification token generation and sending

import crypto from 'crypto';
import { db } from './db';
import { getBaseUrl } from './email-templates';
import { sendVerificationNotification, sendWelcomeEmail } from './email-notifications';

const TOKEN_EXPIRY_HOURS = 24;

/**
 * Generate a verification token and store it in the database
 */
export async function createVerificationToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Remove any existing tokens for this email
  await db.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Create new token
  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Verify a token and mark email as verified
 */
export async function verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  const record = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!record) {
    return { success: false, error: 'Invalid or expired verification link' };
  }

  if (record.expires < new Date()) {
    // Clean up expired token
    await db.verificationToken.delete({
      where: { token },
    });
    return { success: false, error: 'Verification link has expired. Please request a new one.' };
  }

  // Mark user email as verified
  await db.user.updateMany({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });

  // Delete used token
  await db.verificationToken.delete({
    where: { token },
  });

  return { success: true, email: record.identifier };
}

/**
 * Build verification URL using the correct public base URL
 */
export function buildVerifyUrl(token: string, requestUrl?: string): string {
  // Priority: 1. NEXT_PUBLIC_SITE_URL, 2. NEXTAUTH_URL, 3. Request origin, 4. NEXT_PUBLIC_APP_URL
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

  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');

  return `${baseUrl}/api/auth/verify-email?token=${token}`;
}

/**
 * Send verification email using the new template system
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  userName?: string,
  requestUrl?: string
): Promise<boolean> {
  try {
    const verifyUrl = buildVerifyUrl(token, requestUrl);

    return await sendVerificationNotification({
      email,
      userName,
      verifyUrl,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

/**
 * Send welcome email with verification link
 */
export async function sendWelcomeWithVerification(data: {
  email: string;
  userName: string;
  accountType: string;
  token: string;
  userId?: string;
  requestUrl?: string;
}): Promise<boolean> {
  try {
    const verifyUrl = buildVerifyUrl(data.token, data.requestUrl);

    return await sendWelcomeEmail({
      email: data.email,
      userName: data.userName,
      accountType: data.accountType,
      verifyUrl,
      userId: data.userId,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}
