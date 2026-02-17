export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const products = await db.product.findMany({
      where: {
        id: { in: ids },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        salePrice: true,
        images: true,
        stockQuantity: true,
        minimumOrderQty: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: Number(product.basePrice),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      images: product.images as string[],
      stockQuantity: product.stockQuantity,
      minimumOrderQty: product.minimumOrderQty,
      category: product.category,
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error: any) {
    console.error('Products by IDs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
