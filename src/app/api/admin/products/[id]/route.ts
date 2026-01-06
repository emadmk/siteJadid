import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET single product with all details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        defaultSupplier: { select: { id: true, name: true, code: true } },
        defaultWarehouse: { select: { id: true, name: true, code: true } },
        categories: {
          select: {
            categoryId: true,
            isPrimary: true,
            displayOrder: true,
            category: { select: { id: true, name: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.sku || !data.slug) {
      return NextResponse.json(
        { error: 'Name, SKU, and slug are required' },
        { status: 400 }
      );
    }

    // Check for duplicate SKU (excluding current product)
    const existingSku = await db.product.findFirst({
      where: {
        sku: data.sku,
        id: { not: params.id },
      },
    });

    if (existingSku) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 400 }
      );
    }

    // Check for duplicate slug (excluding current product)
    const existingSlug = await db.product.findFirst({
      where: {
        slug: data.slug,
        id: { not: params.id },
      },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 400 }
      );
    }

    // Handle vendorPartNumber - auto-generate if not provided
    let vendorPartNumber = data.vendorPartNumber;
    if (!vendorPartNumber && data.defaultSupplierId) {
      const supplier = await db.supplier.findUnique({
        where: { id: data.defaultSupplierId },
        select: { name: true },
      });

      const prefixMap: Record<string, string> = {
        'Keen': 'K-',
        'Bates': 'B-',
        'PIP': 'PIP-',
        'Occunomix': 'OCC-',
        'OccuNomix': 'OCC-',
      };

      const prefix = supplier?.name ? (prefixMap[supplier.name] || 'ADA-') : 'ADA-';
      vendorPartNumber = prefix + data.sku;
    } else if (!vendorPartNumber) {
      vendorPartNumber = 'ADA-' + data.sku;
    }

    // Check for duplicate vendorPartNumber (excluding current product)
    if (vendorPartNumber) {
      const existingVpn = await db.product.findFirst({
        where: {
          vendorPartNumber,
          id: { not: params.id },
        },
      });

      if (existingVpn) {
        return NextResponse.json(
          { error: 'A product with this Vendor Part Number already exists' },
          { status: 400 }
        );
      }
    }

    // Update product
    const product = await db.product.update({
      where: { id: params.id },
      data: {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        vendorPartNumber,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        basePrice: data.basePrice,
        salePrice: data.salePrice,
        wholesalePrice: data.wholesalePrice,
        gsaPrice: data.gsaPrice,
        costPrice: data.costPrice,
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        minimumOrderQty: data.minimumOrderQty || 1,
        categoryId: data.categoryId,
        brandId: data.brandId,
        defaultSupplierId: data.defaultSupplierId,
        defaultWarehouseId: data.defaultWarehouseId,
        status: data.status || 'ACTIVE',
        images: data.images || [],
        tierPricing: data.tierPricing || [],
        weight: data.weight,
        length: data.length,
        width: data.width,
        height: data.height,
        isFeatured: data.isFeatured || false,
        isBestSeller: data.isBestSeller || false,
        isNewArrival: data.isNewArrival || false,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null,
        complianceCertifications: data.complianceCertifications || [],
      },
    });

    // Handle multiple categories if provided
    if (data.categoryIds && Array.isArray(data.categoryIds)) {
      // Delete existing category relationships
      await db.productCategory.deleteMany({
        where: { productId: params.id },
      });

      // Create new category relationships
      if (data.categoryIds.length > 0) {
        await db.productCategory.createMany({
          data: data.categoryIds.map((categoryId: string, index: number) => ({
            productId: params.id,
            categoryId,
            isPrimary: index === 0,
            displayOrder: index,
          })),
        });
      }
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

// PATCH for inline/partial updates
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.brandId !== undefined) updateData.brandId = data.brandId || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.images !== undefined) updateData.images = data.images;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const product = await db.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Patch product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can delete products' }, { status: 403 });
    }

    await db.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
