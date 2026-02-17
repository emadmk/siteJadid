import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

// POST /api/email/send - Admin only (CRIT-2 fix)
export async function POST(request: NextRequest) {
  try {
    // SECURITY FIX: Require admin authentication
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.to || !data.subject || !data.html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Get email service settings
    const settings = await prisma.emailServiceSettings.findFirst({
      where: { isActive: true, isDefault: true },
    });

    if (!settings) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    let emailId: string | null = null;

    // Send email based on provider
    switch (settings.provider) {
      case 'RESEND':
        emailId = await sendWithResend(settings, data);
        break;
      case 'SENDGRID':
        emailId = await sendWithSendGrid(settings, data);
        break;
      case 'SES':
        emailId = await sendWithSES(settings, data);
        break;
      default:
        throw new Error('Unsupported email provider');
    }

    // Log email
    await prisma.emailLog.create({
      data: {
        toEmail: data.to,
        toName: data.toName,
        subject: data.subject,
        htmlContent: data.html,
        emailType: data.type || 'CUSTOM',
        userId: data.userId,
        orderId: data.orderId,
        templateId: data.templateId,
        status: 'SENT',
        provider: settings.provider.toLowerCase(),
        providerId: emailId,
        sentAt: new Date(),
      },
    });

    // Update usage stats
    await prisma.emailServiceSettings.update({
      where: { id: settings.id },
      data: {
        emailsSentToday: { increment: 1 },
        emailsSentMonth: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, emailId });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

async function sendWithResend(settings: any, data: any): Promise<string> {
  const resend = new Resend(settings.apiKey);

  const result = await resend.emails.send({
    from: data.from || `${settings.defaultFromName} <${settings.defaultFromEmail}>`,
    to: data.to,
    subject: data.subject,
    html: data.html,
    text: data.text,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data?.id || '';
}

async function sendWithSendGrid(settings: any, data: any): Promise<string> {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: data.to, name: data.toName }],
        },
      ],
      from: {
        email: settings.defaultFromEmail,
        name: settings.defaultFromName,
      },
      subject: data.subject,
      content: [
        {
          type: 'text/html',
          value: data.html,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'SendGrid error');
  }

  return response.headers.get('x-message-id') || '';
}

async function sendWithSES(settings: any, data: any): Promise<string> {
  // AWS SES integration would go here
  // This is a simplified version
  throw new Error('SES integration not implemented yet');
}
