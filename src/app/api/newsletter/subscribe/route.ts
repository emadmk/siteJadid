export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  baseLayout,
  button,
  divider,
  BRAND,
  ensureBrandLoaded,
  getBaseUrl,
} from '@/lib/email-templates';

/**
 * Build a branded welcome email for new newsletter subscribers
 */
function newsletterWelcomeEmail(email: string): { subject: string; html: string } {
  const baseUrl = getBaseUrl();

  const content = `
    <h1 style="font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 16px 0;">
      Welcome to the ${BRAND.name} Newsletter!
    </h1>
    <p style="font-size: 16px; color: #374151; line-height: 1.6; margin: 0 0 24px 0;">
      Thank you for subscribing! You'll now receive exclusive deals, safety tips, and new product announcements directly in your inbox.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; border-left: 4px solid ${BRAND.color};">
          <p style="font-size: 15px; color: #374151; margin: 0 0 8px 0; font-weight: 600;">As a subscriber, you'll get:</p>
          <ul style="font-size: 14px; color: #374151; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Early access to sales and promotions</li>
            <li>New product announcements</li>
            <li>Industry safety tips and guides</li>
            <li>Exclusive subscriber-only discounts</li>
          </ul>
        </td>
      </tr>
    </table>

    ${divider()}

    ${button('Browse Products', `${baseUrl}/products`)}

    <p style="font-size: 13px; color: #9ca3af; text-align: center; margin: 24px 0 0 0;">
      You're receiving this email because ${email} was subscribed to the ${BRAND.name} newsletter.
    </p>
  `;

  return {
    subject: `Welcome to the ${BRAND.name} Newsletter!`,
    html: baseLayout(content, `You're now subscribed to the ${BRAND.name} newsletter. Expect exclusive deals and safety tips!`),
  };
}

/**
 * Send email via SMTP using the same pattern as email-notifications.ts
 */
async function sendNewsletterWelcomeEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const host = process.env.EMAIL_SERVER_HOST;
    const port = parseInt(process.env.EMAIL_SERVER_PORT || '587');
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;
    const rawFrom = process.env.EMAIL_FROM || user;

    if (!host || !user || !pass) {
      console.error('[EMAIL] SMTP not configured for newsletter welcome email');
      return false;
    }

    const from = rawFrom && rawFrom.includes('<')
      ? rawFrom
      : `ADA Supplies <${rawFrom}>`;

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

    const result = await transporter.sendMail({ from, to, subject, html });
    console.log(`[EMAIL] Newsletter welcome sent to ${to} (messageId: ${result.messageId})`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL] Failed to send newsletter welcome to ${to}:`, error.message || error);
    return false;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing && existing.status === 'ACTIVE') {
      return NextResponse.json(
        { message: 'You are already subscribed!' },
        { status: 200 }
      );
    }

    // Upsert: create or reactivate
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalizedEmail },
      update: {
        status: 'ACTIVE',
        subscribedAt: new Date(),
        unsubscribedAt: null,
        source: 'WEBSITE',
      },
      create: {
        email: normalizedEmail,
        status: 'ACTIVE',
        source: 'WEBSITE',
      },
    });

    // Send branded welcome email (non-blocking)
    await ensureBrandLoaded();
    const template = newsletterWelcomeEmail(normalizedEmail);
    sendNewsletterWelcomeEmail(normalizedEmail, template.subject, template.html).catch(() => {});

    // Log the email
    try {
      await prisma.emailLog.create({
        data: {
          toEmail: normalizedEmail,
          subject: template.subject,
          emailType: 'NEWSLETTER_WELCOME',
          status: 'SENT',
          provider: 'smtp',
          sentAt: new Date(),
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json(
      { message: 'Successfully subscribed!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[NEWSLETTER] Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}
