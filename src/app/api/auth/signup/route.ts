import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { z } from 'zod';

// GSA Departments
const GSA_DEPARTMENTS = ['DOW', 'DLA', 'USDA', 'NIH', 'GCSS-Army'] as const;

// Validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  accountType: z.enum(['B2C', 'B2B', 'GSA']).default('B2C'),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  gsaDepartment: z.enum(GSA_DEPARTMENTS).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Determine user role based on account type
    let role: 'CUSTOMER' | 'B2B_CUSTOMER' | 'GSA_CUSTOMER' = 'CUSTOMER';
    if (validatedData.accountType === 'B2B') {
      role = 'B2B_CUSTOMER';
    } else if (validatedData.accountType === 'GSA') {
      role = 'GSA_CUSTOMER';
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        accountType: validatedData.accountType,
        role: role,
        isActive: true,
        emailVerified: null,
        // GSA-specific fields
        gsaDepartment: validatedData.accountType === 'GSA' ? validatedData.gsaDepartment : null,
        gsaApprovalStatus: validatedData.accountType === 'GSA' ? 'PENDING' : null,
      },
    });

    // Create loyalty profile for all users
    await db.loyaltyProfile.create({
      data: {
        userId: user.id,
        points: 0,
        lifetimePoints: 0,
        tier: 'BRONZE',
      },
    });

    // Note: B2B and GSA profiles are created by admin during account approval
    // This ensures all required fields (taxId, contractNumber, etc.) are properly collected

    // Return success (without password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
