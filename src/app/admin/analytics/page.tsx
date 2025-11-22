import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUp,
  ArrowDown,
  Calendar,
} from 'lucide-react';
import { db } from '@/lib/db';

async function getAnalyticsData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Current period (last 30 days)
  const [
    currentRevenue,
    currentOrders,
    currentCustomers,
    previousRevenue,
    previousOrders,
    totalCustomers,
    totalProducts,
    lowStockProducts,
  ] = await Promise.all([
    // Current period revenue
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
    }),
    // Current period orders
    db.order.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    // New customers this period
    db.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    // Previous period revenue (for comparison)
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
    }),
    // Previous period orders
    db.order.count({
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
    // Total customers
    db.user.count(),
    // Total products
    db.product.count(),
    // Low stock products
    db.product.count({
      where: {
        stockQuantity: { lte: 10, gt: 0 },
      },
    }),
  ]);

  const revenue = Number(currentRevenue._sum.totalAmount || 0);
  const prevRevenue = Number(previousRevenue._sum.totalAmount || 0);

  const revenueChange =
    prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
  const ordersChange =
    previousOrders > 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : 0;

  return {
    revenue,
    revenueChange,
    orders: currentOrders,
    ordersChange,
    newCustomers: currentCustomers,
    totalCustomers,
    totalProducts,
    lowStockProducts,
  };
}

async function getRecentOrders() {
  return await db.order.findMany({
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
    take: 5,
  });
}

async function getTopProducts() {
  const orderItems = await db.orderItem.groupBy({
    by: ['productId'],
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: 5,
  });

  const productIds = orderItems.map((item) => item.productId);
  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      images: true,
      basePrice: true,
    },
  });

  return orderItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      product,
      quantitySold: item._sum.quantity || 0,
    };
  });
}

async function getRevenueByAccountType() {
  const revenueData = await db.order.groupBy({
    by: ['accountType'],
    _sum: {
      totalAmount: true,
    },
    where: {
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
    },
  });

  return revenueData.map((item) => ({
    accountType: item.accountType,
    revenue: Number(item._sum.totalAmount || 0),
  }));
}

export default async function AnalyticsOverviewPage() {
  const [analytics, recentOrders, topProducts, revenueByType] = await Promise.all([
    getAnalyticsData(),
    getRecentOrders(),
    getTopProducts(),
    getRevenueByAccountType(),
  ]);

  const orderStatusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-safety-green-100 text-safety-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-orange-100 text-orange-800',
    ON_HOLD: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Analytics Overview</h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Last 30 days performance
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-safety-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-safety-green-600" />
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                analytics.revenueChange >= 0
                  ? 'text-safety-green-600'
                  : 'text-red-600'
              }`}
            >
              {analytics.revenueChange >= 0 ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              {Math.abs(analytics.revenueChange).toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            ${analytics.revenue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                analytics.ordersChange >= 0 ? 'text-safety-green-600' : 'text-red-600'
              }`}
            >
              {analytics.ordersChange >= 0 ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              {Math.abs(analytics.ordersChange).toFixed(1)}%
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">{analytics.orders}</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>

        {/* New Customers */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            {analytics.newCustomers}
          </div>
          <div className="text-sm text-gray-600">New Customers</div>
          <div className="text-xs text-gray-500 mt-1">
            Total: {analytics.totalCustomers}
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">
            {analytics.totalProducts}
          </div>
          <div className="text-sm text-gray-600">Total Products</div>
          <div className="text-xs text-orange-600 mt-1">
            {analytics.lowStockProducts} low stock
          </div>
        </div>
      </div>

      {/* Revenue by Account Type */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-black mb-6">Revenue by Account Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {revenueByType.map((item) => (
            <div
              key={item.accountType}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <div className="text-sm text-gray-600 mb-2">{item.accountType}</div>
              <div className="text-2xl font-bold text-safety-green-600">
                ${item.revenue.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">Recent Orders</h2>
            <Link href="/admin/orders">
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 hover:border-safety-green-600"
              >
                View All
              </Button>
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-safety-green-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-black">#{order.orderNumber}</div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        orderStatusColors[order.status]
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-600">{order.user?.name || 'Guest'}</div>
                    <div className="font-semibold text-safety-green-600">
                      ${Number(order.totalAmount).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">Top Products</h2>
            <Link href="/admin/analytics/products">
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 hover:border-safety-green-600"
              >
                View All
              </Button>
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((item, index) => {
                const images = item.product?.images as string[] | undefined;
                return (
                  <div
                    key={item.product?.id || index}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0">
                      {images && images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={item.product?.name || ''}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-black line-clamp-1">
                        {item.product?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-600">
                        SKU: {item.product?.sku || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-black">
                        {item.quantitySold}
                      </div>
                      <div className="text-xs text-gray-600">sold</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Link href="/admin/analytics/sales">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-safety-green-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-safety-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-safety-green-600" />
              </div>
              <div>
                <div className="font-semibold text-black">Sales Report</div>
                <div className="text-sm text-gray-600">Detailed sales analysis</div>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/admin/analytics/products">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-black">Product Performance</div>
                <div className="text-sm text-gray-600">Product analytics</div>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/admin/analytics/customers">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-500 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-black">Customer Insights</div>
                <div className="text-sm text-gray-600">Customer behavior</div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
