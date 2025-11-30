import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Package,
  Heart,
  MapPin,
  Award,
  Clock,
  TrendingUp,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';

async function getAccountOverview(userId: string) {
  const [user, recentOrders, wishlistCount, addressCount, loyaltyProfile] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        accountType: true,
        createdAt: true,
      },
    }),
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          take: 3,
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
    }),
    db.wishlistItem.count({
      where: { userId },
    }),
    db.address.count({
      where: { userId },
    }),
    db.loyaltyProfile.findUnique({
      where: { userId },
      select: {
        points: true,
        lifetimePoints: true,
        tier: true,
      },
    }),
  ]);

  const orderStats = await db.order.aggregate({
    where: { userId },
    _count: true,
    _sum: { total: true },
  });

  return { user, recentOrders, wishlistCount, addressCount, loyaltyProfile, orderStats };
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/account');
  }

  const { user, recentOrders, wishlistCount, addressCount, loyaltyProfile, orderStats } =
    await getAccountOverview(session.user.id);

  if (!user) {
    redirect('/auth/signin');
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user.name || 'User'}!</h1>
        <p className="text-safety-green-100">
          {user.accountType} Account • Member since{' '}
          {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-black">{orderStats._count}</span>
          </div>
          <p className="text-sm text-gray-600">Total Orders</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-black">{wishlistCount}</span>
          </div>
          <p className="text-sm text-gray-600">Wishlist Items</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-black">{addressCount}</span>
          </div>
          <p className="text-sm text-gray-600">Saved Addresses</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-black">
              {loyaltyProfile?.points.toLocaleString() || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">Reward Points</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-black">Recent Orders</h2>
          <Link href="/account/orders">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-black mb-1">No orders yet</h3>
            <p className="text-sm text-gray-600 mb-4">Start shopping to see your orders here</p>
            <Link href="/products">
              <Button className="bg-safety-green-600 hover:bg-safety-green-700">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-black">{order.orderNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="font-bold text-black">${Number(order.total).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <Link href={`/account/orders/${order.orderNumber}`}>
                    <Button variant="link" size="sm" className="text-safety-green-600 p-0 h-auto">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/account/wishlist" className="block">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-safety-green-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black">My Wishlist</h3>
                <p className="text-sm text-gray-600">{wishlistCount} items saved</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </div>
        </Link>

        <Link href="/account/addresses" className="block">
          <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-safety-green-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black">Manage Addresses</h3>
                <p className="text-sm text-gray-600">{addressCount} addresses saved</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </div>
        </Link>
      </div>

      {/* Loyalty Section */}
      {loyaltyProfile && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <h3 className="font-bold text-black">{loyaltyProfile.tier} Member</h3>
              </div>
              <p className="text-sm text-gray-600">
                You have <span className="font-bold text-yellow-700">{loyaltyProfile.points.toLocaleString()}</span> points available
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Lifetime points earned: {loyaltyProfile.lifetimePoints.toLocaleString()}
              </p>
            </div>
            <Link href="/account/rewards">
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                View Rewards
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export const metadata = {
  title: 'My Account | AdaSupply',
  description: 'Manage your AdaSupply account, orders, and preferences.',
};
