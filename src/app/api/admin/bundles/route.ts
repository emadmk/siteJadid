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
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: true,
            price: true,
          },
        },
        items: {
          include: {
            bundledProduct: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                price: true,
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

    const { productId, items, discount } = body;

    if (!productId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Product and items are required' },
        { status: 400 }
      );
    }

    const bundle = await prisma.productBundle.create({
      data: {
        productId,
        discount: discount || 0,
        items: {
          create: items.map((item: any) => ({
            bundledProductId: item.productId,
            quantity: item.quantity,
            discount: item.discount || 0,
          })),
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            images: true,
            price: true,
          },
        },
        items: {
          include: {
            bundledProduct: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                price: true,
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
