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

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                stockQuantity: true,
              },
            },
          },
        },
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            products: true,
            purchaseOrders: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
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
      name,
      code,
      email,
      phone,
      website,
      address,
      city,
      state,
      country,
      zipCode,
      taxId,
      businessLicense,
      rating,
      onTimeDeliveryRate,
      qualityRating,
      paymentTerms,
      currency,
      status,
      notes,
    } = body;

    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: params.id },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    if (code && code !== existingSupplier.code) {
      const codeExists = await prisma.supplier.findUnique({
        where: { code },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: 'Supplier code already exists' },
          { status: 400 }
        );
      }
    }

    // Convert empty strings to null for Decimal fields
    const sanitizedRating = rating === '' || rating === null || rating === undefined ? null : parseFloat(rating);
    const sanitizedOnTimeDeliveryRate = onTimeDeliveryRate === '' || onTimeDeliveryRate === null || onTimeDeliveryRate === undefined ? null : parseFloat(onTimeDeliveryRate);
    const sanitizedQualityRating = qualityRating === '' || qualityRating === null || qualityRating === undefined ? null : parseFloat(qualityRating);

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name,
        code,
        email: email || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country,
        zipCode: zipCode || null,
        taxId: taxId || null,
        businessLicense: businessLicense || null,
        rating: sanitizedRating,
        onTimeDeliveryRate: sanitizedOnTimeDeliveryRate,
        qualityRating: sanitizedQualityRating,
        paymentTerms,
        currency,
        status,
        notes: notes || null,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
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

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
            purchaseOrders: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    if (supplier._count.products > 0 || supplier._count.purchaseOrders > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete supplier with associated products or purchase orders',
        },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
