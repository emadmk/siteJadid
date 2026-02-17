export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      supplierSku,
      costPrice,
      minimumOrderQty,
      leadTimeDays,
      isPrimary,
      priority,
    } = body;

    const existing = await prisma.productSupplier.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Product supplier relationship not found' },
        { status: 404 }
      );
    }

    if (isPrimary && !existing.isPrimary) {
      await prisma.productSupplier.updateMany({
        where: {
          productId: existing.productId,
          id: { not: params.id },
        },
        data: { isPrimary: false },
      });
    }

    const productSupplier = await prisma.productSupplier.update({
      where: { id: params.id },
      data: {
        supplierSku,
        costPrice,
        minimumOrderQty,
        leadTimeDays,
        isPrimary,
        priority,
      },
      include: {
        supplier: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    return NextResponse.json(productSupplier);
  } catch (error) {
    console.error('Error updating product supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update product supplier' },
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

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productSupplier = await prisma.productSupplier.findUnique({
      where: { id: params.id },
    });

    if (!productSupplier) {
      return NextResponse.json(
        { error: 'Product supplier relationship not found' },
        { status: 404 }
      );
    }

    await prisma.productSupplier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete product supplier' },
      { status: 500 }
    );
  }
}
