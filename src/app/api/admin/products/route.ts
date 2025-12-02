import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/products - List products with optional order count
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const includeOrderCount = searchParams.get('includeOrderCount') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Get total count
    const total = await db.product.count({ where });

    // Get products
    const products = await db.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sku: true,
        name: true,
        slug: true,
        status: true,
        basePrice: true,
        stockQuantity: true,
        images: true,
        brand: {
          select: { name: true },
        },
        category: {
          select: { name: true },
        },
        ...(includeOrderCount && {
          _count: {
            select: {
              orderItems: true,
              warehouseStock: true,
              cartItems: true,
            },
          },
        }),
      },
    });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('List products error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Check for duplicate SKU
    const existingSku = await db.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existingSlug = await db.product.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A product with this slug already exists' },
        { status: 400 }
      );
    }

    // Create product
    const product = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        basePrice: data.basePrice,
        salePrice: data.salePrice,
        gsaPrice: data.gsaPrice,
        costPrice: data.costPrice,
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
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

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
