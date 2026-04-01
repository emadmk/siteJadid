export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAdminAction, getClientIp } from '@/lib/audit-log';

// POST - Bulk release products: set status to ACTIVE, assign category, optionally set brand
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productIds, categoryId, brandId } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No products selected' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ success: false, message: 'Category is required for release' }, { status: 400 });
    }

    // Verify category exists
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    // Optionally verify brand exists
    if (brandId) {
      const brand = await db.brand.findUnique({ where: { id: brandId } });
      if (!brand) {
        return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 });
      }
    }

    // Build the update data
    const updateData: any = {
      status: 'ACTIVE',
      categoryId,
    };
    if (brandId) {
      updateData.brandId = brandId;
    }

    // Bulk update all products: set status, categoryId, and optionally brandId
    const result = await db.product.updateMany({
      where: { id: { in: productIds } },
      data: updateData,
    });

    // Upsert ProductCategory relations for each product
    // Use a transaction to create/update the junction table entries
    const categoryUpserts = productIds.map((productId: string) =>
      db.productCategory.upsert({
        where: {
          productId_categoryId: {
            productId,
            categoryId,
          },
        },
        create: {
          productId,
          categoryId,
          isPrimary: true,
        },
        update: {
          isPrimary: true,
        },
      })
    );

    await db.$transaction(categoryUpserts);

    logAdminAction({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'Product',
      description: `Bulk released ${result.count} products`,
      metadata: { productIds, categoryId, brandId },
      ipAddress: getClientIp(request.headers),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Successfully released ${result.count} product(s)`,
      affected: result.count,
    });
  } catch (error) {
    console.error('Error in bulk release:', error);
    return NextResponse.json({ success: false, message: 'Bulk release failed' }, { status: 500 });
  }
}
