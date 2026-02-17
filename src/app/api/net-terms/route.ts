export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const netTermsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  taxId: z.string().min(1, 'Tax ID is required'),
  yearsInBusiness: z.string().min(1, 'Years in business is required'),
  annualRevenue: z.string().min(1, 'Annual revenue is required'),
  requestedTerms: z.string().min(1, 'Requested terms is required'),
  creditReferences: z.string().optional(),
  bankName: z.string().optional(),
  bankContact: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = netTermsSchema.parse(body);

    const application = await db.netTermsApplication.create({
      data: {
        companyName: validatedData.companyName,
        contactName: validatedData.contactName,
        email: validatedData.email,
        phone: validatedData.phone || null,
        taxId: validatedData.taxId,
        yearsInBusiness: validatedData.yearsInBusiness,
        annualRevenue: validatedData.annualRevenue,
        requestedTerms: validatedData.requestedTerms,
        creditReferences: validatedData.creditReferences || null,
        bankName: validatedData.bankName || null,
        bankContact: validatedData.bankContact || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Net terms application submitted successfully',
      id: application.id,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating net terms application:', error);
    return NextResponse.json(
      { error: 'Failed to submit net terms application' },
      { status: 500 }
    );
  }
}
