import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

async function getAdminDashboardData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalRevenue,
    totalOrders,
    totalUsers,
    totalProducts,
    recentOrders,
    ordersByStatus,
    revenueByMonth,
    topProducts,
    lowStockProducts,
  ] = await Promise.all([
    db.order.aggregate({
      _sum: { total: true },
      where: {
        paymentStatus: 'PAID',
      },
    }),
    db.order.count(),
    db.user.count(),
    db.product.count({ where: { status: 'ACTIVE' } }),
    db.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    db.order.groupBy({
      by: ['status'],
      _count: true,
      orderBy: { _count: { status: 'desc' } },
    }),
    db.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        paymentStatus: 'PAID',
      },
      _sum: { total: true },
    }),
    db.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    db.product.findMany({
      where: {
        status: 'ACTIVE',
        stockQuantity: { lte: 10 },
      },
      select: {
        id: true,
        sku: true,
        name: true,
        stockQuantity: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { stockQuantity: 'asc' },
      take: 10,
    }),
  ]);

  const topProductDetails = await db.product.findMany({
    where: {
      id: { in: topProducts.map((p: { productId: string }) => p.productId) },
    },
    select: {
      id: true,
      name: true,
      sku: true,
      basePrice: true,
      salePrice: true,
      images: true,
    },
  });

  const topProductsWithDetails = topProducts.map((tp: { productId: string; _sum: { quantity: number | null }; _count: number }) => {
    const product = topProductDetails.find((p: { id: string }) => p.id === tp.productId);
    return {
      ...tp,
      product,
    };
  });

  return {
    totalRevenue: totalRevenue._sum.total || 0,
    totalOrders,
    totalUsers,
    totalProducts,
    recentOrders,
    ordersByStatus,
    topProducts: topProductsWithDetails,
    lowStockProducts,
  };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin');
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const data = await getAdminDashboardData();

  const pendingOrders = data.ordersByStatus.find((s: { status: string; _count: number }) => s.status === 'PENDING')?._count || 0;
  const processingOrders = data.ordersByStatus.find((s: { status: string; _count: number }) => s.status === 'PROCESSING')?._count || 0;
  const shippedOrders = data.ordersByStatus.find((s: { status: string; _count: number }) => s.status === 'SHIPPED')?._count || 0;
  const deliveredOrders = data.ordersByStatus.find((s: { status: string; _count: number }) => s.status === 'DELIVERED')?._count || 0;
  const cancelledOrders = data.ordersByStatus.find((s: { status: string; _count: number }) => s.status === 'CANCELLED')?._count || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your safety equipment store</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/products">
                <Button className="bg-primary hover:bg-primary/90">Manage Products</Button>
              </Link>
              <Link href="/admin/orders">
                <Button variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                  Manage Orders
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-safety-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-safety-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-safety-green-600" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">
              ${data.totalRevenue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-1">{data.totalOrders}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-1">{data.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-black mb-1">{data.totalProducts}</div>
            <div className="text-sm text-gray-600">Active Products</div>
          </div>
        </div>

        {/* Order Status Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-6">Order Status Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-black mb-1">{pendingOrders}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-black mb-1">{processingOrders}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-black mb-1">{shippedOrders}</div>
              <div className="text-sm text-gray-600">Shipped</div>
            </div>
            <div className="text-center p-4 bg-safety-green-50 rounded-lg border border-safety-green-200">
              <CheckCircle2 className="w-8 h-8 text-safety-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-black mb-1">{deliveredOrders}</div>
              <div className="text-sm text-gray-600">Delivered</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-black mb-1">{cancelledOrders}</div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Products */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-black">Top Selling Products</h2>
              <Link href="/admin/products">
                <Button variant="link" size="sm" className="text-safety-green-600 hover:text-safety-green-700 p-0 h-auto">
                  View All
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {data.topProducts.map((item: any, index: number) => {
                const images = (item.product?.images as string[]) || [];
                return (
                  <div key={item.productId} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-safety-green-100 text-safety-green-800 flex items-center justify-center font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                        {images[0] ? (
                          <img src={images[0]} alt="" className="w-full h-full object-cover rounded" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-black line-clamp-1">
                          {item.product?.name || 'Unknown Product'}
                        </div>
                        <div className="text-sm text-gray-600">SKU: {item.product?.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-black">{item._sum.quantity}</div>
                        <div className="text-xs text-gray-600">units sold</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-black">Low Stock Alert</h2>
              <Link href="/admin/inventory">
                <Button variant="link" size="sm" className="text-safety-green-600 hover:text-safety-green-700 p-0 h-auto">
                  Manage Inventory
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {data.lowStockProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-safety-green-600 mx-auto mb-3" />
                  <div className="text-sm text-gray-600">All products are well stocked</div>
                </div>
              ) : (
                data.lowStockProducts.map((product: any) => (
                  <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-black line-clamp-1">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          SKU: {product.sku} • {product.category?.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            product.stockQuantity === 0
                              ? 'bg-red-100 text-red-800'
                              : product.stockQuantity <= 5
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {product.stockQuantity === 0 ? 'Out of Stock' : `${product.stockQuantity} left`}
                        </div>
                        <Button size="sm" variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                          Restock
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-black">Recent Orders</h2>
            <Link href="/admin/orders">
              <Button variant="link" size="sm" className="text-safety-green-600 hover:text-safety-green-700 p-0 h-auto">
                View All Orders
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentOrders.map((order: any) => {
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-yellow-100 text-yellow-800',
                    PROCESSING: 'bg-blue-100 text-blue-800',
                    SHIPPED: 'bg-purple-100 text-purple-800',
                    DELIVERED: 'bg-safety-green-100 text-safety-green-800',
                    CANCELLED: 'bg-red-100 text-red-800',
                  };

                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-black">{order.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-black">
                          {order.user.name || order.user.email}
                        </div>
                        <div className="text-xs text-gray-600">{order.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {new Date(order.createdAt).toLocaleDateString('en-US')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-black">${order.total.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/orders/${order.orderNumber}`}>
                          <Button size="sm" variant="outline" className="border-black text-black hover:bg-black hover:text-white">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
