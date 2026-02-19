export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateInventorySchema = z.object({
  stockQuantity: z.number().int().min(0),
  adjustmentType: z.enum(['add', 'remove', 'set']).optional(),
  adjustmentQuantity: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate request body
    const body = await req.json();
    const validation = updateInventorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { stockQuantity, adjustmentType, adjustmentQuantity, notes } = validation.data;

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update product stock quantity
    const updatedProduct = await db.product.update({
      where: { id: params.id },
      data: {
        stockQuantity,
        // Update status based on stock quantity
        status:
          stockQuantity === 0
            ? 'OUT_OF_STOCK'
            : product.stockQuantity === 0
            ? 'ACTIVE'
            : undefined,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        status: true,
        lowStockThreshold: true,
      },
    });

    // Log the inventory adjustment (you could create an InventoryLog model for this)
    // For now, we'll just log to console
    console.log('Inventory Adjustment:', {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      previousStock: product.stockQuantity,
      newStock: stockQuantity,
      adjustmentType,
      adjustmentQuantity,
      notes,
      adjustedBy: session.user.id,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'Inventory updated successfully',
      previousStock: product.stockQuantity,
      newStock: stockQuantity,
    });
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
