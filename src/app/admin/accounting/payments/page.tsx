import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { db } from '@/lib/db';

async function getPayments(searchParams: {
  status?: string;
  method?: string;
  search?: string;
}) {
  const where: any = {};

  if (searchParams.status) {
    where.paymentStatus = searchParams.status;
  }

  if (searchParams.method) {
    where.paymentMethod = searchParams.method;
  }

  if (searchParams.search) {
    where.OR = [
      { orderNumber: { contains: searchParams.search, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { name: { contains: searchParams.search, mode: 'insensitive' } },
            { email: { contains: searchParams.search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  const payments = await db.order.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return payments;
}

async function getPaymentStats() {
  const [successful, pending, failed, totalRevenue] = await Promise.all([
    db.order.count({
      where: {
        paymentStatus: 'PAID',
      },
    }),
    db.order.count({
      where: {
        paymentStatus: 'PENDING',
      },
    }),
    db.order.count({
      where: {
        paymentStatus: 'FAILED',
      },
    }),
    db.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        paymentStatus: 'PAID',
      },
    }),
  ]);

  return {
    successful,
    pending,
    failed,
    totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
  };
}

async function getPaymentMethods() {
  const methods = await db.order.groupBy({
    by: ['paymentMethod'],
    _count: {
      id: true,
    },
    _sum: {
      totalAmount: true,
    },
    where: {
      paymentStatus: 'PAID',
    },
  });

  return methods.map((item) => ({
    method: item.paymentMethod || 'Not Specified',
    count: item._count.id,
    revenue: Number(item._sum.totalAmount || 0),
  }));
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string; method?: string; search?: string };
}) {
  const [payments, stats, paymentMethods] = await Promise.all([
    getPayments(searchParams),
    getPaymentStats(),
    getPaymentMethods(),
  ]);

  const paymentStatusColors: Record<string, string> = {
    PAID: 'bg-safety-green-100 text-safety-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-orange-100 text-orange-800',
  };

  const paymentStatusIcons: Record<string, any> = {
    PAID: CheckCircle,
    PENDING: Clock,
    FAILED: XCircle,
    REFUNDED: XCircle,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Payment History</h1>
          <p className="text-gray-600">View and manage payment transactions</p>
        </div>
        <Button variant="outline" className="border-gray-300">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-safety-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-safety-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">{stats.successful}</div>
          <div className="text-sm text-gray-600">Successful Payments</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending Payments</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-black mb-1">{stats.failed}</div>
          <div className="text-sm text-gray-600">Failed Payments</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-safety-green-600 mb-1">
            ${stats.totalRevenue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Collected</div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-black mb-6">Payment Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.method}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-black">{method.method}</span>
                <span className="text-sm text-gray-600">{method.count} payments</span>
              </div>
              <div className="text-2xl font-bold text-safety-green-600">
                ${method.revenue.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Avg: ${(method.revenue / method.count).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search by order number, customer name, or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              name="status"
              defaultValue={searchParams.status || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>

          {/* Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              name="method"
              defaultValue={searchParams.method || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Methods</option>
              {paymentMethods.map((method) => (
                <option key={method.method} value={method.method}>
                  {method.method}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4 flex gap-2">
            <Button type="submit" className="bg-safety-green-600 hover:bg-safety-green-700">
              Apply Filters
            </Button>
            <Link href="/admin/accounting/payments">
              <Button type="button" variant="outline" className="border-gray-300">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No payments found</h3>
              <p className="text-gray-600">
                {searchParams.search || searchParams.status || searchParams.method
                  ? 'Try adjusting your filters'
                  : 'No payment transactions yet'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((payment) => {
                  const StatusIcon = paymentStatusIcons[payment.paymentStatus];
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-black">
                          #{payment.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-black">
                          {payment.user?.name || 'Guest'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {payment.user?.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(payment.createdAt).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(payment.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {payment.paymentMethod || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-safety-green-600">
                        ${Number(payment.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            paymentStatusColors[payment.paymentStatus]
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {payment.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/orders/${payment.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 hover:border-blue-600 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
