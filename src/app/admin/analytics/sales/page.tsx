import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar,
} from 'lucide-react';
import { db } from '@/lib/db';

async function getSalesData(period: '7d' | '30d' | '90d' | '1y' = '30d') {
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

  const [totalRevenue, totalOrders, completedOrders, avgOrderValue] = await Promise.all([
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: startDate },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
    }),
    db.order.count({
      where: {
        createdAt: { gte: startDate },
      },
    }),
    db.order.count({
      where: {
        createdAt: { gte: startDate },
        status: 'DELIVERED',
      },
    }),
    db.order.aggregate({
      _avg: { totalAmount: true },
      where: {
        createdAt: { gte: startDate },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
    }),
  ]);

  return {
    totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
    totalOrders,
    completedOrders,
    avgOrderValue: Number(avgOrderValue._avg.totalAmount || 0),
  };
}

async function getSalesByStatus() {
  const salesByStatus = await db.order.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
    _sum: {
      totalAmount: true,
    },
  });

  return salesByStatus.map((item) => ({
    status: item.status,
    count: item._count.id,
    revenue: Number(item._sum.totalAmount || 0),
  }));
}

async function getSalesByAccountType() {
  const salesByType = await db.order.groupBy({
    by: ['accountType'],
    _count: {
      id: true,
    },
    _sum: {
      totalAmount: true,
    },
    where: {
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
    },
  });

  return salesByType.map((item) => ({
    accountType: item.accountType,
    count: item._count.id,
    revenue: Number(item._sum.totalAmount || 0),
  }));
}

async function getTopSellingProducts() {
  const orderItems = await db.orderItem.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true,
      basePrice: true,
    },
    orderBy: {
      _sum: {
        price: 'desc',
      },
    },
    take: 10,
  });

  const productIds = orderItems.map((item) => item.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      sku: true,
      images: true,
    },
  });

  return orderItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      product,
      quantitySold: item._sum.quantity || 0,
      revenue: Number(item._sum.price || 0),
    };
  });
}

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: { period?: '7d' | '30d' | '90d' | '1y' };
}) {
  const period = searchParams.period || '30d';
  const [salesData, salesByStatus, salesByType, topProducts] = await Promise.all([
    getSalesData(period),
    getSalesByStatus(),
    getSalesByAccountType(),
    getTopSellingProducts(),
  ]);

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-safety-green-100 text-safety-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-orange-100 text-orange-800',
    ON_HOLD: 'bg-gray-100 text-gray-800',
  };

  const accountTypeColors: Record<string, string> = {
    B2C: 'bg-blue-100 text-blue-800',
    B2B: 'bg-purple-100 text-purple-800',
    GSA: 'bg-safety-green-100 text-safety-green-800',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/analytics">
          <Button variant="outline" className="mb-4 border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Sales Report</h1>
            <p className="text-gray-600">Detailed sales performance analysis</p>
          </div>
          {/* Period Selector */}
          <div className="flex gap-2">
            <Link href="/admin/analytics/sales?period=7d">
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
            <Link href="/admin/analytics/sales?period=30d">
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
            <Link href="/admin/analytics/sales?period=90d">
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
            <Link href="/admin/analytics/sales?period=1y">
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
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-safety-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-safety-green-600" />
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
          <div className="text-3xl font-bold text-black">
            ${salesData.totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="text-3xl font-bold text-black">{salesData.totalOrders}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm text-gray-600">Avg Order Value</div>
          </div>
          <div className="text-3xl font-bold text-black">
            ${salesData.avgOrderValue.toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-sm text-gray-600">Completed Orders</div>
          </div>
          <div className="text-3xl font-bold text-black">
            {salesData.completedOrders}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {salesData.totalOrders > 0
              ? ((salesData.completedOrders / salesData.totalOrders) * 100).toFixed(1)
              : 0}
            % completion rate
          </div>
        </div>
      </div>

      {/* Sales by Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-black mb-6">Sales by Order Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {salesByStatus.map((item) => (
                <tr key={item.status} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusColors[item.status]
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-black">
                    {item.count}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-safety-green-600">
                    ${item.revenue.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {salesData.totalRevenue > 0
                      ? ((item.revenue / salesData.totalRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales by Account Type */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-black mb-6">Sales by Account Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {salesByType.map((item) => (
            <div
              key={item.accountType}
              className="p-6 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    accountTypeColors[item.accountType]
                  }`}
                >
                  {item.accountType}
                </span>
                <div className="text-sm text-gray-600">{item.count} orders</div>
              </div>
              <div className="text-3xl font-bold text-safety-green-600 mb-1">
                ${item.revenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                Avg: ${(item.revenue / item.count).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-black mb-6">Top Selling Products</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Quantity Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProducts.map((item, index) => {
                const images = item.product?.images as string[] | undefined;
                return (
                  <tr key={item.product?.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded">
                          {images && images.length > 0 ? (
                            <img
                              src={images[0]}
                              alt={item.product?.name || ''}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="w-4 h-4 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-black">
                          {item.product?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">
                      {item.product?.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-black">
                      {item.quantitySold}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-safety-green-600">
                      ${item.revenue.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
