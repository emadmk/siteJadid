export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const { name, companyName, address, telephone, industry } = data;

    // Validate required fields
    if (!name || !companyName || !telephone) {
      return NextResponse.json(
        { error: 'Name, company name, and telephone are required' },
        { status: 400 }
      );
    }

    // Store in database as a quote request for tracking
    const inquiry = await db.quoteRequest.create({
      data: {
        companyName,
        contactName: name,
        email: 'b2b@adasupply.com', // Default since form doesn't collect email
        phone: telephone,
        products: `Industry: ${industry || 'Not specified'}\nAddress: ${address || 'Not provided'}`,
        quantity: 'B2B Inquiry',
        timeline: null,
        message: `B2B Homepage Inquiry\n\nName: ${name}\nCompany: ${companyName}\nAddress: ${address || 'Not provided'}\nPhone: ${telephone}\nIndustry: ${industry || 'Not specified'}`,
        status: 'PENDING',
      },
    });

    // Try to send email notification
    try {
      // Check if we have email settings
      const emailSettings = await db.setting.findMany({
        where: {
          key: {
            in: ['email.smtpHost', 'email.smtpPort', 'email.smtpUser', 'email.smtpPassword', 'email.fromEmail'],
          },
        },
      });

      const settings: Record<string, string> = {};
      emailSettings.forEach((s) => {
        settings[s.key] = s.value;
      });

      // If SMTP is configured, send email
      if (settings['email.smtpHost'] && settings['email.smtpUser']) {
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
          host: settings['email.smtpHost'],
          port: parseInt(settings['email.smtpPort'] || '587'),
          secure: settings['email.smtpPort'] === '465',
          auth: {
            user: settings['email.smtpUser'],
            pass: settings['email.smtpPassword'],
          },
        });

        await transporter.sendMail({
          from: settings['email.fromEmail'] || 'noreply@adasupply.com',
          to: 'b2b@adasupply.com',
          subject: `New B2B Inquiry from ${companyName}`,
          html: `
            <h2>New B2B Inquiry</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Address:</strong> ${address || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${telephone}</p>
            <p><strong>Industry:</strong> ${industry || 'Not specified'}</p>
            <hr>
            <p><em>This inquiry was submitted from the homepage B2B contact form.</em></p>
          `,
        });
      }
    } catch (emailError) {
      // Log but don't fail if email fails
      console.error('Failed to send email notification:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry submitted successfully',
      id: inquiry.id,
    });
  } catch (error: any) {
    console.error('B2B inquiry error:', error);
    return NextResponse.json(
      { error: 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}
