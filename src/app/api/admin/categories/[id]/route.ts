import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = await db.category.findUnique({
      where: { id: params.id },
      include: {
        parent: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get category' },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists (excluding current category)
    const existing = await db.category.findFirst({
      where: {
        slug: data.slug,
        id: { not: params.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      );
    }

    // Prevent circular parent relationships
    if (data.parentId) {
      // Check if trying to set itself as parent
      if (data.parentId === params.id) {
        return NextResponse.json(
          { error: 'A category cannot be its own parent' },
          { status: 400 }
        );
      }

      // Check if trying to set one of its descendants as parent
      const descendants = await getDescendants(params.id);
      if (descendants.includes(data.parentId)) {
        return NextResponse.json(
          { error: 'Cannot set a descendant category as parent' },
          { status: 400 }
        );
      }
    }

    // Update category
    const category = await db.category.update({
      where: { id: params.id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        parentId: data.parentId || null,
        displayOrder: data.displayOrder || 0,
        isActive: data.isActive ?? true,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        metaKeywords: data.metaKeywords || null,
        // Variant system fields
        variantAttributeIds: data.variantAttributeIds || [],
        priceRules: data.priceRules || null,
      },
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if category has products
    const category = await db.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products. Please reassign or delete products first.' },
        { status: 400 }
      );
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Please delete subcategories first.' },
        { status: 400 }
      );
    }

    // Delete category
    await db.category.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}

// Helper function to get all descendant category IDs
async function getDescendants(categoryId: string): Promise<string[]> {
  const children = await db.category.findMany({
    where: { parentId: categoryId },
    select: { id: true },
  });

  const childIds = children.map(c => c.id);
  const descendantIds: string[] = [...childIds];

  for (const childId of childIds) {
    const grandChildren = await getDescendants(childId);
    descendantIds.push(...grandChildren);
  }

  return descendantIds;
}
