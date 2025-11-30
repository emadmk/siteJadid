import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/products/frequently-bought?productId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get frequently bought together products
    const frequentlyBought = await db.frequentlyBoughtTogether.findMany({
      where: {
        productId,
        isActive: true,
      },
      orderBy: {
        confidence: 'desc',
      },
      take: 6,
    });

    // Fetch related products
    const relatedProducts = await db.product.findMany({
      where: {
        id: {
          in: frequentlyBought.map((fb) => fb.relatedProductId),
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        sku: true,
        name: true,
        slug: true,
        basePrice: true,
        salePrice: true,
        wholesalePrice: true,
        gsaPrice: true,
        images: true,
        stockQuantity: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(relatedProducts);
  } catch (error) {
    console.error('Get frequently bought together error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
