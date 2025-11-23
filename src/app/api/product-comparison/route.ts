import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/product-comparison - Get user's product comparisons
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comparisons = await db.productComparison.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Fetch products for each comparison
    const comparisonsWithProducts = await Promise.all(
      comparisons.map(async (comparison) => {
        const products = await db.product.findMany({
          where: {
            id: {
              in: comparison.productIds,
            },
          },
          select: {
            id: true,
            sku: true,
            name: true,
            slug: true,
            description: true,
            shortDescription: true,
            basePrice: true,
            salePrice: true,
            wholesalePrice: true,
            gsaPrice: true,
            images: true,
            stockQuantity: true,
            weight: true,
            length: true,
            width: true,
            height: true,
            complianceCertifications: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
            attributes: {
              include: {
                attribute: true,
              },
            },
          },
        });

        return {
          ...comparison,
          products,
        };
      })
    );

    return NextResponse.json(comparisonsWithProducts);
  } catch (error) {
    console.error('Get product comparisons error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/product-comparison - Create product comparison
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, productIds } = await request.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
      return NextResponse.json({ error: 'At least 2 products required for comparison' }, { status: 400 });
    }

    if (productIds.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 products can be compared' }, { status: 400 });
    }

    const comparison = await db.productComparison.create({
      data: {
        userId: session.user.id,
        name,
        productIds,
      },
    });

    // Fetch products
    const products = await db.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        basePrice: true,
        salePrice: true,
        wholesalePrice: true,
        gsaPrice: true,
        images: true,
        stockQuantity: true,
        weight: true,
        length: true,
        width: true,
        height: true,
        complianceCertifications: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        attributes: {
          include: {
            attribute: true,
          },
        },
      },
    });

    return NextResponse.json({ ...comparison, products }, { status: 201 });
  } catch (error) {
    console.error('Create product comparison error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/product-comparison/[id]
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Comparison ID required' }, { status: 400 });
    }

    const comparison = await db.productComparison.findUnique({
      where: { id },
    });

    if (!comparison) {
      return NextResponse.json({ error: 'Comparison not found' }, { status: 404 });
    }

    if (comparison.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.productComparison.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product comparison error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
