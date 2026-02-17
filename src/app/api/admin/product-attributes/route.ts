export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
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

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
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

    // Generate code from name
    const code = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');

    const attribute = await prisma.productAttribute.create({
      data: {
        name,
        code,
        type,
        isFilterable: isFilterable ?? true,
        isRequired: isRequired ?? false,
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
