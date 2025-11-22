import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where = activeOnly ? { isActive: true } : {};

    const warehouses = await prisma.warehouse.findMany({
      where,
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            stock: true,
            transfers: true,
          },
        },
      },
    });

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
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
      code,
      name,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
      manager,
      isActive,
      isPrimary,
      latitude,
      longitude,
    } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { code },
    });

    if (existingWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse code already exists' },
        { status: 400 }
      );
    }

    if (isPrimary) {
      await prisma.warehouse.updateMany({
        data: { isPrimary: false },
      });
    }

    const warehouse = await prisma.warehouse.create({
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
        manager,
        isActive: isActive !== undefined ? isActive : true,
        isPrimary: isPrimary || false,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}
