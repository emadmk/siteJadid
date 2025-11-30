import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, data } = await request.json();

    if (type === 'products') {
      const results: Array<{ success: boolean; sku: string; id?: string; error?: string }> = [];
      for (const item of data) {
        try {
          const product = await db.product.create({
            data: {
              sku: item.sku,
              name: item.name,
              basePrice: parseFloat(item.basePrice),
              stockQuantity: parseInt(item.stockQuantity),
              categoryId: item.categoryId,
            },
          });
          results.push({ success: true, sku: item.sku, id: product.id });
        } catch (error) {
          results.push({ success: false, sku: item.sku, error: 'Failed to import' });
        }
      }
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
