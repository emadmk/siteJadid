export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { baseLayout } from '@/lib/email-templates';

// POST /api/admin/send-customer-email - Send email to a customer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CUSTOMER_SERVICE'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { to, subject, message, orderId } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Build email content using the branded template
    const content = `
      <div style="padding: 0 0 30px;">
        <p style="font-size: 16px; color: #1a1a1a; line-height: 1.6; margin: 0 0 20px;">
          ${message.replace(/\n/g, '<br/>')}
        </p>
      </div>
      <div style="padding: 20px 0 0; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 13px; color: #6b7280; margin: 0;">
          This email was sent by the ADA Supply customer service team.
          If you have any questions, please reply to this email or contact us at support.
        </p>
      </div>
    `;

    const html = baseLayout(content, subject);

    // Send email via SMTP
    const host = process.env.EMAIL_SERVER_HOST;
    const port = parseInt(process.env.EMAIL_SERVER_PORT || '587');
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;
    const rawFrom = process.env.EMAIL_FROM || user;

    if (!host || !user || !pass) {
      return NextResponse.json(
        { error: 'Email server not configured' },
        { status: 500 }
      );
    }

    const from = rawFrom && rawFrom.includes('<')
      ? rawFrom
      : `ADA Supply <${rawFrom}>`;

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    const result = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    // Log the email
    try {
      await db.emailLog.create({
        data: {
          toEmail: to,
          subject,
          emailType: 'CUSTOM',
          orderId: orderId || undefined,
          status: 'SENT',
          provider: 'smtp',
          sentAt: new Date(),
        },
      });
    } catch (logError) {
      console.error('[EMAIL] Failed to log email:', logError);
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error('Error sending customer email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
