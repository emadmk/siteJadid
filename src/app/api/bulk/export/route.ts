export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');

    if (type === 'products') {
      const products = await db.product.findMany({
        select: {
          sku: true,
          name: true,
          basePrice: true,
          stockQuantity: true,
          category: { select: { name: true } },
        },
      });
      
      const csv = [
        'SKU,Name,Price,Stock,Category',
        ...products.map(p => 
          `${p.sku},"${p.name}",${p.basePrice},${p.stockQuantity},"${p.category?.name || ''}"`
        ),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=products.csv',
        },
      });
    }

    if (type === 'orders') {
      const orders = await db.order.findMany({
        select: {
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      });

      const csv = [
        'Order,Total,Status,Date,Customer',
        ...orders.map(o =>
          `${o.orderNumber},${o.total},${o.status},${o.createdAt.toISOString()},${o.user.email}`
        ),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=orders.csv',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
