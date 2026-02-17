export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export interface LookupResult {
  found: boolean;
  type: 'product' | 'variant' | null;
  product: {
    id: string;
    sku: string;
    name: string;
    basePrice: number;
    salePrice: number | null;
    stockQuantity: number;
    images: string[];
    status: string;
  } | null;
  variant: {
    id: string;
    sku: string;
    name: string;
    basePrice: number;
    salePrice: number | null;
    stockQuantity: number;
    images: string[];
  } | null;
}

// GET /api/products/lookup?sku=XXX - Lookup product or variant by SKU
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get('sku')?.trim();

    if (!sku) {
      return NextResponse.json<LookupResult>({
        found: false,
        type: null,
        product: null,
        variant: null,
      });
    }

    // First, try to find a product with this SKU
    const product = await db.product.findFirst({
      where: {
        sku: { equals: sku, mode: 'insensitive' },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        sku: true,
        name: true,
        basePrice: true,
        salePrice: true,
        stockQuantity: true,
        images: true,
        status: true,
      },
    });

    if (product) {
      return NextResponse.json<LookupResult>({
        found: true,
        type: 'product',
        product: {
          ...product,
          basePrice: Number(product.basePrice),
          salePrice: product.salePrice ? Number(product.salePrice) : null,
          images: product.images as string[],
        },
        variant: null,
      });
    }

    // If not found as product, try to find a variant with this SKU
    const variant = await db.productVariant.findFirst({
      where: {
        sku: { equals: sku, mode: 'insensitive' },
        isActive: true,
      },
      select: {
        id: true,
        sku: true,
        name: true,
        basePrice: true,
        salePrice: true,
        stockQuantity: true,
        images: true,
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            basePrice: true,
            salePrice: true,
            stockQuantity: true,
            images: true,
            status: true,
          },
        },
      },
    });

    if (variant && variant.product.status === 'ACTIVE') {
      return NextResponse.json<LookupResult>({
        found: true,
        type: 'variant',
        product: {
          ...variant.product,
          basePrice: Number(variant.product.basePrice),
          salePrice: variant.product.salePrice ? Number(variant.product.salePrice) : null,
          images: variant.product.images as string[],
        },
        variant: {
          id: variant.id,
          sku: variant.sku,
          name: variant.name,
          basePrice: Number(variant.basePrice),
          salePrice: variant.salePrice ? Number(variant.salePrice) : null,
          stockQuantity: variant.stockQuantity,
          images: variant.images as string[],
        },
      });
    }

    // Not found
    return NextResponse.json<LookupResult>({
      found: false,
      type: null,
      product: null,
      variant: null,
    });
  } catch (error) {
    console.error('SKU lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products/lookup - Bulk lookup multiple SKUs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const skus: string[] = body.skus || [];

    if (skus.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Limit to 100 SKUs at a time
    const limitedSkus = skus.slice(0, 100);

    const results: LookupResult[] = [];

    for (const sku of limitedSkus) {
      const trimmedSku = sku.trim();
      if (!trimmedSku) {
        results.push({
          found: false,
          type: null,
          product: null,
          variant: null,
        });
        continue;
      }

      // Try product first
      const product = await db.product.findFirst({
        where: {
          sku: { equals: trimmedSku, mode: 'insensitive' },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          sku: true,
          name: true,
          basePrice: true,
          salePrice: true,
          stockQuantity: true,
          images: true,
          status: true,
        },
      });

      if (product) {
        results.push({
          found: true,
          type: 'product',
          product: {
            ...product,
            basePrice: Number(product.basePrice),
            salePrice: product.salePrice ? Number(product.salePrice) : null,
            images: product.images as string[],
          },
          variant: null,
        });
        continue;
      }

      // Try variant
      const variant = await db.productVariant.findFirst({
        where: {
          sku: { equals: trimmedSku, mode: 'insensitive' },
          isActive: true,
        },
        select: {
          id: true,
          sku: true,
          name: true,
          basePrice: true,
          salePrice: true,
          stockQuantity: true,
          images: true,
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              basePrice: true,
              salePrice: true,
              stockQuantity: true,
              images: true,
              status: true,
            },
          },
        },
      });

      if (variant && variant.product.status === 'ACTIVE') {
        results.push({
          found: true,
          type: 'variant',
          product: {
            ...variant.product,
            basePrice: Number(variant.product.basePrice),
            salePrice: variant.product.salePrice ? Number(variant.product.salePrice) : null,
            images: variant.product.images as string[],
          },
          variant: {
            id: variant.id,
            sku: variant.sku,
            name: variant.name,
            basePrice: Number(variant.basePrice),
            salePrice: variant.salePrice ? Number(variant.salePrice) : null,
            stockQuantity: variant.stockQuantity,
            images: variant.images as string[],
          },
        });
      } else {
        results.push({
          found: false,
          type: null,
          product: null,
          variant: null,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Bulk SKU lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
