import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Package, MapPin, CreditCard, Award, ShoppingBag, TrendingUp, Clock, CheckCircle, Users, ShoppingCart, ListChecks } from 'lucide-react';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getDashboardData(userId: string) {
  const [user, orders, addresses, loyaltyProfile, b2bMembership, shoppingLists] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
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
        total: true,
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
        approvals: {
          select: {
            status: true,
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
    db.loyaltyProfile.findUnique({
      where: { userId },
      select: {
        points: true,
        lifetimePoints: true,
        tier: true,
      },
    }),
    db.b2BAccountMember.findFirst({
      where: { userId },
      include: {
        b2bProfile: {
          select: {
            companyName: true,
          },
        },
        costCenter: {
          select: {
            name: true,
            budgetAmount: true,
            currentSpent: true,
          },
        },
      },
    }),
    db.shoppingList.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      take: 3,
    }),
  ]);

  const orderStats = await db.order.groupBy({
    by: ['status'],
    where: { userId },
    _count: true,
  });

  // Get pending approvals count
  let pendingApprovals = 0;
  if (b2bMembership) {
    pendingApprovals = await db.orderApproval.count({
      where: {
        approverId: b2bMembership.id,
        status: 'PENDING',
      },
    });
  }

  return { user, orders, addresses, loyaltyProfile, orderStats, b2bMembership, pendingApprovals, shoppingLists };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard');
  }

  if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
    redirect('/admin');
  }

  const { user, orders, addresses, loyaltyProfile, orderStats, b2bMembership, pendingApprovals, shoppingLists } = await getDashboardData(session.user.id);

  if (!user) {
    redirect('/auth/signin');
  }

  const totalOrders = orders.length;
  const pendingOrders = orderStats.find((s: any) => s.status === 'PENDING')?._count || 0;
  const processingOrders = orderStats.find((s: any) => s.status === 'PROCESSING')?._count || 0;
  const shippedOrders = orderStats.find((s: any) => s.status === 'SHIPPED')?._count || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {user.name || 'User'}!
              </h1>
              <p className="text-safety-green-100">
                {user.accountType} Account • Member since{' '}
                {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            </div>
            {loyaltyProfile && (
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <Award className="w-5 h-5" />
                  <span className="text-sm font-medium">Loyalty Points</span>
                </div>
                <div className="text-3xl font-bold">{loyaltyProfile.points.toLocaleString()}</div>
                <div className="text-xs text-safety-green-100 mt-1">{loyaltyProfile.tier} Tier</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* B2B Member Info Banner */}
        {b2bMembership && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5" />
                  <h3 className="font-bold text-lg">{b2bMembership.b2bProfile.companyName}</h3>
                </div>
                <div className="text-sm text-blue-100">
                  Role: {b2bMembership.role.replace(/_/g, ' ')}
                  {b2bMembership.department && ` • ${b2bMembership.department}`}
                  {b2bMembership.costCenter && ` • ${b2bMembership.costCenter.name}`}
                </div>
                {b2bMembership.orderLimit && (
                  <div className="text-sm text-blue-100 mt-1">
                    Order Limit: ${Number(b2bMembership.orderLimit).toLocaleString()}
                  </div>
                )}
              </div>
              <Link href="/b2b/team">
                <Button variant="outline" className="bg-white text-blue-700 hover:bg-blue-50 border-0">
                  Manage Team
                </Button>
              </Link>
            </div>
          </div>
        )}

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

          {b2bMembership && (b2bMembership.role === 'APPROVER' || b2bMembership.role === 'ACCOUNT_ADMIN') ? (
            <Link href="/b2b/approvals" className="bg-white rounded-lg border border-gray-200 p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-black">{pendingApprovals}</span>
              </div>
              <div className="text-sm text-gray-600">Pending Approvals</div>
            </Link>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-safety-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-safety-green-600" />
                </div>
                <span className="text-2xl font-bold text-black">{shippedOrders}</span>
              </div>
              <div className="text-sm text-gray-600">Shipped Orders</div>
            </div>
          )}

          <Link href="/shopping-lists" className="bg-white rounded-lg border border-gray-200 p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ListChecks className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-black">{shoppingLists.length}</span>
            </div>
            <div className="text-sm text-gray-600">Shopping Lists</div>
          </Link>
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
                  orders.map((order: any) => {
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
                              ${Number(order.total).toFixed(2)}
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
                <Link href="/quick-order">
                  <Button variant="outline" className="w-full justify-start border-safety-green-600 text-safety-green-600 hover:bg-safety-green-50 gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Quick Order Pad
                  </Button>
                </Link>
                <Link href="/bulk-order">
                  <Button variant="outline" className="w-full justify-start border-blue-600 text-blue-600 hover:bg-blue-50 gap-2">
                    <Package className="w-4 h-4" />
                    Bulk Order Entry
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
                  {addresses.slice(0, 2).map((address: any) => (
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
