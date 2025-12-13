import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Merge multiple categories into one
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { targetCategoryId, sourceCategoryIds } = body;

    if (!targetCategoryId || !sourceCategoryIds || !Array.isArray(sourceCategoryIds)) {
      return NextResponse.json(
        { error: 'targetCategoryId and sourceCategoryIds array are required' },
        { status: 400 }
      );
    }

    if (sourceCategoryIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one source category is required' },
        { status: 400 }
      );
    }

    // Make sure target is not in source list
    const filteredSourceIds = sourceCategoryIds.filter((id: string) => id !== targetCategoryId);

    if (filteredSourceIds.length === 0) {
      return NextResponse.json(
        { error: 'Source categories cannot be the same as target' },
        { status: 400 }
      );
    }

    // Verify target category exists
    const targetCategory = await prisma.category.findUnique({
      where: { id: targetCategoryId },
    });

    if (!targetCategory) {
      return NextResponse.json({ error: 'Target category not found' }, { status: 404 });
    }

    // Get source categories with their product counts
    const sourceCategories = await prisma.category.findMany({
      where: { id: { in: filteredSourceIds } },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (sourceCategories.length !== filteredSourceIds.length) {
      return NextResponse.json(
        { error: 'One or more source categories not found' },
        { status: 404 }
      );
    }

    // Perform merge in a transaction
    const result = await prisma.$transaction(async (tx) => {
      let movedProducts = 0;
      let movedChildren = 0;
      const deletedCategories: string[] = [];

      for (const sourceCategory of sourceCategories) {
        // Move all products from source to target
        const updateProducts = await tx.product.updateMany({
          where: { categoryId: sourceCategory.id },
          data: { categoryId: targetCategoryId },
        });
        movedProducts += updateProducts.count;

        // Move all child categories from source to target
        const updateChildren = await tx.category.updateMany({
          where: { parentId: sourceCategory.id },
          data: { parentId: targetCategoryId },
        });
        movedChildren += updateChildren.count;

        // Delete the source category
        await tx.category.delete({
          where: { id: sourceCategory.id },
        });
        deletedCategories.push(sourceCategory.name);
      }

      return {
        movedProducts,
        movedChildren,
        deletedCategories,
        targetCategory: targetCategory.name,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${result.deletedCategories.length} categories into "${result.targetCategory}"`,
      details: {
        movedProducts: result.movedProducts,
        movedChildren: result.movedChildren,
        deletedCategories: result.deletedCategories,
      },
    });
  } catch (error) {
    console.error('Error merging categories:', error);
    return NextResponse.json(
      {
        error: 'Failed to merge categories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
