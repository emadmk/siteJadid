export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET single bundle
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bundle = await prisma.productBundle.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                basePrice: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!bundle) {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }

    return NextResponse.json(bundle);
  } catch (error) {
    console.error('Error fetching bundle:', error);
    return NextResponse.json({ error: 'Failed to fetch bundle' }, { status: 500 });
  }
}

// PATCH update bundle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, sku, description, image, bundlePrice, retailValue, savings, isActive, items } = body;

    // Update bundle
    const bundle = await prisma.productBundle.update({
      where: { id: params.id },
      data: {
        name,
        sku,
        description,
        image,
        bundlePrice,
        retailValue,
        savings,
        isActive,
      },
    });

    // Update items if provided
    if (items) {
      // Delete existing items
      await prisma.bundleItem.deleteMany({
        where: { bundleId: params.id },
      });

      // Create new items
      await prisma.bundleItem.createMany({
        data: items.map((item: { productId: string; quantity: number }) => ({
          bundleId: params.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
    }

    // Fetch updated bundle with items
    const updatedBundle = await prisma.productBundle.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                basePrice: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedBundle);
  } catch (error: any) {
    console.error('Error updating bundle:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
  }
}

// DELETE bundle
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete items first
    await prisma.bundleItem.deleteMany({
      where: { bundleId: params.id },
    });

    // Delete bundle
    await prisma.productBundle.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting bundle:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 });
  }
}
