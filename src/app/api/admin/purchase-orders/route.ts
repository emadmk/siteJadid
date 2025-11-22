import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    const status = searchParams.get('status');

    const where: any = {};

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (status) {
      where.status = status;
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
        receipts: true,
      },
    });

    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      supplierId,
      items,
      expectedDelivery,
      shippingAddress,
      notes,
    } = body;

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier and items are required' },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const lastPO = await prisma.purchaseOrder.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const nextNumber = lastPO
      ? parseInt(lastPO.poNumber.replace('PO-', '')) + 1
      : 1;
    const poNumber = `PO-${String(nextNumber).padStart(6, '0')}`;

    let subtotal = 0;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        status: 'DRAFT',
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        orderDate: new Date(),
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        notes,
        createdBy: session.user.id,
        items: {
          create: items.map((item: any) => {
            const itemTotal = item.quantity * item.unitCost;
            subtotal += itemTotal;

            return {
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: itemTotal,
            };
          }),
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
      },
    });

    await prisma.purchaseOrder.update({
      where: { id: purchaseOrder.id },
      data: {
        subtotal,
        total: subtotal,
      },
    });

    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        totalPurchases: {
          increment: totalAmount,
        },
      },
    });

    return NextResponse.json(
      { ...purchaseOrder, totalAmount },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating purchase order:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    );
  }
}
