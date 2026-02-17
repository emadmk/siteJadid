export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// PUT - Update color-image mappings for a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Update product with color images mapping
    const product = await db.product.update({
      where: { id: params.id },
      data: {
        colorImages: body.colorImages || null,
      },
      select: {
        id: true,
        colorImages: true,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error updating color images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update color images' },
      { status: 500 }
    );
  }
}

// GET - Get color-image mappings for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        colorImages: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error fetching color images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch color images' },
      { status: 500 }
    );
  }
}
