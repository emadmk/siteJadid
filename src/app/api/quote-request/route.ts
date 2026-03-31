export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { sendAdminQuoteRequestNotification } from '@/lib/email-notifications';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { rateLimit } from '@/lib/rate-limit';

const quoteRequestSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  products: z.string().min(1, 'Products description is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  timeline: z.string().optional(),
  message: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Rate limit: 5 requests per 15 minutes per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const { success: rateLimitOk } = await rateLimit(`quote:${ip}`, 5, 15 * 60 * 1000);
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const validatedData = quoteRequestSchema.parse(body);

    // Verify Turnstile captcha
    const isHuman = await verifyTurnstileToken(validatedData.turnstileToken);
    if (!isHuman) {
      return NextResponse.json({ error: 'Captcha verification failed. Please try again.' }, { status: 400 });
    }

    const quoteRequest = await db.quoteRequest.create({
      data: {
        companyName: validatedData.companyName,
        contactName: validatedData.contactName,
        email: validatedData.email,
        phone: validatedData.phone || null,
        products: validatedData.products,
        quantity: validatedData.quantity,
        timeline: validatedData.timeline || null,
        message: validatedData.message || null,
      },
    });

    // Send admin notification for new quote request
    sendAdminQuoteRequestNotification({
      companyName: validatedData.companyName,
      contactName: validatedData.contactName,
      email: validatedData.email,
      phone: validatedData.phone,
      products: validatedData.products,
      quantity: validatedData.quantity,
      timeline: validatedData.timeline,
      message: validatedData.message,
    }).catch(err => console.error('Failed to send admin quote request notification:', err));

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted successfully',
      id: quoteRequest.id,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating quote request:', error);
    return NextResponse.json(
      { error: 'Failed to submit quote request' },
      { status: 500 }
    );
  }
}
