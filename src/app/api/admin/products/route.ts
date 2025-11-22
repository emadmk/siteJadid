import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

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
