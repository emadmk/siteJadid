export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  accountType: z.enum(['B2C', 'B2B', 'GSA']).optional(),
  gsaApprovalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional().nullable(),
  gsaNumber: z.string().optional().nullable(),
  gsaDepartment: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        accountType: true,
        gsaApprovalStatus: true,
        gsaNumber: true,
        gsaDepartment: true,
        createdAt: true,
        emailVerified: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only SUPER_ADMIN can change roles to ADMIN or SUPER_ADMIN
    if (validatedData.role && ['ADMIN', 'SUPER_ADMIN'].includes(validatedData.role)) {
      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Only Super Admin can assign admin roles' },
          { status: 403 }
        );
      }
    }

    // Prevent non-super admins from modifying super admins
    if (existingUser.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot modify Super Admin account' },
        { status: 403 }
      );
    }

    // Prevent users from demoting themselves
    if (params.id === session.user.id && validatedData.role && validatedData.role !== session.user.role) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 403 }
      );
    }

    // If email is being changed, check for duplicates
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: validatedData.email },
      });
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.role !== undefined) updateData.role = validatedData.role;
    if (validatedData.accountType !== undefined) updateData.accountType = validatedData.accountType;
    if (validatedData.gsaApprovalStatus !== undefined) updateData.gsaApprovalStatus = validatedData.gsaApprovalStatus;
    if (validatedData.gsaNumber !== undefined) updateData.gsaNumber = validatedData.gsaNumber;
    if (validatedData.gsaDepartment !== undefined) updateData.gsaDepartment = validatedData.gsaDepartment;

    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        accountType: true,
        gsaApprovalStatus: true,
        gsaNumber: true,
        gsaDepartment: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admin can delete users' },
        { status: 401 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    // Prevent deletion of other super admins
    if (existingUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete Super Admin accounts' },
        { status: 403 }
      );
    }

    // Delete related records first (cascading)
    await db.$transaction([
      // Delete cart items
      db.cartItem.deleteMany({ where: { cart: { userId: params.id } } }),
      // Delete carts
      db.cart.deleteMany({ where: { userId: params.id } }),
      // Delete wishlist items
      db.wishlistItem.deleteMany({ where: { wishlist: { userId: params.id } } }),
      // Delete wishlists
      db.wishlist.deleteMany({ where: { userId: params.id } }),
      // Delete reviews
      db.review.deleteMany({ where: { userId: params.id } }),
      // Delete addresses
      db.address.deleteMany({ where: { userId: params.id } }),
      // Delete notifications
      db.notification.deleteMany({ where: { userId: params.id } }),
      // Delete sessions
      db.session.deleteMany({ where: { userId: params.id } }),
      // Delete accounts (OAuth)
      db.account.deleteMany({ where: { userId: params.id } }),
      // Finally delete the user
      db.user.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
