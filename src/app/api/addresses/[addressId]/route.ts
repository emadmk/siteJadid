import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/addresses/[addressId] - Get single address
export async function GET(
  request: NextRequest,
  { params }: { params: { addressId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { addressId } = params;

    const address = await db.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json(
      { error: 'Failed to fetch address' },
      { status: 500 }
    );
  }
}

// PATCH /api/addresses/[addressId] - Update address
export async function PATCH(
  request: NextRequest,
  { params }: { params: { addressId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { addressId } = params;
    const body = await request.json();

    // Check if address exists and belongs to user
    const existingAddress = await db.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (body.isDefault === true) {
      await db.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          id: { not: addressId },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update the address
    const updatedAddress = await db.address.update({
      where: { id: addressId },
      data: {
        ...(body.firstName !== undefined && { firstName: body.firstName }),
        ...(body.lastName !== undefined && { lastName: body.lastName }),
        ...(body.company !== undefined && { company: body.company }),
        ...(body.address1 !== undefined && { address1: body.address1 }),
        ...(body.address2 !== undefined && { address2: body.address2 }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.zipCode !== undefined && { zipCode: body.zipCode }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      },
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses/[addressId] - Delete address
export async function DELETE(
  request: NextRequest,
  { params }: { params: { addressId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { addressId } = params;

    // Check if address exists and belongs to user
    const address = await db.address.findFirst({
      where: {
        id: addressId,
        userId: session.user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Delete the address
    await db.address.delete({
      where: { id: addressId },
    });

    // If this was the default address, set another one as default
    if (address.isDefault) {
      const nextAddress = await db.address.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (nextAddress) {
        await db.address.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
