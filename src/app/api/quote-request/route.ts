import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const quoteRequestSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  products: z.string().min(1, 'Products description is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  timeline: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = quoteRequestSchema.parse(body);

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
