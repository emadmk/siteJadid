import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, accountType } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Name, email, subject, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Store the message in a database
    // 2. Send email notification to support team
    // 3. Send confirmation email to customer
    
    // For now, we'll log it and return success
    console.log('Contact form submission:', {
      name,
      email,
      phone,
      subject,
      message,
      accountType,
      timestamp: new Date().toISOString(),
    });

    // Optional: Store in database for tracking
    // You could create a ContactMessage model in Prisma schema
    /*
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
        accountType,
      },
    });
    */

    return NextResponse.json({
      message: 'Message sent successfully',
      success: true,
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
