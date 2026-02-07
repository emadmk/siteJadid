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

// POST /api/admin/discount-settings - Update discount settings
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
