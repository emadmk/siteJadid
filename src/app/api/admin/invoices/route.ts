import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const accountType = searchParams.get('accountType');
    const search = searchParams.get('search');

    const where: any = {};

    // Map invoice status filter to order status
    if (status === 'paid') {
      where.paymentStatus = 'PAID';
    } else if (status === 'unpaid') {
      where.paymentStatus = { in: ['PENDING', 'FAILED'] };
    } else if (status === 'overdue') {
      where.AND = [
        { paymentStatus: { in: ['PENDING', 'FAILED'] } },
        {
          createdAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      ];
    }

    if (accountType) {
      where.accountType = accountType;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const invoices = await db.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
          },
        },
        billingAddress: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Get stats
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, paid, unpaid, overdue] = await Promise.all([
      db.order.count(),
      db.order.count({
        where: {
          paymentStatus: 'PAID',
        },
      }),
      db.order.count({
        where: {
          paymentStatus: { in: ['PENDING', 'FAILED'] },
        },
      }),
      db.order.count({
        where: {
          paymentStatus: { in: ['PENDING', 'FAILED'] },
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      }),
    ]);

    const [paidAmount, unpaidAmount, overdueAmount] = await Promise.all([
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: { in: ['PENDING', 'FAILED'] } },
      }),
      db.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: { in: ['PENDING', 'FAILED'] },
          createdAt: { lt: thirtyDaysAgo },
        },
      }),
    ]);

    return NextResponse.json({
      invoices,
      stats: {
        total,
        paid,
        unpaid,
        overdue,
        paidAmount: Number(paidAmount._sum.totalAmount || 0),
        unpaidAmount: Number(unpaidAmount._sum.totalAmount || 0),
        overdueAmount: Number(overdueAmount._sum.totalAmount || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
