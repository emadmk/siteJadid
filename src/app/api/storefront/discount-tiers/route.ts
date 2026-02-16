import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/storefront/discount-tiers - Get discount tiers for current user's account type
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    const queryAccountType = url.searchParams.get('accountType');

    // Use session account type first, fall back to query parameter
    const accountType = session?.user?.accountType || queryAccountType || 'B2C';
    let normalizedType: 'PERSONAL' | 'VOLUME_BUYER' | 'GOVERNMENT';

    switch (accountType) {
      case 'B2B':
      case 'VOLUME_BUYER':
        normalizedType = 'VOLUME_BUYER';
        break;
      case 'GSA':
      case 'GOVERNMENT':
        normalizedType = 'GOVERNMENT';
        break;
      default:
        normalizedType = 'PERSONAL';
    }

    // Fetch all active global discounts for this user type, sorted by minimumOrderAmount
    const discounts = await db.userTypeDiscountSettings.findMany({
      where: {
        accountType: normalizedType,
        isActive: true,
        // Only global discounts for the banner
        categoryId: null,
        brandId: null,
        supplierId: null,
        warehouseId: null,
      },
      orderBy: { minimumOrderAmount: 'asc' },
      select: {
        id: true,
        discountPercentage: true,
        minimumOrderAmount: true,
      },
    });

    // Also fetch category-specific discounts to show "extra savings on categories" message
    const categoryDiscounts = await db.userTypeDiscountSettings.findMany({
      where: {
        accountType: normalizedType,
        isActive: true,
        categoryId: { not: null },
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { discountPercentage: 'desc' },
      take: 3,
    });

    const tiers = discounts.map((d) => ({
      id: d.id,
      discountPercentage: Number(d.discountPercentage),
      minimumOrderAmount: Number(d.minimumOrderAmount),
    }));

    const categoryBonuses = categoryDiscounts.map((d) => ({
      categoryName: d.category?.name || 'Unknown',
      discountPercentage: Number(d.discountPercentage),
    }));

    return NextResponse.json({
      tiers,
      categoryBonuses,
      accountType: normalizedType,
      userAccountType: accountType,
    });
  } catch (error) {
    console.error('Error fetching discount tiers:', error);
    return NextResponse.json({ tiers: [], categoryBonuses: [] });
  }
}
