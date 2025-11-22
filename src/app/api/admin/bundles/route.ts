import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bundles = await prisma.productBundle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                basePrice: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(bundles);
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bundles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { sku, name, slug, description, bundlePrice, retailValue, savings, image, items } = body;

    if (!sku || !name || !slug || !items || items.length === 0 || !bundlePrice || !retailValue || !savings) {
      return NextResponse.json(
        { error: 'SKU, name, slug, pricing details, and items are required' },
        { status: 400 }
      );
    }

    const bundle = await prisma.productBundle.create({
      data: {
        sku,
        name,
        slug,
        description,
        bundlePrice,
        retailValue,
        savings,
        image,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            sortOrder: item.sortOrder || 0,
            isOptional: item.isOptional || false,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                basePrice: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(bundle, { status: 201 });
  } catch (error) {
    console.error('Error creating bundle:', error);
    return NextResponse.json(
      { error: 'Failed to create bundle' },
      { status: 500 }
    );
  }
}
