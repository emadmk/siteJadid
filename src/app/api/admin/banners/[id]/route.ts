export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  desktopImage: string;
  mobileImage: string;
  image: string;
  link: string;
  linkType: 'url' | 'category' | 'product';
  linkTarget: string;
  position: 'hero' | 'sidebar' | 'footer' | 'popup';
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  order: number;
  slideDuration: number;
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

async function deleteImageFile(imagePath: string): Promise<void> {
  if (!imagePath) return;
  const cleanPath = imagePath.replace('/api/uploads/', '');
  const filePath = path.join(process.cwd(), 'public', 'uploads', cleanPath);
  if (existsSync(filePath)) {
    try {
      await unlink(filePath);
    } catch (e) {
      console.error('Error deleting image:', e);
    }
  }
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const banners = await getBanners();
    const banner = banners.find(b => b.id === params.id);

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json({ error: 'Failed to fetch banner' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const banners = await getBanners();
    const bannerIndex = banners.findIndex(b => b.id === params.id);

    if (bannerIndex === -1) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const banner = banners[bannerIndex];

    // Update text fields
    const title = formData.get('title') as string | null;
    const subtitle = formData.get('subtitle') as string | null;
    const link = formData.get('link') as string | null;
    const linkType = formData.get('linkType') as string | null;
    const linkTarget = formData.get('linkTarget') as string | null;
    const position = formData.get('position') as string | null;
    const isActive = formData.get('isActive');
    const startDate = formData.get('startDate') as string | null;
    const endDate = formData.get('endDate') as string | null;
    const order = formData.get('order') as string | null;
    const slideDuration = formData.get('slideDuration') as string | null;

    if (title !== null) banner.title = title;
    if (subtitle !== null) banner.subtitle = subtitle;
    if (position !== null) banner.position = position as Banner['position'];
    if (isActive !== null) banner.isActive = isActive === 'true';
    if (startDate !== null) banner.startDate = startDate || null;
    if (endDate !== null) banner.endDate = endDate || null;
    if (order !== null) banner.order = parseInt(order);
    if (slideDuration !== null) banner.slideDuration = parseInt(slideDuration) || 5;
    if (linkType !== null) banner.linkType = linkType as Banner['linkType'];
    if (linkTarget !== null) banner.linkTarget = linkTarget;

    // Handle link
    if (link !== null) banner.link = link;
    if (linkType !== null && linkTarget !== null) {
      if (linkType === 'category' && linkTarget) {
        banner.link = `/categories/${linkTarget}`;
      } else if (linkType === 'product' && linkTarget) {
        banner.link = `/products/${linkTarget}`;
      }
    }

    // Handle desktop image
    const desktopImageFile = formData.get('desktopImage') as File | null;
    if (desktopImageFile && desktopImageFile.size > 0) {
      await deleteImageFile(banner.desktopImage);
      banner.desktopImage = await saveUploadedImage(desktopImageFile, 'banner-desktop');
      banner.image = banner.desktopImage;
    }

    // Handle mobile image
    const mobileImageFile = formData.get('mobileImage') as File | null;
    if (mobileImageFile && mobileImageFile.size > 0) {
      await deleteImageFile(banner.mobileImage);
      banner.mobileImage = await saveUploadedImage(mobileImageFile, 'banner-mobile');
    }

    banners[bannerIndex] = banner;
    await saveBanners(banners);

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
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

    const banners = await getBanners();
    const bannerIndex = banners.findIndex(b => b.id === params.id);

    if (bannerIndex === -1) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const banner = banners[bannerIndex];

    // Delete image files
    await deleteImageFile(banner.desktopImage);
    if (banner.mobileImage && banner.mobileImage !== banner.desktopImage) {
      await deleteImageFile(banner.mobileImage);
    }
    // Also try legacy image field
    if (banner.image && banner.image !== banner.desktopImage && banner.image !== banner.mobileImage) {
      await deleteImageFile(banner.image);
    }

    banners.splice(bannerIndex, 1);
    await saveBanners(banners);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
