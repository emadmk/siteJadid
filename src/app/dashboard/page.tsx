import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Package, MapPin, CreditCard, Award, ShoppingBag, TrendingUp, Clock } from 'lucide-react';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getDashboardData(userId: string) {
  const [user, orders, addresses, loyaltyAccount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        accountType: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    }),
    db.order.findMany({
      where: { userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        createdAt: true,
        items: {
          select: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    db.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
      take: 3,
    }),
    db.loyaltyAccount.findUnique({
      where: { userId },
      select: {
        currentPoints: true,
        lifetimePoints: true,
        tier: true,
      },
    }),
  ]);

  const orderStats = await db.order.groupBy({
    by: ['status'],
    where: { userId },
    _count: true,
  });

  return { user, orders, addresses, loyaltyAccount, orderStats };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
    redirect('/admin');
  }

  const { user, orders, addresses, loyaltyAccount, orderStats } = await getDashboardData(session.user.id);

  if (!user) {
    redirect('/auth/signin');
  }

  const totalOrders = orders.length;
  const pendingOrders = orderStats.find((s) => s.status === 'PENDING')?._count || 0;
  const processingOrders = orderStats.find((s) => s.status === 'PROCESSING')?._count || 0;
  const shippedOrders = orderStats.find((s) => s.status === 'SHIPPED')?._count || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {user.firstName || 'User'}!
              </h1>
              <p className="text-safety-green-100">
                {user.accountType} Account • Member since{' '}
                {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            </div>
            {loyaltyAccount && (
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <Award className="w-5 h-5" />
                  <span className="text-sm font-medium">Loyalty Points</span>
                </div>
                <div className="text-3xl font-bold">{loyaltyAccount.currentPoints.toLocaleString()}</div>
                <div className="text-xs text-safety-green-100 mt-1">{loyaltyAccount.tier} Tier</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-black">{totalOrders}</span>
            </div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-black">{pendingOrders + processingOrders}</span>
            </div>
            <div className="text-sm text-gray-600">Active Orders</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-safety-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-safety-green-600" />
              </div>
              <span className="text-2xl font-bold text-black">{shippedOrders}</span>
            </div>
            <div className="text-sm text-gray-600">Shipped Orders</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-black">
                {loyaltyAccount?.currentPoints || 0}
              </span>
            </div>
            <div className="text-sm text-gray-600">Loyalty Points</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">Recent Orders</h2>
                <Link href="/orders">
                  <Button variant="outline" size="sm" className="border-black text-black hover:bg-black hover:text-white">
                    View All
                  </Button>
                </Link>
              </div>

              <div className="divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-black mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-6">Start shopping for safety equipment</p>
                    <Link href="/products">
                      <Button className="bg-primary hover:bg-primary/90">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => {
                    const statusColors: Record<string, string> = {
                      PENDING: 'bg-yellow-100 text-yellow-800',
                      PROCESSING: 'bg-blue-100 text-blue-800',
                      SHIPPED: 'bg-purple-100 text-purple-800',
                      DELIVERED: 'bg-safety-green-100 text-safety-green-800',
                      CANCELLED: 'bg-red-100 text-red-800',
                    };

                    const paymentStatusColors: Record<string, string> = {
                      PENDING: 'bg-yellow-100 text-yellow-800',
                      PAID: 'bg-safety-green-100 text-safety-green-800',
                      FAILED: 'bg-red-100 text-red-800',
                      REFUNDED: 'bg-gray-100 text-gray-800',
                    };

                    return (
                      <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-black">{order.orderNumber}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                                {order.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[order.paymentStatus]}`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-black">
                              ${order.totalAmount.toFixed(2)}
                            </div>
                            <Link href={`/orders/${order.orderNumber}`}>
                              <Button variant="link" size="sm" className="text-safety-green-600 hover:text-safety-green-700 p-0 h-auto">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-black mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/products">
                  <Button className="w-full justify-start bg-primary hover:bg-primary/90 gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Shop Products
                  </Button>
                </Link>
                <Link href="/orders">
                  <Button variant="outline" className="w-full justify-start border-black text-black hover:bg-black hover:text-white gap-2">
                    <Package className="w-4 h-4" />
                    View Orders
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start border-gray-300 text-black hover:bg-gray-100 gap-2">
                    <MapPin className="w-4 h-4" />
                    Manage Addresses
                  </Button>
                </Link>
              </div>
            </div>

            {/* Saved Addresses */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-black">Addresses</h2>
                <Link href="/profile/addresses">
                  <Button variant="link" size="sm" className="text-safety-green-600 hover:text-safety-green-700 p-0 h-auto">
                    Manage
                  </Button>
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="text-sm text-gray-600">No saved addresses</div>
              ) : (
                <div className="space-y-3">
                  {addresses.slice(0, 2).map((address) => (
                    <div key={address.id} className="text-sm">
                      <div className="font-medium text-black mb-1">
                        {address.firstName} {address.lastName}
                        {address.isDefault && (
                          <span className="ml-2 text-xs bg-safety-green-100 text-safety-green-800 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-gray-600">
                        {address.address1}, {address.city}, {address.state} {address.zipCode}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Type Badge */}
            {(user.accountType === 'B2B' || user.accountType === 'GSA') && (
              <div className="bg-gradient-to-br from-safety-green-600 to-safety-green-700 rounded-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-bold">{user.accountType} Account</h3>
                </div>
                <p className="text-sm text-safety-green-100 mb-4">
                  {user.accountType === 'B2B'
                    ? 'Enjoy wholesale pricing and Net 30 payment terms'
                    : 'GSA contract pricing and government compliance'}
                </p>
                <Link href="/contact">
                  <Button size="sm" className="bg-white text-safety-green-700 hover:bg-gray-100">
                    Contact Account Manager
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
