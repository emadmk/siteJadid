import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
      include: {
        stock: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                stockQuantity: true,
                costPrice: true,
                basePrice: true,
                brand: {
                  select: {
                    name: true,
                    logo: true,
                  },
                },
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        // Products that have this warehouse as their defaultWarehouseId
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: true,
            stockQuantity: true,
            costPrice: true,
            basePrice: true,
            brand: {
              select: {
                name: true,
                logo: true,
              },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      code,
      name,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
      isPrimary,
      isActive,
      notes,
    } = body;

    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
    });

    if (!existingWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // If setting as primary, unset other primary warehouses
    if (isPrimary && !existingWarehouse.isPrimary) {
      await prisma.warehouse.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const warehouse = await prisma.warehouse.update({
      where: { id: params.id },
      data: {
        code,
        name,
        address,
        city,
        state,
        zipCode,
        country,
        phone,
        email,
        isPrimary,
        isActive,
        notes,
      },
    });

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to update warehouse' },
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

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            stock: true,
            products: true,
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    if (warehouse._count.stock > 0 || warehouse._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete warehouse with associated products' },
        { status: 400 }
      );
    }

    await prisma.warehouse.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to delete warehouse' },
      { status: 500 }
    );
  }
}
