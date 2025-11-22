import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { db } from '@/lib/db';

async function getRevenueData(period: '7d' | '30d' | '90d' | '1y' = '30d') {
  const now = new Date();
  let startDate: Date;
  let previousStartDate: Date;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  }

  const [currentRevenue, previousRevenue, refunds, pending] = await Promise.all([
    db.order.aggregate({
      _sum: { totalAmount: true, taxAmount: true, shippingCost: true },
      where: {
        createdAt: { gte: startDate },
        status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED'] },
      },
    }),
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: previousStartDate, lt: startDate },
        status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED'] },
      },
    }),
    db.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
        status: 'REFUNDED',
      },
    }),
    db.order.aggregate({
      _sum: { totalAmount: true },
      _count: { id: true },
      where: {
        createdAt: { gte: startDate },
        status: { in: ['PENDING', 'ON_HOLD'] },
      },
    }),
  ]);

  const revenue = Number(currentRevenue._sum.totalAmount || 0);
  const prevRevenue = Number(previousRevenue._sum.totalAmount || 0);
  const revenueChange =
    prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

  return {
    revenue,
    revenueChange,
    tax: Number(currentRevenue._sum.taxAmount || 0),
    shipping: Number(currentRevenue._sum.shippingCost || 0),
    refunds: Number(refunds._sum.totalAmount || 0),
    refundCount: refunds._count.id,
    pending: Number(pending._sum.totalAmount || 0),
    pendingCount: pending._count.id,
  };
}

async function getRevenueByAccountType(startDate: Date) {
  const revenueByType = await db.order.groupBy({
    by: ['accountType'],
    _sum: {
      totalAmount: true,
    },
    _count: {
      id: true,
    },
    where: {
      createdAt: { gte: startDate },
      status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED'] },
    },
  });

  return revenueByType.map((item) => ({
    accountType: item.accountType,
    revenue: Number(item._sum.totalAmount || 0),
    orderCount: item._count.id,
  }));
}

async function getRevenueByPaymentMethod(startDate: Date) {
  const revenueByMethod = await db.order.groupBy({
    by: ['paymentMethod'],
    _sum: {
      totalAmount: true,
    },
    _count: {
      id: true,
    },
    where: {
      createdAt: { gte: startDate },
      status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED'] },
    },
  });

  return revenueByMethod.map((item) => ({
    method: item.paymentMethod,
    revenue: Number(item._sum.totalAmount || 0),
    orderCount: item._count.id,
  }));
}

async function getRecentTransactions() {
  return await db.order.findMany({
    where: {
      status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED'] },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: { period?: '7d' | '30d' | '90d' | '1y' };
}) {
  const period = searchParams.period || '30d';
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const [revenueData, revenueByType, revenueByMethod, recentTransactions] =
    await Promise.all([
      getRevenueData(period),
      getRevenueByAccountType(startDate),
      getRevenueByPaymentMethod(startDate),
      getRecentTransactions(),
    ]);

  const netRevenue =
    revenueData.revenue - revenueData.refunds + revenueData.pending;

  const accountTypeColors: Record<string, string> = {
    B2C: 'bg-blue-100 text-blue-800',
    B2B: 'bg-purple-100 text-purple-800',
    GSA: 'bg-safety-green-100 text-safety-green-800',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Revenue Dashboard</h1>
          <p className="text-gray-600">Track and analyze your revenue streams</p>
        </div>
        <div className="flex gap-2">
          {/* Period Selector */}
          <Link href="/admin/accounting/revenue?period=7d">
            <Button
              variant={period === '7d' ? 'default' : 'outline'}
              className={
                period === '7d'
                  ? 'bg-safety-green-600 hover:bg-safety-green-700'
                  : 'border-gray-300'
              }
              size="sm"
            >
              7 Days
            </Button>
          </Link>
          <Link href="/admin/accounting/revenue?period=30d">
            <Button
              variant={period === '30d' ? 'default' : 'outline'}
              className={
                period === '30d'
                  ? 'bg-safety-green-600 hover:bg-safety-green-700'
                  : 'border-gray-300'
              }
              size="sm"
            >
              30 Days
            </Button>
          </Link>
          <Link href="/admin/accounting/revenue?period=90d">
            <Button
              variant={period === '90d' ? 'default' : 'outline'}
              className={
                period === '90d'
                  ? 'bg-safety-green-600 hover:bg-safety-green-700'
                  : 'border-gray-300'
              }
              size="sm"
            >
              90 Days
            </Button>
          </Link>
          <Link href="/admin/accounting/revenue?period=1y">
            <Button
              variant={period === '1y' ? 'default' : 'outline'}
              className={
                period === '1y'
                  ? 'bg-safety-green-600 hover:bg-safety-green-700'
                  : 'border-gray-300'
              }
              size="sm"
            >
              1 Year
            </Button>
          </Link>
          <Button variant="outline" className="border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-safety-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-safety-green-600" />
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                revenueData.revenueChange >= 0
                  ? 'text-safety-green-600'
                  : 'text-red-600'
              }`}
            >
              {revenueData.revenueChange >= 0 ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              {Math.abs(revenueData.revenueChange).toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            ${revenueData.revenue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Gross Revenue</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            ${netRevenue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Net Revenue</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            ${revenueData.tax.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Tax Collected</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            ${revenueData.pending.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            Pending ({revenueData.pendingCount})
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600 mb-1">
            ${revenueData.refunds.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            Refunds ({revenueData.refundCount})
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* By Account Type */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-black mb-6">
            Revenue by Account Type
          </h2>
          <div className="space-y-4">
            {revenueByType.map((item) => (
              <div
                key={item.accountType}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      accountTypeColors[item.accountType]
                    }`}
                  >
                    {item.accountType}
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.orderCount} orders
                  </span>
                </div>
                <div className="text-2xl font-bold text-safety-green-600">
                  ${item.revenue.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {revenueData.revenue > 0
                    ? ((item.revenue / revenueData.revenue) * 100).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Payment Method */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-black mb-6">
            Revenue by Payment Method
          </h2>
          <div className="space-y-4">
            {revenueByMethod.map((item) => (
              <div
                key={item.method}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-black">
                    {item.method || 'Not Specified'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.orderCount} orders
                  </span>
                </div>
                <div className="text-2xl font-bold text-safety-green-600">
                  ${item.revenue.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {revenueData.revenue > 0
                    ? ((item.revenue / revenueData.revenue) * 100).toFixed(1)
                    : 0}
                  % of total
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTransactions.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-sm text-blue-600 hover:text-blue-800"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-black">{order.user?.name || 'Guest'}</div>
                    <div className="text-xs text-gray-600">
                      {order.user?.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {order.paymentMethod || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-safety-green-600">
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-safety-green-100 text-safety-green-800 rounded-full text-xs font-medium">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
