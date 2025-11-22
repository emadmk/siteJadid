import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const contracts = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
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

    const {
      userId,
      contractNumber,
      name,
      description,
      startDate,
      endDate,
      minimumSpend,
      items,
      paymentTerms,
    } = body;

    if (!userId || !name || !startDate || !endDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'User, name, dates, and items are required' },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.create({
      data: {
        contractNumber: contractNumber || `CNT-${Date.now()}`,
        userId,
        name,
        description,
        status: 'DRAFT',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        minimumSpend: minimumSpend || 0,
        paymentTerms: paymentTerms || 30,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            contractPrice: item.contractPrice,
            minimumQuantity: item.minimumQuantity,
            maximumQuantity: item.maximumQuantity,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
