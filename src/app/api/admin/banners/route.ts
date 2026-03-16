export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  image: string; // legacy - kept for backwards compat
  link: string;
  linkType: 'url' | 'category' | 'product' | 'brand';
  linkTarget: string; // slug for category/product, full URL for url
  position: 'hero' | 'sidebar' | 'footer' | 'popup';
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  order: number;
  slideDuration: number; // seconds
  createdAt: string;
}

const BANNERS_KEY = 'site_banners';

async function getBanners(): Promise<Banner[]> {
  const setting = await prisma.setting.findUnique({
    where: { key: BANNERS_KEY },
  });

  if (!setting || !setting.value) {
    return [];
  }

  try {
    return JSON.parse(setting.value);
  } catch {
    return [];
  }
}

async function saveBanners(banners: Banner[]): Promise<void> {
  await prisma.setting.upsert({
    where: { key: BANNERS_KEY },
    update: { value: JSON.stringify(banners) },
    create: {
      key: BANNERS_KEY,
      value: JSON.stringify(banners),
      type: 'JSON',
      category: 'marketing',
    },
  });
}

async function saveUploadedImage(file: File, prefix: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'banners');
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const rawExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const ext = allowedExts.includes(rawExt) ? rawExt : 'jpg';
  const filename = `${prefix}-${Date.now()}.${ext}`;
  const filepath = path.join(uploadsDir, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return `/api/uploads/banners/${filename}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const banners = await getBanners();
    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const title = (formData.get('title') as string) || '';
    const subtitle = (formData.get('subtitle') as string) || '';
    const link = (formData.get('link') as string) || '';
    const linkType = (formData.get('linkType') as string) || 'url';
    const linkTarget = (formData.get('linkTarget') as string) || '';
    const position = (formData.get('position') as string) || 'hero';
    const isActive = formData.get('isActive') === 'true';
    const startDate = (formData.get('startDate') as string) || null;
    const endDate = (formData.get('endDate') as string) || null;
    const slideDuration = parseInt(formData.get('slideDuration') as string) || 5;
    const desktopImageFile = formData.get('desktopImage') as File | null;
    const mobileImageFile = formData.get('mobileImage') as File | null;

    let desktopImage = '';
    let mobileImage = '';

    if (desktopImageFile && desktopImageFile.size > 0) {
      desktopImage = await saveUploadedImage(desktopImageFile, 'banner-desktop');
    }

    if (mobileImageFile && mobileImageFile.size > 0) {
      mobileImage = await saveUploadedImage(mobileImageFile, 'banner-mobile');
    }

    if (!desktopImage) {
      return NextResponse.json(
        { error: 'Desktop banner image is required' },
        { status: 400 }
      );
    }

    const banners = await getBanners();

    // Build the link based on linkType
    let finalLink = link;
    if (linkType === 'category' && linkTarget) {
      finalLink = `/categories/${linkTarget}`;
    } else if (linkType === 'product' && linkTarget) {
      finalLink = `/products/${linkTarget}`;
    } else if (linkType === 'brand' && linkTarget) {
      finalLink = `/brands/${linkTarget}`;
    }

    const newBanner: Banner = {
      id: `banner-${Date.now()}`,
      title,
      subtitle,
      desktopImage,
      mobileImage: mobileImage || desktopImage, // fallback to desktop
      image: desktopImage, // legacy compat
      link: finalLink,
      linkType: linkType as Banner['linkType'],
      linkTarget,
      position: position as Banner['position'],
      isActive,
      startDate,
      endDate,
      order: banners.length,
      slideDuration,
      createdAt: new Date().toISOString(),
    };

    banners.push(newBanner);
    await saveBanners(banners);

    return NextResponse.json(newBanner, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    );
  }
}
