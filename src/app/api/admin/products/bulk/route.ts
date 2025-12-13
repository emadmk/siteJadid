import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Fetch products for bulk edit with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const warehouse = searchParams.get('warehouse');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (brand) {
      where.brandId = brand;
    }

    if (warehouse) {
      where.defaultWarehouseId = warehouse;
    }

    if (status) {
      where.status = status;
    }

    // Get total count for pagination
    const total = await db.product.count({ where });

    const products = await db.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        status: true,
        basePrice: true,
        salePrice: true,
        gsaPrice: true,
        wholesalePrice: true,
        stockQuantity: true,
        images: true,
        category: {
          select: { id: true, name: true },
        },
        brand: {
          select: { id: true, name: true },
        },
        defaultWarehouse: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching products for bulk edit:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Execute bulk actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, productIds, ...params } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, message: 'No products selected' }, { status: 400 });
    }

    let affected = 0;

    switch (action) {
      case 'delete': {
        // Delete products and all related data
        const result = await db.product.deleteMany({
          where: { id: { in: productIds } },
        });
        affected = result.count;
        return NextResponse.json({
          success: true,
          message: `Successfully deleted ${affected} product(s)`,
          affected,
        });
      }

      case 'move_warehouse': {
        const { warehouseId } = params;
        if (!warehouseId) {
          return NextResponse.json({ success: false, message: 'Warehouse ID required' }, { status: 400 });
        }

        // Verify warehouse exists
        const warehouse = await db.warehouse.findUnique({ where: { id: warehouseId } });
        if (!warehouse) {
          return NextResponse.json({ success: false, message: 'Warehouse not found' }, { status: 404 });
        }

        const result = await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { defaultWarehouseId: warehouseId },
        });
        affected = result.count;
        return NextResponse.json({
          success: true,
          message: `Successfully moved ${affected} product(s) to ${warehouse.name}`,
          affected,
        });
      }

      case 'update_status': {
        const { status } = params;
        if (!status || !['ACTIVE', 'DRAFT', 'INACTIVE', 'DISCONTINUED'].includes(status)) {
          return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
        }

        const result = await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { status },
        });
        affected = result.count;
        return NextResponse.json({
          success: true,
          message: `Successfully updated status to ${status} for ${affected} product(s)`,
          affected,
        });
      }

      case 'apply_discount': {
        const { discountType, discountValue, priceField } = params;

        if (!discountValue || discountValue <= 0) {
          return NextResponse.json({ success: false, message: 'Invalid discount value' }, { status: 400 });
        }

        // Get products to update
        const products = await db.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, basePrice: true, salePrice: true, gsaPrice: true, wholesalePrice: true },
        });

        // Calculate and update prices
        const updates = products.map(async (product) => {
          let sourcePrice: number;
          let targetField: string;

          if (priceField === 'basePrice') {
            sourcePrice = Number(product.basePrice);
            targetField = 'salePrice';
          } else if (priceField === 'salePrice') {
            sourcePrice = Number(product.salePrice || product.basePrice);
            targetField = 'salePrice';
          } else if (priceField === 'gsaPrice') {
            sourcePrice = Number(product.gsaPrice || product.basePrice);
            targetField = 'gsaPrice';
          } else {
            sourcePrice = Number(product.wholesalePrice || product.basePrice);
            targetField = 'wholesalePrice';
          }

          let newPrice: number;
          if (discountType === 'percentage') {
            newPrice = sourcePrice * (1 - discountValue / 100);
          } else {
            newPrice = sourcePrice - discountValue;
          }

          // Ensure price is not negative
          newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

          return db.product.update({
            where: { id: product.id },
            data: { [targetField]: newPrice },
          });
        });

        await Promise.all(updates);
        affected = products.length;

        return NextResponse.json({
          success: true,
          message: `Successfully applied discount to ${affected} product(s)`,
          affected,
        });
      }

      case 'set_minimum_order': {
        const { minimumOrderQty } = params;

        if (!minimumOrderQty || minimumOrderQty < 1) {
          return NextResponse.json({ success: false, message: 'Minimum order quantity must be at least 1' }, { status: 400 });
        }

        const result = await db.product.updateMany({
          where: { id: { in: productIds } },
          data: { minimumOrderQty: parseInt(minimumOrderQty) },
        });
        affected = result.count;

        return NextResponse.json({
          success: true,
          message: `Successfully set minimum order quantity to ${minimumOrderQty} for ${affected} product(s)`,
          affected,
        });
      }

      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error executing bulk action:', error);
    return NextResponse.json({ success: false, message: 'Operation failed' }, { status: 500 });
  }
}
