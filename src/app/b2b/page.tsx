import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  ShoppingCart,
  ClipboardCheck,
  CreditCard,
  FileCheck,
  TrendingUp,
  Clock,
  Package,
  ChevronRight,
  Shield
} from 'lucide-react';

async function getB2BData(userId: string) {
  const b2bProfile = await db.b2BProfile.findUnique({
    where: { userId },
    include: {
      members: {
        take: 5,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      costCenters: {
        where: { isActive: true },
      },
    },
  });

  if (!b2bProfile) return null;

  const [recentOrders, pendingApprovals] = await Promise.all([
    db.order.findMany({
      where: {
        userId,
        status: { not: 'CANCELLED' },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    db.orderApproval.count({
      where: {
        approver: {
          userId,
        },
        status: 'PENDING',
      },
    }),
  ]);

  return { b2bProfile, recentOrders, pendingApprovals };
}

export default async function B2BDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/b2b');
  }

  if (session.user.accountType !== 'B2B') {
    // Show B2B benefits for non-B2B users
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-safety-green-600 to-safety-green-700 text-white">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Business Accounts
              </h1>
              <p className="text-xl text-safety-green-100 mb-8">
                Unlock exclusive benefits, volume pricing, and dedicated support for your organization.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/b2b/request-quote">
                  <Button size="lg" className="bg-white text-safety-green-700 hover:bg-gray-100">
                    Request a Quote
                  </Button>
                </Link>
                <Link href="/auth/signup?type=b2b">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Apply for B2B Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-black text-center mb-12">
            Why Choose a Business Account?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg border p-6">
              <div className="w-12 h-12 bg-safety-green-100 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-safety-green-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Volume Pricing</h3>
              <p className="text-gray-600">
                Access exclusive tiered pricing based on order volume. The more you buy, the more you save.
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Net Terms</h3>
              <p className="text-gray-600">
                Qualify for Net 30, 45, or 60 payment terms to improve your cash flow and simplify purchasing.
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Team Management</h3>
              <p className="text-gray-600">
                Add team members with customized roles, spending limits, and approval workflows.
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Tax Exemption</h3>
              <p className="text-gray-600">
                Submit your tax exemption certificate for tax-free purchases on eligible orders.
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Dedicated Support</h3>
              <p className="text-gray-600">
                Get priority access to our B2B support team with dedicated account managers.
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Analytics & Reporting</h3>
              <p className="text-gray-600">
                Access detailed spending reports, cost center tracking, and purchase analytics.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Apply for a business account today and start saving on your safety equipment purchases.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/b2b/request-quote">
                <Button size="lg" className="bg-safety-green-600 hover:bg-safety-green-700">
                  Request a Quote
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const data = await getB2BData(session.user.id);

  if (!data) {
    redirect('/account');
  }

  const { b2bProfile, recentOrders, pendingApprovals } = data;

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-safety-green-100 text-safety-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-safety-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-safety-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">{b2bProfile.companyName}</h1>
              <p className="text-gray-600">Business Account Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Credit Limit</span>
              <CreditCard className="w-5 h-5 text-safety-green-600" />
            </div>
            <div className="text-2xl font-bold text-black">
              ${Number(b2bProfile.creditLimit || 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Available Credit</span>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-black">
              ${(Number(b2bProfile.creditLimit) - Number(b2bProfile.creditUsed)).toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Team Members</span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-black">{b2bProfile.members.length}</div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm">Pending Approvals</span>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-black">{pendingApprovals}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Links */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold text-black">Quick Actions</h2>
              </div>
              <div className="divide-y">
                <Link href="/products" className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <ShoppingCart className="w-5 h-5 text-safety-green-600" />
                  <span className="font-medium text-black">Browse Products</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link href="/b2b/request-quote" className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-black">Request Quote</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link href="/b2b/team" className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-black">Manage Team</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link href="/b2b/approvals" className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <ClipboardCheck className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-black">Order Approvals</span>
                  {pendingApprovals > 0 && (
                    <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {pendingApprovals}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link href="/b2b/tax-exemption" className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <FileCheck className="w-5 h-5 text-teal-600" />
                  <span className="font-medium text-black">Tax Exemption</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
                <Link href="/b2b/net-terms" className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <span className="font-medium text-black">Net Terms</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold text-black">Recent Orders</h2>
                <Link href="/account/orders" className="text-safety-green-600 hover:text-safety-green-700 text-sm font-medium">
                  View All
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-black mb-1">No orders yet</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Start shopping to see your orders here
                  </p>
                  <Link href="/products">
                    <Button className="bg-safety-green-600 hover:bg-safety-green-700">
                      Browse Products
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.orderNumber}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-black">{order.orderNumber}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                        <span className="font-bold text-black">
                          ${Number(order.total).toFixed(2)}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Business Account | ADA Supplies',
  description: 'Manage your B2B account, team, orders, and access exclusive business features.',
};
