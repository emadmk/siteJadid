import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productIds, mode = 'delete', forceDelete = false } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'No product IDs provided' },
        { status: 400 }
      );
    }

    const results = {
      success: true,
      deleted: 0,
      hidden: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each product
    for (const productId of productIds) {
      try {
        // Check if product exists and get order count
        const product = await prisma.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            sku: true,
            name: true,
            status: true,
            _count: {
              select: {
                orderItems: true,
              },
            },
          },
        });

        if (!product) {
          results.errors.push(`Product ${productId} not found`);
          results.failed++;
          continue;
        }

        const hasOrders = product._count.orderItems > 0;

        // If mode is 'hide' or product has orders, set to INACTIVE
        if (mode === 'hide' || (hasOrders && !forceDelete)) {
          await prisma.product.update({
            where: { id: productId },
            data: { status: 'INACTIVE' },
          });
          results.hidden++;
          continue;
        }

        // If product has orders and forceDelete is not enabled, hide instead
        if (hasOrders) {
          await prisma.product.update({
            where: { id: productId },
            data: { status: 'INACTIVE' },
          });
          results.hidden++;
          results.errors.push(
            `Product ${product.sku} has ${product._count.orderItems} order(s), hidden instead`
          );
          continue;
        }

        // Delete related records first (in proper order to avoid FK constraints)

        // Delete product images
        await prisma.productImage.deleteMany({
          where: { productId },
        });

        // Delete warehouse stock
        await prisma.warehouseStock.deleteMany({
          where: { productId },
        });

        // Delete cart items
        await prisma.cartItem.deleteMany({
          where: { productId },
        });

        // Delete wishlist items
        await prisma.wishlistItem.deleteMany({
          where: { productId },
        });

        // Delete product reviews
        await prisma.review.deleteMany({
          where: { productId },
        });

        // Delete tiered prices
        await prisma.tieredPrice.deleteMany({
          where: { productId },
        });

        // Delete product discounts
        await prisma.productDiscount.deleteMany({
          where: { productId },
        });

        // Delete product suppliers
        await prisma.productSupplier.deleteMany({
          where: { productId },
        });

        // Delete inventory logs
        await prisma.inventoryLog.deleteMany({
          where: { productId },
        });

        // Delete bundle items where this product is included
        await prisma.bundleItem.deleteMany({
          where: { productId },
        });

        // Finally delete the product
        await prisma.product.delete({
          where: { id: productId },
        });

        results.deleted++;
      } catch (error) {
        console.error(`Error processing product ${productId}:`, error);
        results.errors.push(
          `Failed to process product ${productId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        results.failed++;
      }
    }

    results.success = results.failed === 0;

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk delete' },
      { status: 500 }
    );
  }
}
