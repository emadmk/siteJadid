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
  image: string;
  link: string;
  position: 'hero' | 'sidebar' | 'footer' | 'popup';
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  order: number;
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
      label: 'Site Banners',
    },
  });
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

    const title = formData.get('title') as string | null;
    const subtitle = formData.get('subtitle') as string | null;
    const link = formData.get('link') as string | null;
    const position = formData.get('position') as string | null;
    const isActive = formData.get('isActive');
    const startDate = formData.get('startDate') as string | null;
    const endDate = formData.get('endDate') as string | null;
    const order = formData.get('order') as string | null;
    const imageFile = formData.get('image') as File | null;

    const banner = banners[bannerIndex];

    if (title !== null) banner.title = title;
    if (subtitle !== null) banner.subtitle = subtitle;
    if (link !== null) banner.link = link;
    if (position !== null) banner.position = position as Banner['position'];
    if (isActive !== null) banner.isActive = isActive === 'true';
    if (startDate !== null) banner.startDate = startDate || null;
    if (endDate !== null) banner.endDate = endDate || null;
    if (order !== null) banner.order = parseInt(order);

    if (imageFile && imageFile.size > 0) {
      // Delete old image if exists
      if (banner.image) {
        const oldPath = banner.image.replace('/api/uploads/', '');
        const oldFilePath = path.join(process.cwd(), 'uploads', oldPath);
        if (existsSync(oldFilePath)) {
          try {
            await unlink(oldFilePath);
          } catch (e) {
            console.error('Error deleting old banner image:', e);
          }
        }
      }

      const uploadsDir = path.join(process.cwd(), 'uploads', 'banners');

      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filename = `banner-${Date.now()}.${ext}`;
      const filepath = path.join(uploadsDir, filename);

      const bytes = await imageFile.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));

      banner.image = `/api/uploads/banners/${filename}`;
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

    // Delete image file if exists
    if (banner.image) {
      const imagePath = banner.image.replace('/api/uploads/', '');
      const filePath = path.join(process.cwd(), 'uploads', imagePath);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
        } catch (e) {
          console.error('Error deleting banner image:', e);
        }
      }
    }

    banners.splice(bannerIndex, 1);
    await saveBanners(banners);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
  }
}
