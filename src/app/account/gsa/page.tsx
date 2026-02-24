import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  FileText,
  Package,
  ArrowLeft,
  Star,
  BadgePercent,
} from 'lucide-react';

const DEPARTMENT_LABELS: Record<string, string> = {
  'DOW': 'Department of War (DOW)',
  'DLA': 'Defense Logistics Agency (DLA)',
  'USDA': 'US Department of Agriculture (USDA)',
  'NIH': 'National Institute of Health (NIH)',
  'GCSS-Army': 'Global Combat Support System-Army (GCSS-Army)',
};

async function getGSAData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      accountType: true,
      gsaNumber: true,
      gsaDepartment: true,
      gsaApprovalStatus: true,
      createdAt: true,
    },
  });

  // Get GSA orders count (if user is approved)
  const orderStats = user?.gsaApprovalStatus === 'APPROVED' ? await db.order.aggregate({
    where: { userId },
    _count: true,
    _sum: { total: true },
  }) : null;

  return { user, orderStats };
}

export default async function GSAAccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/account/gsa');
  }

  const { user, orderStats } = await getGSAData(session.user.id);

  if (!user || user.accountType !== 'GSA') {
    redirect('/account');
  }

  const statusConfig = {
    PENDING: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      label: 'Pending Approval',
      description: 'Your Government account is under review. We typically process applications within 1-2 business days.',
    },
    APPROVED: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      label: 'Approved',
      description: 'Your Government account is active. You now have access to exclusive government pricing on eligible products.',
    },
    REJECTED: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      label: 'Not Approved',
      description: 'Your Government application was not approved. Please contact support for more information.',
    },
  };

  const status = user.gsaApprovalStatus ? statusConfig[user.gsaApprovalStatus] : statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900">
        <div className="container mx-auto px-4 py-8">
          <Link href="/account">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Government Account</h1>
              <p className="text-blue-100">Government Buyer Account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className={`bg-white rounded-xl border-2 ${status.borderColor} p-6`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${status.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <StatusIcon className={`w-6 h-6 ${status.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-black">Account Status</h2>
                    <span className={`px-3 py-1 ${status.bgColor} ${status.color} rounded-full text-sm font-semibold`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-gray-600">{status.description}</p>
                </div>
              </div>
            </div>

            {/* GSA Benefits - Show only if approved */}
            {user.gsaApprovalStatus === 'APPROVED' && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-bold text-green-800">Your Government Benefits</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <BadgePercent className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-black mb-1">Exclusive Government Pricing</h3>
                    <p className="text-sm text-gray-600">Access special government pricing on thousands of products</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <Package className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-black mb-1">Priority Shipping</h3>
                    <p className="text-sm text-gray-600">Fast and reliable delivery for government orders</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <FileText className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-black mb-1">TAA Compliant</h3>
                    <p className="text-sm text-gray-600">Products meet Trade Agreements Act requirements</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    <Shield className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-black mb-1">Purchase Card Accepted</h3>
                    <p className="text-sm text-gray-600">Easy payment with government purchase cards</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Info - Show only if pending */}
            {user.gsaApprovalStatus === 'PENDING' && (
              <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
                <h2 className="text-lg font-bold text-yellow-800 mb-4">What Happens Next?</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-800 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-800">Application Review</h3>
                      <p className="text-sm text-yellow-700">Our team is verifying your government credentials</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-800 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-800">Approval Notification</h3>
                      <p className="text-sm text-yellow-700">You'll receive an email once your account is approved</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-800 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-yellow-800">Start Saving</h3>
                      <p className="text-sm text-yellow-700">Access exclusive government pricing on eligible products</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Stats - Show only if approved */}
            {user.gsaApprovalStatus === 'APPROVED' && orderStats && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-black mb-4">Order Summary</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">{orderStats._count}</div>
                    <div className="text-sm text-gray-600">Total Orders</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      ${Number(orderStats._sum?.total || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                </div>
                <Link href="/account/orders" className="block mt-4">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    View All Orders
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-black mb-4">Account Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Name</label>
                  <p className="text-black font-medium">{user.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Email</label>
                  <p className="text-black font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Account Type</label>
                  <p className="text-black font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Government Customer
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Member Since</label>
                  <p className="text-black font-medium">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* GSA Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Government Information
              </h2>
              <div className="space-y-4">
                {user.gsaDepartment && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Department</label>
                    <p className="text-black font-medium">
                      {DEPARTMENT_LABELS[user.gsaDepartment] || user.gsaDepartment}
                    </p>
                  </div>
                )}
                {user.gsaNumber && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider">Government ID Number</label>
                    <p className="text-black font-medium font-mono">{user.gsaNumber}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider">Status</label>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 ${status.bgColor} ${status.color} rounded-full text-sm font-semibold mt-1`}>
                    <StatusIcon className="w-4 h-4" />
                    {status.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h2 className="text-lg font-bold text-blue-800 mb-2">Need Help?</h2>
              <p className="text-sm text-blue-700 mb-4">
                Questions about your government account or pricing? Our team is here to help.
              </p>
              <Link href="/contact">
                <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
