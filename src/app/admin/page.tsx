import Link from 'next/link';
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
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { db } from '@/lib/db';
import { DashboardClient } from '@/components/admin/DashboardClient';

async function getAdminDashboardData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Get orders for last 30 days for chart
  const ordersLast30Days = await db.order.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
      total: true,
      status: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Calculate daily revenue for chart
  const dailyRevenueMap = new Map<string, number>();
  const dailyOrdersMap = new Map<string, number>();

  ordersLast30Days.forEach(order => {
    const dateKey = order.createdAt.toISOString().split('T')[0];
    dailyRevenueMap.set(dateKey, (dailyRevenueMap.get(dateKey) || 0) + Number(order.total));
    dailyOrdersMap.set(dateKey, (dailyOrdersMap.get(dateKey) || 0) + 1);
  });

  // Create chart data for last 30 days
  const chartData: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    chartData.push({
      date: dateKey,
      revenue: dailyRevenueMap.get(dateKey) || 0,
      orders: dailyOrdersMap.get(dateKey) || 0,
    });
  }

  const [
    totalRevenue,
    previousRevenue,
    totalOrders,
    previousOrders,
    totalUsers,
    previousUsers,
    totalProducts,
    recentOrders,
    ordersByStatus,
    topProducts,
    lowStockProducts,
    newUsersToday,
  ] = await Promise.all([
    // Current period revenue
    db.order.aggregate({
      _sum: { total: true },
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    // Previous period revenue (for comparison)
    db.order.aggregate({
      _sum: { total: true },
      where: {
        paymentStatus: 'PAID',
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    }),
    // Current period orders
    db.order.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    // Previous period orders
    db.order.count({
      where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    // Total users
    db.user.count(),
    // Previous period users
    db.user.count({
      where: { createdAt: { lt: thirtyDaysAgo } },
    }),
    db.product.count({ where: { status: 'ACTIVE' } }),
    db.order.findMany({
      take: 8,
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
      take: 8,
    }),
    db.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
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

  // Calculate percentage changes
  const currentRevenue = Number(totalRevenue._sum.total || 0);
  const prevRevenue = Number(previousRevenue._sum.total || 0);
  const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const ordersChange = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;
  const newUsers = totalUsers - previousUsers;
  const usersChange = previousUsers > 0 ? ((newUsers) / previousUsers) * 100 : 0;

  return {
    totalRevenue: currentRevenue,
    revenueChange,
    totalOrders,
    ordersChange,
    totalUsers,
    usersChange,
    newUsersToday,
    totalProducts,
    recentOrders,
    ordersByStatus,
    topProducts: topProductsWithDetails,
    lowStockProducts,
    chartData,
  };
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  const pendingOrders = data.ordersByStatus.find((s: { status: string; _count: number }) => s.status === 'PENDING')?._count || 0;
  const processingOrders = data.ordersByStatus.find((s: { status: string; _count: number }) => s.status === 'PROCESSING')?._count || 0;
  const shippedOrders = data.ordersByStatus.find((s: { status: string; _count: number }) => s.status === 'SHIPPED')?._count || 0;
  const deliveredOrders = data.ordersByStatus.find((s: { status: string; _count: number }) => s.status === 'DELIVERED')?._count || 0;
  const cancelledOrders = data.ordersByStatus.find((s: { status: string; _count: number }) => s.status === 'CANCELLED')?._count || 0;

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: data.revenueChange,
      icon: 'dollar',
      color: 'green',
    },
    {
      title: 'Total Orders',
      value: data.totalOrders.toLocaleString(),
      change: data.ordersChange,
      icon: 'cart',
      color: 'blue',
    },
    {
      title: 'Total Customers',
      value: data.totalUsers.toLocaleString(),
      change: data.usersChange,
      subtitle: `${data.newUsersToday} new today`,
      icon: 'users',
      color: 'purple',
    },
    {
      title: 'Active Products',
      value: data.totalProducts.toLocaleString(),
      icon: 'package',
      color: 'orange',
    },
  ];

  const orderStatusData = [
    { name: 'Pending', value: pendingOrders, color: '#eab308' },
    { name: 'Processing', value: processingOrders, color: '#3b82f6' },
    { name: 'Shipped', value: shippedOrders, color: '#8b5cf6' },
    { name: 'Delivered', value: deliveredOrders, color: '#22c55e' },
    { name: 'Cancelled', value: cancelledOrders, color: '#ef4444' },
  ];

  return (
    <DashboardClient
      stats={stats}
      chartData={data.chartData}
      orderStatusData={orderStatusData}
      topProducts={data.topProducts}
      lowStockProducts={data.lowStockProducts}
      recentOrders={data.recentOrders}
    />
  );
}
