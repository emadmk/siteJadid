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

    const attributes = await prisma.productAttribute.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            values: true,
          },
        },
      },
    });

    return NextResponse.json(attributes);
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attributes' },
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

    const { name, type, isFilterable, isRequired, options } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const attribute = await prisma.productAttribute.create({
      data: {
        name,
        type,
        isFilterable: isFilterable !== false,
        isRequired: isRequired || false,
        options: options || [],
      },
    });

    return NextResponse.json(attribute, { status: 201 });
  } catch (error) {
    console.error('Error creating attribute:', error);
    return NextResponse.json(
      { error: 'Failed to create attribute' },
      { status: 500 }
    );
  }
}
