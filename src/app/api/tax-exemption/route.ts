import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const taxExemptionSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  taxId: z.string().min(1, 'Tax ID is required'),
  exemptionType: z.string().min(1, 'Exemption type is required'),
  states: z.string().min(1, 'States are required'),
  certificateUrl: z.string().optional(), // Will be uploaded separately
});

// Generate unique certificate number
function generateCertificateNumber(): string {
  const prefix = 'TXE';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const body = await request.json();
    const validatedData = taxExemptionSchema.parse(body);

    // Parse states as array (comma separated)
    const statesArray = validatedData.states.split(',').map(s => s.trim()).filter(Boolean);

    // If user is logged in, check if they already have a tax exemption
    if (session?.user?.id) {
      const existing = await db.taxExemption.findUnique({
        where: { userId: session.user.id },
      });

      if (existing) {
        // Update existing
        const updated = await db.taxExemption.update({
          where: { userId: session.user.id },
          data: {
            exemptionType: validatedData.exemptionType,
            states: statesArray,
            certificateUrl: validatedData.certificateUrl || null,
            status: 'PENDING', // Reset to pending for re-review
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Tax exemption updated and pending review',
          id: updated.id,
        });
      }

      // Create new for logged in user
      const taxExemption = await db.taxExemption.create({
        data: {
          userId: session.user.id,
          certificateNumber: generateCertificateNumber(),
          exemptionType: validatedData.exemptionType,
          states: statesArray,
          certificateUrl: validatedData.certificateUrl || null,
          issueDate: new Date(),
          status: 'PENDING',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Tax exemption certificate submitted successfully',
        id: taxExemption.id,
      }, { status: 201 });
    }

    // For non-logged in users, we'll store as a pending request
    // You could create a TaxExemptionRequest model or handle differently
    // For now, return success and suggest they create an account

    return NextResponse.json({
      success: true,
      message: 'Request received. Please create an account to complete your tax exemption application.',
      requiresAccount: true,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Error creating tax exemption:', error);
    return NextResponse.json(
      { error: 'Failed to submit tax exemption request' },
      { status: 500 }
    );
  }
}
