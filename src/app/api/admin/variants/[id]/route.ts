import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const variant = await db.productVariant.findUnique({
      where: { id: params.id },
      include: {
        attributeValues: {
          include: {
            attribute: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    return NextResponse.json({ variant });
  } catch (error) {
    console.error('Error fetching variant:', error);
    return NextResponse.json({ error: 'Failed to fetch variant' }, { status: 500 });
  }
}

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
    const {
      sku,
      name,
      color,
      size,
      type,
      material,
      basePrice,
      salePrice,
      wholesalePrice,
      gsaPrice,
      costPrice,
      stockQuantity,
      isActive,
      images,
    } = body;

    // Build update data - only include fields that are provided
    const updateData: any = {};

    if (sku !== undefined) updateData.sku = sku;
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (size !== undefined) updateData.size = size;
    if (type !== undefined) updateData.type = type;
    if (material !== undefined) updateData.material = material;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (salePrice !== undefined) updateData.salePrice = salePrice;
    if (wholesalePrice !== undefined) updateData.wholesalePrice = wholesalePrice;
    if (gsaPrice !== undefined) updateData.gsaPrice = gsaPrice;
    if (costPrice !== undefined) updateData.costPrice = costPrice;
    if (stockQuantity !== undefined) updateData.stockQuantity = stockQuantity;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (images !== undefined) updateData.images = images;

    const variant = await db.productVariant.update({
      where: { id: params.id },
      data: updateData,
      include: {
        attributeValues: {
          include: {
            attribute: true,
          },
        },
      },
    });

    return NextResponse.json({ variant });
  } catch (error) {
    console.error('Error updating variant:', error);
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.productVariant.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variant:', error);
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
  }
}
