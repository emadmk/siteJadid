export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/admin/email-test - Test email configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const testEmail = body.email || session.user.email;

    // Check env vars
    const host = process.env.EMAIL_SERVER_HOST;
    const port = parseInt(process.env.EMAIL_SERVER_PORT || '587');
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;
    const from = process.env.EMAIL_FROM || `ADA Supplies <${user}>`;

    const diagnostics: Record<string, any> = {
      EMAIL_SERVER_HOST: host ? `${host} (set)` : 'NOT SET',
      EMAIL_SERVER_PORT: port,
      EMAIL_SERVER_USER: user ? `${user.substring(0, 3)}***${user.substring(user.indexOf('@'))}` : 'NOT SET',
      EMAIL_SERVER_PASSWORD: pass ? 'SET (hidden)' : 'NOT SET',
      EMAIL_FROM: from,
    };

    if (!host || !user || !pass) {
      return NextResponse.json({
        success: false,
        error: 'SMTP not configured. Missing environment variables.',
        diagnostics,
        fix: 'Set EMAIL_SERVER_HOST, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD in your .env or server environment.',
      });
    }

    // Try to send test email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    // Verify connection first
    try {
      await transporter.verify();
      diagnostics.smtpConnection = 'SUCCESS';
    } catch (verifyError: any) {
      diagnostics.smtpConnection = 'FAILED';
      diagnostics.smtpError = verifyError.message;
      return NextResponse.json({
        success: false,
        error: `SMTP connection failed: ${verifyError.message}`,
        diagnostics,
        fix: verifyError.message.includes('auth')
          ? 'Check your email credentials. For Gmail, use an App Password (not your regular password).'
          : 'Check your SMTP host and port settings.',
      });
    }

    // Send test email
    await transporter.sendMail({
      from,
      to: testEmail,
      subject: 'ADA Supplies - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Configuration Test</h2>
          <p>This is a test email from ADA Supplies.</p>
          <p>If you received this, your email configuration is working correctly!</p>
          <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      diagnostics,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send test email',
    }, { status: 500 });
  }
}

// GET /api/admin/email-test - Check email configuration status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const host = process.env.EMAIL_SERVER_HOST;
    const port = process.env.EMAIL_SERVER_PORT;
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;

    return NextResponse.json({
      configured: !!(host && user && pass),
      settings: {
        host: host || 'NOT SET',
        port: port || '587',
        user: user ? `${user.substring(0, 3)}***` : 'NOT SET',
        password: pass ? 'SET' : 'NOT SET',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
