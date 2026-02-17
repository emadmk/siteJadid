// Email verification token generation and sending

import crypto from 'crypto';
import { db } from './db';

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
 * Build the verification email HTML
 */
export function buildVerificationEmailHtml(verifyUrl: string, userName?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 24px;">Verify Your Email Address</h1>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Hi${userName ? ` ${userName}` : ''},
    </p>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Thank you for creating an account. Please verify your email address by clicking the button below:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}"
         style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    <p style="color: #888; font-size: 14px;">
      This link will expire in ${TOKEN_EXPIRY_HOURS} hours. If you didn't create an account, you can safely ignore this email.
    </p>
    <p style="color: #888; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
      If the button doesn't work, copy and paste this URL into your browser:<br>
      <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
    </p>
  </div>
</body>
</html>`;
}

/**
 * Send verification email using the configured email service
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  userName?: string
): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;
    const html = buildVerificationEmailHtml(verifyUrl, userName);

    // Try to use the internal email API
    const response = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Verify Your Email Address',
        html,
        type: 'VERIFICATION',
      }),
    });

    // If internal API fails (no admin session), try SMTP directly
    if (!response.ok) {
      return await sendViaSMTP(email, 'Verify Your Email Address', html);
    }

    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

/**
 * Fallback: send email via SMTP if configured
 */
async function sendViaSMTP(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const host = process.env.EMAIL_SERVER_HOST;
    const port = parseInt(process.env.EMAIL_SERVER_PORT || '587');
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;
    const from = process.env.EMAIL_FROM;

    if (!host || !user || !pass || !from) {
      console.warn('SMTP not configured - verification email not sent');
      return false;
    }

    // Use nodemailer if available, otherwise log the verification link
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({ from, to, subject, html });
      return true;
    } catch {
      console.warn('Nodemailer not available - verification email logged to console');
      return false;
    }
  } catch (error) {
    console.error('SMTP send error:', error);
    return false;
  }
}
