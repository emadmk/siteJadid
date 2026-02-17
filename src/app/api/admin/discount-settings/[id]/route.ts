export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// DELETE /api/admin/discount-settings/[id] - Delete a discount setting
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if setting exists
    const setting = await db.userTypeDiscountSettings.findUnique({
      where: { id },
    });

    if (!setting) {
      return NextResponse.json({ error: 'Discount setting not found' }, { status: 404 });
    }

    // Don't allow deleting global settings (only category/brand/supplier/warehouse specific)
    const isGlobal = !setting.categoryId && !setting.brandId && !setting.supplierId && !setting.warehouseId;
    if (isGlobal) {
      return NextResponse.json(
        { error: 'Cannot delete global discount settings. Disable them instead.' },
        { status: 400 }
      );
    }

    await db.userTypeDiscountSettings.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting discount setting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
