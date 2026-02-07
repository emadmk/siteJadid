import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { z } from 'zod';

// Government Departments
const GOVERNMENT_DEPARTMENTS = ['DOW', 'DLA', 'USDA', 'NIH', 'GCSS-Army', 'OTHER'] as const;

// Validation schema - Updated for new user types
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  // Support both old and new account types for backward compatibility
  accountType: z.enum(['B2C', 'B2B', 'GSA', 'PERSONAL', 'VOLUME_BUYER', 'GOVERNMENT']).default('PERSONAL'),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
  governmentDepartment: z.string().optional(),
  // Legacy field support
  gsaDepartment: z.enum(GOVERNMENT_DEPARTMENTS).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = signupSchema.parse(body);

    // Map old account types to new ones
    let accountType = validatedData.accountType;
    if (accountType === 'B2C') accountType = 'PERSONAL';
    if (accountType === 'B2B') accountType = 'VOLUME_BUYER';
    if (accountType === 'GSA') accountType = 'GOVERNMENT';

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
    let role: 'CUSTOMER' | 'PERSONAL_CUSTOMER' | 'VOLUME_BUYER_CUSTOMER' | 'GOVERNMENT_CUSTOMER' = 'PERSONAL_CUSTOMER';
    if (accountType === 'VOLUME_BUYER') {
      role = 'VOLUME_BUYER_CUSTOMER';
    } else if (accountType === 'GOVERNMENT') {
      role = 'GOVERNMENT_CUSTOMER';
    }

    // Get government department from either new or legacy field
    const governmentDept = validatedData.governmentDepartment || validatedData.gsaDepartment;

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        phone: validatedData.phone,
        accountType: accountType as 'PERSONAL' | 'VOLUME_BUYER' | 'GOVERNMENT',
        role: role,
        isActive: true,
        emailVerified: null,
        // Company name for Volume Buyer and Government users
        companyName: accountType !== 'PERSONAL' ? validatedData.companyName : null,
        // Government-specific fields
        governmentDepartment: accountType === 'GOVERNMENT' ? governmentDept : null,
        approvalStatus: (accountType === 'GOVERNMENT' || accountType === 'VOLUME_BUYER') ? 'PENDING' : null,
        // Legacy GSA fields (for backward compatibility)
        gsaDepartment: accountType === 'GOVERNMENT' ? governmentDept : null,
        gsaApprovalStatus: accountType === 'GOVERNMENT' ? 'PENDING' : null,
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

    // Return success (without password)
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: userWithoutPassword,
        accountType: accountType,
        requiresApproval: accountType === 'GOVERNMENT' || accountType === 'VOLUME_BUYER',
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
