import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { RefreshCw, DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';

async function getSubscriptionData() {
  const subscriptions = await db.subscription.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              images: true,
            },
          },
        },
      },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const stats = await db.subscription.groupBy({
    by: ['status'],
    _count: true,
  });

  const totalMRR = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, s) => {
      const intervalDays =
        s.interval === 'WEEKLY' ? 7 : s.interval === 'MONTHLY' ? 30 : s.interval === 'QUARTERLY' ? 90 : 365;
      const monthlyValue = (Number(s.price) * 30) / intervalDays;
      return sum + monthlyValue;
    }, 0);

  return { subscriptions, stats, totalMRR };
}

export default async function SubscriptionsListPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/admin/subscriptions-list');
  }

  const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
  if (!adminRoles.includes(session.user.role)) {
    redirect('/admin');
  }

  const { subscriptions, stats, totalMRR } = await getSubscriptionData();

  const active = stats.find((s) => s.status === 'ACTIVE')?._count || 0;
  const paused = stats.find((s) => s.status === 'PAUSED')?._count || 0;
  const cancelled = stats.find((s) => s.status === 'CANCELLED')?._count || 0;

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-safety-green-100 text-safety-green-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  };

  const intervalLabels: Record<string, string> = {
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Subscription Management</h1>
        <p className="text-gray-600">Manage recurring orders and subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Active Subscriptions</span>
            <RefreshCw className="w-5 h-5 text-safety-green-600" />
          </div>
          <div className="text-3xl font-bold text-black">{active}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Monthly Recurring Revenue</span>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-black">${totalMRR.toFixed(0)}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Paused</span>
            <Calendar className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-black">{paused}</div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Cancelled</span>
            <Users className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-black">{cancelled}</div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-black">All Subscriptions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interval</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Billing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((subscription) => {
                const lastOrder = subscription.orders[0];

                return (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-black">{subscription.user.name || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{subscription.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {subscription.items.length} product{subscription.items.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {intervalLabels[subscription.interval]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                      ${Number(subscription.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(subscription.nextBillingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lastOrder ? (
                        <Link
                          href={`/admin/orders/${lastOrder.id}`}
                          className="text-safety-green-600 hover:text-safety-green-700"
                        >
                          {lastOrder.orderNumber}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[subscription.status]}`}>
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/admin/subscriptions/${subscription.id}`}
                        className="text-safety-green-600 hover:text-safety-green-900 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
