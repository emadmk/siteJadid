import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tag, Plus, Search } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function CouponsPage() {
  // Fetch coupons from database
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Calculate stats
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.isActive && (!c.endsAt || c.endsAt > new Date())).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usageCount, 0);
  const expiredCoupons = coupons.filter(c => c.endsAt && c.endsAt < new Date()).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Coupon Codes</h1>
          <p className="text-gray-600">Create and manage discount coupon codes</p>
        </div>
        <Button className="bg-safety-green-600 hover:bg-safety-green-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">{totalCoupons}</div>
          <div className="text-sm text-gray-600">Total Coupons</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-safety-green-600 mb-1">{activeCoupons}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-blue-600 mb-1">{totalUsage}</div>
          <div className="text-sm text-gray-600">Times Used</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-purple-600 mb-1">$0.00</div>
          <div className="text-sm text-gray-600">Total Discount</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-gray-600 mb-1">{expiredCoupons}</div>
          <div className="text-sm text-gray-600">Expired</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                placeholder="Search coupon codes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type
            </label>
            <select
              name="type"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Types</option>
              <option value="percentage">Percentage Off</option>
              <option value="fixed">Fixed Amount</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>

          <div className="md:col-span-4 flex gap-2">
            <Button type="submit" className="bg-safety-green-600 hover:bg-safety-green-700">
              Apply Filters
            </Button>
            <Link href="/admin/coupons">
              <Button type="button" variant="outline" className="border-gray-300">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No coupons found. Create your first coupon to get started.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const isExpired = coupon.endsAt && coupon.endsAt < new Date();
                const status = !coupon.isActive ? 'Disabled' : isExpired ? 'Expired' : 'Active';
                const statusColor = status === 'Active' ? 'bg-green-100 text-green-800' : status === 'Expired' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800';

                return (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-black">{coupon.code}</div>
                      {coupon.description && (
                        <div className="text-sm text-gray-500">{coupon.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {coupon.type === 'PERCENTAGE' ? 'Percentage' :
                       coupon.type === 'FIXED_AMOUNT' ? 'Fixed Amount' :
                       coupon.type === 'FREE_SHIPPING' ? 'Free Shipping' : 'Buy X Get Y'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-black">
                      {coupon.type === 'PERCENTAGE'
                        ? `${Number(coupon.value)}%`
                        : coupon.type === 'FIXED_AMOUNT'
                        ? `$${Number(coupon.value).toFixed(2)}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString() : 'No expiration'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
