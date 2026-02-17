// Password reset email builder and sender

const TOKEN_EXPIRY_HOURS = 1;

export function buildPasswordResetEmailHtml(resetUrl: string, userName?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 24px;">Reset Your Password</h1>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      Hi${userName ? ` ${userName}` : ''},
    </p>
    <p style="color: #555; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to set a new password:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}"
         style="background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color: #888; font-size: 14px;">
      This link will expire in ${TOKEN_EXPIRY_HOURS} hour. If you didn't request a password reset, you can safely ignore this email.
    </p>
    <p style="color: #888; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
      If the button doesn't work, copy and paste this URL into your browser:<br>
      <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
    </p>
  </div>
</body>
</html>`;
}

export async function sendResetEmail(
  email: string,
  token: string,
  userName?: string
): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;
    const html = buildPasswordResetEmailHtml(resetUrl, userName);

    // Try to use the internal email API
    const response = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Reset Your Password',
        html,
        type: 'PASSWORD_RESET',
      }),
    });

    // If internal API fails, try SMTP directly
    if (!response.ok) {
      return await sendViaSMTP(email, 'Reset Your Password', html);
    }

    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

async function sendViaSMTP(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const host = process.env.EMAIL_SERVER_HOST;
    const port = parseInt(process.env.EMAIL_SERVER_PORT || '587');
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;
    const from = process.env.EMAIL_FROM;

    if (!host || !user || !pass || !from) {
      console.warn('SMTP not configured - password reset email not sent');
      return false;
    }

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
      console.warn('Nodemailer not available - password reset email logged to console');
      return false;
    }
  } catch (error) {
    console.error('SMTP send error:', error);
    return false;
  }
}
