import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productSuppliers = await prisma.productSupplier.findMany({
      where: { productId: params.id },
      include: {
        supplier: true,
      },
      orderBy: [{ isPrimary: 'desc' }, { priority: 'desc' }],
    });

    return NextResponse.json(productSuppliers);
  } catch (error) {
    console.error('Error fetching product suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(
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
      supplierId,
      supplierSku,
      costPrice,
      minimumOrderQty,
      leadTimeDays,
      isPrimary,
      priority,
    } = body;

    if (!supplierId || costPrice === undefined) {
      return NextResponse.json(
        { error: 'Supplier ID and cost price are required' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const existing = await prisma.productSupplier.findUnique({
      where: {
        productId_supplierId: {
          productId: params.id,
          supplierId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This supplier is already linked to this product' },
        { status: 400 }
      );
    }

    if (isPrimary) {
      await prisma.productSupplier.updateMany({
        where: { productId: params.id },
        data: { isPrimary: false },
      });
    }

    const productSupplier = await prisma.productSupplier.create({
      data: {
        productId: params.id,
        supplierId,
        supplierSku,
        costPrice,
        minimumOrderQty: minimumOrderQty || 1,
        leadTimeDays: leadTimeDays || 7,
        isPrimary: isPrimary || false,
        priority: priority || 0,
      },
      include: {
        supplier: true,
      },
    });

    return NextResponse.json(productSupplier, { status: 201 });
  } catch (error) {
    console.error('Error creating product supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create product supplier' },
      { status: 500 }
    );
  }
}
