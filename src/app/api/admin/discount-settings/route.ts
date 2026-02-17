export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/discount-settings - Get all discount settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await db.userTypeDiscountSettings.findMany({
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: [
        { accountType: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching discount settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/discount-settings - Update discount settings (batch)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { settings } = await request.json();

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 });
    }

    // Update each setting
    for (const setting of settings) {
      await db.userTypeDiscountSettings.update({
        where: { id: setting.id },
        data: {
          discountPercentage: setting.discountPercentage,
          minimumOrderAmount: setting.minimumOrderAmount,
          isActive: setting.isActive,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating discount settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/discount-settings - Create new discount setting
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      accountType,
      discountPercentage,
      minimumOrderAmount,
      isActive,
      categoryId,
      brandId,
      supplierId,
      warehouseId,
    } = body;

    if (!accountType || !['PERSONAL', 'VOLUME_BUYER', 'GOVERNMENT'].includes(accountType)) {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 400 });
    }

    // Check if this exact combination already exists
    const existing = await db.userTypeDiscountSettings.findFirst({
      where: {
        accountType,
        categoryId: categoryId || null,
        brandId: brandId || null,
        supplierId: supplierId || null,
        warehouseId: warehouseId || null,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'A discount with this combination already exists' }, { status: 400 });
    }

    const newSetting = await db.userTypeDiscountSettings.create({
      data: {
        accountType,
        discountPercentage: discountPercentage || 0,
        minimumOrderAmount: minimumOrderAmount || 0,
        isActive: isActive ?? true,
        categoryId: categoryId || null,
        brandId: brandId || null,
        supplierId: supplierId || null,
        warehouseId: warehouseId || null,
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(newSetting, { status: 201 });
  } catch (error) {
    console.error('Error creating discount setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
