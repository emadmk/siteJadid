import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      companyName,
      contactName,
      email,
      phone,
      quantity,
      timeline,
      message,
      productId,
      productName,
      productSku,
      variantId,
      variantName,
    } = data;

    // Validate required fields
    if (!companyName || !contactName || !email || !quantity) {
      return NextResponse.json(
        { error: 'Company name, contact name, email, and quantity are required' },
        { status: 400 }
      );
    }

    // Build product description string
    let productsDescription = `Product: ${productName}\nSKU: ${productSku}`;
    if (variantName) {
      productsDescription += `\nVariant: ${variantName}`;
    }
    productsDescription += `\nQuantity: ${quantity}`;

    // Create the quote request
    const quoteRequest = await db.quoteRequest.create({
      data: {
        companyName,
        contactName,
        email,
        phone: phone || null,
        products: productsDescription,
        quantity,
        timeline: timeline || null,
        message: message || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted successfully',
      id: quoteRequest.id,
    });
  } catch (error: any) {
    console.error('Quote request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quote request' },
      { status: 500 }
    );
  }
}
