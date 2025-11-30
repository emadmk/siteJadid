import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
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

    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string || '';
    const link = formData.get('link') as string || '';
    const position = formData.get('position') as string || 'hero';
    const isActive = formData.get('isActive') === 'true';
    const startDate = formData.get('startDate') as string || null;
    const endDate = formData.get('endDate') as string || null;
    const imageFile = formData.get('image') as File | null;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    let imagePath = '';

    if (imageFile && imageFile.size > 0) {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'banners');

      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filename = `banner-${Date.now()}.${ext}`;
      const filepath = path.join(uploadsDir, filename);

      const bytes = await imageFile.arrayBuffer();
      await writeFile(filepath, Buffer.from(bytes));

      imagePath = `/api/uploads/banners/${filename}`;
    }

    const banners = await getBanners();

    const newBanner: Banner = {
      id: `banner-${Date.now()}`,
      title,
      subtitle,
      image: imagePath,
      link,
      position: position as Banner['position'],
      isActive,
      startDate,
      endDate,
      order: banners.length,
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
