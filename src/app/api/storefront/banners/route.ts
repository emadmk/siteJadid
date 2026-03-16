export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BANNERS_KEY = 'site_banners';

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: BANNERS_KEY },
    });

    if (!setting || !setting.value) {
      return NextResponse.json([]);
    }

    const banners = JSON.parse(setting.value);
    const now = new Date();

    // Filter: active banners, hero position, within date range
    const activeBanners = banners
      .filter((b: any) => {
        if (!b.isActive) return false;
        if (b.position !== 'hero') return false;
        if (b.startDate && new Date(b.startDate) > now) return false;
        if (b.endDate && new Date(b.endDate) < now) return false;
        return true;
      })
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((b: any) => ({
        id: b.id,
        desktopImage: b.desktopImage || b.image,
        mobileImage: b.mobileImage || b.desktopImage || b.image,
        link: b.link || '',
        slideDuration: b.slideDuration || 5,
        order: b.order || 0,
      }));

    return NextResponse.json(activeBanners);
  } catch (error) {
    console.error('Error fetching storefront banners:', error);
    return NextResponse.json([]);
  }
}
