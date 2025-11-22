import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, Search, Mail, Phone, Eye, ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';

async function getGSACustomers(searchParams: { search?: string; status?: string }) {
  const where: any = {
    accountType: 'GSA',
  };

  if (searchParams.status) {
    where.gsaApprovalStatus = searchParams.status;
  }

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: 'insensitive' } },
      { email: { contains: searchParams.search, mode: 'insensitive' } },
      { phone: { contains: searchParams.search, mode: 'insensitive' } },
      { gsaNumber: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  const customers = await db.user.findMany({
    where,
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
      orders: {
        select: {
          totalAmount: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return customers;
}

async function getGSAStats() {
  const [total, approved, pending, rejected] = await Promise.all([
    db.user.count({ where: { accountType: 'GSA' } }),
    db.user.count({
      where: { accountType: 'GSA', gsaApprovalStatus: 'APPROVED' },
    }),
    db.user.count({
      where: { accountType: 'GSA', gsaApprovalStatus: 'PENDING' },
    }),
    db.user.count({
      where: { accountType: 'GSA', gsaApprovalStatus: 'REJECTED' },
    }),
  ]);

  return { total, approved, pending, rejected };
}

export default async function GSACustomersPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  const [customers, stats] = await Promise.all([
    getGSACustomers(searchParams),
    getGSAStats(),
  ]);

  const totalRevenue = customers.reduce((sum, customer) => {
    const customerTotal = customer.orders.reduce(
      (orderSum, order) => orderSum + Number(order.totalAmount),
      0
    );
    return sum + customerTotal;
  }, 0);

  const approvalStatusColors: Record<string, string> = {
    APPROVED: 'bg-safety-green-100 text-safety-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/customers">
          <Button variant="outline" className="mb-4 border-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Customers
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-3">
              <Shield className="w-8 h-8 text-safety-green-600" />
              GSA Customers
            </h1>
            <p className="text-gray-600">Government Services Administration accounts</p>
          </div>
          <Link href="/admin/customers/gsa-approvals">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              GSA Approvals ({stats.pending})
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-black mb-1">{stats.total}</div>
          <div className="text-sm text-gray-600">Total GSA Customers</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-safety-green-600 mb-1">
            {stats.approved}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
          <div className="text-sm text-gray-600">Pending Approval</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-red-600 mb-1">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="Search by name, email, phone, or GSA number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval Status
            </label>
            <select
              name="status"
              defaultValue={searchParams.status || ''}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-safety-green-500"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="md:col-span-3 flex gap-2">
            <Button type="submit" className="bg-safety-green-600 hover:bg-safety-green-700">
              Apply Filters
            </Button>
            <Link href="/admin/customers/gsa">
              <Button type="button" variant="outline" className="border-gray-300">
                Clear
              </Button>
            </Link>
          </div>
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          {customers.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">
                No GSA customers found
              </h3>
              <p className="text-gray-600">
                {searchParams.search || searchParams.status
                  ? 'Try adjusting your filters'
                  : 'No GSA customers registered yet'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    GSA Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => {
                  const totalSpent = customer.orders.reduce(
                    (sum, order) => sum + Number(order.totalAmount),
                    0
                  );

                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-safety-green-100 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-safety-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-black">{customer.name}</div>
                            <div className="text-xs text-gray-600">
                              ID: {customer.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-black">
                          {customer.gsaNumber || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            approvalStatusColors[customer.gsaApprovalStatus || 'PENDING']
                          }`}
                        >
                          {customer.gsaApprovalStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-black">
                          {customer._count.orders}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-safety-green-600">
                          ${totalSpent.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/customers/${customer.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 hover:border-safety-green-600 hover:text-safety-green-600"
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
