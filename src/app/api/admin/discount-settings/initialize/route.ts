export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// POST /api/admin/discount-settings/initialize - Create default discount settings
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if settings already exist
    const existingCount = await db.userTypeDiscountSettings.count();
    if (existingCount > 0) {
      return NextResponse.json({ error: 'Discount settings already exist' }, { status: 400 });
    }

    // Create default settings for each account type
    await db.userTypeDiscountSettings.createMany({
      data: [
        {
          accountType: 'PERSONAL',
          discountPercentage: 0,
          minimumOrderAmount: 0,
          isActive: true,
        },
        {
          accountType: 'VOLUME_BUYER',
          discountPercentage: 5,
          minimumOrderAmount: 500,
          isActive: true,
        },
        {
          accountType: 'GOVERNMENT',
          discountPercentage: 0,
          minimumOrderAmount: 0,
          isActive: true,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initializing discount settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
