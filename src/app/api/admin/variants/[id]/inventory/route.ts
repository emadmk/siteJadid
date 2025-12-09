import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { stockQuantity, adjustmentType, adjustmentQuantity, notes } = body;

    if (stockQuantity === undefined || stockQuantity < 0) {
      return NextResponse.json(
        { error: 'Invalid stock quantity' },
        { status: 400 }
      );
    }

    const variant = await db.productVariant.findUnique({
      where: { id: params.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Update variant stock
    const updatedVariant = await db.productVariant.update({
      where: { id: params.id },
      data: {
        stockQuantity,
        isActive: stockQuantity > 0,
      },
    });

    // Update the parent product's total stock (sum of all variant stocks)
    const allVariants = await db.productVariant.findMany({
      where: { productId: variant.productId },
      select: { stockQuantity: true },
    });

    const totalVariantStock = allVariants.reduce((sum, v) => sum + v.stockQuantity, 0);

    await db.product.update({
      where: { id: variant.productId },
      data: {
        stockQuantity: totalVariantStock,
        status: totalVariantStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
      },
    });

    // Log the adjustment
    console.log(`Inventory adjustment for variant ${variant.sku}:`, {
      productName: variant.product.name,
      variantName: variant.name,
      previousStock: variant.stockQuantity,
      newStock: stockQuantity,
      adjustmentType,
      adjustmentQuantity,
      notes,
      adjustedBy: session.user.email,
    });

    return NextResponse.json({
      success: true,
      variant: updatedVariant,
    });
  } catch (error: any) {
    console.error('Error updating variant inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
