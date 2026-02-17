export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keepImages = searchParams.get('keepImages') === 'true';

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
      include: {
        stock: {
          select: {
            productId: true,
          },
        },
        defaultProducts: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Get all product IDs associated with this warehouse
    const productIdsFromStock = warehouse.stock.map(s => s.productId);
    const productIdsFromDefault = warehouse.defaultProducts.map(p => p.id);
    const allProductIds = [...new Set([...productIdsFromStock, ...productIdsFromDefault])];

    if (allProductIds.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'No products to delete',
      });
    }

    // Delete in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete warehouse stock records
      await tx.warehouseStock.deleteMany({
        where: { warehouseId: params.id },
      });

      // 2. Delete related records for products
      // Delete cart items
      await tx.cartItem.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete wishlist items
      await tx.wishlistItem.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete order items (keep orders but remove product reference)
      await tx.orderItem.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete product reviews
      await tx.review.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete product categories
      await tx.productCategory.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete product discounts
      await tx.productDiscount.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete product suppliers
      await tx.productSupplier.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete tiered prices
      await tx.tieredPrice.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete bundle items (products included in bundles)
      await tx.bundleItem.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete back orders
      await tx.backOrder.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete product attribute values
      await tx.productAttributeValue.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete RMA items
      await tx.rMAItem.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete frequently bought together
      await tx.frequentlyBoughtTogether.deleteMany({
        where: {
          OR: [
            { productId: { in: allProductIds } },
            { relatedProductId: { in: allProductIds } },
          ],
        },
      });

      // Delete flash sale items
      await tx.flashSaleItem.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete product questions
      await tx.productQuestion.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete product images records (not the actual files)
      await tx.productImage.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete product variants (this will also cascade to variant warehouse stock)
      await tx.productVariant.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete inventory logs
      await tx.inventoryLog.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete stock notifications
      await tx.stockNotification.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete warehouse stock records for these products
      await tx.warehouseStock.deleteMany({
        where: { productId: { in: allProductIds } },
      });

      // Delete variant warehouse stock
      await tx.variantWarehouseStock.deleteMany({
        where: {
          variant: { productId: { in: allProductIds } },
        },
      });

      // Note: We're NOT deleting images from storage if keepImages is true
      // The images array is stored in the product record and will be deleted with it
      // But the actual files in storage remain for re-import

      // 3. Delete the products
      const deleteResult = await tx.product.deleteMany({
        where: { id: { in: allProductIds } },
      });

      return deleteResult;
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Deleted ${result.count} products from warehouse "${warehouse.name}"${keepImages ? ' (images preserved in storage)' : ''}`,
    });
  } catch (error: any) {
    console.error('Error deleting warehouse products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete products' },
      { status: 500 }
    );
  }
}
