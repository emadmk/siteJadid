import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// TEMPORARY ENDPOINT - Remove after setting up admin
// This allows you to make a user admin without needing shell access

export async function POST(request: NextRequest) {
  try {
    const { email, role, secretKey } = await request.json();

    // Simple security - require a secret key
    // Set this in your .env: ADMIN_SETUP_KEY=your-secret-key
    const expectedKey = process.env.ADMIN_SETUP_KEY || 'change-me-in-production';

    if (!secretKey || secretKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const validRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'WAREHOUSE_MANAGER',
      'ACCOUNTANT',
      'CUSTOMER_SERVICE',
    ];

    const newRole = role || 'SUPER_ADMIN';

    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: `Invalid role. Valid roles: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: `User not found: ${email}` },
        { status: 404 }
      );
    }

    // Update role
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { role: newRole as any },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedUser.email} to ${newRole}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Make admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to list all users (for convenience)
export async function GET(request: NextRequest) {
  try {
    const secretKey = request.nextUrl.searchParams.get('secretKey');

    const expectedKey = process.env.ADMIN_SETUP_KEY || 'change-me-in-production';

    if (!secretKey || secretKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 403 }
      );
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accountType: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
