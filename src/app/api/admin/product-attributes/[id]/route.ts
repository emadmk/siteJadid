export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET single attribute
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attribute = await prisma.productAttribute.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    if (!attribute) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }

    return NextResponse.json(attribute);
  } catch (error) {
    console.error('Error fetching attribute:', error);
    return NextResponse.json({ error: 'Failed to fetch attribute' }, { status: 500 });
  }
}

// PATCH update attribute
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, isFilterable, isRequired, options } = body;

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.code = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
    }
    if (type !== undefined) updateData.type = type;
    if (isFilterable !== undefined) updateData.isFilterable = isFilterable;
    if (isRequired !== undefined) updateData.isRequired = isRequired;
    if (options !== undefined) updateData.options = options;

    const attribute = await prisma.productAttribute.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(attribute);
  } catch (error: any) {
    console.error('Error updating attribute:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update attribute' }, { status: 500 });
  }
}

// DELETE attribute
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if attribute has values
    const attribute = await prisma.productAttribute.findUnique({
      where: { id: params.id },
      include: { _count: { select: { values: true } } },
    });

    if (!attribute) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }

    if (attribute._count.values > 0) {
      return NextResponse.json({
        error: `Cannot delete attribute with ${attribute._count.values} associated products. Remove from products first.`,
      }, { status: 400 });
    }

    await prisma.productAttribute.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting attribute:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete attribute' }, { status: 500 });
  }
}
