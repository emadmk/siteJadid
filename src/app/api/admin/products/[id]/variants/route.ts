export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - List all variants for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const variants = await db.productVariant.findMany({
      where: { productId: params.id },
      include: {
        attributeValues: {
          include: {
            attribute: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(variants);
  } catch (error: any) {
    console.error('Error fetching variants:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

// POST - Create a new variant for a product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.sku || !body.name || body.basePrice === undefined) {
      return NextResponse.json(
        { error: 'SKU, name, and base price are required' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    const existingSku = await db.productVariant.findUnique({
      where: { sku: body.sku },
    });

    if (existingSku) {
      return NextResponse.json(
        { error: 'A variant with this SKU already exists' },
        { status: 400 }
      );
    }

    // Create variant with attribute values
    const variant = await db.productVariant.create({
      data: {
        productId: params.id,
        sku: body.sku,
        name: body.name,
        color: body.color || null,
        size: body.size || null,
        type: body.type || null,
        material: body.material || null,
        basePrice: body.basePrice,
        salePrice: body.salePrice || null,
        wholesalePrice: body.wholesalePrice || null,
        gsaPrice: body.gsaPrice || null,
        costPrice: body.costPrice || null,
        stockQuantity: body.stockQuantity || 0,
        images: body.images || [],
        isActive: body.isActive ?? true,
        attributeValues: body.attributeValues?.length > 0
          ? {
              create: body.attributeValues.map((av: { attributeId: string; value: string }) => ({
                attributeId: av.attributeId,
                value: av.value,
              })),
            }
          : undefined,
      },
      include: {
        attributeValues: {
          include: {
            attribute: true,
          },
        },
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error: any) {
    console.error('Error creating variant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create variant' },
      { status: 500 }
    );
  }
}

// PUT - Bulk update variants
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Handle single variant update
    if (body.variantId) {
      const variant = await db.productVariant.update({
        where: { id: body.variantId },
        data: {
          sku: body.sku,
          name: body.name,
          color: body.color !== undefined ? body.color : null,
          size: body.size !== undefined ? body.size : null,
          type: body.type !== undefined ? body.type : null,
          material: body.material !== undefined ? body.material : null,
          basePrice: body.basePrice,
          salePrice: body.salePrice,
          wholesalePrice: body.wholesalePrice,
          gsaPrice: body.gsaPrice,
          costPrice: body.costPrice,
          stockQuantity: body.stockQuantity,
          images: body.images,
          isActive: body.isActive,
        },
        include: {
          attributeValues: {
            include: {
              attribute: true,
            },
          },
        },
      });

      // Update attribute values if provided
      if (body.attributeValues) {
        // Delete existing and recreate
        await db.variantAttributeValue.deleteMany({
          where: { variantId: body.variantId },
        });

        if (body.attributeValues.length > 0) {
          await db.variantAttributeValue.createMany({
            data: body.attributeValues.map((av: { attributeId: string; value: string }) => ({
              variantId: body.variantId,
              attributeId: av.attributeId,
              value: av.value,
            })),
          });
        }
      }

      return NextResponse.json(variant);
    }

    // Handle bulk update (array of variants)
    if (Array.isArray(body.variants)) {
      const updates = await Promise.all(
        body.variants.map(async (v: any) => {
          return db.productVariant.update({
            where: { id: v.id },
            data: {
              basePrice: v.basePrice,
              salePrice: v.salePrice,
              wholesalePrice: v.wholesalePrice,
              gsaPrice: v.gsaPrice,
              costPrice: v.costPrice,
              stockQuantity: v.stockQuantity,
              isActive: v.isActive,
            },
          });
        })
      );

      return NextResponse.json(updates);
    }

    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error updating variant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update variant' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('variantId');

    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    // Delete variant (this will cascade delete attributeValues due to onDelete: Cascade)
    await db.productVariant.delete({
      where: { id: variantId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting variant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete variant' },
      { status: 500 }
    );
  }
}
